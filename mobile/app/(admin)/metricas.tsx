import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';

export default function MetricasScreen() {
  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Administración</Text>
        <Text style={styles.title}>Panel de control</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPIs mockup */}
        <View style={styles.row}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="people-outline" size={18} color={Colors.success} />
            </View>
            <Text style={styles.kpiValue}>--</Text>
            <Text style={styles.kpiLabel}>Socios activos</Text>
          </View>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: Colors.accent + '20' }]}>
              <Ionicons name="cash-outline" size={18} color={Colors.accent} />
            </View>
            <Text style={styles.kpiValue}>--</Text>
            <Text style={styles.kpiLabel}>Ingresos mes</Text>
          </View>
        </View>

        {/* Empty State para gráficos */}
        <View style={styles.emptyCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="bar-chart-outline" size={48} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Métricas en desarrollo</Text>
          <Text style={styles.emptySubtitle}>
            Pronto vas a poder ver gráficos interactivos sobre asistencia, cobrabilidad y ocupación por disciplina en esta pantalla.
          </Text>
        </View>
      </ScrollView>
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
    padding: Spacing.md,
    paddingBottom: 100,
  },
  row: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  kpiCard: {
    flex: 1, backgroundColor: Colors.surface,
    padding: Spacing.md, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  kpiIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  kpiValue: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 },
  kpiLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  emptyCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
