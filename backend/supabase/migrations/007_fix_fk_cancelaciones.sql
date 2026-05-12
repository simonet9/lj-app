ALTER TABLE public.cancelaciones
DROP CONSTRAINT IF EXISTS cancelaciones_clase_id_fkey;

ALTER TABLE public.cancelaciones
ADD CONSTRAINT cancelaciones_clase_id_fkey
FOREIGN KEY (clase_id)
REFERENCES public.clases(id)
ON DELETE CASCADE;
