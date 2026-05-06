// ─── Utilidades de manejo de fechas y horarios ────────────────────────────────

/**
 * Agrega `duracionMinutos` a un horario en formato "HH:MM" y
 * devuelve el resultado como "HH:MM".
 *
 * Ejemplos:
 *   calcularHoraFin('18:00', 60)  → '19:00'
 *   calcularHoraFin('23:00', 90)  → '00:30'  (siguiente día — BD lo maneja)
 */
export function calcularHoraFin(inicio: string, duracionMinutos: number): string {
  const [hh, mm] = inicio.split(':').map(Number);
  const totalMin = hh * 60 + mm + duracionMinutos;
  const horaFin  = Math.floor(totalMin / 60) % 24;
  const minFin   = totalMin % 60;
  return `${String(horaFin).padStart(2, '0')}:${String(minFin).padStart(2, '0')}`;
}

/**
 * Convierte una fecha ISO 'YYYY-MM-DD' al formato 'DD/MM/YYYY'
 * usado en la UI.
 */
export function formatFechaUI(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Convierte una fecha ISO 'YYYY-MM-DD' a un objeto Date con hora local 00:00.
 * Evita el off-by-one que ocurre cuando `new Date('YYYY-MM-DD')` interpreta
 * la cadena como UTC en algunos entornos.
 */
export function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0);
}

/**
 * Devuelve la fecha de hoy en formato 'YYYY-MM-DD' usando la zona
 * horaria local del dispositivo.
 */
export function hoyISO(): string {
  const hoy = new Date();
  const y   = hoy.getFullYear();
  const m   = String(hoy.getMonth() + 1).padStart(2, '0');
  const d   = String(hoy.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Suma `dias` días a una fecha ISO y devuelve el resultado como 'YYYY-MM-DD'.
 * Funciona correctamente cruzando límites de mes y año.
 */
export function sumarDias(iso: string, dias: number): string {
  const date = isoToLocalDate(iso);
  date.setDate(date.getDate() + dias);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Genera el array de horarios disponibles cada 30 minutos
 * entre 17:00 y 23:00 inclusive.
 *
 * Resultado: ['17:00', '17:30', '18:00', ..., '23:00']
 */
export function generarHorariosDisponibles(): string[] {
  const slots: string[] = [];
  for (let h = 17; h <= 23; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 23) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}
