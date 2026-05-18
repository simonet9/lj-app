/**
 * NotificationService.ts
 *
 * Servicio centralizado para gestión de Push Notifications con expo-notifications.
 * Responsabilidades:
 *  - Solicitar permisos
 *  - Obtener y registrar el Expo Push Token en Supabase
 *  - Configurar canales de Android
 *  - Proporcionar helpers para registrar/desregistrar listeners
 *
 * NO contiene lógica de UI — eso va en usePushNotifications hook.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@services/supabase';

// ─── Configuración global del handler ────────────────────────────────────────
// Debe llamarse antes de que la app intente mostrar notificaciones.
// Controla cómo se muestran cuando la app está en foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // Mostrar banner con la app abierta
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBadgeInExpander: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export interface PushRegistrationResult {
  status: PushPermissionStatus;
  token: string | null;
}

// ─── Canal de Android ─────────────────────────────────────────────────────────

const ANDROID_CHANNEL_ID = 'default';

async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Centro Deportivo L&J',
    description: 'Notificaciones de reservas, clases y lista de espera',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3b82f6',
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
    sound: 'default',
  });
}

// ─── Obtener plataforma ───────────────────────────────────────────────────────

function getPlatform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

// ─── Solicitar permisos y obtener token ───────────────────────────────────────

/**
 * Solicita permisos de notificaciones push y retorna el Expo Push Token.
 *
 * - En simuladores (no físicos) retorna null sin lanzar error.
 * - Si el usuario niega, retorna { status: 'denied', token: null }.
 * - Si la plataforma es web, retorna unavailable.
 */
export async function requestPushPermissions(): Promise<PushRegistrationResult> {
  // Web no soporta expo-notifications
  if (Platform.OS === 'web') {
    return { status: 'unavailable', token: null };
  }

  // Solo en dispositivos físicos — Expo Go en simulador no tiene push real
  if (!Device.isDevice) {
    console.warn('[NotificationService] Push no disponible en simulador');
    return { status: 'unavailable', token: null };
  }

  // Configurar canal Android antes de solicitar permisos
  await setupAndroidChannel();

  // Verificar permisos existentes primero
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[NotificationService] Permisos push denegados');
    return { status: 'denied', token: null };
  }

  // Obtener token — requiere projectId de EAS (app.json extra.eas.projectId)
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: 'fcc2e74d-f0b9-47ab-a5c1-1eccdc8df120',
    });
    console.log('[NotificationService] Token obtenido:', token.substring(0, 30) + '...');
    return { status: 'granted', token };
  } catch (err: any) {
    const msg: string = err?.message ?? '';

    // Firebase no inicializado → falta google-services.json (build de dev sin Firebase)
    if (msg.includes('FirebaseApp') || msg.includes('Default FirebaseApp')) {
      console.warn(
        '[NotificationService] Firebase no inicializado. ' +
        'Colocá google-services.json en android/app/ y corré `npx expo prebuild`.',
      );
      return { status: 'unavailable', token: null };
    }

    console.error('[NotificationService] Error obteniendo token:', msg);
    return { status: 'undetermined', token: null };
  }
}

// ─── Registrar token en Supabase ──────────────────────────────────────────────

/**
 * Hace upsert del push token para el usuario autenticado.
 * Llama a la RPC `upsert_push_token` que maneja INSERT ... ON CONFLICT.
 * Safe de llamar múltiples veces (idempotente).
 */
export async function registerTokenInSupabase(
  userId: string,
  pushToken: string,
): Promise<void> {
  const platform = getPlatform();

  const { error } = await supabase.rpc('upsert_push_token', {
    p_user_id: userId,
    p_push_token: pushToken,
    p_platform: platform,
  });

  if (error) {
    console.error('[NotificationService] Error registrando token en BD:', error.message);
  } else {
    console.log('[NotificationService] Token registrado en BD para usuario:', userId);
  }
}

/**
 * Desactiva el token del dispositivo actual en Supabase.
 * Llamar en el flujo de sign out para evitar notificaciones a sesiones cerradas.
 */
export async function deactivateTokenInSupabase(
  userId: string,
  pushToken: string,
): Promise<void> {
  const { error } = await supabase.rpc('deactivate_push_token', {
    p_user_id: userId,
    p_push_token: pushToken,
  });

  if (error) {
    console.error('[NotificationService] Error desactivando token:', error.message);
  }
}

// ─── Listeners ────────────────────────────────────────────────────────────────

/**
 * Registra el listener para notificaciones recibidas con la app en foreground.
 * Retorna la función de cleanup para usar en useEffect.
 */
export function addForegroundListener(
  handler: (notification: Notifications.Notification) => void,
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(handler);
  return () => subscription.remove();
}

/**
 * Registra el listener para cuando el usuario toca una notificación.
 * Retorna la función de cleanup para usar en useEffect.
 *
 * El `response.notification.request.content.data` contiene el payload
 * que enviamos desde la Edge Function (tipo, claseId, etc.).
 */
export function addResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(handler);
  return () => subscription.remove();
}

/**
 * Obtiene la notificación que causó el cold start de la app (si existe).
 * Llamar una vez al montar el root layout.
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  if (Platform.OS === 'web') return null;
  return await Notifications.getLastNotificationResponseAsync();
}

/**
 * Limpia el badge del ícono de la app.
 */
export async function clearBadge(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.setBadgeCountAsync(0);
}
