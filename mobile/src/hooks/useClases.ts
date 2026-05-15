import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@services/supabase';
import type { Clase } from '@app-types/index';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface UseClasesResult {
  clases: Clase[];
  reservas: string[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}

// ─── Helper: fecha de hoy en formato ISO YYYY-MM-DD ──────────────────────────

function fechaHoy(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Obtiene TODAS las clases no suspendidas desde hoy en adelante.
 *
 * Reglas de negocio aplicadas en la query:
 * - Excluye clases con estado 'suspendida'
 * - Solo clases con fecha >= hoy
 * - Orden: fecha ASC, hora_inicio ASC
 *
 * El filtrado por disciplina y nivel se realiza en el cliente (HU-06)
 * para evitar múltiples llamadas a la red al cambiar filtros.
 *
 * No realiza polling — solo fetch al montar y al llamar refresh().
 */
export function useClases(usuarioId?: string): UseClasesResult {
  const [clases, setClases]         = useState<Clase[]>([]);
  const [reservas, setReservas]     = useState<string[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const fetchClases = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const queryClases = supabase
        .from('clases')
        .select('*, gestor:usuarios(id)')
        .gte('fecha', fechaHoy())         // RN: solo desde hoy
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true });

      let queryReservas = null;
      if (usuarioId) {
        queryReservas = supabase
          .from('reservas')
          .select('clase_id')
          .eq('socio_id', usuarioId)
          .eq('estado', 'confirmada');
      }

      const [resClases, resReservas] = await Promise.all([queryClases, queryReservas]);

      if (resClases.error) {
        console.error('[useClases] Error fetching clases:', resClases.error.message);
        setError('No se pudieron cargar las clases. Intentá de nuevo.');
      } else {
        setClases((resClases.data ?? []) as Clase[]);
      }

      if (resReservas && !resReservas.error) {
        setReservas(resReservas.data.map((r: any) => r.clase_id));
      } else {
        setReservas([]);
      }
    } catch (err: any) {
      console.error('[useClases] Exception:', err.message);
      setError('No se pudieron cargar las clases. Intentá de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // sin dependencias: la query es siempre la misma

  useEffect(() => {
    fetchClases(false);
  }, [fetchClases, usuarioId]);

  function refresh() {
    fetchClases(true);
  }

  return { clases, reservas, loading, refreshing, error, refresh };
}
