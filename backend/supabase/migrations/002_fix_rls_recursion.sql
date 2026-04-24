-- ============================================================
-- Fix: Recursión infinita en política RLS de "usuarios"
-- Versión: 1.0.1 | Abril 2026
-- ============================================================
-- PROBLEMA:
--   La política "usuarios_select_admin" consultaba public.usuarios
--   dentro de su propio USING, causando recursión infinita al
--   evaluar las políticas RLS de esa misma tabla.
--
-- SOLUCIÓN:
--   Usar una función SECURITY DEFINER que omite RLS al consultar
--   el rol del usuario, rompiendo el ciclo de recursión.
-- ============================================================

-- 1. Función auxiliar: obtiene el rol del usuario autenticado
--    sin disparar RLS (SECURITY DEFINER + search_path fijo)
create or replace function public.get_my_rol()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.usuarios where id = auth.uid() limit 1;
$$;

-- 2. Eliminar la política que causaba la recursión
drop policy if exists "usuarios_select_admin" on public.usuarios;

-- 3. Recrear la política usando la función auxiliar (sin subquery sobre usuarios)
create policy "usuarios_select_admin" on public.usuarios
  for select using (public.get_my_rol() = 'admin');

-- ============================================================
-- NOTA: No es necesario reaplicar las demás políticas.
--       Solo se reemplaza "usuarios_select_admin".
-- ============================================================
