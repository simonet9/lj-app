ALTER TABLE public.usuarios DROP COLUMN IF EXISTS nombre;
ALTER TABLE public.usuarios DROP COLUMN IF EXISTS apellido;
ALTER TABLE public.usuarios ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.usuarios ALTER COLUMN dni SET NOT NULL;
