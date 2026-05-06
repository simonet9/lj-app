import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@services/supabase';
import type { Reserva } from '@app-types/index';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface UseReservasResult {
  reservas: Reserva[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fechaHoy(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * PostgREST no soporta filtrar por columnas de relaciones embebidas con .gte()
 * directamente. Filtramos y ordenamos en cliente — el volumen de reservas activas
 * por socio es siempre pequeño (< 20), por lo que es O(n) sin impacto real.
 */
function filtrarYOrdenar(data: Reserva[]): Reserva[] {
  const hoy = fechaHoy();
  return data
    .filter(r => {
      const fecha: string | undefined = (r.clase as any)?.fecha;
      return fecha !== undefined && fecha >= hoy;
    })
    .sort((a, b) => {
      const fa: string = (a.clase as any)?.fecha ?? '';
      const fb: string = (b.clase as any)?.fecha ?? '';
      if (fa < fb) return -1;
      if (fa > fb) return 1;
      // Secundario: hora_inicio
      const ha: string = (a.clase as any)?.hora_inicio ?? '';
      const hb: string = (b.clase as any)?.hora_inicio ?? '';
      return ha.localeCompare(hb);
    });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Obtiene las reservas confirmadas del socio con clases desde hoy.
 *
 * Reglas de negocio aplicadas:
 * - Solo estado = 'confirmada'
 * - Solo clases con fecha >= hoy (filtrado en cliente)
 * - Orden: fecha ASC, hora_inicio ASC (ordenado en cliente)
 *
 * No realiza polling — solo fetch al montar y al llamar refresh().
 */
export function useReservas(socioId: string | undefined): UseReservasResult {
  const [reservas, setReservas]       = useState<Reserva[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const fetchReservas = useCallback(async (isRefresh = false) => {
    if (!socioId) {
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('reservas')
        .select(`
          *,
          clase:clases(
            id, disciplina, nivel, fecha, hora_inicio, hora_fin, estado
          )
        `)
        .eq('socio_id', socioId)
        .eq('estado', 'confirmada');

      if (queryError) {
        console.error('[useReservas] Error:', queryError.message);
        setError('No se pudieron cargar tus reservas. Intentá de nuevo.');
      } else {
        setReservas(filtrarYOrdenar((data ?? []) as Reserva[]));
      }
    } catch (err: any) {
      console.error('[useReservas] Exception:', err.message);
      setError('No se pudieron cargar tus reservas. Intentá de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [socioId]);

  useEffect(() => {
    fetchReservas(false);
  }, [fetchReservas]);

  function refresh() {
    fetchReservas(true);
  }

  return { reservas, loading, refreshing, error, refresh };
}
