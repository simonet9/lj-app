import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@services/supabase';
import {
  fetchNotificaciones,
  contarNoLeidas,
  marcarComoLeida as svcMarcarComoLeida,
  marcarTodasComoLeidas as svcMarcarTodasComoLeidas,
  type Notificacion,
} from '@services/notificaciones';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type { Notificacion };

export interface UseNotificacionesResult {
  notificaciones: Notificacion[];
  noLeidas:       number;
  loading:        boolean;
  marcarComoLeida:       (id: string) => Promise<void>;
  marcarTodasComoLeidas: ()           => Promise<void>;
  refresh:        () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook que combina fetch inicial + suscripción Supabase Realtime para
 * recibir notificaciones en tiempo real.
 *
 * - Abre un canal Realtime filtrando INSERT en notificaciones por usuario_id.
 * - Al recibir un INSERT nuevo, lo antepone a la lista local (sin refetch).
 * - Limpia el canal en el unmount para evitar memory leaks.
 *
 * Uso:
 *   const { notificaciones, noLeidas } = useNotificaciones(usuario?.id);
 */
export function useNotificaciones(
  usuarioId: string | undefined,
): UseNotificacionesResult {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas]             = useState(0);
  const [loading, setLoading]               = useState(true);

  // Ref para el canal realtime — lo guardamos para poder cerrarlo en cleanup
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Fetch inicial ──────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    if (!usuarioId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [data, count] = await Promise.all([
      fetchNotificaciones(usuarioId),
      contarNoLeidas(usuarioId),
    ]);
    setNotificaciones(data);
    setNoLeidas(count);
    setLoading(false);
  }, [usuarioId]);

  // ── Suscripción Realtime ───────────────────────────────────────────────────
  useEffect(() => {
    if (!usuarioId) return;

    // Fetch inicial
    cargar();

    // Abrir canal Realtime — escucha INSERT en notificaciones del usuario
    const channel = supabase
      .channel(`notificaciones:${usuarioId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notificaciones',
          filter: `usuario_id=eq.${usuarioId}`,
        },
        (payload) => {
          const nueva = payload.new as Notificacion;
          // Anteponer al listado sin refetch completo
          setNotificaciones(prev => [nueva, ...prev]);
          setNoLeidas(prev => prev + 1);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useNotificaciones] Realtime conectado para', usuarioId);
        }
      });

    channelRef.current = channel;

    // Cleanup: cerrar canal al desmontar o cambiar usuarioId
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [usuarioId, cargar]);

  // ── Acciones ──────────────────────────────────────────────────────────────

  async function marcarComoLeida(id: string) {
    await svcMarcarComoLeida(id);
    setNotificaciones(prev =>
      prev.map(n => (n.id === id ? { ...n, leida: true } : n)),
    );
    setNoLeidas(prev => Math.max(0, prev - 1));
  }

  async function marcarTodasComoLeidas() {
    if (!usuarioId) return;
    await svcMarcarTodasComoLeidas(usuarioId);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);
  }

  return {
    notificaciones,
    noLeidas,
    loading,
    marcarComoLeida,
    marcarTodasComoLeidas,
    refresh: cargar,
  };
}
