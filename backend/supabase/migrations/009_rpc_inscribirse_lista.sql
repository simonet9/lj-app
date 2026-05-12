CREATE OR REPLACE FUNCTION public.inscribirse_en_lista_espera(
  p_socio_id uuid,
  p_clase_id uuid
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_max_posicion integer;
  v_nueva_posicion integer;
BEGIN
  -- Verificar si ya está en la lista
  IF EXISTS (SELECT 1 FROM public.lista_espera WHERE socio_id = p_socio_id AND clase_id = p_clase_id) THEN
    RETURN json_build_object('error', 'already_inscribed');
  END IF;

  -- Obtener la posición máxima actual
  SELECT COALESCE(MAX(posicion), 0) INTO v_max_posicion
  FROM public.lista_espera
  WHERE clase_id = p_clase_id;

  v_nueva_posicion := v_max_posicion + 1;

  INSERT INTO public.lista_espera (socio_id, clase_id, posicion)
  VALUES (p_socio_id, p_clase_id, v_nueva_posicion);

  RETURN json_build_object(
    'success', true,
    'posicion', v_nueva_posicion,
    'socio_id', p_socio_id,
    'clase_id', p_clase_id
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('error', 'already_inscribed');
  WHEN OTHERS THEN
    RETURN json_build_object('error', 'unknown', 'message', SQLERRM);
END;
$$;
