-- ─── Migración 015: Push Notification Tokens ─────────────────────────────────
--
-- Almacena los Expo Push Tokens de los dispositivos de cada usuario.
-- Un usuario puede tener múltiples tokens (múltiples dispositivos).
-- Índices optimizados para lookup por user_id y por token (invalidación).

-- ── Tabla ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT        NOT NULL,
  platform   TEXT        NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un device (token) es único por usuario y plataforma
  UNIQUE (user_id, push_token)
);

-- ── Índices ───────────────────────────────────────────────────────────────────

-- Lookup principal: "dame todos los tokens activos del usuario X"
-- Usado por la Edge Function al enviar notificaciones.
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_active
  ON public.user_push_tokens (user_id, active)
  WHERE active = TRUE;

-- Lookup por token solo: para invalidar un token concreto (DeviceNotRegistered)
CREATE INDEX IF NOT EXISTS idx_push_tokens_token
  ON public.user_push_tokens (push_token);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Un usuario solo puede ver sus propios tokens
CREATE POLICY "push_tokens_select_own"
  ON public.user_push_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Un usuario solo puede insertar sus propios tokens
CREATE POLICY "push_tokens_insert_own"
  ON public.user_push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Un usuario solo puede actualizar sus propios tokens
CREATE POLICY "push_tokens_update_own"
  ON public.user_push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Un usuario solo puede borrar sus propios tokens (ej. al hacer sign out)
CREATE POLICY "push_tokens_delete_own"
  ON public.user_push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- NOTA: El service_role (usado por Edge Functions) omite RLS automáticamente,
-- por lo que no necesita política adicional para leer todos los tokens.

-- ── Trigger: auto-actualizar updated_at ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_push_token_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON public.user_push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_push_token_updated_at();

-- ── RPC helper: upsert_push_token ─────────────────────────────────────────────
-- Llamada desde el frontend al registrar/actualizar el token.
-- Hace INSERT ... ON CONFLICT UPDATE para manejar rotaciones de token.
-- También reactiva tokens que estaban marcados como inactive.

CREATE OR REPLACE FUNCTION public.upsert_push_token(
  p_user_id    UUID,
  p_push_token TEXT,
  p_platform   TEXT
)
RETURNS VOID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_push_tokens (user_id, push_token, platform, active)
  VALUES (p_user_id, p_push_token, p_platform, TRUE)
  ON CONFLICT (user_id, push_token)
  DO UPDATE SET
    active     = TRUE,
    platform   = EXCLUDED.platform,
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_push_token(UUID, TEXT, TEXT) TO authenticated;

-- ── RPC helper: deactivate_push_token ─────────────────────────────────────────
-- Llamada al hacer sign out: desactiva el token del dispositivo actual.

CREATE OR REPLACE FUNCTION public.deactivate_push_token(
  p_user_id    UUID,
  p_push_token TEXT
)
RETURNS VOID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER AS $$
BEGIN
  UPDATE public.user_push_tokens
  SET active = FALSE, updated_at = NOW()
  WHERE user_id = p_user_id AND push_token = p_push_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deactivate_push_token(UUID, TEXT) TO authenticated;
