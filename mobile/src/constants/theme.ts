// ─── Colores institucionales L&J ─────────────────────────────────────────────
export const Colors = {
  // Primarios
  primary: '#1a1a2e',        // Azul marino oscuro
  primaryLight: '#16213e',
  accent: '#e94560',         // Rojo L&J
  accentLight: '#ff6b6b',

  // Neutros
  background: '#f8f9fa',
  backgroundDark: '#1a1a2e',
  surface: '#ffffff',
  surfaceDark: '#0f3460',
  border: '#e2e8f0',
  borderDark: '#2d3748',

  // Texto
  textPrimary: '#1a202c',
  textSecondary: '#718096',
  textMuted: '#a0aec0',
  textInverse: '#ffffff',

  // Estados
  success: '#48bb78',
  successLight: '#f0fff4',
  warning: '#ed8936',
  warningLight: '#fffaf0',
  danger: '#f56565',
  dangerLight: '#fff5f5',
  info: '#4299e1',
  infoLight: '#ebf8ff',

  // Disciplinas
  futbol5: '#48bb78',
  padel: '#4299e1',
  voley: '#ed8936',
  basquet: '#f56565',

  // Estados de clase
  disponible: '#48bb78',
  completa: '#f56565',
  suspendida: '#a0aec0',
} as const;

// ─── Tipografía ───────────────────────────────────────────────────────────────
export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '500' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '400' as const, lineHeight: 16 },
} as const;

// ─── Espaciado ────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Bordes ───────────────────────────────────────────────────────────────────
export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ─── Disciplinas (labels) ─────────────────────────────────────────────────────
export const DisciplinaLabel: Record<string, string> = {
  futbol5: 'Fútbol 5',
  padel: 'Pádel',
  voley: 'Vóley',
  basquet: 'Básquet',
};

export const NivelLabel: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};
