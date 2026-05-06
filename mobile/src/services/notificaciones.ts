import { supabase } from '@services/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Notificacion {
  id:           string;
  usuario_id:   string;
  titulo:       string;
  cuerpo:       string;
  leida:        boolean;
  tipo:         string | null;   // 'espera' | 'cancelacion' | 'recordatorio' | 'renovacion'
  referencia_id: string | null;  // clase_id cuando tipo = 'espera'
  created_at:   string;
}

// ─── fetchNotificaciones ──────────────────────────────────────────────────────

/**
 * Obtiene todas las notificaciones del usuario, ordenadas por fecha DESC.
 * Solo llamar para el fetch inicial; las actualizaciones en vivo
 * se reciben por useNotificaciones (Supabase Realtime).
 */
export async function fetchNotificaciones(
  usuarioId: string,
): Promise<Notificacion[]> {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[notificaciones] fetchNotificaciones:', error.message);
    return [];
  }
  return (data ?? []) as Notificacion[];
}

// ─── contarNoLeidas ───────────────────────────────────────────────────────────

/**
 * Retorna el número de notificaciones no leídas del usuario.
 * Usado para el badge del tab bar — hace una query COUNT liviana.
 */
export async function contarNoLeidas(usuarioId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('leida', false);

  if (error) {
    console.error('[notificaciones] contarNoLeidas:', error.message);
    return 0;
  }
  return count ?? 0;
}

// ─── marcarComoLeida ──────────────────────────────────────────────────────────

/**
 * Marca una notificación individual como leída.
 * Llamar cuando el usuario la toca / la visualiza.
 */
export async function marcarComoLeida(notificacionId: string): Promise<void> {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', notificacionId);

  if (error) {
    console.error('[notificaciones] marcarComoLeida:', error.message);
  }
}

// ─── marcarTodasComoLeidas ────────────────────────────────────────────────────

/**
 * Marca todas las notificaciones del usuario como leídas.
 * Útil para el botón "Marcar todas como leídas".
 */
export async function marcarTodasComoLeidas(usuarioId: string): Promise<void> {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('usuario_id', usuarioId)
    .eq('leida', false);

  if (error) {
    console.error('[notificaciones] marcarTodasComoLeidas:', error.message);
  }
}
