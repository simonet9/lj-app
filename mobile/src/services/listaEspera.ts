import { supabase } from '@services/supabase';
import type { ListaEspera } from '@app-types/index';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface InscripcionResult {
  entrada: ListaEspera;
  posicion: number;
}

export type InscripcionError =
  | 'already_inscribed'  // unique_violation: 23505
  | 'unknown';

export interface InscripcionFailure {
  tipo: InscripcionError;
  mensaje: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mapea códigos de error de Postgres/Supabase a tipos de error de dominio. */
function mapearError(error: any): InscripcionFailure {
  // Postgres unique_violation = código 23505
  const codigo: string = error?.code ?? '';
  if (codigo === '23505') {
    return {
      tipo: 'already_inscribed',
      mensaje: 'Ya estás en la lista de espera de esta clase.',
    };
  }
  return {
    tipo: 'unknown',
    mensaje: 'No se pudo procesar la solicitud. Intentá de nuevo.',
  };
}

// ─── Servicio ──────────────────────────────────────────────────────────────────

/**
 * Inscribe a un socio en la lista de espera de una clase.
 *
 * Estrategia FIFO:
 *   1. Consulta MAX(posicion) para la clase dada.
 *   2. Inserta con posicion = MAX + 1 (o 1 si la lista está vacía).
 *
 * Lanza un InscripcionFailure si falla (unique_violation u otro error).
 */
export async function inscribirseEnLista(socioId: string, claseId: string) {
  const { data, error } = await supabase.rpc('inscribirse_en_lista_espera', {
    p_socio_id: socioId,
    p_clase_id: claseId
  })

  if (error) {
    console.error('[listaEspera] RPC error:', error.message)
    throw new Error('No se pudo procesar la solicitud. Intentá de nuevo.')
  }

  if (data?.error === 'already_inscribed') {
    throw new Error('Ya estás en la lista de espera de esta clase')
  }
  
  if (data?.error) {
    console.error('[listaEspera] RPC business error:', data.error)
    throw new Error('No se pudo procesar la solicitud. Intentá de nuevo.')
  }

  return { ...data }
}

/**
 * Devuelve la entrada de lista de espera del socio para la clase dada,
 * o null si no está anotado.
 */
export async function obtenerPosicionEnLista(
  socioId: string,
  claseId: string,
): Promise<ListaEspera | null> {
  const { data } = await supabase
    .from('lista_espera')
    .select('*')
    .eq('socio_id', socioId)
    .eq('clase_id', claseId)
    .maybeSingle();

  return (data as ListaEspera | null) ?? null;
}
