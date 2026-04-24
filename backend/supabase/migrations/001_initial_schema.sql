-- ============================================================
-- Centro Deportivo L&J — Schema Supabase
-- Versión: 1.0.0 | mino.tar | Abril 2026
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────
create type user_role      as enum ('socio', 'gestor', 'admin');
create type membresia_type as enum ('eventual', 'abonado');
create type disciplina     as enum ('futbol5', 'padel', 'voley', 'basquet');
create type nivel_clase    as enum ('principiante', 'intermedio', 'avanzado');
create type estado_clase   as enum ('disponible', 'completa', 'suspendida');
create type estado_reserva as enum ('confirmada', 'cancelada', 'asistio', 'ausente');

-- ─── Tabla: usuarios ─────────────────────────────────────────
-- Extiende auth.users de Supabase con datos del negocio
create table public.usuarios (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  dni          text not null unique,
  nombre       text not null,
  apellido     text not null,
  rol          user_role not null default 'socio',
  membresia    membresia_type default 'eventual',
  creditos     integer not null default 0 check (creditos >= 0),
  -- Para gestores: disciplina asignada
  disciplina   disciplina,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── Tabla: clases ───────────────────────────────────────────
create table public.clases (
  id               uuid primary key default uuid_generate_v4(),
  disciplina       disciplina not null,
  nivel            nivel_clase not null default 'intermedio',
  fecha            date not null,
  hora_inicio      time not null,
  hora_fin         time not null,
  cupo_maximo      integer not null default 20 check (cupo_maximo > 0),
  cupo_disponible  integer not null default 20 check (cupo_disponible >= 0),
  estado           estado_clase not null default 'disponible',
  gestor_id        uuid not null references public.usuarios(id),
  motivo_suspension text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Constraint: solo clases entre 17:00 y 00:00
  constraint horario_valido check (hora_inicio >= '17:00' and hora_inicio < '24:00'),
  -- Constraint: cupo disponible no puede superar cupo máximo
  constraint cupo_coherente check (cupo_disponible <= cupo_maximo)
);

-- ─── Tabla: reservas ─────────────────────────────────────────
create table public.reservas (
  id           uuid primary key default uuid_generate_v4(),
  socio_id     uuid not null references public.usuarios(id) on delete cascade,
  clase_id     uuid not null references public.clases(id) on delete cascade,
  estado       estado_reserva not null default 'confirmada',
  seña_pagada  numeric(10,2),   -- Solo socios eventuales (50% del valor)
  credito_usado boolean default false,
  cancelada_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Un socio no puede tener dos reservas activas en la misma clase
  constraint reserva_unica unique (socio_id, clase_id)
);

-- ─── Tabla: lista_espera ─────────────────────────────────────
create table public.lista_espera (
  id             uuid primary key default uuid_generate_v4(),
  socio_id       uuid not null references public.usuarios(id) on delete cascade,
  clase_id       uuid not null references public.clases(id) on delete cascade,
  posicion       integer not null,
  notificado_at  timestamptz,
  expira_at      timestamptz,   -- 15 min desde notificación
  created_at     timestamptz not null default now(),
  constraint espera_unica unique (socio_id, clase_id)
);

-- ─── Tabla: abonos ───────────────────────────────────────────
create table public.abonos (
  id               uuid primary key default uuid_generate_v4(),
  socio_id         uuid not null references public.usuarios(id) on delete cascade,
  mes              integer not null check (mes between 1 and 12),
  anio             integer not null check (anio >= 2026),
  creditos_totales integer not null default 4,
  creditos_usados  integer not null default 0,
  monto_pagado     numeric(10,2) not null,
  pagado_at        timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  constraint abono_unico_mes unique (socio_id, mes, anio)
);

-- ─── Tabla: notificaciones ───────────────────────────────────
create table public.notificaciones (
  id         uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  titulo     text not null,
  cuerpo     text not null,
  leida      boolean not null default false,
  tipo       text,   -- 'recordatorio', 'cancelacion', 'espera', 'renovacion'
  referencia_id uuid, -- id de clase o reserva relacionada
  created_at timestamptz not null default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index idx_clases_fecha        on public.clases(fecha);
create index idx_clases_disciplina   on public.clases(disciplina);
create index idx_clases_gestor       on public.clases(gestor_id);
create index idx_reservas_socio      on public.reservas(socio_id);
create index idx_reservas_clase      on public.reservas(clase_id);
create index idx_lista_espera_clase  on public.lista_espera(clase_id, posicion);
create index idx_notificaciones_user on public.notificaciones(usuario_id, leida);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
alter table public.usuarios      enable row level security;
alter table public.clases        enable row level security;
alter table public.reservas      enable row level security;
alter table public.lista_espera  enable row level security;
alter table public.abonos        enable row level security;
alter table public.notificaciones enable row level security;

-- ─── Helper SECURITY DEFINER (evita recursión en RLS) ───────
-- Lee el rol del usuario actual sin disparar las políticas RLS
-- de la tabla usuarios (SECURITY DEFINER omite RLS).
create or replace function public.get_my_rol()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.usuarios where id = auth.uid() limit 1;
$$;

-- ─── Políticas: usuarios ─────────────────────────────────────
-- Cada usuario ve su propio perfil; admin ve todos
create policy "usuarios_select_own" on public.usuarios
  for select using (auth.uid() = id);

-- IMPORTANTE: NO usar subquery sobre public.usuarios aquí (causaría recursión infinita).
-- Se usa la función auxiliar get_my_rol() que opera con SECURITY DEFINER.
create policy "usuarios_select_admin" on public.usuarios
  for select using (public.get_my_rol() = 'admin');

create policy "usuarios_update_own" on public.usuarios
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "usuarios_insert_on_signup" on public.usuarios
  for insert with check (auth.uid() = id);

-- ─── Políticas: clases ───────────────────────────────────────
-- Todos los autenticados pueden ver clases
create policy "clases_select_all" on public.clases
  for select using (auth.role() = 'authenticated');

-- Solo el gestor dueño puede crear/modificar sus clases
create policy "clases_insert_gestor" on public.clases
  for insert with check (
    auth.uid() = gestor_id and
    exists (select 1 from public.usuarios u where u.id = auth.uid() and u.rol = 'gestor')
  );

create policy "clases_update_gestor" on public.clases
  for update using (auth.uid() = gestor_id);

-- ─── Políticas: reservas ─────────────────────────────────────
-- Socio ve sus propias reservas; gestor ve reservas de sus clases
create policy "reservas_select_socio" on public.reservas
  for select using (auth.uid() = socio_id);

create policy "reservas_select_gestor" on public.reservas
  for select using (
    exists (
      select 1 from public.clases c
      where c.id = clase_id and c.gestor_id = auth.uid()
    )
  );

create policy "reservas_insert_socio" on public.reservas
  for insert with check (auth.uid() = socio_id);

create policy "reservas_update_socio" on public.reservas
  for update using (auth.uid() = socio_id);

-- ─── Políticas: notificaciones ───────────────────────────────
create policy "notificaciones_select_own" on public.notificaciones
  for select using (auth.uid() = usuario_id);

create policy "notificaciones_update_own" on public.notificaciones
  for update using (auth.uid() = usuario_id);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Actualizar updated_at automáticamente
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger usuarios_updated_at before update on public.usuarios
  for each row execute function public.handle_updated_at();
create trigger clases_updated_at before update on public.clases
  for each row execute function public.handle_updated_at();
create trigger reservas_updated_at before update on public.reservas
  for each row execute function public.handle_updated_at();

-- Actualizar cupo_disponible al insertar/cancelar reserva
create or replace function public.handle_reserva_cupo()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' and new.estado = 'confirmada' then
    update public.clases
    set cupo_disponible = cupo_disponible - 1,
        estado = case when cupo_disponible - 1 = 0 then 'completa' else estado end
    where id = new.clase_id and cupo_disponible > 0;
  end if;

  if TG_OP = 'UPDATE' and old.estado = 'confirmada' and new.estado = 'cancelada' then
    update public.clases
    set cupo_disponible = cupo_disponible + 1,
        estado = case when estado = 'completa' then 'disponible' else estado end
    where id = new.clase_id;
  end if;

  return new;
end;
$$;

create trigger reserva_cupo_trigger
  after insert or update on public.reservas
  for each row execute function public.handle_reserva_cupo();

-- ============================================================
-- SEED DE DEMO
-- ============================================================
-- IMPORTANTE: Ejecutar DESPUÉS de crear los usuarios en Supabase Auth
-- Reemplazar los UUIDs con los reales generados por auth.users

-- Usuarios de demo (sus UUIDs se insertan después de crearlos via Auth)
-- Cuentas a crear en Supabase Auth Dashboard o via API:
--   ana.gomez@gmail.com      / Club2026!  → rol: socio abonado
--   carlos.ruiz@gmail.com    / Club2026!  → rol: socio eventual
--   laura.garcia@gmail.com   / Club2026!  → rol: gestor (padel)
--   miguel.lopez@gmail.com   / Club2026!  → rol: gestor (futbol5)
--   admin@centrolj.com       / Admin2026! → rol: admin

-- Clases de demo (insertar con los IDs de gestor reales)
-- Ver: docs/seed-demo.sql para el seed completo con datos
