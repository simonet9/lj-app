import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Datos demo hardcodeados (admin ve métricas agregadas) ─────────────────────
const KPI_DATA = [
  {
    label: 'Socios activos',
    value: '84',
    delta: '+12%',
    deltaUp: true,
    icon: 'people' as const,
    color: Colors.success,
    bg: Colors.successLight,
  },
  {
    label: 'Ingresos del mes',
    value: '$182k',
    delta: '+8%',
    deltaUp: true,
    icon: 'cash' as const,
    color: Colors.accent,
    bg: Colors.accent + '18',
  },
  {
    label: 'Clases esta semana',
    value: '21',
    delta: '−2',
    deltaUp: false,
    icon: 'calendar' as const,
    color: Colors.padel,
    bg: Colors.padel + '18',
  },
  {
    label: 'Ausentismo',
    value: '9%',
    delta: '−3%',
    deltaUp: true,
    icon: 'alert-circle' as const,
    color: Colors.warning,
    bg: Colors.warningLight,
  },
];

const DISCIPLINAS = [
  { key: 'futbol5', label: 'Fútbol 5', emoji: '⚽', pct: 78, color: Colors.futbol5 },
  { key: 'padel',   label: 'Pádel',   emoji: '🏓', pct: 91, color: Colors.padel   },
  { key: 'voley',   label: 'Vóley',   emoji: '🏐', pct: 65, color: Colors.voley   },
  { key: 'basquet', label: 'Básquet', emoji: '🏀', pct: 55, color: Colors.basquet },
];

const ACTIVIDAD = [
  { dia: 'Lu', reservas: 12, color: Colors.futbol5 },
  { dia: 'Ma', reservas: 18, color: Colors.padel   },
  { dia: 'Mi', reservas: 9,  color: Colors.voley   },
  { dia: 'Ju', reservas: 22, color: Colors.padel   },
  { dia: 'Vi', reservas: 30, color: Colors.accent  },
  { dia: 'Sa', reservas: 26, color: Colors.accent  },
  { dia: 'Do', reservas: 7,  color: Colors.textMuted },
];
const MAX_RESERVAS = 30;

export default function MetricasScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerEyebrow}>ADMINISTRACIÓN</Text>
            <Text style={styles.title}>Panel de control</Text>
          </View>
          <View style={styles.avatarBadge}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.accent} />
          </View>
        </View>
        {/* Pill de periodo */}
        <View style={styles.periodPill}>
          <Ionicons name="calendar-outline" size={13} color={Colors.accent} />
          <Text style={styles.periodText}>Abril 2026</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Grid 2×2 */}
        <View style={styles.kpiGrid}>
          {KPI_DATA.map((kpi) => (
            <View key={kpi.label} style={styles.kpiCard}>
              <View style={[styles.kpiIconWrap, { backgroundColor: kpi.bg }]}>
                <Ionicons name={kpi.icon} size={18} color={kpi.color} />
              </View>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <View style={styles.kpiDeltaRow}>
                <Ionicons
                  name={kpi.deltaUp ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={kpi.deltaUp ? Colors.success : Colors.danger}
                />
                <Text style={[styles.kpiDelta, { color: kpi.deltaUp ? Colors.success : Colors.danger }]}>
                  {kpi.delta}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Ocupación por disciplina */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OCUPACIÓN POR DISCIPLINA</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.card}>
          {DISCIPLINAS.map((d, idx) => (
            <View key={d.key} style={[styles.discRow, idx < DISCIPLINAS.length - 1 && styles.discRowBorder]}>
              <Text style={styles.discEmoji}>{d.emoji}</Text>
              <View style={styles.discBody}>
                <View style={styles.discLabelRow}>
                  <Text style={styles.discLabel}>{d.label}</Text>
                  <Text style={[styles.discPct, { color: d.color }]}>{d.pct}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${d.pct}%` as any, backgroundColor: d.color }]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Actividad semanal — bar chart manual */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ACTIVIDAD SEMANAL</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.card}>
          <Text style={styles.chartSubtitle}>Reservas por día · semana actual</Text>
          <View style={styles.barChart}>
            {ACTIVIDAD.map((d) => {
              const h = Math.round((d.reservas / MAX_RESERVAS) * 80);
              return (
                <View key={d.dia} style={styles.barColumn}>
                  <Text style={styles.barValue}>{d.reservas}</Text>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        { height: h, backgroundColor: d.color },
                        d.dia === 'Vi' || d.dia === 'Sa' ? styles.barHighlight : null,
                      ]}
                    />
                  </View>
                  <Text style={styles.barDia}>{d.dia}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Resumen financiero */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RESUMEN FINANCIERO</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.finRow}>
          <View style={[styles.finCard, { backgroundColor: Colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={[styles.finValue, { color: Colors.success }]}>$148k</Text>
            <Text style={styles.finLabel}>Abonados</Text>
          </View>
          <View style={[styles.finCard, { backgroundColor: Colors.infoLight }]}>
            <Ionicons name="flash" size={16} color={Colors.padel} />
            <Text style={[styles.finValue, { color: Colors.padel }]}>$34k</Text>
            <Text style={styles.finLabel}>Eventuales</Text>
          </View>
          <View style={[styles.finCard, { backgroundColor: Colors.accent + '15' }]}>
            <Ionicons name="trending-up" size={16} color={Colors.accent} />
            <Text style={[styles.finValue, { color: Colors.accent }]}>81%</Text>
            <Text style={styles.finLabel}>Cobrabilidad</Text>
          </View>
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
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerEyebrow: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5 },
  avatarBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  periodPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: Radius.full, alignSelf: 'flex-start',
  },
  periodText: { ...Typography.caption, color: Colors.accent, fontWeight: '600' },
  content: { padding: Spacing.md, gap: Spacing.md },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  kpiCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  kpiIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  kpiValue: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1, marginBottom: 2 },
  kpiLabel: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: 6 },
  kpiDeltaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  kpiDelta: { ...Typography.caption, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  sectionTitle: { ...Typography.caption, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1 },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  discRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  discRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  discEmoji: { fontSize: 22 },
  discBody: { flex: 1 },
  discLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  discLabel: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
  discPct: { ...Typography.body, fontWeight: '700' },
  barTrack: { height: 7, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.full },
  chartSubtitle: { ...Typography.bodySmall, color: Colors.textMuted, marginBottom: Spacing.md },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
  barColumn: { alignItems: 'center', flex: 1 },
  barValue: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4, fontWeight: '600' },
  barWrapper: { height: 80, justifyContent: 'flex-end', width: '70%' },
  bar: { borderRadius: Radius.sm, minHeight: 4 },
  barHighlight: { opacity: 1 },
  barDia: { ...Typography.caption, color: Colors.textMuted, marginTop: 6, fontWeight: '500' },
  finRow: { flexDirection: 'row', gap: Spacing.sm },
  finCard: {
    flex: 1, borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', gap: 4,
  },
  finValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  finLabel: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },
});
