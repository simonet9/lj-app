import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';

export default function GestorPerfilScreen() {
  const { usuario, signOut } = useAuth();

  function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Querés cerrar tu sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>{usuario?.nombre} {usuario?.apellido}</Text>
        <Text style={styles.role}>Gestor de actividad</Text>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.md, paddingTop: 60, paddingBottom: Spacing.sm },
  title: { ...Typography.h1, color: Colors.textPrimary },
  subtitle: { ...Typography.h3, color: Colors.textSecondary, marginTop: 4 },
  role: { ...Typography.body, color: Colors.accent, marginTop: 4 },
  logoutBtn: {
    margin: Spacing.md, padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.danger, alignItems: 'center',
  },
  logoutText: { ...Typography.body, color: Colors.danger, fontWeight: '600' },
});
