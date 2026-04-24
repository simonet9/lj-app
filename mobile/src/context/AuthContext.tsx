import React, { createContext, useContext, useEffect, useState } from 'react';
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
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error al obtener usuario:', error.message);
    } else {
      setUsuario(data as Usuario);
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }

  async function signUp(data: SignUpData) {
    // 1. Crear cuenta en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('No se pudo crear el usuario');

    // 2. Insertar perfil en tabla usuarios
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

    if (profileError) throw new Error(profileError.message);
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, signIn, signUp, signOut }}>
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
