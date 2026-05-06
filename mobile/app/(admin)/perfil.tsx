import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';

export default function AdminPerfilScreen() {
  const { usuario, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (Platform.OS === 'web') {
      const ok = window.confirm('¿Cerrar sesión?');
      if (ok) {
        setSigningOut(true);
        try {
          await signOut();
        } catch (error: any) {
          setSigningOut(false);
          window.alert(error.message || 'No se pudo cerrar la sesión. Intentá de nuevo.');
        }
      }
      return;
    }

    Alert.alert('¿Cerrar sesión?', 'Tu sesión quedará cerrada en este dispositivo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
            // ✅ El redirect lo maneja _layout.tsx via onAuthStateChange
          } catch (error: any) {
            setSigningOut(false);
            Alert.alert('Error', error.message || 'No se pudo cerrar la sesión. Intentá de nuevo.');
          }
        },
      },
    ]);
  }

  if (!usuario) return null;

  const iniciales = `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Mi perfil</Text>
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, { backgroundColor: Colors.warning }]}>
            <Text style={styles.avatarText}>{iniciales}</Text>
          </View>
        </View>
        <Text style={styles.nombre}>{usuario.nombre} {usuario.apellido}</Text>
        <Text style={styles.email}>{usuario.email}</Text>
        <View style={styles.rolChip}>
          <Ionicons name="settings-outline" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.rolText}>Administrador</Text>
        </View>
      </View>

      {/* Info */}
      <View style={[styles.card, { marginTop: Spacing.lg }]}>
        <Text style={styles.cardTitle}>INFORMACIÓN</Text>
        <InfoRow icon="card-outline" label="DNI" value={usuario.dni} />
        <InfoRow icon="shield-half-outline" label="Rol" value={usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)} last />
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity
        style={[styles.logoutBtn, signingOut && styles.logoutBtnDisabled]}
        onPress={handleSignOut}
        disabled={signingOut}
        activeOpacity={0.8}
        accessibilityLabel="Cerrar sesión"
        accessibilityRole="button"
      >
        {signingOut ? (
          <ActivityIndicator size="small" color={Colors.danger} />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[infoStyles.row, !last && infoStyles.rowBorder]}>
      <View style={infoStyles.iconWrap}>
        <Ionicons name={icon as any} size={15} color={Colors.textMuted} />
      </View>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  label: { ...Typography.body, color: Colors.textSecondary, flex: 1 },
  value: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  heroTitle: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
  },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.warning, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary },
  nombre: { fontSize: 22, fontWeight: '700', color: Colors.textInverse, marginBottom: 4 },
  email: { ...Typography.body, color: 'rgba(255,255,255,0.55)', marginBottom: Spacing.md },
  rolChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  rolText: { ...Typography.label, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  card: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTitle: { ...Typography.caption, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.md, marginBottom: Spacing.md, padding: Spacing.md,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.danger + '50',
    backgroundColor: Colors.dangerLight, minHeight: 52,
  },
  logoutBtnDisabled: { opacity: 0.6 },
  logoutText: { ...Typography.body, color: Colors.danger, fontWeight: '600' },
});
