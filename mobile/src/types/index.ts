// ─── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = 'socio' | 'gestor' | 'admin';

// ─── Disciplinas ──────────────────────────────────────────────────────────────
export type Disciplina = 'futbol5' | 'padel' | 'voley' | 'basquet';
export type NivelClase = 'principiante' | 'intermedio' | 'avanzado';
export type EstadoClase = 'disponible' | 'completa' | 'suspendida';

// ─── Usuario ──────────────────────────────────────────────────────────────────
export interface Usuario {
  id: string;
  email: string;
  dni: string;
  nombre: string | null;
  apellido: string | null;
  rol: UserRole;
  creditos: number;
  disciplina: Disciplina | null; // Solo para gestores
  created_at: string;
}

// ─── Clase ────────────────────────────────────────────────────────────────────
export interface Clase {
  id: string;
  disciplina: Disciplina;
  nivel: NivelClase;
  fecha: string;           // ISO date string
  hora_inicio: string;     // HH:MM
  hora_fin: string;        // HH:MM
  cupo_maximo: number;
  cupo_disponible: number;
  estado: EstadoClase;
  gestor_id: string;
  created_at: string;
}

// ─── Reserva ──────────────────────────────────────────────────────────────────
export type EstadoReserva = 'confirmada' | 'cancelada' | 'asistio' | 'ausente';

export interface Reserva {
  id: string;
  socio_id: string;
  clase_id: string;
  estado: EstadoReserva;
  seña_pagada: number | null;   // solo si se pagó con dinero
  credito_usado: boolean;        // true = reserva con crédito, false = con dinero
  cancelada_at: string | null;
  created_at: string;
  clase?: Clase;
  socio?: Pick<Usuario, 'dni'>;
}

// ─── Lista de espera ──────────────────────────────────────────────────────────
export interface ListaEspera {
  id: string;
  socio_id: string;
  clase_id: string;
  posicion: number;
  notificado_at: string | null;
  expira_at: string | null;
  created_at: string;
}

// ─── Notificaciones ───────────────────────────────────────────────────────────
export interface Notificacion {
  id:           string;
  usuario_id:   string;
  titulo:       string;
  cuerpo:       string;
  leida:        boolean;
  tipo:         string | null;   // 'espera' | 'cancelacion' | 'recordatorio' | 'renovacion'
  referencia_id: string | null;  // clase_id cuando tipo = 'espera'
  created_at:   string;
}

// ─── Abono ────────────────────────────────────────────────────────────────────
export interface Abono {
  id: string;
  socio_id: string;
  mes: number;             // 1–12
  anio: number;
  creditos_totales: number;
  creditos_usados: number;
  monto_pagado: number;
  pagado_at: string;
  created_at: string;
}

// ─── Packs ────────────────────────────────────────────────────────────────────
export interface Pack {
  pack_id: string;
  disciplina: Disciplina;
  nivel: NivelClase;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  precio: number;
  fechas: PackFecha[];   // 4 objetos con fecha + clase_id
  cupo_minimo: number;
  ya_comprado: boolean;
  solapa_horarios: boolean;
}

export interface PackFecha {
  clase_id: string;
  fecha: string;         // ISO date
  semana: number;        // 1–4
  cupo: number;
}

export type EstadoCompraPack = 'activo' | 'cancelado';

export interface CompraPackResult {
  success: boolean;
  compra_id: string;
  reserva_ids: string[];
}

// ─── Métricas (admin) ─────────────────────────────────────────────────────────
export interface MetricaOcupacion {
  disciplina: Disciplina;
  franja: string;
  porcentaje_ocupacion: number;
}

export interface MetricaCobrabilidad {
  mes: number;
  anio: number;
  eventuales: number;
  abonados: number;
  total: number;
}

export interface MetricaAusentismo {
  disciplina: Disciplina;
  total_reservas: number;
  ausentes: number;
  porcentaje: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUsuario: () => Promise<void>;
}

export interface SignUpData {
  email: string;
  password: string;
  dni: string;
  nombre: string;
  apellido: string;
}

// ─── Navegación ───────────────────────────────────────────────────────────────
export type RootStackParamList = {
  '(auth)': undefined;
  '(socio)': undefined;
  '(gestor)': undefined;
  '(admin)': undefined;
};
