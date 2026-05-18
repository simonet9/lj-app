import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';

export default function PerfilScreen() {
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

  const iniciales = usuario.email.substring(0, 2).toUpperCase();
  // HU-21: condicionar vista por créditos, no por membresía
  const tieneCreditos = (usuario.creditos ?? 0) > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Mi perfil</Text>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{iniciales}</Text>
          </View>
          {tieneCreditos && (
            <View style={styles.creditosBadgeAvatar}>
              <Ionicons name="flash" size={10} color={Colors.textInverse} />
            </View>
          )}
        </View>
        <Text style={styles.nombre}>
          {usuario.nombre && usuario.apellido
            ? `${usuario.nombre} ${usuario.apellido}`
            : usuario.email.split('@')[0]}
        </Text>
        <Text style={styles.email}>{usuario.email}</Text>
      </View>

      {/* Créditos — solo si tiene créditos disponibles (HU-21) */}
      {tieneCreditos && (
        <View style={styles.creditosCard}>
          <View style={styles.creditosLeft}>
            <Ionicons name="flash" size={24} color={Colors.accent} />
            <View>
              <Text style={styles.creditosLabel}>Créditos disponibles</Text>
              <View style={styles.creditosValueRow}>
                <Text style={styles.creditosNumber}>{usuario.creditos}</Text>
                <Text style={styles.creditosUnit}> crédito{usuario.creditos !== 1 ? 's' : ''}</Text>
              </View>
            </View>
          </View>
          <View style={styles.creditosBadge}>
            <Text style={styles.creditosBadgeText}>ACTIVO</Text>
          </View>
        </View>
      )}

      {/* Datos personales */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>INFORMACIÓN</Text>
        {usuario.nombre ? (
          <InfoRow icon="person-outline" label="Nombre" value={usuario.nombre} />
        ) : null}
        {usuario.apellido ? (
          <InfoRow icon="person-outline" label="Apellido" value={usuario.apellido} />
        ) : null}
        <InfoRow icon="card-outline" label="DNI" value={usuario.dni} />
        <InfoRow icon="mail-outline" label="Email" value={usuario.email} last />
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

      {/* Botón de debug — solo visible en desarrollo */}
      {__DEV__ && (
        <TouchableOpacity
          style={styles.devBtn}
          onPress={() => router.push('/(socio)/test-notificaciones' as any)}
          activeOpacity={0.8}
          accessibilityLabel="Abrir pantalla de prueba de notificaciones"
          accessibilityRole="button"
        >
          <Ionicons name="flask-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.devBtnText}>Test de notificaciones</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      )}

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
  value: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
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
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.textInverse },
  // Badge de rayo cuando tiene créditos
  creditosBadgeAvatar: {
    position: 'absolute',
    bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  nombre: { ...Typography.h2, color: Colors.textInverse, marginBottom: 4 },
  email: { ...Typography.body, color: 'rgba(255,255,255,0.55)', marginBottom: Spacing.md },
  creditosCard: {
    margin: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  creditosLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  creditosLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  creditosValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  creditosNumber: { ...Typography.h2, color: Colors.accent, fontWeight: '800' },
  creditosUnit: { ...Typography.body, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  creditosBadge: {
    backgroundColor: Colors.success + '30',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  creditosBadgeText: { ...Typography.caption, color: Colors.success, fontWeight: '700', letterSpacing: 0.5 },
  card: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTitle: { ...Typography.caption, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.danger + '50',
    backgroundColor: Colors.dangerLight,
    minHeight: 52,
  },
  logoutBtnDisabled: { opacity: 0.6 },
  logoutText: { ...Typography.body, color: Colors.danger, fontWeight: '600' },
  // Botón de debug — solo en __DEV__
  devBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.surface,
  },
  devBtnText: { ...Typography.caption, color: Colors.textMuted, fontWeight: '600', flex: 1 },
});
