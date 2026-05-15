-- ─── Migración 011: Fix Previsualizar Cancelación ───────────────────────────
-- Re-define la función para que lea desde public.cancelaciones_mensuales
-- en lugar de public.cancelaciones, lo que arregla la visualización de los escenarios.

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
  v_mes               INT := EXTRACT(MONTH FROM NOW());
  v_anio              INT := EXTRACT(YEAR FROM NOW());
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

  -- Contar cancelaciones y devoluciones del mes desde cancelaciones_mensuales
  SELECT cancelaciones, devoluciones
  INTO v_cancelaciones_mes, v_devoluciones_mes
  FROM public.cancelaciones_mensuales
  WHERE socio_id = p_socio_id AND mes = v_mes AND anio = v_anio;

  v_cancelaciones_mes := COALESCE(v_cancelaciones_mes, 0);
  v_devoluciones_mes := COALESCE(v_devoluciones_mes, 0);

  -- ── Lógica de negocio ────────────────────────────────────────────────────
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
