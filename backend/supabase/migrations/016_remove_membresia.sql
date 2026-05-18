-- Migración para eliminar el campo membresia de la tabla usuarios
-- y el tipo enumerado membresia_type, ya que los roles de
-- eventual y abonado se han fusionado.

-- 1. Eliminar la columna de la tabla usuarios
ALTER TABLE public.usuarios
DROP COLUMN IF EXISTS membresia;

-- 2. Eliminar el tipo enumerado si ya no se utiliza en otra tabla
DROP TYPE IF EXISTS public.membresia_type;
