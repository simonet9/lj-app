import { supabase } from '@services/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type EscenarioCancelacion =
  | 'devolucion_normal'      // crédito >48hs + devoluciones disponibles → devuelve crédito
  | 'devolucion_dinero'      // dinero >24hs → reembolso de seña
  | 'limite_devoluciones'    // crédito >48hs pero ya 3 devoluciones en el mes → sin crédito
  | 'sin_anticipacion'       // crédito ≤48hs → sin crédito
  | 'sin_anticipacion_dinero'// dinero ≤24hs → sin reembolso
  | 'cuarta_cancelacion';    // 4ta cancelación del mes → pierde descuento siguiente mes

export interface PreviewCancelacion {
  horasAnticipacion:  number;
  cancelacionesMes:   number;
  devolucionesMes:    number;
  creditoUsado:       boolean;  // true = reserva por crédito, false = por dinero
  senaPagada:         number;
  devuelveCredito:    boolean;
  reembolsaDinero:    boolean;
  perderiaDescuento:  boolean;
  escenario:          EscenarioCancelacion;
}

export interface ResultadoCancelacion {
  devuelveCredito:  boolean;
  reembolsaDinero:  boolean;
  perdioDescuento:  boolean;
  cancelacionesMes: number;
  mensaje:          string;
}

export interface CancelacionError {
  codigo:  string;
  mensaje: string;
}

// ─── Mensajes de modal (pre-acción) ──────────────────────────────────────────

export function buildModalMessage(preview: PreviewCancelacion): {
  title: string;
  message: string;
  confirmColor: string;
} {
  const RED    = '#f56565';
  const ORANGE = '#ed8936';

  switch (preview.escenario) {
    case 'devolucion_normal':
      return {
        title:        '¿Cancelar reserva?',
        message:      'Se te devolverá 1 crédito a tu cuenta. El cupo quedará disponible para otros socios.',
        confirmColor: RED,
      };
    case 'devolucion_dinero':
      return {
        title:        '¿Cancelar reserva?',
        message:      `Cancelás con más de 24hs de anticipación. Iniciaremos el reembolso de la seña ($${preview.senaPagada?.toLocaleString('es-AR') ?? '—'}) a través de Mercado Pago.`,
        confirmColor: RED,
      };
    case 'limite_devoluciones':
      return {
        title:        '¿Cancelar reserva?',
        message:      `Ya realizaste 3 devoluciones este mes (límite alcanzado). Podés cancelar, pero no se reintegrará el crédito.`,
        confirmColor: ORANGE,
      };
    case 'sin_anticipacion':
      return {
        title:        '¿Cancelar reserva?',
        message:      `Faltan menos de 48 horas para la clase (${preview.horasAnticipacion.toFixed(0)}hs). El crédito no se reintegrará.`,
        confirmColor: ORANGE,
      };
    case 'sin_anticipacion_dinero':
      return {
        title:        '¿Cancelar reserva?',
        message:      `Faltan menos de 24 horas para la clase (${preview.horasAnticipacion.toFixed(0)}hs). La seña no se reembolsará.`,
        confirmColor: ORANGE,
      };
    case 'cuarta_cancelacion':
      return {
        title:        '⚠️ Atención',
        message:      `Esta sería tu 4ta cancelación del mes. Si confirmás, perderás el descuento de abonado el mes que viene.`,
        confirmColor: ORANGE,
      };
  }
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

/**
 * Previsualiza el escenario de cancelación sin mutar datos.
 * Detecta automáticamente si la reserva fue por crédito o dinero.
 * Llamar ANTES de mostrar el ConfirmModal para construir el mensaje contextual.
 *
 * Lanza CancelacionError si la reserva no existe o no pertenece al socio.
 */
export async function previsualizarCancelacion(
  reservaId: string,
  socioId:   string,
): Promise<PreviewCancelacion> {
  const { data, error } = await supabase.rpc('previsualizar_cancelacion_unificada', {
    p_reserva_id: reservaId,
    p_socio_id:   socioId,
  });

  if (error) {
    console.error('[cancelaciones] RPC preview error:', error.message);
    throw { codigo: 'rpc_error', mensaje: 'No se pudo cargar la información de cancelación.' } as CancelacionError;
  }

  if (data?.error) {
    throw { codigo: data.error, mensaje: 'No se encontró la reserva.' } as CancelacionError;
  }

  return {
    horasAnticipacion: data.horas_anticipacion,
    cancelacionesMes:  data.cancelaciones_mes,
    devolucionesMes:   data.devoluciones_mes,
    creditoUsado:      data.credito_usado,
    senaPagada:        data.sena_pagada,
    devuelveCredito:   data.devuelve_credito,
    reembolsaDinero:   data.reembolsa_dinero,
    perderiaDescuento: data.perderia_descuento,
    escenario:         data.escenario as EscenarioCancelacion,
  };
}

/**
 * Ejecuta la cancelación atómica unificada en la BD.
 * Maneja automáticamente:
 *   - Reservas por crédito: devuelve crédito si >48hs y <3 devoluciones
 *   - Reservas por dinero:  inicia reembolso si >24hs
 *   - Penalización de descuento en 4ta cancelación del mes
 *
 * El trigger handle_reserva_cupo libera el cupo automáticamente.
 * Lanza CancelacionError si algo falla.
 */
export async function cancelarReserva(
  reservaId: string,
  socioId:   string,
): Promise<ResultadoCancelacion> {
  const { data, error } = await supabase.rpc('cancelar_reserva_unificada', {
    p_reserva_id: reservaId,
    p_socio_id:   socioId,
  });

  if (error) {
    throw { codigo: 'rpc_error', mensaje: 'No se pudo procesar la cancelación. Intentá de nuevo.' } as CancelacionError;
  }

  if (data?.error) {
    throw { codigo: data.error, mensaje: 'No se encontró la reserva o ya fue cancelada.' } as CancelacionError;
  }

  return {
    devuelveCredito:  data.devuelve_credito  as boolean,
    reembolsaDinero:  data.reembolsa_dinero  as boolean,
    perdioDescuento:  data.perdio_descuento  as boolean,
    cancelacionesMes: data.cancelaciones_mes as number,
    mensaje:          data.mensaje           as string,
  };
}

// ─── Compatibilidad hacia atrás (alias) ───────────────────────────────────────
// Mantener export antiguo para no romper imports existentes en reservas.tsx

/** @deprecated Usar cancelarReserva() en su lugar */
export async function cancelarReservaAbonado(
  reservaId: string,
  socioId:   string,
) {
  const resultado = await cancelarReserva(reservaId, socioId);
  return {
    success:          true,
    devuelve_credito: resultado.devuelveCredito,
    pierde_descuento: resultado.perdioDescuento,
    cancelaciones_mes: resultado.cancelacionesMes,
    mensaje:          resultado.mensaje,
  };
}
