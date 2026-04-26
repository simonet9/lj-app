import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';

export default function PerfilScreen() {
  const { usuario, signOut } = useAuth();

  async function handleSignOut() {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('¿Querés cerrar tu sesión?');
      if (confirm) {
        try {
          await signOut();
        } catch (error: any) {
          window.alert('Error: ' + (error.message || 'No se pudo cerrar sesión'));
        }
      }
      return;
    }

    Alert.alert('Cerrar sesión', '¿Querés cerrar tu sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Cerrar sesión', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo cerrar sesión');
          }
        } 
      },
    ]);
  }

  if (!usuario) return null;

  const iniciales = `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase();
  const esAbonado = usuario.membresia === 'abonado';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Mi perfil</Text>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{iniciales}</Text>
          </View>
          {esAbonado && (
            <View style={styles.abonadoBadge}>
              <Ionicons name="star" size={10} color={Colors.textInverse} />
            </View>
          )}
        </View>
        <Text style={styles.nombre}>{usuario.nombre} {usuario.apellido}</Text>
        <Text style={styles.email}>{usuario.email}</Text>
        <View style={styles.rolChip}>
          <Text style={styles.rolText}>{esAbonado ? 'Socio Abonado' : 'Socio Eventual'}</Text>
        </View>
      </View>

      {/* Créditos (solo abonados) */}
      {esAbonado && (
        <View style={styles.creditosCard}>
          <View style={styles.creditosLeft}>
            <Ionicons name="flash" size={24} color={Colors.accent} />
            <View>
              <Text style={styles.creditosLabel}>Créditos disponibles</Text>
              <Text style={styles.creditosValue}>{usuario.creditos} créditos</Text>
            </View>
          </View>
          <View style={styles.creditosBadge}>
            <Text style={styles.creditosBadgeText}>ACTIVO</Text>
          </View>
        </View>
      )}

      {/* Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>INFORMACIÓN</Text>
        <InfoRow icon="card-outline" label="DNI" value={usuario.dni} />
        <InfoRow icon="people-outline" label="Membresía" value={esAbonado ? 'Abonado mensual' : 'Eventual'} />
        <InfoRow icon="shield-outline" label="Rol" value={usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)} last />
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
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
  abonadoBadge: {
    position: 'absolute',
    bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.warning,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  nombre: { fontSize: 22, fontWeight: '700', color: Colors.textInverse, marginBottom: 4 },
  email: { ...Typography.body, color: 'rgba(255,255,255,0.55)', marginBottom: Spacing.md },
  rolChip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  rolText: { ...Typography.label, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
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
  creditosValue: { ...Typography.h3, color: Colors.textInverse, fontWeight: '700' },
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
  },
  logoutText: { ...Typography.body, color: Colors.danger, fontWeight: '600' },
});
