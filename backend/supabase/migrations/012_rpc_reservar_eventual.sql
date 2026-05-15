-- ─── Migración 012: RPC Reserva Eventual ─────────────────────────────
-- Implementa de forma segura la reserva para usuarios eventuales, 
-- aplicando los mismos validadores de cupo que la de abonado.

CREATE OR REPLACE FUNCTION reservar_clase_eventual(
  p_socio_id uuid,
  p_clase_id uuid,
  p_sena_pagada numeric,
  p_fecha text,
  p_hora text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cupo             int;
  v_reserva_id       uuid;
BEGIN
  -- ── 1. Leer cupo con bloqueo ──────────────────────────────────────────────
  SELECT cupo_disponible
    INTO v_cupo
    FROM clases
   WHERE id = p_clase_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'clase_no_encontrada');
  END IF;

  IF v_cupo < 1 THEN
    RETURN json_build_object('error', 'sin_cupo');
  END IF;

  -- ── 2. Insertar reserva ───────────────────────────────────────────────────
  -- Si ya existe una reserva confirmada para este socio+clase, el unique
  -- constraint lanzará una excepción que capturamos abajo.
  INSERT INTO reservas (socio_id, clase_id, estado, credito_usado, seña_pagada)
    VALUES (p_socio_id, p_clase_id, 'confirmada', false, p_sena_pagada)
    RETURNING id INTO v_reserva_id;

  -- El trigger handle_reserva_cupo se encarga de actualizar cupo_disponible
  -- en la tabla clases al detectar el INSERT en reservas.

  RETURN json_build_object(
    'success',    true,
    'reserva_id', v_reserva_id
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('error', 'ya_reservada');
END;
$$;

REVOKE EXECUTE ON FUNCTION reservar_clase_eventual(uuid, uuid, numeric, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION reservar_clase_eventual(uuid, uuid, numeric, text, text) TO authenticated;
