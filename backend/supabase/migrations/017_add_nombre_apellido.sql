-- Migración 017: Agregar nombre y apellido a la tabla usuarios
-- Reintroduce los campos que fueron eliminados en 005_fix_usuarios.sql

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS nombre   TEXT,
  ADD COLUMN IF NOT EXISTS apellido TEXT;

-- Comentarios descriptivos
COMMENT ON COLUMN public.usuarios.nombre   IS 'Nombre de pila del socio';
COMMENT ON COLUMN public.usuarios.apellido IS 'Apellido del socio';
