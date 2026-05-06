import { supabase } from '@services/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type EscenarioCancelacion =
  | 'devolucion_normal'    // > 48hs + devoluciones disponibles → devuelve crédito
  | 'limite_devoluciones'  // > 48hs pero ya 3 devoluciones en el mes → sin crédito
  | 'sin_anticipacion'     // ≤ 48hs → sin crédito por anticipación insuficiente
  | 'cuarta_cancelacion';  // 4ta cancelación del mes → pierde descuento siguiente mes

export interface PreviewCancelacion {
  horasAnticipacion: number;
  cancelacionesMes:  number;
  devolucionesMes:   number;
  devuelveCredito:   boolean;
  perderiaDescuento: boolean;
  escenario:         EscenarioCancelacion;
}

export interface ResultadoCancelacion {
  devuelveCredito:  boolean;
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
  // importar Colors inline para evitar dependencia circular
  const RED    = '#f56565';
  const ORANGE = '#ed8936';
  const GRAY   = '#718096';

  switch (preview.escenario) {
    case 'devolucion_normal':
      return {
        title:        '¿Cancelar reserva?',
        message:      'Se te devolverá 1 crédito a tu cuenta. El cupo quedará disponible para otros socios.',
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
 * Llamar ANTES de mostrar el ConfirmModal para construir el mensaje contextual.
 *
 * Lanza CancelacionError si la reserva no existe o no pertenece al socio.
 */
export async function previsualizarCancelacion(
  reservaId: string,
  socioId:   string,
): Promise<PreviewCancelacion> {
  const { data, error } = await supabase.rpc('previsualizar_cancelacion_abonado', {
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
    devuelveCredito:   data.devuelve_credito,
    perderiaDescuento: data.perderia_descuento,
    escenario:         data.escenario as EscenarioCancelacion,
  };
}

/**
 * Ejecuta la cancelación atómica en la BD.
 * La lógica completa de negocio (créditos, descuentos, límites) está en el RPC.
 * El trigger handle_reserva_cupo libera el cupo automáticamente.
 *
 * Lanza CancelacionError si algo falla.
 */
export async function cancelarReservaAbonado(
  reservaId: string,
  socioId:   string,
): Promise<ResultadoCancelacion> {
  const { data, error } = await supabase.rpc('cancelar_reserva_abonado', {
    p_reserva_id: reservaId,
    p_socio_id:   socioId,
  });

  if (error) {
    console.error('[cancelaciones] RPC error:', error.message);
    throw { codigo: 'rpc_error', mensaje: 'No se pudo procesar la cancelación. Intentá de nuevo.' } as CancelacionError;
  }

  if (data?.error) {
    throw { codigo: data.error, mensaje: 'No se encontró la reserva o ya fue cancelada.' } as CancelacionError;
  }

  return {
    devuelveCredito:  data.devuelve_credito  as boolean,
    perdioDescuento:  data.perdio_descuento  as boolean,
    cancelacionesMes: data.cancelaciones_mes as number,
    mensaje:          data.mensaje           as string,
  };
}
