import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';

export default function AbonoScreen() {
  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Suscripción</Text>
        <Text style={styles.title}>Abono mensual</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="card-outline" size={64} color={Colors.accent} />
        </View>
        <Text style={styles.emptyTitle}>Adquirí tu abono</Text>
        <Text style={styles.emptySubtitle}>
          Próximamente vas a poder comprar tu abono mensual directamente desde acá y gestionar tus pagos de forma rápida y segura.
        </Text>
        
        <TouchableOpacity style={styles.buttonDisabled} disabled activeOpacity={1}>
          <Text style={styles.buttonText}>Comprar abono (Próximamente)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.xl,
  },
  headerEyebrow: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iconContainer: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  emptyTitle: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl },
  buttonDisabled: {
    backgroundColor: Colors.border,
    paddingVertical: 16, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    width: '100%', alignItems: 'center',
  },
  buttonText: { ...Typography.body, fontWeight: '700', color: Colors.textMuted },
});
