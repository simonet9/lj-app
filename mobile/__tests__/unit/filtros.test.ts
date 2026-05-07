/**
 * __tests__/unit/filtros.test.ts
 *
 * Tests unitarios — lógica de filtrado de clases (HU-06)
 * Sin Supabase: testean funciones puras sobre arrays de Clase.
 *
 * El hook useClases trae todas las clases y el filtrado ocurre en cliente.
 * Estas funciones replican la lógica de filtrado de la pantalla de clases.
 */

import type { Clase, Disciplina, NivelClase } from '../../src/types/index';

// ─── Helper: fábrica de clases de prueba ──────────────────────────────────────

function crearClase(overrides: Partial<Clase>): Clase {
  return {
    id:               overrides.id               ?? 'clase-test-001',
    disciplina:       overrides.disciplina        ?? 'padel',
    nivel:            overrides.nivel             ?? 'intermedio',
    fecha:            overrides.fecha             ?? '2026-04-10',
    hora_inicio:      overrides.hora_inicio       ?? '18:00',
    hora_fin:         overrides.hora_fin          ?? '19:00',
    cupo_maximo:      overrides.cupo_maximo       ?? 10,
    cupo_disponible:  overrides.cupo_disponible   ?? 5,
    estado:           overrides.estado            ?? 'disponible',
    gestor_id:        overrides.gestor_id         ?? 'gestor-001',
    created_at:       overrides.created_at        ?? '2026-04-01T00:00:00Z',
  };
}

// ─── Funciones puras de filtrado (reflejo de la lógica en pantalla clases) ───

interface FiltrosClases {
  disciplina?: Disciplina | null;
  nivel?: NivelClase | null;
}

function filtrarClases(clases: Clase[], filtros: FiltrosClases): Clase[] {
  return clases.filter(c => {
    if (filtros.disciplina && c.disciplina !== filtros.disciplina) return false;
    if (filtros.nivel && c.nivel !== filtros.nivel) return false;
    return true;
  });
}

// ─── Dataset de prueba ────────────────────────────────────────────────────────

const clasesPrueba: Clase[] = [
  crearClase({ id: '1', disciplina: 'padel',   nivel: 'principiante', hora_inicio: '17:00' }),
  crearClase({ id: '2', disciplina: 'padel',   nivel: 'intermedio',   hora_inicio: '18:00' }),
  crearClase({ id: '3', disciplina: 'futbol5', nivel: 'intermedio',   hora_inicio: '19:00' }),
  crearClase({ id: '4', disciplina: 'voley',   nivel: 'avanzado',     hora_inicio: '20:00' }),
  crearClase({ id: '5', disciplina: 'basquet', nivel: 'principiante', hora_inicio: '21:00' }),
  crearClase({ id: '6', disciplina: 'padel',   nivel: 'avanzado',     hora_inicio: '22:00' }),
];

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('filtrarClases — HU-06', () => {
  describe('sin filtros activos', () => {
    it('devuelve todas las clases', () => {
      const resultado = filtrarClases(clasesPrueba, {});
      expect(resultado).toHaveLength(clasesPrueba.length);
    });

    it('devuelve array vacío si no hay clases', () => {
      const resultado = filtrarClases([], {});
      expect(resultado).toHaveLength(0);
    });
  });

  describe('filtro por disciplina', () => {
    it('filtra correctamente por Pádel → solo clases de padel', () => {
      const resultado = filtrarClases(clasesPrueba, { disciplina: 'padel' });
      expect(resultado).toHaveLength(3);
      resultado.forEach(c => expect(c.disciplina).toBe('padel'));
    });

    it('filtra correctamente por Fútbol5 → solo 1 clase', () => {
      const resultado = filtrarClases(clasesPrueba, { disciplina: 'futbol5' });
      expect(resultado).toHaveLength(1);
      expect(resultado[0].disciplina).toBe('futbol5');
    });

    it('filtra correctamente por Voley → solo 1 clase', () => {
      const resultado = filtrarClases(clasesPrueba, { disciplina: 'voley' });
      expect(resultado).toHaveLength(1);
      expect(resultado[0].disciplina).toBe('voley');
    });

    it('devuelve array vacío si no hay clases de esa disciplina', () => {
      const clasesConPadel = clasesPrueba.filter(c => c.disciplina === 'padel');
      const resultado = filtrarClases(clasesConPadel, { disciplina: 'futbol5' });
      expect(resultado).toHaveLength(0);
    });
  });

  describe('filtro por nivel', () => {
    it('filtra correctamente por nivel principiante', () => {
      const resultado = filtrarClases(clasesPrueba, { nivel: 'principiante' });
      expect(resultado).toHaveLength(2);
      resultado.forEach(c => expect(c.nivel).toBe('principiante'));
    });

    it('filtra correctamente por nivel intermedio', () => {
      const resultado = filtrarClases(clasesPrueba, { nivel: 'intermedio' });
      expect(resultado).toHaveLength(2);
      resultado.forEach(c => expect(c.nivel).toBe('intermedio'));
    });

    it('filtra correctamente por nivel avanzado', () => {
      const resultado = filtrarClases(clasesPrueba, { nivel: 'avanzado' });
      expect(resultado).toHaveLength(2);
      resultado.forEach(c => expect(c.nivel).toBe('avanzado'));
    });
  });

  describe('filtro combinado (disciplina + nivel)', () => {
    it('Pádel + intermedio → 1 clase', () => {
      const resultado = filtrarClases(clasesPrueba, {
        disciplina: 'padel',
        nivel: 'intermedio',
      });
      expect(resultado).toHaveLength(1);
      expect(resultado[0].disciplina).toBe('padel');
      expect(resultado[0].nivel).toBe('intermedio');
    });

    it('Pádel + avanzado → 1 clase', () => {
      const resultado = filtrarClases(clasesPrueba, {
        disciplina: 'padel',
        nivel: 'avanzado',
      });
      expect(resultado).toHaveLength(1);
    });

    it('Fútbol5 + avanzado → 0 clases (combinación inexistente)', () => {
      const resultado = filtrarClases(clasesPrueba, {
        disciplina: 'futbol5',
        nivel: 'avanzado',
      });
      expect(resultado).toHaveLength(0);
    });
  });

  describe('validación de horario operativo', () => {
    it('todas las clases del dataset están en horario operativo (>= 17:00)', () => {
      clasesPrueba.forEach(c => {
        expect(c.hora_inicio >= '17:00').toBe(true);
      });
    });

    it('filtra clases suspendidas correctamente', () => {
      const conSuspendida = [
        ...clasesPrueba,
        crearClase({ id: '99', estado: 'suspendida', disciplina: 'padel' }),
      ];
      // Simular el filtro de la query (neq estado suspendida)
      const activas = conSuspendida.filter(c => c.estado !== 'suspendida');
      expect(activas).toHaveLength(clasesPrueba.length);
      activas.forEach(c => expect(c.estado).not.toBe('suspendida'));
    });
  });
});
