import { supabase } from '@services/supabase';
import type { Pack, CompraPackResult } from '@app-types/index';

// ─── Tipos de respuesta ───────────────────────────────────────────────────────

export interface CompraPackError {
  codigo: string;
  mensaje: string;
}

const MENSAJES_ERROR: Record<string, string> = {
  pack_no_encontrado: 'El pack seleccionado ya no está disponible.',
  pack_ya_comprado: 'Ya compraste este pack anteriormente.',
  sin_cupo_en_clase: 'Una de las clases del pack ya no tiene cupo.',
  reserva_duplicada: 'Ya tenés una reserva en alguna de las clases de este pack.',
  rpc_error: 'No se pudo procesar la compra. Intentá de nuevo.',
};

// ─── Servicio ─────────────────────────────────────────────────────────────────

/**
 * Obtiene los packs disponibles para el socio con triple filtro:
 *   1. Cupo en las 4 fechas
 *   2. Sin solapamiento de horario con reservas del socio
 *   3. El socio no compró ya el pack
 */
export async function obtenerPacksDisponibles(socioId: string): Promise<Pack[]> {
  const { data, error } = await supabase.rpc('obtener_packs_disponibles', {
    p_socio_id: socioId,
  });

  // Mapear el JSON de la BD al tipo Pack
  return data.map((row: any): Pack => ({
    pack_id: row.pack_id,
    disciplina: row.disciplina,
    nivel: row.nivel,
    dia_semana: row.dia_semana,
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,
    precio: Number(row.precio),
    cupo_minimo: Number(row.cupo_minimo),
    ya_comprado: Boolean(row.ya_comprado),
    solapa_horarios: Boolean(row.solapa_horarios),
    fechas: Array.isArray(row.fechas)
      ? row.fechas.map((f: any) => ({
        clase_id: f.clase_id,
        fecha: f.fecha,
        semana: f.semana,
        cupo: f.cupo,
      }))
      : [],
  }));
}

/**
 * Ejecuta la compra de un pack de forma atómica.
 * Crea 4 reservas + 1 compra_pack en una sola transacción.
 *
 * Lanza CompraPackError si la operación falla.
 */
export async function comprarPackAtomico(
  socioId: string,
  packId: string,
  monto: number,
): Promise<CompraPackResult> {
  const { data, error } = await supabase.rpc('comprar_pack_atomico', {
    p_socio_id: socioId,
    p_pack_id: packId,
    p_monto: monto,
  });

  if (error) {
    console.error('[packs] RPC error en comprar_pack_atomico:', error.message);
    throw { codigo: 'rpc_error', mensaje: MENSAJES_ERROR['rpc_error'] } as CompraPackError;
  }

  if (data?.error) {
    const codigo: string = data.error;
    const mensaje = MENSAJES_ERROR[codigo] ?? MENSAJES_ERROR['rpc_error'];
    throw { codigo, mensaje } as CompraPackError;
  }

  if (!data?.success) {
    throw { codigo: 'rpc_error', mensaje: MENSAJES_ERROR['rpc_error'] } as CompraPackError;
  }

  return {
    success: data.success as boolean,
    compra_id: data.compra_id as string,
    reserva_ids: data.reserva_ids as string[],
  };
}
