-- ============================================================
-- Centro Deportivo L&J — Seed de Demo
-- Ejecutar DESPUÉS de 001_initial_schema.sql
-- Y DESPUÉS de crear los usuarios en Supabase Auth
-- ============================================================
--
-- PASO 1: Crear estos usuarios en Supabase Auth
--   (Dashboard → Authentication → Users → Add user)
--
--   Email                       Password     UUID (copiar después de crear)
--   ana.gomez@gmail.com         Club2026!    → reemplazar UUID_SOCIO_ANA
--   carlos.ruiz@gmail.com       Club2026!    → reemplazar UUID_SOCIO_CARLOS
--   lucia.perez@gmail.com       Club2026!    → reemplazar UUID_SOCIO_LUCIA
--   roberto.silva@gmail.com     Club2026!    → reemplazar UUID_SOCIO_ROBERTO
--   laura.garcia@gmail.com      Club2026!    → reemplazar UUID_GESTOR_PADEL
--   miguel.lopez@gmail.com      Club2026!    → reemplazar UUID_GESTOR_FUTBOL
--   sofia.martinez@gmail.com    Club2026!    → reemplazar UUID_GESTOR_VOLEY
--   jorge.ramirez@gmail.com     Club2026!    → reemplazar UUID_GESTOR_BASQUET
--   admin@centrolj.com          Admin2026!   → reemplazar UUID_ADMIN
--
-- PASO 2: Reemplazar los placeholders de UUID y ejecutar
-- ============================================================

-- ─── Perfiles de usuarios ────────────────────────────────────
insert into public.usuarios (id, email, dni, nombre, apellido, rol, membresia, creditos, disciplina) values
  ('UUID_SOCIO_ANA',       'ana.gomez@gmail.com',      '38111222', 'Ana',     'Gómez',     'socio',  'abonado',  3,    null),
  ('UUID_SOCIO_CARLOS',    'carlos.ruiz@gmail.com',    '25334455', 'Carlos',  'Ruiz',      'socio',  'eventual', 0,    null),
  ('UUID_SOCIO_LUCIA',     'lucia.perez@gmail.com',    '40221133', 'Lucía',   'Pérez',     'socio',  'abonado',  1,    null),
  ('UUID_SOCIO_ROBERTO',   'roberto.silva@gmail.com',  '31998877', 'Roberto', 'Silva',     'socio',  'eventual', 0,    null),
  ('UUID_GESTOR_PADEL',    'laura.garcia@gmail.com',   '29445566', 'Laura',   'García',    'gestor', null,       0,    'padel'),
  ('UUID_GESTOR_FUTBOL',   'miguel.lopez@gmail.com',   '33667788', 'Miguel',  'López',     'gestor', null,       0,    'futbol5'),
  ('UUID_GESTOR_VOLEY',    'sofia.martinez@gmail.com', '36990011', 'Sofía',   'Martínez',  'gestor', null,       0,    'voley'),
  ('UUID_GESTOR_BASQUET',  'jorge.ramirez@gmail.com',  '28123456', 'Jorge',   'Ramírez',   'gestor', null,       0,    'basquet'),
  ('UUID_ADMIN',           'admin@centrolj.com',       '20000001', 'Admin',   'Centro L&J','admin',  null,       0,    null);

-- ─── Clases de demo ──────────────────────────────────────────
-- Semana actual: ajustar fechas si es necesario
insert into public.clases (id, disciplina, nivel, fecha, hora_inicio, hora_fin, cupo_maximo, cupo_disponible, estado, gestor_id) values
  -- Fútbol 5
  (uuid_generate_v4(), 'futbol5', 'intermedio',    current_date + 0, '18:00', '19:00', 10, 3,  'disponible', 'UUID_GESTOR_FUTBOL'),
  (uuid_generate_v4(), 'futbol5', 'avanzado',      current_date + 0, '19:00', '20:00', 10, 0,  'completa',   'UUID_GESTOR_FUTBOL'),
  (uuid_generate_v4(), 'futbol5', 'principiante',  current_date + 1, '17:00', '18:00', 12, 8,  'disponible', 'UUID_GESTOR_FUTBOL'),
  (uuid_generate_v4(), 'futbol5', 'intermedio',    current_date + 2, '20:00', '21:00', 10, 5,  'disponible', 'UUID_GESTOR_FUTBOL'),
  -- Pádel
  (uuid_generate_v4(), 'padel',   'principiante',  current_date + 0, '18:00', '19:30', 8,  4,  'disponible', 'UUID_GESTOR_PADEL'),
  (uuid_generate_v4(), 'padel',   'intermedio',    current_date + 0, '20:00', '21:30', 8,  2,  'disponible', 'UUID_GESTOR_PADEL'),
  (uuid_generate_v4(), 'padel',   'avanzado',      current_date + 1, '19:00', '20:30', 8,  0,  'completa',   'UUID_GESTOR_PADEL'),
  (uuid_generate_v4(), 'padel',   'principiante',  current_date + 3, '17:30', '19:00', 8,  6,  'disponible', 'UUID_GESTOR_PADEL'),
  -- Vóley
  (uuid_generate_v4(), 'voley',   'intermedio',    current_date + 0, '19:00', '20:30', 14, 7,  'disponible', 'UUID_GESTOR_VOLEY'),
  (uuid_generate_v4(), 'voley',   'principiante',  current_date + 1, '18:00', '19:30', 14, 11, 'disponible', 'UUID_GESTOR_VOLEY'),
  (uuid_generate_v4(), 'voley',   'avanzado',      current_date + 2, '21:00', '22:30', 12, 3,  'disponible', 'UUID_GESTOR_VOLEY'),
  -- Básquet
  (uuid_generate_v4(), 'basquet', 'principiante',  current_date + 0, '17:00', '18:30', 12, 2,  'disponible', 'UUID_GESTOR_BASQUET'),
  (uuid_generate_v4(), 'basquet', 'intermedio',    current_date + 1, '20:00', '21:30', 12, 0,  'completa',   'UUID_GESTOR_BASQUET'),
  (uuid_generate_v4(), 'basquet', 'avanzado',      current_date + 2, '19:00', '20:30', 10, 4,  'disponible', 'UUID_GESTOR_BASQUET');

-- ─── Abono de Ana (socio abonado) ────────────────────────────
insert into public.abonos (socio_id, mes, anio, creditos_totales, creditos_usados, monto_pagado) values
  ('UUID_SOCIO_ANA', extract(month from current_date)::int, extract(year from current_date)::int, 4, 1, 28000.00),
  ('UUID_SOCIO_LUCIA', extract(month from current_date)::int, extract(year from current_date)::int, 4, 3, 28000.00);

-- ─── Notificaciones de demo ──────────────────────────────────
insert into public.notificaciones (usuario_id, titulo, cuerpo, tipo) values
  ('UUID_SOCIO_ANA', 'Recordatorio de clase', 'Tu clase de Pádel (intermedio) es mañana a las 20:00 hs.', 'recordatorio'),
  ('UUID_SOCIO_ANA', 'Lugar disponible', 'Se liberó un lugar en Fútbol 5 (avanzado). Tenés 15 minutos para confirmar.', 'espera'),
  ('UUID_SOCIO_LUCIA', 'Renovación de abono', 'Tu abono vence en 2 días. Renovalo entre el 1 y el 10 del mes.', 'renovacion');
