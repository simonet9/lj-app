// Mock del cliente Supabase para tests UNITARIOS.
// Los tests unitarios testean lógica pura y nunca deben llegar a Supabase.
module.exports = {
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
      insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
      delete: () => ({ eq: () => ({ data: null, error: null }) }),
      update: () => ({ eq: () => ({ data: null, error: null }) }),
    }),
    auth: {
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    rpc: async () => ({ data: null, error: null }),
  },
  supabaseTest: null,
};
