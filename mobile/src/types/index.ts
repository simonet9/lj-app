// ─── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = 'socio' | 'gestor' | 'admin';
export type MembresiaType = 'eventual' | 'abonado';

// ─── Disciplinas ──────────────────────────────────────────────────────────────
export type Disciplina = 'futbol5' | 'padel' | 'voley' | 'basquet';
export type NivelClase = 'principiante' | 'intermedio' | 'avanzado';
export type EstadoClase = 'disponible' | 'completa' | 'suspendida';

// ─── Usuario ──────────────────────────────────────────────────────────────────
export interface Usuario {
  id: string;
  email: string;
  dni: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  membresia: MembresiaType | null;
  creditos: number;
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
  gestor?: Pick<Usuario, 'nombre' | 'apellido'>;
  created_at: string;
}

// ─── Reserva ──────────────────────────────────────────────────────────────────
export type EstadoReserva = 'confirmada' | 'cancelada' | 'asistio' | 'ausente';

export interface Reserva {
  id: string;
  socio_id: string;
  clase_id: string;
  estado: EstadoReserva;
  seña_pagada: number | null;   // solo socios eventuales
  created_at: string;
  clase?: Clase;
  socio?: Pick<Usuario, 'nombre' | 'apellido' | 'dni'>;
}

// ─── Lista de espera ──────────────────────────────────────────────────────────
export interface ListaEspera {
  id: string;
  socio_id: string;
  clase_id: string;
  posicion: number;
  notificado_at: string | null;
  created_at: string;
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
