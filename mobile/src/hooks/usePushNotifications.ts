/**
 * usePushNotifications.ts
 *
 * Hook que conecta el NotificationService con:
 *  1. El estado de auth del usuario (registra/desregistra el token al loguear/desloguear)
 *  2. El router de expo-router (navega al tocar una notificación)
 *  3. El store local de notificaciones (badge count)
 *
 * Diseñado para usarse UNA SOLA VEZ en el root layout (_layout.tsx).
 */

import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useAuth } from '@context/AuthContext';
import {
  requestPushPermissions,
  registerTokenInSupabase,
  deactivateTokenInSupabase,
  addForegroundListener,
  addResponseListener,
  getLastNotificationResponse,
  clearBadge,
} from '@services/NotificationService';

// ─── Navegación por tipo de notificación ─────────────────────────────────────

type NotifData = {
  tipo?: string;
  claseId?: string;
  reservaId?: string;
  [key: string]: unknown;
};

function handleNotificationNavigation(data: NotifData): void {
  const { tipo, claseId, reservaId } = data;

  switch (tipo) {
    case 'lista_espera':
      // Abrir detalle de la clase para que confirme su asistencia
      if (claseId) {
        router.push(`/(socio)/clase/${claseId}` as any);
      }
      break;

    case 'reserva_confirmada':
      // Ir a la pantalla de mis reservas
      router.push('/(socio)/reservas' as any);
      break;

    case 'clase_suspendida':
      // Ir a mis reservas para ver el estado
      router.push('/(socio)/reservas' as any);
      break;

    case 'cancelacion':
      if (reservaId) {
        router.push('/(socio)/reservas' as any);
      }
      break;

    default:
      // Tipo desconocido — no navegar
      console.log('[usePushNotifications] Notificación sin navegación definida, tipo:', tipo);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePushNotifications(): void {
  const { usuario } = useAuth();

  // Guardamos el token actual para poder desactivarlo en sign out
  const currentTokenRef = useRef<string | null>(null);
  // Evitar registrar el token múltiples veces para el mismo usuario
  const registeredForRef = useRef<string | null>(null);

  // ── 1. Registrar token cuando el usuario se autentica ─────────────────────
  useEffect(() => {
    if (!usuario) {
      // Usuario deslogueado → desactivar el token actual si existe
      if (currentTokenRef.current && registeredForRef.current) {
        deactivateTokenInSupabase(registeredForRef.current, currentTokenRef.current)
          .finally(() => {
            currentTokenRef.current = null;
            registeredForRef.current = null;
          });
      }
      return;
    }

    // Evitar doble registro para el mismo usuario
    if (registeredForRef.current === usuario.id) return;

    async function register() {
      const { status, token } = await requestPushPermissions();

      if (status === 'denied') {
        console.log('[usePushNotifications] Permisos denegados por el usuario');
        return;
      }

      if (status === 'unavailable') {
        // Simulador o web — silencioso, no es un error
        return;
      }

      if (!token || !usuario) return;

      currentTokenRef.current = token;
      registeredForRef.current = usuario.id;

      await registerTokenInSupabase(usuario.id, token);
    }

    register();
  }, [usuario]);

  // ── 2. Listener: notificación recibida con app en foreground ──────────────
  useEffect(() => {
    const cleanup = addForegroundListener((notification) => {
      const data = notification.request.content.data as NotifData;
      console.log('[usePushNotifications] Notificación en foreground:', {
        title: notification.request.content.title,
        tipo: data?.tipo,
      });
      // No navegamos en foreground — el usuario ya está en la app.
      // La notificación aparece como banner gracias al handler global.
    });

    return cleanup;
  }, []);

  // ── 3. Listener: usuario toca la notificación ─────────────────────────────
  useEffect(() => {
    const cleanup = addResponseListener((response) => {
      const data = response.notification.request.content.data as NotifData;
      console.log('[usePushNotifications] Notificación tocada:', data);

      // Limpiar badge al abrir
      clearBadge();

      // Navegar según el tipo
      handleNotificationNavigation(data);
    });

    return cleanup;
  }, []);

  // ── 4. Cold start: notificación que abrió la app ──────────────────────────
  useEffect(() => {
    getLastNotificationResponse().then((response) => {
      if (!response) return;

      const data = response.notification.request.content.data as NotifData;
      const receivedAt = response.notification.date;
      const ageSeconds = (Date.now() - receivedAt * 1000) / 1000;

      // Solo procesar si tiene menos de 60 segundos (evitar navegación al abrir la app por segunda vez)
      if (ageSeconds < 60) {
        console.log('[usePushNotifications] Cold start desde notificación:', data);
        clearBadge();
        handleNotificationNavigation(data);
      }
    });
  }, []); // Solo al montar (cold start)
}

// ─── Hook helper: enviar push desde el frontend (Evento B) ───────────────────

/**
 * Llama a la Edge Function send-push-notification directamente desde el frontend.
 * Usar SOLO para el Evento B (reserva confirmada), donde la acción ya ocurrió
 * y el usuario está esperando feedback.
 *
 * Para eventos server-side (lista espera, suspensión), usar Database Webhooks.
 */
export async function sendPushFromClient(params: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const { supabase } = await import('@services/supabase');
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.warn('[sendPushFromClient] No hay sesión activa');
    return;
  }

  // Obtener URL de la Edge Function desde el cliente de supabase
  // Esto requiere que la Edge Function acepte el anon key + bearer del usuario
  const supabaseUrl = (supabase as any).supabaseUrl as string;

  try {
    await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        userIds: [params.userId],
        title: params.title,
        body: params.body,
        data: params.data,
        priority: 'high',
      }),
    });
  } catch (err: any) {
    // No bloquear el flujo principal si falla el push
    console.error('[sendPushFromClient] Error:', err.message);
  }
}
