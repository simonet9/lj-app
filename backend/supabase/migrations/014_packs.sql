-- ─── Migración 014: Sistema de Packs (HU-25 y HU-48) ────────────────────────
--
-- Un Pack agrupa 4 clases de la misma disciplina, nivel, día y horario
-- durante 4 semanas consecutivas.
--
-- Tablas:
--   packs         → definición del pack (disciplina, horario, precio)
--   pack_clases   → las 4 clases concretas que componen un pack
--   compras_pack  → historial de compras de packs por socio
--
-- Funciones:
--   obtener_packs_disponibles(p_socio_id) → lista packs con triple filtro
--   comprar_pack_atomico(p_socio_id, p_pack_id, p_monto) → reserva 4 clases en 1 TX

-- ── Tabla: packs ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.packs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina  TEXT        NOT NULL CHECK (disciplina IN ('futbol5','padel','voley','basquet')),
  nivel       TEXT        NOT NULL CHECK (nivel IN ('principiante','intermedio','avanzado')),
  dia_semana  TEXT        NOT NULL,  -- 'lunes', 'martes', etc.
  hora_inicio TEXT        NOT NULL,  -- 'HH:MM'
  hora_fin    TEXT        NOT NULL,  -- 'HH:MM'
  gestor_id   UUID        REFERENCES public.usuarios(id) ON DELETE SET NULL,
  precio      NUMERIC     NOT NULL DEFAULT 0,
  activo      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packs_select_auth"
  ON public.packs FOR SELECT
  TO authenticated
  USING (activo = TRUE);

-- ── Tabla: pack_clases ────────────────────────────────────────────────────────
-- Join entre un pack y las 4 clases concretas (semanas 1 a 4)

CREATE TABLE IF NOT EXISTS public.pack_clases (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id       UUID    NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  clase_id      UUID    NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  semana_numero INTEGER NOT NULL CHECK (semana_numero BETWEEN 1 AND 4),
  UNIQUE (pack_id, clase_id),
  UNIQUE (pack_id, semana_numero)
);

ALTER TABLE public.pack_clases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pack_clases_select_auth"
  ON public.pack_clases FOR SELECT
  TO authenticated
  USING (TRUE);

-- ── Tabla: compras_pack ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.compras_pack (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id     UUID        NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  pack_id      UUID        NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  monto_pagado NUMERIC     NOT NULL DEFAULT 0,
  pagado_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado       TEXT        NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'cancelado')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (socio_id, pack_id)  -- Un socio no puede comprar el mismo pack dos veces
);

ALTER TABLE public.compras_pack ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compras_pack_select_own"
  ON public.compras_pack FOR SELECT
  USING (auth.uid() = socio_id);

CREATE POLICY "compras_pack_insert_own"
  ON public.compras_pack FOR INSERT
  WITH CHECK (auth.uid() = socio_id);

-- ── Función: obtener_packs_disponibles ────────────────────────────────────────
-- Triple filtro:
--   1. Cupo disponible en las 4 fechas del pack
--   2. Sin solapamiento de horario con reservas actuales del socio
--   3. El socio no compró ya ese pack

