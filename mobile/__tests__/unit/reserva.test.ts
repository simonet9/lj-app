/**
 * __tests__/unit/reserva.test.ts
 *
 * Tests unitarios — lógica de reserva (HU-08, HU-09)
 * Sin Supabase: testean funciones puras.
 *
 * Cubre:
 *  - calcularSena()     → 50% del valor de la clase
 *  - calcularHoraFin()  → suma de minutos con overflow a medianoche
 *  - hayConflictoHorario() → solapamiento de horarios en reservas existentes
 */

import { calcularHoraFin } from '../../src/utils/fechas';
import { calcularSena, VALOR_CLASE_POR_DISCIPLINA } from '../../src/services/reservas';
import type { Disciplina } from '../../src/types/index';

// ─── calcularSena ─────────────────────────────────────────────────────────────

describe('calcularSena', () => {
  it('devuelve el 50% del valor de pádel (10000 → 5000)', () => {
    expect(calcularSena('padel')).toBe(5000);
  });

  it('devuelve el 50% del valor de fútbol5 (8000 → 4000)', () => {
    expect(calcularSena('futbol5')).toBe(4000);
  });

  it('devuelve el 50% del valor de voley (7000 → 3500)', () => {
    expect(calcularSena('voley')).toBe(3500);
  });

  it('devuelve el 50% del valor de básquet (7500 → 3750)', () => {
    expect(calcularSena('basquet')).toBe(3750);
  });

  it('es exactamente la mitad del valor de cada disciplina', () => {
    const disciplinas: Disciplina[] = ['futbol5', 'padel', 'voley', 'basquet'];
    disciplinas.forEach(d => {
      const valorCompleto = VALOR_CLASE_POR_DISCIPLINA[d];
      expect(calcularSena(d)).toBe(Math.round(valorCompleto / 2));
    });
  });
});

// ─── calcularHoraFin ──────────────────────────────────────────────────────────

describe('calcularHoraFin', () => {
  it('18:00 + 60 min → 19:00', () => {
    expect(calcularHoraFin('18:00')).toBe('19:00');
  });

  it('22:30 + 60 min → 23:30', () => {
    expect(calcularHoraFin('22:30')).toBe('23:30');
  });

  it('23:30 + 60 min → 00:30 (overflow)', () => {
    expect(calcularHoraFin('23:30')).toBe('00:30');
  });

  it('padea horas con cero cuando es menor de 10', () => {
    expect(calcularHoraFin('07:00')).toBe('08:00');
  });
});

// ─── hayConflictoHorario (implementación local para tests unitarios) ──────────
// La versión de producción (verificarConflictoHorario) consulta Supabase.
// Para tests unitarios aislamos la lógica de solapamiento.

interface ClaseSimple {
  fecha:       string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM
  hora_fin:    string; // HH:MM
}

/**
 * Versión pura de la verificación de conflicto de horario.
 * Detecta si `claseNueva` se solapa con alguna clase en `reservasExistentes`.
 * Criterio: misma fecha y misma hora de inicio (simplificado como en el servicio).
 */
function hayConflictoHorario(
  reservasExistentes: ClaseSimple[],
  claseNueva: ClaseSimple,
): boolean {
  return reservasExistentes.some(
    r =>
      r.fecha === claseNueva.fecha &&
      r.hora_inicio === claseNueva.hora_inicio,
  );
}

describe('hayConflictoHorario', () => {
  const claseNueva: ClaseSimple = {
    fecha:       '2026-04-15',
    hora_inicio: '18:00',
    hora_fin:    '19:00',
  };

  it('→ true: hay una reserva con mismo fecha y hora_inicio', () => {
    const reservas: ClaseSimple[] = [
      { fecha: '2026-04-15', hora_inicio: '18:00', hora_fin: '19:00' },
    ];
    expect(hayConflictoHorario(reservas, claseNueva)).toBe(true);
  });

  it('→ true: hay múltiples reservas y una coincide', () => {
    const reservas: ClaseSimple[] = [
      { fecha: '2026-04-14', hora_inicio: '18:00', hora_fin: '19:00' },
      { fecha: '2026-04-15', hora_inicio: '18:00', hora_fin: '19:00' }, // conflicto
      { fecha: '2026-04-16', hora_inicio: '20:00', hora_fin: '21:00' },
    ];
    expect(hayConflictoHorario(reservas, claseNueva)).toBe(true);
  });

  it('→ false: misma fecha pero distinta hora_inicio', () => {
    const reservas: ClaseSimple[] = [
      { fecha: '2026-04-15', hora_inicio: '20:00', hora_fin: '21:00' },
    ];
    expect(hayConflictoHorario(reservas, claseNueva)).toBe(false);
  });

  it('→ false: misma hora pero distinta fecha', () => {
    const reservas: ClaseSimple[] = [
      { fecha: '2026-04-16', hora_inicio: '18:00', hora_fin: '19:00' },
    ];
    expect(hayConflictoHorario(reservas, claseNueva)).toBe(false);
  });

  it('→ false: lista de reservas vacía', () => {
    expect(hayConflictoHorario([], claseNueva)).toBe(false);
  });

  it('→ false: todas las reservas son en días distintos', () => {
    const reservas: ClaseSimple[] = [
      { fecha: '2026-04-10', hora_inicio: '18:00', hora_fin: '19:00' },
      { fecha: '2026-04-11', hora_inicio: '18:00', hora_fin: '19:00' },
      { fecha: '2026-04-12', hora_inicio: '18:00', hora_fin: '19:00' },
    ];
    expect(hayConflictoHorario(reservas, claseNueva)).toBe(false);
  });
});
