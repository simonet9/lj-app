-- ─── Migración 013: Cancelación Unificada (Crédito + Dinero) ─────────────────
--
-- Extiende la lógica de cancelaciones para soportar reservas pagadas con dinero
-- (seña 50%) además de las reservas con crédito de abonado.
--
-- Reglas de negocio:
--   Vía crédito: devuelve crédito si >48hs Y <3 devoluciones en el mes
--   Vía dinero:  inicia reembolso (flag) si >24hs
--   Penalización: si cancelaciones >= 4 en el mes → pierde_descuento_next_mes
--
-- Nota: la columna `credito_usado` en `reservas` ya distingue el tipo:
--   credito_usado = TRUE  → reserva con crédito
--   credito_usado = FALSE → reserva con dinero (seña)

-- ── 1. Extender tabla cancelaciones con columnas de tipo de pago ──────────────

ALTER TABLE public.cancelaciones
  ADD COLUMN IF NOT EXISTS via_pago         TEXT    NOT NULL DEFAULT 'credito'
    CHECK (via_pago IN ('credito', 'dinero')),
  ADD COLUMN IF NOT EXISTS reembolso_pendiente BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 2. Función RPC: previsualizar_cancelacion_unificada ───────────────────────
-- Solo lectura. Devuelve el escenario sin mutar datos.
-- Detecta automáticamente si la reserva fue por crédito o dinero.

CREATE OR REPLACE FUNCTION public.previsualizar_cancelacion_unificada(
  p_reserva_id UUID,
  p_socio_id   UUID
)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_clase_inicio      TIMESTAMPTZ;
  v_credito_usado     BOOLEAN;
  v_sena_pagada       NUMERIC;
  v_horas             NUMERIC;
  v_cancelaciones_mes INT;
  v_devoluciones_mes  INT;
  v_devuelve          BOOLEAN;
  v_reembolsa         BOOLEAN;
  v_perderia_descuento BOOLEAN;
  v_escenario         TEXT;
BEGIN
  -- Obtener datos de la reserva y clase
  SELECT
    (c.fecha::TEXT || ' ' || c.hora_inicio)::TIMESTAMPTZ,
    r.credito_usado,
    COALESCE(r.seña_pagada, 0)
  INTO v_clase_inicio, v_credito_usado, v_sena_pagada
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

  -- Contar cancelaciones y devoluciones del mes (tabla cancelaciones_mensuales)
  SELECT
    COALESCE(cancelaciones, 0),
    COALESCE(devoluciones, 0)
  INTO v_cancelaciones_mes, v_devoluciones_mes
  FROM public.cancelaciones_mensuales
  WHERE socio_id = p_socio_id
    AND mes  = EXTRACT(MONTH FROM NOW())
    AND anio = EXTRACT(YEAR  FROM NOW());

  IF NOT FOUND THEN
    v_cancelaciones_mes := 0;
    v_devoluciones_mes  := 0;
  END IF;

  -- ── Lógica de negocio ─────────────────────────────────────────────────────
  v_devuelve  := FALSE;
  v_reembolsa := FALSE;

  IF v_credito_usado THEN
    -- Reserva con crédito: devuelve si >48hs y <3 devoluciones
    v_devuelve := (v_horas > 48) AND (v_devoluciones_mes < 3);
    IF v_devuelve THEN
      v_escenario := 'devolucion_normal';
    ELSIF v_horas > 48 THEN
      v_escenario := 'limite_devoluciones';
    ELSE
      v_escenario := 'sin_anticipacion';
    END IF;
  ELSE
    -- Reserva con dinero (seña): reembolso si >24hs
    v_reembolsa := (v_horas > 24);
    IF v_reembolsa THEN
      v_escenario := 'devolucion_dinero';
    ELSE
      v_escenario := 'sin_anticipacion_dinero';
    END IF;
  END IF;

  -- Penalización 4ta cancelación (aplica a cualquier tipo)
  v_perderia_descuento := (v_cancelaciones_mes >= 3);
  IF v_perderia_descuento THEN
    v_escenario := 'cuarta_cancelacion';
  END IF;

  RETURN json_build_object(
    'horas_anticipacion',   ROUND(v_horas, 1),
    'cancelaciones_mes',    v_cancelaciones_mes,
    'devoluciones_mes',     v_devoluciones_mes,
    'credito_usado',        v_credito_usado,
    'sena_pagada',          v_sena_pagada,
    'devuelve_credito',     v_devuelve,
    'reembolsa_dinero',     v_reembolsa,
    'perderia_descuento',   v_perderia_descuento,
    'escenario',            v_escenario
  );
END;
$$;

-- ── 3. Función RPC: cancelar_reserva_unificada ────────────────────────────────
-- Cancela de forma atómica, manejando lógica de crédito y dinero.

CREATE OR REPLACE FUNCTION public.cancelar_reserva_unificada(
  p_reserva_id UUID,
  p_socio_id   UUID
)
RETURNS JSON
LANGUAGE plpgsql VOLATILE SECURITY DEFINER AS $$
DECLARE
  v_clase_id           UUID;
  v_clase_inicio       TIMESTAMPTZ;
  v_credito_usado      BOOLEAN;
  v_sena_pagada        NUMERIC;
  v_horas              NUMERIC;
  v_mes                INTEGER := EXTRACT(MONTH FROM NOW());
  v_anio               INTEGER := EXTRACT(YEAR  FROM NOW());
  v_cancelaciones_mes  INT;
  v_devoluciones_mes   INT;
  v_devuelve_credito   BOOLEAN := FALSE;
  v_reembolsa_dinero   BOOLEAN := FALSE;
  v_perdio_descuento   BOOLEAN := FALSE;
  v_mensaje            TEXT;
