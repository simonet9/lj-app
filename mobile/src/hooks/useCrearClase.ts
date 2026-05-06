import { useState, useCallback } from 'react';
import { supabase } from '@services/supabase';
import { calcularHoraFin, hoyISO, sumarDias } from '@utils/fechas';
import type { Disciplina, NivelClase } from '@app-types/index';

// ─── Tipos del formulario ─────────────────────────────────────────────────────

export interface FormCrearClase {
  nivel:      NivelClase;
  fecha:      string;    // 'YYYY-MM-DD'
  horaInicio: string;    // 'HH:MM'
  duracion:   60 | 90 | 120;
  cupo:       number;
}

export interface ClaseCreada {
  id:         string;
  disciplina: Disciplina;
  nivel:      NivelClase;
  fecha:      string;
  hora_inicio: string;
  hora_fin:   string;
  cupo_maximo: number;
}

export interface UseCrearClaseResult {
  form:        FormCrearClase;
  loading:     boolean;
  error:       string | null;
  // Setters individuales para cada campo
  setNivel:      (v: NivelClase)      => void;
  setFecha:      (v: string)           => void;
  setHoraInicio: (v: string)           => void;
  setDuracion:   (v: 60 | 90 | 120)   => void;
  setCupo:       (v: number)           => void;
  // Acción principal
  crearClase:  () => Promise<ClaseCreada | null>;
  // Helpers de validación
  esFormValido: boolean;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CUPO_MIN = 4;
const CUPO_MAX = 20;

const FORM_INICIAL: FormCrearClase = {
  nivel:      'intermedio',
  fecha:      sumarDias(hoyISO(), 1), // Mañana por defecto (no puede ser hoy)
  horaInicio: '18:00',
  duracion:   60,
  cupo:       10,
};

// ─── Mensajes de error de Supabase ───────────────────────────────────────────

function mapearError(msg: string): string {
  if (msg.includes('new row violates row-level security') ||
      msg.includes('violates row-level security policy')) {
    return 'No podés crear clases de otra disciplina.';
  }
  if (msg.includes('horario_valido')) {
    return 'El horario debe estar entre las 17:00 y las 23:30.';
  }
  if (msg.includes('cupo_coherente') || msg.includes('cupo_maximo')) {
    return 'El cupo máximo debe estar entre 4 y 20.';
  }
  if (msg.includes('duplicate') || msg.includes('unique')) {
    return 'Ya existe una clase en ese horario.';
  }
  return 'Ocurrió un error al crear la clase. Intentá de nuevo.';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Gestiona el estado del formulario de creación de clase y ejecuta
 * el INSERT en Supabase cuando el formulario es válido.
 *
 * Recibe gestorId y disciplina del contexto de auth (el gestor
 * no puede cambiarlos — se fuerza desde el backend via RLS).
 */
export function useCrearClase(
  gestorId:   string,
  disciplina: Disciplina,
): UseCrearClaseResult {
  const [form, setForm]     = useState<FormCrearClase>(FORM_INICIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // ── Setters ──────────────────────────────────────────────────────────────

  const setNivel      = useCallback((v: NivelClase)    => setForm(f => ({ ...f, nivel: v })),      []);
  const setFecha      = useCallback((v: string)         => setForm(f => ({ ...f, fecha: v })),      []);
  const setHoraInicio = useCallback((v: string)         => setForm(f => ({ ...f, horaInicio: v })), []);
  const setDuracion   = useCallback((v: 60 | 90 | 120) => setForm(f => ({ ...f, duracion: v })),   []);
  const setCupo       = useCallback((v: number)         =>
    setForm(f => ({ ...f, cupo: Math.min(CUPO_MAX, Math.max(CUPO_MIN, v)) })), []);

  // ── Validación ───────────────────────────────────────────────────────────

  const esFormValido =
    form.nivel.trim() !== '' &&
    form.fecha >= hoyISO() &&           // no puede ser en el pasado
    form.horaInicio >= '17:00' &&
    form.cupo >= CUPO_MIN &&
    form.cupo <= CUPO_MAX;

  // ── Acción principal ─────────────────────────────────────────────────────

  const crearClase = useCallback(async (): Promise<ClaseCreada | null> => {
    if (!esFormValido) return null;

    setLoading(true);
    setError(null);

    const horaFin = calcularHoraFin(form.horaInicio, form.duracion);

    try {
      const { data, error: supaErr } = await supabase
        .from('clases')
        .insert({
          disciplina:      disciplina,
          nivel:           form.nivel,
          fecha:           form.fecha,
          hora_inicio:     form.horaInicio,
          hora_fin:        horaFin,
          cupo_maximo:     form.cupo,
          cupo_disponible: form.cupo,
          estado:          'disponible',
          gestor_id:       gestorId,
        })
        .select()
        .single();

      if (supaErr) {
        setError(mapearError(supaErr.message));
        return null;
      }

      // Reset al form inicial para permitir crear otra clase sin recargar
      setForm(FORM_INICIAL);
      return data as ClaseCreada;

    } catch (err: any) {
      setError('Error inesperado. Intentá de nuevo.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [form, disciplina, gestorId, esFormValido]);

  return {
    form,
    loading,
    error,
    setNivel,
    setFecha,
    setHoraInicio,
    setDuracion,
    setCupo,
    crearClase,
    esFormValido,
  };
}
