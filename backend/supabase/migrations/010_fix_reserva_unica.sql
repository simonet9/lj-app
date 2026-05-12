-- Drop the existing unique constraint if it exists
ALTER TABLE public.reservas DROP CONSTRAINT IF EXISTS reserva_unica;

-- Drop the index if it exists (in case it was already converted to an index)
DROP INDEX IF EXISTS reserva_unica;

-- Create a partial unique index that only applies to confirmed reservations
-- This allows a user to cancel a reservation and later re-book the same class
CREATE UNIQUE INDEX reserva_unica ON public.reservas (socio_id, clase_id) WHERE estado = 'confirmada';
