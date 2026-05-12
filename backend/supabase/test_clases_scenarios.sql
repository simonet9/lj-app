-- IMPORTANTE: Para que este script funcione, asegúrate de tener al menos 
-- 1 usuario con rol 'gestor' y 2 usuarios con rol 'socio' en tu base de datos.

-- ESCENARIO 1: Clase Disponible (Completamente vacía)
-- Se visualizará normal, lista para recibir reservas.
INSERT INTO public.clases (id, disciplina, nivel, fecha, hora_inicio, hora_fin, cupo_maximo, cupo_disponible, estado, gestor_id, created_at, updated_at)
VALUES (
  gen_random_uuid(), 'padel', 'principiante', CURRENT_DATE + INTERVAL '1 day', '17:00:00', '18:00:00', 4, 4, 'disponible', 
  (SELECT id FROM public.usuarios WHERE rol = 'gestor' LIMIT 1),
  now(), now()
);

-- ESCENARIO 2: Clase Llena (Sin lugar)
-- El cupo_disponible es 0. Debería habilitar el botón de "Anotarse en Lista de Espera".
WITH nueva_clase AS (
  INSERT INTO public.clases (id, disciplina, nivel, fecha, hora_inicio, hora_fin, cupo_maximo, cupo_disponible, estado, gestor_id, created_at, updated_at)
  VALUES (gen_random_uuid(), 'futbol5', 'intermedio', CURRENT_DATE + INTERVAL '2 days', '19:00:00', '20:00:00', 1, 0, 'disponible', (SELECT id FROM public.usuarios WHERE rol = 'gestor' LIMIT 1), now(), now())
  RETURNING id
)
INSERT INTO public.reservas (id, socio_id, clase_id, estado, created_at, updated_at)
SELECT gen_random_uuid(), (SELECT id FROM public.usuarios WHERE rol = 'socio' LIMIT 1), id, 'confirmada', now(), now()
FROM nueva_clase;

-- ESCENARIO 3: Clase Llena CON gente en Lista de Espera
-- Cupo disponible 0, y ya hay otro socio en lista de espera.
WITH nueva_clase_espera AS (
  INSERT INTO public.clases (id, disciplina, nivel, fecha, hora_inicio, hora_fin, cupo_maximo, cupo_disponible, estado, gestor_id, created_at, updated_at)
  VALUES (gen_random_uuid(), 'voley', 'avanzado', CURRENT_DATE + INTERVAL '3 days', '20:00:00', '21:00:00', 1, 0, 'disponible', (SELECT id FROM public.usuarios WHERE rol = 'gestor' LIMIT 1), now(), now())
  RETURNING id
),
insert_reserva AS (
  INSERT INTO public.reservas (id, socio_id, clase_id, estado, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT id FROM public.usuarios WHERE rol = 'socio' LIMIT 1), id, 'confirmada', now(), now()
  FROM nueva_clase_espera
)
INSERT INTO public.lista_espera (id, socio_id, clase_id, posicion, created_at)
SELECT gen_random_uuid(), (SELECT id FROM public.usuarios WHERE rol = 'socio' OFFSET 1 LIMIT 1), id, 1, now()
FROM nueva_clase_espera;

-- ESCENARIO 4: Clase Suspendida
-- El estado es 'suspendida'. No debería permitir reservas ni listas de espera.
INSERT INTO public.clases (id, disciplina, nivel, fecha, hora_inicio, hora_fin, cupo_maximo, cupo_disponible, estado, gestor_id, motivo_suspension, created_at, updated_at)
VALUES (
  gen_random_uuid(), 'basquet', 'intermedio', CURRENT_DATE + INTERVAL '4 days', '18:00:00', '19:00:00', 10, 10, 'suspendida', 
  (SELECT id FROM public.usuarios WHERE rol = 'gestor' LIMIT 1),
  'Lluvia torrencial, cancha inundada',
  now(), now()
);

-- ESCENARIO 5: Clase Histórica (Fecha pasada)
-- Útil para probar cómo se ve el historial de clases de un socio.
INSERT INTO public.clases (id, disciplina, nivel, fecha, hora_inicio, hora_fin, cupo_maximo, cupo_disponible, estado, gestor_id, created_at, updated_at)
VALUES (
  gen_random_uuid(), 'padel', 'avanzado', CURRENT_DATE - INTERVAL '2 days', '17:00:00', '18:00:00', 4, 4, 'disponible', 
  (SELECT id FROM public.usuarios WHERE rol = 'gestor' LIMIT 1),
  now(), now()
);
