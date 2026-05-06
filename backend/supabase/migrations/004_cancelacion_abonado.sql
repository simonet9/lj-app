-- ─── Migración 004: Cancelaciones de reservas para socios abonados ────────────
--
-- Tabla: public.cancelaciones
--   Registra cada cancelación de un socio abonado con sus flags de negocio.
--   Es el punto de verdad para contar cancelaciones y devoluciones del mes.
--
-- Función: previsualizar_cancelacion_abonado(p_reserva_id, p_socio_id)
--   Calcula el escenario sin mutar datos. Usada por el frontend para
--   construir el mensaje contextual del modal ANTES de confirmar.
--
-- Función: cancelar_reserva_abonado(p_reserva_id, p_socio_id)
--   Ejecuta la cancelación atómica con toda la lógica de negocio.
--   El trigger handle_reserva_cupo libera el cupo automáticamente
--   al actualizar estado → 'cancelada'.

-- ─── Tabla cancelaciones ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cancelaciones (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id          UUID        NOT NULL REFERENCES public.reservas(id),
  socio_id            UUID        NOT NULL REFERENCES public.usuarios(id),
  clase_id            UUID        NOT NULL REFERENCES public.clases(id),
  horas_anticipacion  NUMERIC     NOT NULL,   -- horas entre cancelación y inicio de clase
  credito_devuelto    BOOLEAN     NOT NULL DEFAULT FALSE,
  perdio_descuento    BOOLEAN     NOT NULL DEFAULT FALSE,  -- flag: 4ta cancelación del mes
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para las consultas de conteo mensual
CREATE INDEX IF NOT EXISTS idx_cancelaciones_socio_mes
  ON public.cancelaciones (socio_id, created_at);

-- RLS
ALTER TABLE public.cancelaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "socio_ve_sus_cancelaciones"
  ON public.cancelaciones FOR SELECT
  USING (auth.uid() = socio_id);

-- ─── Helper: contar cancelaciones del mes actual ──────────────────────────────

CREATE OR REPLACE FUNCTION public._contar_cancelaciones_mes(
  p_socio_id UUID,
  p_now      TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (total_cancelaciones INT, total_devoluciones INT)
LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*)::INT                                          AS total_cancelaciones,
    COUNT(*) FILTER (WHERE credito_devuelto = TRUE)::INT   AS total_devoluciones
  FROM public.cancelaciones
  WHERE socio_id = p_socio_id
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', p_now);
$$;

-- ─── Función: previsualizar_cancelacion_abonado ───────────────────────────────
-- Solo lectura — no muta ningún dato.
-- Retorna el escenario que enfrentaría el socio si cancela ahora.
-- El frontend la llama para construir el mensaje del modal.

CREATE OR REPLACE FUNCTION public.previsualizar_cancelacion_abonado(
  p_reserva_id UUID,
  p_socio_id   UUID
)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_clase_inicio      TIMESTAMPTZ;
  v_horas             NUMERIC;
  v_cancelaciones_mes INT;
  v_devoluciones_mes  INT;
  v_devuelve_credito  BOOLEAN;
  v_perderia_descuento BOOLEAN;
  v_escenario         TEXT;
BEGIN
  -- Verificar que la reserva pertenece al socio y está confirmada
  SELECT (c.fecha::TEXT || ' ' || c.hora_inicio)::TIMESTAMPTZ
  INTO v_clase_inicio
  FROM public.reservas r
  JOIN public.clases c ON c.id = r.clase_id
  WHERE r.id = p_reserva_id
    AND r.socio_id = p_socio_id
    AND r.estado = 'confirmada';

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'reserva_no_encontrada');
  END IF;

  -- Calcular horas de anticipación
  v_horas := EXTRACT(EPOCH FROM (v_clase_inicio - NOW())) / 3600.0;

  -- Contar cancelaciones y devoluciones del mes
  SELECT total_cancelaciones, total_devoluciones
  INTO v_cancelaciones_mes, v_devoluciones_mes
  FROM public._contar_cancelaciones_mes(p_socio_id);

  -- ── Lógica de negocio ────────────────────────────────────────────────────
  -- Regla 1: devolución solo si > 48 horas
  -- Regla 2: máximo 3 devoluciones por mes
  -- Regla 4: 4ta cancelación → pierde descuento mes siguiente
  v_devuelve_credito   := (v_horas > 48) AND (v_devoluciones_mes < 3);
  v_perderia_descuento := (v_cancelaciones_mes >= 3);  -- esta sería la 4ta

  -- Determinar escenario textual para el frontend
  IF v_perderia_descuento THEN
    v_escenario := 'cuarta_cancelacion';
  ELSIF NOT v_devuelve_credito AND v_horas <= 48 THEN
    v_escenario := 'sin_anticipacion';
  ELSIF NOT v_devuelve_credito AND v_devoluciones_mes >= 3 THEN
    v_escenario := 'limite_devoluciones';
  ELSE
    v_escenario := 'devolucion_normal';
  END IF;

  RETURN json_build_object(
    'horas_anticipacion',   ROUND(v_horas, 1),
    'cancelaciones_mes',    v_cancelaciones_mes,
    'devoluciones_mes',     v_devoluciones_mes,
    'devuelve_credito',     v_devuelve_credito,
    'perderia_descuento',   v_perderia_descuento,
    'escenario',            v_escenario
  );
END;
$$;

-- ─── Función: cancelar_reserva_abonado ───────────────────────────────────────
-- Ejecuta la cancelación de forma atómica con bloqueos FOR UPDATE.
-- El trigger handle_reserva_cupo libera el cupo al cambiar estado → 'cancelada'.

