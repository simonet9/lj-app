import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, DisciplinaLabel } from '@constants/theme';

// ─── Tipos de parámetros de navegación ───────────────────────────────────────

type ConfirmacionParams = {
  reservaId?: string;
  disciplina?: string;
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  creditosRestantes?: string;
  senaPagada?: string;          // solo para socios eventuales
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatFecha(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const DISCIPLINA_EMOJI: Record<string, string> = {
  futbol5: '⚽', padel: '🏓', voley: '🏐', basquet: '🏀',
};

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function ReservaConfirmadaScreen() {
  const params = useLocalSearchParams() as unknown as ConfirmacionParams;
  const insets = useSafeAreaInsets();

  const disciplina = params.disciplina ?? '';
  const fecha = params.fecha ?? '';
  const horaInicio = params.horaInicio ?? '';
  const horaFin = params.horaFin ?? '';
  const disciplinaLabel = DisciplinaLabel[disciplina] ?? disciplina;
  const emoji = DISCIPLINA_EMOJI[disciplina] ?? '🏅';
  const fechaFormateada = formatFecha(fecha);

  const creditosRestantes = parseInt(params.creditosRestantes ?? '0', 10);
  const senaPagada = parseInt(params.senaPagada ?? '0', 10);
  // Si senaPagada > 0 es un socio eventual; si no, es abonado con créditos
  const esEventual = senaPagada > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Check animado ────────────────────────────────────────────────── */}
        <View style={styles.checkWrapper}>
          <View style={styles.checkOuter}>
            <View style={styles.checkInner}>
              <Ionicons name="checkmark" size={52} color={Colors.textInverse} />
            </View>
          </View>
          {/* Anillos decorativos */}
          <View style={styles.ring1} />
          <View style={styles.ring2} />
        </View>

        {/* ── Título ───────────────────────────────────────────────────────── */}
        <Text style={styles.titulo}>¡Reserva confirmada!</Text>
        <Text style={styles.subtitulo}>
          Tu lugar está asegurado. Te esperamos en el centro.
        </Text>

        {/* ── Card de resumen ───────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DETALLE DE LA RESERVA</Text>

          <View style={styles.disciplinaRow}>
            <Text style={styles.disciplinaEmoji}>{emoji}</Text>
            <Text style={styles.disciplinaText}>{disciplinaLabel}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar-outline" size={15} color={Colors.textMuted} />
            </View>
            <Text style={styles.infoLabel}>Fecha</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{fechaFormateada}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="time-outline" size={15} color={Colors.textMuted} />
            </View>
            <Text style={styles.infoLabel}>Horario</Text>
            <Text style={styles.infoValue}>{horaInicio} — {horaFin}</Text>
          </View>
        </View>

        {/* ── Card de pago / créditos (condicional por membresía) ───────────── */}
        <View style={styles.creditosCard}>
          <View style={styles.creditosRow}>
            <Ionicons
              name={esEventual ? 'card-outline' : 'flash'}
              size={18}
              color={Colors.accent}
            />
            {esEventual ? (
              <Text style={styles.creditosText}>
                Se acreditó una seña de{' '}
                <Text style={styles.creditosDestacado}>
                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(senaPagada)}
                </Text>.
                {' '}El saldo restante se abona al asistir.
              </Text>
            ) : (
              <Text style={styles.creditosText}>
                Se descontó <Text style={styles.creditosDestacado}>1 crédito</Text>.
                {' '}Te quedan{' '}
                <Text style={styles.creditosDestacado}>
                  {creditosRestantes} crédito{creditosRestantes !== 1 ? 's' : ''}
                </Text>.
              </Text>
            )}
          </View>
        </View>

        {/* ── CTAs ─────────────────────────────────────────────────────────── */}
        <View style={styles.ctas}>
          <TouchableOpacity
            style={styles.ctaPrimario}
            onPress={() => router.replace('/(socio)/reservas')}
            activeOpacity={0.85}
            accessibilityLabel="Ver mis reservas"
            accessibilityRole="button"
          >
            <Ionicons name="list-outline" size={18} color={Colors.textInverse} />
            <Text style={styles.ctaPrimarioText}>Ver mis reservas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ctaSecundario}
            onPress={() => router.replace('/(socio)/clases')}
            activeOpacity={0.8}
            accessibilityLabel="Volver a clases"
            accessibilityRole="button"
          >
            <Text style={styles.ctaSecundarioText}>Volver a clases</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    gap: Spacing.lg,
  },

  // Check circle
  checkWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  checkOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 2,
  },
  checkInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring1: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 2,
    borderColor: Colors.success + '40',
    zIndex: 1,
  },
  ring2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: Colors.success + '20',
    zIndex: 0,
  },

  // Texto
  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitulo: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: -Spacing.sm,
  },

  // Card resumen
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  disciplinaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  disciplinaEmoji: { fontSize: 28 },
  disciplinaText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    textTransform: 'capitalize',
    flexShrink: 1,
    textAlign: 'right',
  },

  // Card créditos
  creditosCard: {
    width: '100%',
    backgroundColor: Colors.accent + '12',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.accent + '30',
    padding: Spacing.md,
  },
  creditosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  creditosText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  creditosDestacado: {
    color: Colors.accent,
    fontWeight: '700',
  },

  // CTAs
  ctas: {
    width: '100%',
    gap: Spacing.sm,
  },
  ctaPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaPrimarioText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textInverse,
    fontSize: 16,
  },
  ctaSecundario: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  ctaSecundarioText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