BEGIN
  -- ── 1. Obtener y bloquear reserva ──────────────────────────────────────────
  SELECT
    r.clase_id,
    (c.fecha::TEXT || ' ' || c.hora_inicio)::TIMESTAMPTZ,
    r.credito_usado,
    COALESCE(r.seña_pagada, 0)
  INTO v_clase_id, v_clase_inicio, v_credito_usado, v_sena_pagada
  FROM public.reservas r
  JOIN public.clases c ON c.id = r.clase_id
  WHERE r.id = p_reserva_id
    AND r.socio_id = p_socio_id
    AND r.estado = 'confirmada'
  FOR UPDATE OF r;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'reserva_no_encontrada');
  END IF;

  -- ── 2. Calcular horas de anticipación ──────────────────────────────────────
  v_horas := EXTRACT(EPOCH FROM (v_clase_inicio - NOW())) / 3600.0;

  -- ── 3. Obtener o crear tracking mensual ────────────────────────────────────
  INSERT INTO public.cancelaciones_mensuales (socio_id, mes, anio)
  VALUES (p_socio_id, v_mes, v_anio)
  ON CONFLICT (socio_id, mes, anio) DO NOTHING;

  SELECT cancelaciones, devoluciones
  INTO v_cancelaciones_mes, v_devoluciones_mes
  FROM public.cancelaciones_mensuales
  WHERE socio_id = p_socio_id AND mes = v_mes AND anio = v_anio;

  -- ── 4. Cancelar la reserva (trigger libera cupo automáticamente) ───────────
  UPDATE public.reservas
  SET estado = 'cancelada', cancelada_at = NOW()
  WHERE id = p_reserva_id;

  -- ── 5. Aplicar reglas de negocio según tipo de pago ────────────────────────
  IF v_credito_usado THEN
    -- Reserva vía crédito: devuelve si >48hs y <3 devoluciones
    IF v_horas > 48 AND v_devoluciones_mes < 3 THEN
      v_devuelve_credito := TRUE;
      UPDATE public.usuarios SET creditos = creditos + 1 WHERE id = p_socio_id;
      v_mensaje := 'Tu reserva fue cancelada. Se reintegró 1 crédito a tu saldo.';
    ELSIF v_horas > 48 THEN
      v_mensaje := 'Cancelación registrada. Alcanzaste el límite de 3 devoluciones para este mes.';
    ELSE
      v_mensaje := 'Tu reserva fue cancelada. El crédito no se reintegra por cancelar con menos de 48hs de anticipación.';
    END IF;
  ELSE
    -- Reserva vía dinero (seña): reembolso si >24hs
    IF v_horas > 24 THEN
      v_reembolsa_dinero := TRUE;
      v_mensaje := 'Tu reserva fue cancelada. Iniciaremos el reembolso de la seña a través de Mercado Pago en los próximos días hábiles.';
    ELSE
      v_mensaje := 'Tu reserva fue cancelada. La seña no se reembolsa por cancelar con menos de 24hs de anticipación.';
    END IF;
  END IF;

  -- ── 6. Penalización: 4ta cancelación del mes ──────────────────────────────
  v_perdio_descuento := (v_cancelaciones_mes + 1 >= 4);
  IF v_perdio_descuento THEN
    v_mensaje := v_mensaje || ' Superaste 3 cancelaciones este mes; perderás el descuento de abonado el mes que viene.';
  END IF;

  -- ── 7. Actualizar tracking mensual ────────────────────────────────────────
  UPDATE public.cancelaciones_mensuales
  SET
    cancelaciones             = cancelaciones + 1,
    devoluciones              = devoluciones + (CASE WHEN v_devuelve_credito THEN 1 ELSE 0 END),
    pierde_descuento_next_mes = (v_cancelaciones_mes + 1 >= 4),
    updated_at                = NOW()
  WHERE socio_id = p_socio_id AND mes = v_mes AND anio = v_anio;

  -- ── 8. Registrar en tabla cancelaciones ────────────────────────────────────
  INSERT INTO public.cancelaciones
    (reserva_id, socio_id, clase_id, horas_anticipacion,
     credito_devuelto, perdio_descuento, via_pago, reembolso_pendiente)
  VALUES
    (p_reserva_id, p_socio_id, v_clase_id, ROUND(v_horas, 1),
     v_devuelve_credito, v_perdio_descuento,
     CASE WHEN v_credito_usado THEN 'credito' ELSE 'dinero' END,
     v_reembolsa_dinero);

  -- ── 9. Notificación interna ────────────────────────────────────────────────
  BEGIN
    INSERT INTO public.notificaciones (usuario_id, titulo, cuerpo, tipo, referencia_id)
    VALUES (p_socio_id, 'Reserva cancelada', v_mensaje, 'cancelacion', p_reserva_id);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN json_build_object(
    'success',           TRUE,
    'devuelve_credito',  v_devuelve_credito,
    'reembolsa_dinero',  v_reembolsa_dinero,
    'perdio_descuento',  v_perdio_descuento,
    'cancelaciones_mes', v_cancelaciones_mes + 1,
    'mensaje',           v_mensaje
  );
END;
$$;

-- Permisos
REVOKE EXECUTE ON FUNCTION public.previsualizar_cancelacion_unificada(UUID, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.previsualizar_cancelacion_unificada(UUID, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cancelar_reserva_unificada(UUID, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cancelar_reserva_unificada(UUID, UUID) TO authenticated;
