import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius, DisciplinaLabel } from '@constants/theme';

// Datos hardcodeados para demo — reemplazar con queries reales a Supabase
const OCUPACION_DATA = [
  { disciplina: 'futbol5', porcentaje: 87 },
  { disciplina: 'padel', porcentaje: 72 },
  { disciplina: 'voley', porcentaje: 65 },
  { disciplina: 'basquet', porcentaje: 91 },
];

const COBRABILIDAD_DATA = [
  { mes: 'Ene', eventuales: 48000, abonados: 120000 },
  { mes: 'Feb', eventuales: 52000, abonados: 132000 },
  { mes: 'Mar', eventuales: 61000, abonados: 148000 },
  { mes: 'Abr', eventuales: 57000, abonados: 155000 },
];

const DISCIPLINA_COLORS: Record<string, string> = {
  futbol5: Colors.futbol5,
  padel: Colors.padel,
  voley: Colors.voley,
  basquet: Colors.basquet,
};

export default function MetricasScreen() {
  const totalAbonados = 284;
  const ausentismo = 12.4;
  const cobrabilidad = 96.8;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de métricas</Text>
        <Text style={styles.subtitle}>Abril 2026</Text>
      </View>

      {/* KPIs */}
      <View style={styles.kpiGrid}>
        <KpiCard value={totalAbonados.toString()} label="Socios activos" color={Colors.info} />
        <KpiCard value={`${ausentismo}%`} label="Ausentismo" color={Colors.warning} />
        <KpiCard value={`${cobrabilidad}%`} label="Cobrabilidad" color={Colors.success} />
      </View>

      {/* Ocupación por disciplina */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ocupación por disciplina</Text>
        {OCUPACION_DATA.map(item => (
          <View key={item.disciplina} style={styles.barRow}>
            <Text style={styles.barLabel}>{DisciplinaLabel[item.disciplina]}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${item.porcentaje}%` as any,
                    backgroundColor: DISCIPLINA_COLORS[item.disciplina],
                  },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{item.porcentaje}%</Text>
          </View>
        ))}
      </View>

      {/* Cobrabilidad mensual */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cobrabilidad mensual (ARS)</Text>
        {COBRABILIDAD_DATA.map(item => (
          <View key={item.mes} style={styles.cobrabilidadRow}>
            <Text style={styles.mesLabel}>{item.mes}</Text>
            <View style={styles.cobrabilidadBars}>
              <View style={styles.cobrabilidadBarGroup}>
                <Text style={styles.cobrabilidadBarLabel}>Eventuales</Text>
                <View style={[styles.cobrabilidadBar, { backgroundColor: Colors.info }]}>
                  <Text style={styles.cobrabilidadBarValue}>${(item.eventuales / 1000).toFixed(0)}k</Text>
                </View>
              </View>
              <View style={styles.cobrabilidadBarGroup}>
                <Text style={styles.cobrabilidadBarLabel}>Abonados</Text>
                <View style={[styles.cobrabilidadBar, { backgroundColor: Colors.success }]}>
                  <Text style={styles.cobrabilidadBarValue}>${(item.abonados / 1000).toFixed(0)}k</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function KpiCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={[styles.kpiCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.md, paddingTop: 60, paddingBottom: Spacing.md },
  title: { ...Typography.h1, color: Colors.textPrimary },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  kpiGrid: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.md },
  kpiCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  kpiValue: { ...Typography.h2, fontWeight: '700' },
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  section: {
    margin: Spacing.md, backgroundColor: Colors.surface,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  barLabel: { ...Typography.bodySmall, color: Colors.textSecondary, width: 72 },
  barTrack: {
    flex: 1, height: 10, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: Radius.full },
  barValue: { ...Typography.bodySmall, fontWeight: '600', color: Colors.textPrimary, width: 36, textAlign: 'right' },
  cobrabilidadRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  mesLabel: { ...Typography.bodySmall, color: Colors.textSecondary, width: 28 },
  cobrabilidadBars: { flex: 1, flexDirection: 'row', gap: Spacing.sm },
  cobrabilidadBarGroup: { flex: 1 },
  cobrabilidadBarLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: 2 },
  cobrabilidadBar: {
    borderRadius: Radius.sm, padding: Spacing.xs, alignItems: 'center',
  },
  cobrabilidadBarValue: { ...Typography.caption, color: Colors.textInverse, fontWeight: '600' },
});
