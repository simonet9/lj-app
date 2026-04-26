import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';

export default function AbonoScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerEyebrow}>MEMBRESÍA</Text>
        <Text style={styles.title}>Abono L&J</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <Ionicons name="star" size={24} color={Colors.accent} />
            </View>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>MÁS POPULAR</Text>
            </View>
          </View>
          
          <Text style={styles.planName}>Pase Libre Mensual</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>$</Text>
            <Text style={styles.price}>25.000</Text>
            <Text style={styles.period}>/mes</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.benefitsList}>
            <BenefitItem text="Créditos ilimitados para clases" />
            <BenefitItem text="Prioridad en listas de espera" />
            <BenefitItem text="Reserva anticipada (7 días antes)" />
            <BenefitItem text="Sin seña previa obligatoria" />
          </View>

          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
            <Text style={styles.ctaText}>Suscribirme ahora</Text>
          </TouchableOpacity>
          <Text style={styles.ctaHint}>Pago seguro a través de MercadoPago</Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            Actualmente la pasarela de pagos está en desarrollo. Contactá a recepción para habilitar tu abono.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <View style={styles.benefitItem}>
      <View style={styles.checkWrap}>
        <Ionicons name="checkmark" size={14} color={Colors.surface} />
      </View>
      <Text style={styles.benefitText}>{text}</Text>
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
  headerEyebrow: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '700', letterSpacing: 1.2, marginBottom: 2,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5 },
  scrollContent: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1, shadowRadius: 24, elevation: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(52, 211, 153, 0.15)', // accent light
    justifyContent: 'center', alignItems: 'center',
  },
  badgeWrap: {
    backgroundColor: Colors.primary,
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: Radius.sm,
  },
  badgeText: {
    ...Typography.caption, color: Colors.textInverse, fontWeight: '800', fontSize: 10, letterSpacing: 0.5,
  },
  planName: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.lg },
  currency: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4, marginRight: 2 },
  price: { fontSize: 40, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 },
  period: { ...Typography.body, color: Colors.textSecondary, marginBottom: 6, marginLeft: 4, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.lg },
  benefitsList: { gap: Spacing.md, marginBottom: Spacing.xl },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkWrap: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  benefitText: { ...Typography.body, color: Colors.textSecondary, fontWeight: '500' },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
    marginBottom: Spacing.sm,
  },
  ctaText: { ...Typography.body, color: Colors.textInverse, fontWeight: '700' },
  ctaHint: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  infoBox: {
    flexDirection: 'row', gap: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: Spacing.md, borderRadius: Radius.md,
    marginTop: Spacing.xl,
    borderLeftWidth: 3, borderLeftColor: Colors.textMuted,
  },
  infoText: { flex: 1, ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
});
