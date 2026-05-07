/**
 * jest.setup.ts
 *
 * Se ejecuta después del framework, antes de cada suite de INTEGRACIÓN.
 * - Configura el cliente Supabase de test (apunta a staging).
 * - Hace signOut global para garantizar sesión limpia entre suites.
 *
 * Polyfills mínimos para que @supabase/supabase-js funcione en Node:
 * - fetch: globalThis.fetch (Node 18+) ya está disponible.
 * - TextEncoder / TextDecoder: ya en Node 18+.
 * - El cliente se crea sin AsyncStorage (setStorage: undefined) en entorno Node.
 */

import { createClient } from '@supabase/supabase-js';

const url  = process.env.SUPABASE_URL_TEST!;
const key  = process.env.SUPABASE_ANON_KEY_TEST!;

if (!url || !key) {
  throw new Error(
    'SUPABASE_URL_TEST y SUPABASE_ANON_KEY_TEST deben estar definidas en .env.test'
  );
}

// Cliente compartido para todos los tests de integración
export const supabaseTest = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// ─── Limpieza global ──────────────────────────────────────────────────────────

afterAll(async () => {
  // Cerrar sesión activa al terminar para no dejar tokens colgados
  await supabaseTest.auth.signOut();
});
