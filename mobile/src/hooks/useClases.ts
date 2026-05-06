import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@services/supabase';
import type { Clase } from '@app-types/index';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface UseClasesResult {
  clases: Clase[];
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
export function useClases(): UseClasesResult {
  const [clases, setClases]         = useState<Clase[]>([]);
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
      const { data, error: queryError } = await supabase
        .from('clases')
        .select('*, gestor:usuarios(nombre, apellido)')
        .neq('estado', 'suspendida')      // RN: no mostrar suspendidas
        .gte('fecha', fechaHoy())         // RN: solo desde hoy
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true });

      if (queryError) {
        console.error('[useClases] Error fetching clases:', queryError.message);
        setError('No se pudieron cargar las clases. Intentá de nuevo.');
      } else {
        setClases((data ?? []) as Clase[]);
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
  }, [fetchClases]);

  function refresh() {
    fetchClases(true);
  }

  return { clases, loading, refreshing, error, refresh };
}
