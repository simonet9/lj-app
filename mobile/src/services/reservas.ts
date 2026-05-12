import { supabase } from '@services/supabase';
import type { Disciplina } from '@app-types/index';

// ─── Constantes de valor por disciplina (MVP — sin campo en BD) ───────────────
// Reemplazar por campo `valor` en public.clases cuando se integre el módulo de pagos real.

export const VALOR_CLASE_POR_DISCIPLINA: Record<Disciplina, number> = {
  futbol5: 8000,
  padel:   10000,
  voley:   7000,
  basquet: 7500,
};

/** Retorna el 50% del valor de la clase para socios eventuales. */
export function calcularSena(disciplina: Disciplina): number {
  return Math.round(VALOR_CLASE_POR_DISCIPLINA[disciplina] / 2);
}

// ─── Tipos de respuesta ───────────────────────────────────────────────────────

export interface ReservaExitosa {
  reservaId: string;
  creditosRestantes: number;
}

export interface ReservaEventualExitosa {
  reservaId:  string;
  senaPagada: number;
}

// Cada clave mapea exactamente al campo 'error' que devuelve la función RPC
export type CodigoErrorReserva =
  | 'sin_creditos'
  | 'sin_cupo'
  | 'ya_reservada'
  | 'conflicto_horario'
  | 'socio_no_encontrado'
  | 'clase_no_encontrada'
  | 'rpc_error';

export interface ReservaError {
  codigo: CodigoErrorReserva;
  mensaje: string;         // Mensaje listo para mostrar al usuario
}

// ─── Mapa de mensajes ─────────────────────────────────────────────────────────

const MENSAJES: Record<CodigoErrorReserva, string> = {
  sin_creditos:
    'No tenés créditos disponibles para realizar una reserva.',
  sin_cupo:
    'La clase ya no tiene lugares disponibles.',
  ya_reservada:
    'Ya tenés una reserva confirmada para esta clase.',
  conflicto_horario:
    'Ya tenés una clase agendada en ese día y horario.',
  socio_no_encontrado:
    'No se encontró tu perfil. Cerrá sesión e intentá de nuevo.',
  clase_no_encontrada:
    'La clase no fue encontrada. Es posible que haya sido eliminada.',
  rpc_error:
    'No se pudo procesar la reserva. Intentá de nuevo.',
};

function buildError(codigo: CodigoErrorReserva): ReservaError {
  return { codigo, mensaje: MENSAJES[codigo] };
}

// ─── Servicio ──────────────────────────────────────────────────────────────────

/**
 * Reserva una clase para un socio abonado usando créditos.
 *
 * Llama a la función RPC `reservar_clase_abonado` que ejecuta
 * de forma atómica:
 *   1. Validación de créditos (FOR UPDATE)
 *   2. Validación de cupo (FOR UPDATE)
 *   3. INSERT en reservas
 *   4. UPDATE creditos - 1
 *
 * El trigger `handle_reserva_cupo` en la BD actualiza cupo_disponible.
 *
 * Lanza un `ReservaError` si la operación falla.
 */
export async function reservarClaseAbonado(
  socioId: string,
  claseId: string,
): Promise<ReservaExitosa> {
  const { data, error } = await supabase.rpc('reservar_clase_abonado', {
    p_socio_id: socioId,
    p_clase_id: claseId,
  });

  // Error a nivel de red o PostgREST (no de negocio)
  if (error) {
    console.error('[reservas] RPC error:', error.message);
    throw buildError('rpc_error');
  }

  // La función RPC siempre retorna un JSON.
  // Si contiene 'error', es un error de negocio.
  if (data?.error) {
    const codigo = data.error as CodigoErrorReserva;
    throw buildError(codigo in MENSAJES ? codigo : 'rpc_error');
  }

  if (!data?.success || !data?.reserva_id) {
    console.error('[reservas] RPC returned unexpected response:', data);
    throw buildError('rpc_error');
  }

  return {
    reservaId:         data.reserva_id as string,
    creditosRestantes: data.creditos_restantes as number,
  };
}

// ─── Reserva para socio eventual ──────────────────────────────────────────────

/**
 * Verifica si el socio tiene una reserva confirmada que se solapa con la clase.
 * Consulta en cliente — O(n) sobre las reservas activas del socio, que son pocas.
 */
export async function verificarConflictoHorario(
  socioId: string,
  fecha: string,
  horaInicio: string,
): Promise<boolean> {
  try {
    // 1. Obtener todas las reservas confirmadas del socio
    const { data: misReservas, error: err1 } = await supabase
      .from('reservas')
      .select('clase_id')
      .eq('socio_id', socioId)
      .eq('estado', 'confirmada');

    if (err1) {
      console.error('[reservas] Error al obtener mis reservas para conflicto:', err1);
      return false;
    }
    if (!misReservas || misReservas.length === 0) return false;

    const claseIds = misReservas.map((r: any) => r.clase_id);

    // 2. Obtener los detalles de esas clases
    const { data: misClases, error: err2 } = await supabase
      .from('clases')
      .select('id, fecha, hora_inicio')
      .in('id', claseIds);

    if (err2) {
      console.error('[reservas] Error al obtener mis clases para conflicto:', err2);
      return false;
    }
    if (!misClases || misClases.length === 0) return false;

    // 3. Comprobar si hay alguna en la misma fecha y hora
    const hayConflicto = misClases.some((c: any) => {
      if (!c.fecha || !c.hora_inicio) return false;
      
      const horaBD = c.hora_inicio.slice(0, 5);
      const horaComparar = horaInicio?.slice(0, 5);
      
      return c.fecha === fecha && horaBD === horaComparar;
    });

    if (!hayConflicto) {
      console.log(`[reservas] Evaluadas ${misClases.length} clases activas. No hay conflicto.`);
    }

    return hayConflicto;
  } catch (error) {
    console.error('[reservas] Error inesperado en verificarConflictoHorario:', error);
    return false;
  }
}

/**
 * Registra la reserva de un socio eventual DESPUÉS de que el pago fue confirmado
 * por la pantalla de pago mock.
 *
 * Pasos:
 *   1. Verificar conflicto de horario (guard en cliente)
 *   2. INSERT reserva con seña_pagada
 *   (el trigger handle_reserva_cupo actualiza cupo_disponible automáticamente)
 *
 * Lanza ReservaError si alguna validación falla.
 */
export async function reservarClaseEventual(
  socioId:   string,
  claseId:   string,
  senaPagada: number,
  fecha:      string,
  horaInicio: string,
): Promise<ReservaEventualExitosa> {
  // ── 1. Verificar conflicto de horario ────────────────────────────────────
  const hayConflicto = await verificarConflictoHorario(socioId, fecha, horaInicio);
  if (hayConflicto) throw buildError('conflicto_horario');

  // ── 2. Insertar reserva con seña ─────────────────────────────────────────
  const { data, error } = await supabase
    .from('reservas')
    .insert({
      socio_id:     socioId,
      clase_id:     claseId,
      estado:       'confirmada',
      credito_usado: false,
      seña_pagada:   senaPagada,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') throw buildError('ya_reservada');
    console.error('[reservas] Error insertando reserva eventual:', error.message);
    throw buildError('rpc_error');
  }

  return { reservaId: data.id as string, senaPagada };
}
