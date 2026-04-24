import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';

export default function PerfilScreen() {
  const { usuario, signOut } = useAuth();

  function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Querés cerrar tu sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
    ]);
  }

  if (!usuario) return null;

  const iniciales = `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi perfil</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciales}</Text>
        </View>
        <Text style={styles.nombre}>{usuario.nombre} {usuario.apellido}</Text>
        <Text style={styles.email}>{usuario.email}</Text>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <InfoRow label="DNI" value={usuario.dni} />
        <InfoRow label="Membresía" value={usuario.membresia === 'abonado' ? 'Abonado mensual' : 'Eventual'} />
        {usuario.membresia === 'abonado' && (
          <InfoRow label="Créditos disponibles" value={`${usuario.creditos} créditos`} highlight />
        )}
        <InfoRow label="Rol" value={usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)} />
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.md, paddingTop: 60, paddingBottom: Spacing.sm },
  title: { ...Typography.h1, color: Colors.textPrimary },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.textInverse },
  nombre: { ...Typography.h2, color: Colors.textPrimary, marginTop: Spacing.md },
  email: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  infoCard: {
    margin: Spacing.md, backgroundColor: Colors.surface,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoLabel: { ...Typography.body, color: Colors.textSecondary },
  infoValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
  infoValueHighlight: { color: Colors.accent, fontWeight: '700' },
  logoutBtn: {
    margin: Spacing.md, padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.danger, alignItems: 'center',
  },
  logoutText: { ...Typography.body, color: Colors.danger, fontWeight: '600' },
});
