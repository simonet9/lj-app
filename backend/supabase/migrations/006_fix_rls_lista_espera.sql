DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='lista_espera' AND policyname='lista_espera_select_own'
  ) THEN
    CREATE POLICY "lista_espera_select_own" ON public.lista_espera
      FOR SELECT USING (auth.uid() = socio_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='lista_espera' AND policyname='lista_espera_insert_own'
  ) THEN
    CREATE POLICY "lista_espera_insert_own" ON public.lista_espera
      FOR INSERT WITH CHECK (auth.uid() = socio_id);
  END IF;
END $$;
