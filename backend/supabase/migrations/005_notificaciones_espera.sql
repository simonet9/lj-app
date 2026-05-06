-- ─── Migración 005: Notificaciones de lista de espera ────────────────────────
--
-- Función: notificar_lista_espera()
--   Se activa cuando una reserva pasa de 'confirmada' a 'cancelada'.
--   Busca el primer socio en la lista de espera (posicion ASC, notificado_at IS NULL)
--   e inserta una notificación + actualiza notificado_at y expira_at.
--
-- Trigger: notificar_espera_trigger
--   AFTER UPDATE ON reservas — se ejecuta DESPUÉS de handle_reserva_cupo,
--   garantizando que el cupo ya fue liberado antes de notificar.
--
-- Nota: La ventana de 15 minutos se almacena en expira_at.
-- La reasignación automática al siguiente socio es post-MVP.

-- ─── Etiquetas de disciplina (para mensajes legibles) ────────────────────────

CREATE OR REPLACE FUNCTION public._disciplina_label(d TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE d
    WHEN 'futbol5'  THEN 'Fútbol 5'
    WHEN 'padel'    THEN 'Pádel'
    WHEN 'voley'    THEN 'Vóley'
    WHEN 'basquet'  THEN 'Básquet'
    ELSE initcap(d)
  END;
$$;

-- ─── Función trigger: notificar_lista_espera ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.notificar_lista_espera()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER           -- puede escribir en notificaciones (bypassea RLS)
SET search_path = public
AS $$
DECLARE
  v_primero RECORD;
  v_clase   RECORD;
  v_cuerpo  TEXT;
BEGIN
  -- Solo dispararse en la transición confirmada → cancelada
  IF NEW.estado <> 'cancelada' OR OLD.estado <> 'confirmada' THEN
    RETURN NEW;
  END IF;

  -- ── 1. Obtener el primer socio en espera (no notificado aún) ─────────────
  SELECT le.id, le.socio_id, le.posicion
  INTO v_primero
  FROM public.lista_espera le
  WHERE le.clase_id     = NEW.clase_id
    AND le.notificado_at IS NULL
  ORDER BY le.posicion ASC
  LIMIT 1;

  -- Si no hay nadie en espera, salir limpiamente
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- ── 2. Obtener datos de la clase ──────────────────────────────────────────
  SELECT disciplina, fecha, hora_inicio
  INTO v_clase
  FROM public.clases
  WHERE id = NEW.clase_id;

  -- ── 3. Construir el cuerpo del mensaje ────────────────────────────────────
  v_cuerpo :=
    'Se liberó un lugar en la clase de '
    || public._disciplina_label(v_clase.disciplina::TEXT)
    || ' del '
    || TO_CHAR(v_clase.fecha,       'DD/MM/YYYY')
    || ' a las '
    || TO_CHAR(v_clase.hora_inicio, 'HH24:MI')
    || '. Tenés 15 minutos para confirmar tu asistencia.';

  -- ── 4. Insertar notificación ──────────────────────────────────────────────
  INSERT INTO public.notificaciones
    (usuario_id, titulo, cuerpo, tipo, referencia_id)
  VALUES
    (v_primero.socio_id,
     'Se liberó un lugar',
     v_cuerpo,
     'espera',
     NEW.clase_id);

  -- ── 5. Marcar al socio como notificado y establecer ventana de 15 min ────
  UPDATE public.lista_espera
  SET
    notificado_at = NOW(),
    expira_at     = NOW() + INTERVAL '15 minutes'
  WHERE id = v_primero.id;

  RETURN NEW;
END;
$$;

-- ─── Trigger ─────────────────────────────────────────────────────────────────
-- Se registra AFTER de reserva_cupo_trigger (cupo ya liberado).
-- PostgreSQL ejecuta triggers AFTER en orden de nombre si tienen igual evento;
-- el nombre 'notificar_espera_trigger' es alfabéticamente posterior
-- a 'reserva_cupo_trigger', garantizando el orden correcto.

DROP TRIGGER IF EXISTS notificar_espera_trigger ON public.reservas;

CREATE TRIGGER notificar_espera_trigger
  AFTER UPDATE ON public.reservas
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_lista_espera();

-- ─── Permisos ─────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.notificar_lista_espera  TO authenticated;
GRANT EXECUTE ON FUNCTION public._disciplina_label(TEXT) TO authenticated;
