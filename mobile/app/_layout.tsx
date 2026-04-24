import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@context/AuthContext';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { usuario, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (!usuario && !inAuthGroup) {
      // Sin sesión → ir a login
      router.replace('/(auth)/login');
    } else if (usuario && inAuthGroup) {
      // Con sesión → ir a la sección del rol
      switch (usuario.rol) {
        case 'socio':
          router.replace('/(socio)/clases');
          break;
        case 'gestor':
          router.replace('/(gestor)/agenda');
          break;
        case 'admin':
          router.replace('/(admin)/metricas');
          break;
      }
    }
  }, [usuario, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(socio)" />
      <Stack.Screen name="(gestor)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootLayoutNav />
    </AuthProvider>
  );
}
