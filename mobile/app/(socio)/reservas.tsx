import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';

export default function ReservasScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerEyebrow}>HISTORIAL</Text>
        <Text style={styles.title}>Mis reservas</Text>
      </View>

      {/* Tabs: Próximas / Pasadas */}
      <View style={styles.tabsBar}>
        <View style={styles.tabActive}>
          <Text style={styles.tabTextActive}>Próximas</Text>
        </View>
        <TouchableOpacity style={styles.tab} activeOpacity={0.7}>
          <Text style={styles.tabText}>Historial</Text>
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyEmoji}>📋</Text>
          </View>
          <Text style={styles.emptyTitle}>Sin reservas activas</Text>
          <Text style={styles.emptySubtitle}>
            Tus próximas clases aparecerán aquí después de reservar.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/(socio)/clases')}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={18} color={Colors.textInverse} />
            <Text style={styles.ctaText}>Explorar clases</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  tabsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
  },
  tabActive: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: Colors.accent,
  },
  tabText: { ...Typography.body, color: Colors.textMuted, fontWeight: '600' },
  tabTextActive: { ...Typography.body, color: Colors.accent, fontWeight: '700' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 13, paddingHorizontal: Spacing.xl,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  ctaText: { ...Typography.body, fontWeight: '700', color: Colors.textInverse },
});
