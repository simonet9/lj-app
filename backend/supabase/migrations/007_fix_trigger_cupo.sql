CREATE OR REPLACE FUNCTION public.handle_reserva_cupo()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Al insertar reserva confirmada: decrementar cupo
  IF TG_OP = 'INSERT' AND NEW.estado = 'confirmada' THEN
    UPDATE public.clases
    SET
      cupo_disponible = cupo_disponible - 1,
      estado = CASE
        WHEN cupo_disponible - 1 <= 0 THEN 'completa'::estado_clase
        ELSE estado
      END
    WHERE id = NEW.clase_id AND cupo_disponible > 0;
  END IF;

  -- Al cancelar reserva: incrementar cupo
  IF TG_OP = 'UPDATE' AND OLD.estado = 'confirmada' AND NEW.estado = 'cancelada' THEN
    UPDATE public.clases
    SET
      cupo_disponible = cupo_disponible + 1,
      estado = CASE
        WHEN estado = 'completa' THEN 'disponible'::estado_clase
        ELSE estado
      END
    WHERE id = NEW.clase_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reserva_cupo_trigger ON public.reservas;
CREATE TRIGGER reserva_cupo_trigger
  AFTER INSERT OR UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.handle_reserva_cupo();