CREATE OR REPLACE FUNCTION public.cancelar_reserva_abonado(
  p_reserva_id UUID,
  p_socio_id   UUID
)
RETURNS JSON
LANGUAGE plpgsql VOLATILE SECURITY DEFINER AS $$
DECLARE
  v_clase_id          UUID;
  v_clase_inicio      TIMESTAMPTZ;
  v_horas             NUMERIC;
  v_creditos_actuales INT;
  v_cancelaciones_mes INT;
  v_devoluciones_mes  INT;
  v_devuelve_credito  BOOLEAN;
  v_perdio_descuento  BOOLEAN;
  v_mensaje           TEXT;
BEGIN
  -- ── 1. Obtener y bloquear reserva ────────────────────────────────────────
  SELECT r.clase_id,
         (c.fecha::TEXT || ' ' || c.hora_inicio)::TIMESTAMPTZ
  INTO v_clase_id, v_clase_inicio
  FROM public.reservas r
  JOIN public.clases c ON c.id = r.clase_id
  WHERE r.id = p_reserva_id
    AND r.socio_id = p_socio_id
    AND r.estado = 'confirmada'
  FOR UPDATE OF r;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'reserva_no_encontrada');
  END IF;

  -- ── 2. Calcular horas de anticipación ────────────────────────────────────
  v_horas := EXTRACT(EPOCH FROM (v_clase_inicio - NOW())) / 3600.0;

  -- ── 3. Bloquear fila del socio para actualizar créditos ──────────────────
  SELECT creditos INTO v_creditos_actuales
  FROM public.usuarios
  WHERE id = p_socio_id
  FOR UPDATE;

  -- ── 4. Contar cancelaciones y devoluciones del mes ────────────────────────
  SELECT total_cancelaciones, total_devoluciones
  INTO v_cancelaciones_mes, v_devoluciones_mes
  FROM public._contar_cancelaciones_mes(p_socio_id);

  -- ── 5. Aplicar reglas de negocio ──────────────────────────────────────────
  v_devuelve_credito  := (v_horas > 48) AND (v_devoluciones_mes < 3);
  v_perdio_descuento  := (v_cancelaciones_mes >= 3);  -- esta es la 4ta cancelación

  -- ── 6. Actualizar estado de la reserva → trigger libera el cupo ──────────
  UPDATE public.reservas
  SET estado = 'cancelada'
  WHERE id = p_reserva_id;

  -- ── 7. Devolver crédito si corresponde ────────────────────────────────────
  IF v_devuelve_credito THEN
    UPDATE public.usuarios
    SET creditos = creditos + 1
    WHERE id = p_socio_id;
  END IF;

  -- ── 8. Registrar la cancelación ───────────────────────────────────────────
  INSERT INTO public.cancelaciones
    (reserva_id, socio_id, clase_id, horas_anticipacion, credito_devuelto, perdio_descuento)
  VALUES
    (p_reserva_id, p_socio_id, v_clase_id, ROUND(v_horas, 1), v_devuelve_credito, v_perdio_descuento);

  -- ── 9. Registrar notificación de cancelación en el sistema interno ────────
  -- Usa las columnas reales de public.notificaciones (migración 005):
  -- usuario_id, titulo, cuerpo, tipo, referencia_id
  BEGIN
    INSERT INTO public.notificaciones (usuario_id, titulo, cuerpo, tipo, referencia_id)
    VALUES (
      p_socio_id,
      'Reserva cancelada',
      CASE
        WHEN v_devuelve_credito  THEN 'Tu reserva fue cancelada y el crédito fue reintegrado a tu cuenta.'
        WHEN v_perdio_descuento  THEN 'Cancelación registrada. Superaste 3 cancelaciones este mes; no accederás al descuento el mes que viene.'
        WHEN v_horas <= 48       THEN 'Tu reserva fue cancelada. El crédito no se reintegra por cancelar con menos de 48hs de anticipación.'
        ELSE                          'Tu reserva fue cancelada. Alcanzaste el límite de 3 devoluciones para este mes.'
      END,
      'cancelacion',
      p_reserva_id
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;  -- Si la tabla aún no existe, continuar sin fallar
  END;

  -- ── 10. Construir mensaje de resultado ────────────────────────────────────
  IF v_perdio_descuento THEN
    v_mensaje := 'Cancelación registrada. Por superar 3 cancelaciones este mes, no accederás al descuento de abonado el mes que viene.';
  ELSIF NOT v_devuelve_credito AND v_horas <= 48 THEN
    v_mensaje := 'Tu reserva fue cancelada. El crédito no se reintegra por cancelar con menos de 48 horas de anticipación.';
  ELSIF NOT v_devuelve_credito THEN
    v_mensaje := 'Cancelación registrada. Alcanzaste el límite de 3 devoluciones para este mes, no se reintegra el crédito.';
  ELSE
    v_mensaje := 'Tu reserva fue cancelada y el crédito fue reintegrado a tu cuenta.';
  END IF;

  RETURN json_build_object(
    'success',            TRUE,
    'devuelve_credito',   v_devuelve_credito,
    'perdio_descuento',   v_perdio_descuento,
    'cancelaciones_mes',  v_cancelaciones_mes + 1,
    'mensaje',            v_mensaje
  );
END;
$$;

-- Permisos para las funciones
GRANT EXECUTE ON FUNCTION public.previsualizar_cancelacion_abonado TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancelar_reserva_abonado TO authenticated;
