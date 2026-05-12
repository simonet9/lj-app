-- Tabla que trackea cancelaciones por socio por mes
CREATE TABLE IF NOT EXISTS public.cancelaciones_mensuales (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  socio_id      uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  mes           integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio          integer NOT NULL CHECK (anio >= 2026),
  cancelaciones integer NOT NULL DEFAULT 0,  -- total de cancelaciones del mes
  devoluciones  integer NOT NULL DEFAULT 0,  -- cuántas veces se devolvió crédito
  pierde_descuento_next_mes boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cancelaciones_unicas UNIQUE (socio_id, mes, anio)
);

ALTER TABLE public.cancelaciones_mensuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cancel_select_own" ON public.cancelaciones_mensuales
  FOR SELECT USING (auth.uid() = socio_id);

CREATE POLICY "cancel_insert_own" ON public.cancelaciones_mensuales
  FOR INSERT WITH CHECK (auth.uid() = socio_id);

CREATE POLICY "cancel_update_own" ON public.cancelaciones_mensuales
  FOR UPDATE USING (auth.uid() = socio_id);

CREATE OR REPLACE FUNCTION cancelar_reserva_abonado(
  p_reserva_id  uuid,
  p_socio_id    uuid
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reserva     RECORD;
  v_clase       RECORD;
  v_usuario     RECORD;
  v_horas       numeric;
  v_mes         integer := EXTRACT(MONTH FROM NOW());
  v_anio        integer := EXTRACT(YEAR FROM NOW());
  v_tracking    RECORD;
  v_devuelve    boolean := false;
  v_mensaje     text;
BEGIN
  -- 1. Obtener reserva (con lock para evitar doble cancelación)
  SELECT r.*, c.fecha, c.hora_inicio, c.disciplina
  INTO v_reserva
  FROM public.reservas r
  JOIN public.clases c ON c.id = r.clase_id
  WHERE r.id = p_reserva_id AND r.socio_id = p_socio_id AND r.estado = 'confirmada'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'reserva_no_encontrada');
  END IF;

  -- 2. Calcular horas de anticipación
  v_horas := EXTRACT(EPOCH FROM (
    (v_reserva.fecha + v_reserva.hora_inicio) - NOW()
  )) / 3600.0;

  -- 3. Obtener o crear registro de tracking del mes
  INSERT INTO public.cancelaciones_mensuales (socio_id, mes, anio)
  VALUES (p_socio_id, v_mes, v_anio)
  ON CONFLICT (socio_id, mes, anio) DO NOTHING;

  SELECT * INTO v_tracking
  FROM public.cancelaciones_mensuales
  WHERE socio_id = p_socio_id AND mes = v_mes AND anio = v_anio;

  -- 4. Cancelar la reserva (el trigger handle_reserva_cupo libera el cupo)
  UPDATE public.reservas
  SET estado = 'cancelada', cancelada_at = NOW()
  WHERE id = p_reserva_id;

  -- 5. Determinar si corresponde devolver crédito
  IF v_horas > 48 AND v_tracking.devoluciones < 3 THEN
    v_devuelve := true;
    UPDATE public.usuarios SET creditos = creditos + 1 WHERE id = p_socio_id;
    v_mensaje := 'Tu reserva fue cancelada. Se reintegró 1 crédito a tu saldo.';
  ELSIF v_horas > 48 AND v_tracking.devoluciones >= 3 THEN
    v_mensaje := 'Cancelación registrada. Alcanzaste el límite de 3 devoluciones para este mes, no se reintegra el crédito.';
  ELSE
    v_mensaje := 'Tu reserva fue cancelada. El crédito no se reintegra por cancelar con menos de 48 horas de anticipación.';
  END IF;

  -- 6. Actualizar tracking
  UPDATE public.cancelaciones_mensuales
  SET
    cancelaciones = cancelaciones + 1,
    devoluciones  = devoluciones + (CASE WHEN v_devuelve THEN 1 ELSE 0 END),
    -- 4ta cancelación o más → pierde descuento el mes siguiente
    pierde_descuento_next_mes = (cancelaciones + 1 >= 4),
    updated_at = NOW()
  WHERE socio_id = p_socio_id AND mes = v_mes AND anio = v_anio;

  -- 7. Si es la 4ta cancelación, ajustar mensaje
  IF (v_tracking.cancelaciones + 1) >= 4 THEN
    v_mensaje := 'Cancelación registrada. Por superar 3 cancelaciones este mes, no accederás al descuento de abonado en mayo.';
  END IF;

  RETURN json_build_object(
    'success',            true,
    'devuelve_credito',   v_devuelve,
    'cancelaciones_mes',  v_tracking.cancelaciones + 1,
    'devoluciones_mes',   v_tracking.devoluciones + (CASE WHEN v_devuelve THEN 1 ELSE 0 END),
    'pierde_descuento',   (v_tracking.cancelaciones + 1) >= 4,
    'mensaje',            v_mensaje
  );
END;
$$;
