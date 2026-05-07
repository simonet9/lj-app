/**
 * __tests__/unit/cancelacion.test.ts
 *
 * Tests unitarios — lógica de negocio de cancelación (HU-11)
 * Sin dependencia de Supabase: testean funciones puras extráidas aquí.
 *
 * Reglas de negocio (CLAUDE.md §5):
 *  - Cancelación abonado: devuelve crédito si anticip > 48hs Y devoluciones < 3.
 *  - Cuarta cancelación del mes → pierde descuento del mes siguiente.
 */

// ─── Funciones puras de dominio ───────────────────────────────────────────────
// Estas funciones encapsulan las reglas de negocio de cancelación.
// Son deterministas y no dependen de Supabase.

/**
 * Calcula las horas de anticipación entre la fecha/hora de la clase
 * y el momento actual.
 *
 * @param fechaClase  ISO datetime string de inicio de la clase (e.g. '2026-04-10T18:00:00')
 * @param fechaActual ISO datetime string del instante actual
 * @returns diferencia en horas (puede ser negativa si la clase ya pasó)
 */
export function calcularHorasAnticipacion(
  fechaClase: string,
  fechaActual: string,
): number {
  const inicio  = new Date(fechaClase).getTime();
  const ahora   = new Date(fechaActual).getTime();
  return (inicio - ahora) / (1000 * 60 * 60);
}

/**
 * Determina si se debe devolver el crédito al cancelar.
 *
 * Condición: horasAnticipacion > 48 Y devolucionesMes < 3
 */
export function debeDevolverCredito(
  horasAnticipacion: number,
  devolucionesMes: number,
): boolean {
  return horasAnticipacion > 48 && devolucionesMes < 3;
}

/**
 * Determina si el socio pierde el descuento del próximo mes.
 *
 * Condición: la SIGUIENTE cancelación (cancelacionesMes + 1) >= 4
 * Es decir: si ya tiene 3 cancelaciones, la cuarta dispara la penalización.
 */
export function debePerderDescuento(cancelacionesMes: number): boolean {
  return cancelacionesMes >= 3;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('calcularHorasAnticipacion', () => {
  it('retorna diferencia positiva cuando la clase es en el futuro', () => {
    const claseEnDosHoras = '2026-04-10T20:00:00';
    const ahora           = '2026-04-10T18:00:00';
    const resultado = calcularHorasAnticipacion(claseEnDosHoras, ahora);
    expect(resultado).toBeCloseTo(2, 5);
  });

  it('retorna 72 horas de anticipación', () => {
    const claseEn72hs = '2026-04-13T18:00:00';
    const ahora       = '2026-04-10T18:00:00';
    const resultado = calcularHorasAnticipacion(claseEn72hs, ahora);
    expect(resultado).toBeCloseTo(72, 5);
  });

  it('retorna 48 horas exactas', () => {
    const claseEn48hs = '2026-04-12T18:00:00';
    const ahora       = '2026-04-10T18:00:00';
    const resultado = calcularHorasAnticipacion(claseEn48hs, ahora);
    expect(resultado).toBeCloseTo(48, 5);
  });

  it('retorna 24 horas de anticipación', () => {
    const claseEn24hs = '2026-04-11T18:00:00';
    const ahora       = '2026-04-10T18:00:00';
    const resultado = calcularHorasAnticipacion(claseEn24hs, ahora);
    expect(resultado).toBeCloseTo(24, 5);
  });

  it('retorna valor negativo si la clase ya pasó', () => {
    const clasePasada = '2026-04-09T18:00:00';
    const ahora       = '2026-04-10T18:00:00';
    const resultado = calcularHorasAnticipacion(clasePasada, ahora);
    expect(resultado).toBeLessThan(0);
  });
});

describe('debeDevolverCredito', () => {
  it('→ true: 72hs de anticipación y 1 devolución del mes', () => {
    expect(debeDevolverCredito(72, 1)).toBe(true);
  });

  it('→ true: 48.1hs de anticipación y 0 devoluciones', () => {
    expect(debeDevolverCredito(48.1, 0)).toBe(true);
  });

  it('→ true: 72hs de anticipación y 2 devoluciones del mes', () => {
    expect(debeDevolverCredito(72, 2)).toBe(true);
  });

  it('→ false: límite de 3 devoluciones alcanzado (horasAnticip=72, devol=3)', () => {
    // Regla: devolucionesMes < 3, por lo que con 3 NO devuelve
    expect(debeDevolverCredito(72, 3)).toBe(false);
  });

  it('→ false: anticipación insuficiente (< 48hs) aunque devoluciones disponibles', () => {
    expect(debeDevolverCredito(24, 0)).toBe(false);
  });

  it('→ false: anticipación exactamente 48hs (no supera el umbral)', () => {
    // La condición es estrictamente > 48
    expect(debeDevolverCredito(48, 0)).toBe(false);
  });

  it('→ false: 0hs de anticipación', () => {
    expect(debeDevolverCredito(0, 0)).toBe(false);
  });
});

describe('debePerderDescuento', () => {
  it('→ false: 0 cancelaciones previas (primera cancelación del mes)', () => {
    expect(debePerderDescuento(0)).toBe(false);
  });

  it('→ false: 2 cancelaciones previas', () => {
    expect(debePerderDescuento(2)).toBe(false);
  });

  it('→ true: 3 cancelaciones previas (la siguiente sería la 4ta)', () => {
    // Según la regla: "4ta cancelación → pierde descuento"
    // cancelacionesMes=3 significa que ya hizo 3, la próxima es la 4ta
    expect(debePerderDescuento(3)).toBe(true);
  });

  it('→ true: más de 3 cancelaciones previas', () => {
    expect(debePerderDescuento(4)).toBe(true);
  });
});
