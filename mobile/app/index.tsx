import { Redirect } from 'expo-router';

export default function IndexScreen() {
  // Redirigir siempre al auth login al inicio. 
  // El _layout.tsx se encarga de rebotar al usuario a su pantalla de rol si ya está logueado.
  return <Redirect href="/(auth)/login" />;
}
