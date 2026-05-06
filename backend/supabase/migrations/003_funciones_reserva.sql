-- ============================================================
-- Migración 003: Función RPC para reserva atómica de clase
-- Aplica a: socio abonado (HU-08)
-- ============================================================

-- Función: reservar_clase_abonado
-- Ejecuta en una sola transacción:
--   1. Valida créditos disponibles del socio (FOR UPDATE → evita race conditions)
--   2. Valida cupo disponible de la clase (FOR UPDATE)
--   3. Inserta la reserva con estado 'confirmada' y credito_usado=true
--   4. Descuenta 1 crédito al socio
--   (el trigger handle_reserva_cupo actualiza cupo_disponible automáticamente)
--
-- Retorna:
--   { success: true, reserva_id: uuid, creditos_restantes: int }  → OK
--   { error: 'sin_creditos' }                                      → socio sin créditos
--   { error: 'sin_cupo'     }                                      → clase sin cupo disponible
--   { error: 'ya_reservada' }                                      → reserva duplicada (unique violation)

CREATE OR REPLACE FUNCTION reservar_clase_abonado(
  p_socio_id uuid,
  p_clase_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER   -- corre con permisos del owner, no del socio
AS $$
DECLARE
  v_creditos         int;
  v_cupo             int;
  v_reserva_id       uuid;
  v_creditos_restantes int;
BEGIN
  -- ── 1. Leer créditos con bloqueo para evitar doble gasto ──────────────────
  SELECT creditos
    INTO v_creditos
    FROM usuarios
   WHERE id = p_socio_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'socio_no_encontrado');
  END IF;

  IF v_creditos < 1 THEN
    RETURN json_build_object('error', 'sin_creditos');
  END IF;

  -- ── 2. Leer cupo con bloqueo ──────────────────────────────────────────────
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

  -- ── 3. Insertar reserva ───────────────────────────────────────────────────
  -- Si ya existe una reserva confirmada para este socio+clase, el unique
  -- constraint lanzará una excepción que capturamos abajo.
  INSERT INTO reservas (socio_id, clase_id, estado, credito_usado)
    VALUES (p_socio_id, p_clase_id, 'confirmada', true)
    RETURNING id INTO v_reserva_id;

  -- ── 4. Descontar 1 crédito ────────────────────────────────────────────────
  UPDATE usuarios
     SET creditos = creditos - 1
   WHERE id = p_socio_id
  RETURNING creditos INTO v_creditos_restantes;

  -- El trigger handle_reserva_cupo se encarga de actualizar cupo_disponible
  -- en la tabla clases al detectar el INSERT en reservas.

  RETURN json_build_object(
    'success',             true,
    'reserva_id',          v_reserva_id,
    'creditos_restantes',  v_creditos_restantes
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('error', 'ya_reservada');
END;
$$;

-- Revocar ejecución pública y dar permiso solo a roles autenticados
REVOKE EXECUTE ON FUNCTION reservar_clase_abonado(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION reservar_clase_abonado(uuid, uuid) TO authenticated;
