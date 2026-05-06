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
export async function inscribirseEnLista(
  socioId: string,
  claseId: string,
): Promise<InscripcionResult> {
  // ── Paso 1: obtener la posición máxima actual ─────────────────────────────
  const { data: maxData } = await supabase
    .from('lista_espera')
    .select('posicion')
    .eq('clase_id', claseId)
    .order('posicion', { ascending: false })
    .limit(1)
    .maybeSingle(); // no lanza error si no hay filas (lista vacía)

  const siguientePosicion = (maxData?.posicion ?? 0) + 1;

  // ── Paso 2: insertar entrada ──────────────────────────────────────────────
  const { data, error } = await supabase
    .from('lista_espera')
    .insert({
      socio_id: socioId,
      clase_id: claseId,
      posicion: siguientePosicion,
    })
    .select()
    .single();

  if (error) {
    throw mapearError(error);
  }

  return {
    entrada: data as ListaEspera,
    posicion: siguientePosicion,
  };
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