CREATE OR REPLACE FUNCTION public.obtener_packs_disponibles(
  p_socio_id UUID
)
RETURNS TABLE (
  pack_id       UUID,
  disciplina    TEXT,
  nivel         TEXT,
  dia_semana    TEXT,
  hora_inicio   TEXT,
  hora_fin      TEXT,
  precio        NUMERIC,
  fechas        JSON,
  cupo_minimo   INTEGER,
  ya_comprado   BOOLEAN,
  solapa_horarios BOOLEAN
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH pack_info AS (
    SELECT
      p.id                          AS p_id,
      p.disciplina,
      p.nivel,
      p.dia_semana,
      p.hora_inicio,
      p.hora_fin,
      p.precio,
      COUNT(pc.clase_id)            AS num_clases,
      MIN(c.cupo_disponible)        AS cupo_min,
      json_agg(
        json_build_object(
          'clase_id',    c.id,
          'fecha',       c.fecha,
          'semana',      pc.semana_numero,
          'cupo',        c.cupo_disponible
        ) ORDER BY pc.semana_numero
      )                             AS fechas_json
    FROM public.packs p
    JOIN public.pack_clases pc ON pc.pack_id = p.id
    JOIN public.clases c       ON c.id = pc.clase_id
    WHERE p.activo = TRUE
      AND c.estado != 'suspendida'
    GROUP BY p.id, p.disciplina, p.nivel, p.dia_semana, p.hora_inicio, p.hora_fin, p.precio
    HAVING COUNT(pc.clase_id) = 4
  ),
  reservas_socio AS (
    SELECT c.fecha, c.hora_inicio
    FROM public.reservas r
    JOIN public.clases c ON c.id = r.clase_id
    WHERE r.socio_id = p_socio_id
      AND r.estado = 'confirmada'
  )
  SELECT
    pi.p_id,
    pi.disciplina,
    pi.nivel,
    pi.dia_semana,
    pi.hora_inicio,
    pi.hora_fin,
    pi.precio,
    pi.fechas_json,
    pi.cupo_min::INTEGER,
    -- ya_comprado: true si compró el pack Y todavía tiene al menos una reserva activa en él
    EXISTS (
      SELECT 1 FROM public.compras_pack cp
      JOIN public.reservas r ON r.socio_id = cp.socio_id AND r.estado = 'confirmada'
      WHERE cp.socio_id = p_socio_id
        AND cp.pack_id = pi.p_id
        AND cp.estado = 'activo'
        AND r.clase_id IN (
          SELECT (elem->>'clase_id')::UUID
          FROM json_array_elements(pi.fechas_json) AS elem
        )
    ) AS ya_comprado,
    -- solapa_horarios
    EXISTS (
      SELECT 1 FROM reservas_socio rs
      WHERE rs.hora_inicio = pi.hora_inicio::TIME
        AND rs.fecha IN (
          SELECT (elem->>'fecha')::DATE
          FROM json_array_elements(pi.fechas_json) AS elem
        )
    ) AS solapa_horarios
  FROM pack_info pi
  WHERE pi.cupo_min > 0;
END;
$$;

-- ── Función: comprar_pack_atomico ─────────────────────────────────────────────
-- Crea 4 reservas + 1 compra_pack en una sola transacción atómica.

CREATE OR REPLACE FUNCTION public.comprar_pack_atomico(
  p_socio_id UUID,
  p_pack_id  UUID,
  p_monto    NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql VOLATILE SECURITY DEFINER AS $$
DECLARE
  v_compra_id    UUID;
  v_reserva_ids  UUID[] := '{}';
  v_clase_id     UUID;
  v_reserva_id   UUID;
  v_cupo         INTEGER;
  v_clase_rec    RECORD;
BEGIN
  -- ── 1. Verificar que el pack existe y está activo ─────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.packs WHERE id = p_pack_id AND activo = TRUE
  ) THEN
    RETURN json_build_object('error', 'pack_no_encontrado');
  END IF;

  -- ── 2. Verificar que el socio no tenga ya este pack con clases activas ───
  IF EXISTS (
    SELECT 1 FROM public.compras_pack cp
    JOIN public.reservas r ON r.socio_id = cp.socio_id AND r.estado = 'confirmada'
    JOIN public.pack_clases pc ON pc.pack_id = cp.pack_id AND pc.clase_id = r.clase_id
    WHERE cp.socio_id = p_socio_id 
      AND cp.pack_id = p_pack_id 
      AND cp.estado = 'activo'
  ) THEN
    RETURN json_build_object('error', 'pack_ya_comprado');
  END IF;

  -- ── 3. Registrar la compra del pack (UPSERT por si fue cancelado antes) ──
  INSERT INTO public.compras_pack (socio_id, pack_id, monto_pagado, estado)
  VALUES (p_socio_id, p_pack_id, p_monto, 'activo')
  ON CONFLICT (socio_id, pack_id) 
  DO UPDATE SET 
    monto_pagado = EXCLUDED.monto_pagado, 
    estado = 'activo', 
    pagado_at = NOW()
  RETURNING id INTO v_compra_id;

  -- ── 4. Crear reserva en cada una de las 4 clases ─────────────────────────
  FOR v_clase_rec IN (
    SELECT pc.clase_id, c.cupo_disponible
    FROM public.pack_clases pc
    JOIN public.clases c ON c.id = pc.clase_id
    WHERE pc.pack_id = p_pack_id
    ORDER BY pc.semana_numero
    FOR UPDATE OF c  -- Bloquear filas de clases para evitar condición de carrera
  ) LOOP
    -- Verificar cupo
    IF v_clase_rec.cupo_disponible < 1 THEN
      -- Hacer rollback implícito al lanzar excepción
      RAISE EXCEPTION 'sin_cupo_en_clase_%', v_clase_rec.clase_id;
    END IF;

    -- Insertar reserva (el trigger handle_reserva_cupo actualiza cupo_disponible)
    INSERT INTO public.reservas (socio_id, clase_id, estado, credito_usado, seña_pagada)
    VALUES (p_socio_id, v_clase_rec.clase_id, 'confirmada', FALSE, 0)
    RETURNING id INTO v_reserva_id;

    v_reserva_ids := array_append(v_reserva_ids, v_reserva_id);
  END LOOP;

  RETURN json_build_object(
    'success',      TRUE,
    'compra_id',    v_compra_id,
    'reserva_ids',  v_reserva_ids
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('error', 'reserva_duplicada');
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- ── Permisos ──────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.obtener_packs_disponibles(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.obtener_packs_disponibles(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.comprar_pack_atomico(UUID, UUID, NUMERIC) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.comprar_pack_atomico(UUID, UUID, NUMERIC) TO authenticated;
