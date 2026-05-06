import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '@services/supabase';
import type { AuthContextType, Usuario, SignUpData } from '@app-types/index';
import type { Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recuperar sesión existente al arrancar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUsuario(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          await fetchUsuario(session.user.id);
        } else {
          setUsuario(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUsuario(userId: string) {
    try {
      console.log('[AuthContext] Fetching profile for userId:', userId);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthContext] Error al obtener usuario:', error.message);
        if (Platform.OS === 'web') {
          window.alert(`Error al obtener perfil: ${error.message}`);
        } else {
          Alert.alert('Error', `Error al obtener perfil: ${error.message}`);
        }
      } else {
        console.log('[AuthContext] Profile fetched successfully. Rol:', data?.rol);
        setUsuario(data as Usuario);
      }
    } catch (err: any) {
      console.error('[AuthContext] Exception in fetchUsuario:', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // Todos los errores de autenticación se mapean al mismo mensaje para no
    // revelar si el email existe en el sistema (evita enumeración de credenciales).
    if (error) throw new Error('Credenciales incorrectas');
  }

  async function signUp(data: SignUpData) {
    // ── 1. Crear cuenta en Supabase Auth ────────────────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      // Supabase devuelve este mensaje cuando el email ya está registrado
      if (
        authError.message === 'User already registered' ||
        authError.message.toLowerCase().includes('already registered') ||
        authError.message.toLowerCase().includes('email already')
      ) {
        throw Object.assign(
          new Error('El correo electrónico ya se encuentra registrado'),
          { field: 'email' }
        );
      }
      throw Object.assign(
        new Error('No se pudo crear la cuenta. Intentá de nuevo.'),
        { field: 'general' }
      );
    }

    if (!authData.user) {
      throw Object.assign(
        new Error('No se pudo crear la cuenta. Intentá de nuevo.'),
        { field: 'general' }
      );
    }

    // ── 2. Insertar perfil en public.usuarios ───────────────────────────────────
    const { error: profileError } = await supabase.from('usuarios').insert({
      id: authData.user.id,
      email: data.email,
      dni: data.dni,
      nombre: data.nombre,
      apellido: data.apellido,
      rol: 'socio',
      membresia: 'eventual',
      creditos: 0,
    });

    if (profileError) {
      // Limpiar la cuenta de auth si el perfil no se pudo insertar
      await supabase.auth.signOut();

      // PostgREST devuelve code '23505' para unique_violation
      const isUniqueViolation =
        (profileError as any).code === '23505' ||
        profileError.message.includes('duplicate') ||
        profileError.message.includes('unique');

      if (isUniqueViolation) {
        // Determinar si la violación es sobre el DNI
        const isDniViolation =
          profileError.message.toLowerCase().includes('dni') ||
          (profileError as any).details?.toLowerCase().includes('dni');

        if (isDniViolation) {
          throw Object.assign(
            new Error('El DNI ingresado ya se encuentra registrado'),
            { field: 'dni' }
          );
        }
        // Si no es DNI, asumir que es el email (poco probable aquí, pero lo cubrimos)
        throw Object.assign(
          new Error('El correo electrónico ya se encuentra registrado'),
          { field: 'email' }
        );
      }

      throw Object.assign(
        new Error('No se pudo crear la cuenta. Intentá de nuevo.'),
        { field: 'general' }
      );
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    // supabase.auth.signOut() limpia AsyncStorage automáticamente.
    // No limpiar manualmente el storage.
    if (error) throw new Error('No se pudo cerrar la sesión. Intentá de nuevo.');
  }

  /**
   * Refresca el perfil del usuario desde la BD.
   * Útil después de operaciones que mutan public.usuarios (ej: descuento de créditos).
   */
  async function refreshUsuario() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await fetchUsuario(session.user.id);
    }
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, signIn, signUp, signOut, refreshUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return context;
}
