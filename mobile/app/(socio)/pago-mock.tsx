import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, DisciplinaLabel } from '@constants/theme';
import { reservarClaseEventual } from '@services/reservas';
import type { Disciplina } from '@app-types/index';

// ─── Tipos de parámetros ──────────────────────────────────────────────────────

type PagoMockParams = {
  claseId?:     string;
  socioId?:     string;
  disciplina?:  string;
  fecha?:       string;
  horaInicio?:  string;
  horaFin?:     string;
  monto?:       string;  // seña en pesos (ya calculada = 50% del valor)
  descripcion?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatPesos(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

const DISCIPLINA_EMOJI: Record<string, string> = {
  futbol5: '⚽', padel: '🏓', voley: '🏐', basquet: '🏀',
};

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function PagoMockScreen() {
  const params  = useLocalSearchParams() as unknown as PagoMockParams;
  const insets  = useSafeAreaInsets();
  const [procesando, setProcesando] = useState(false);
  const [intentoFallido, setIntentoFallido] = useState(false);

  const claseId    = params.claseId    ?? '';
  const socioId    = params.socioId    ?? '';
  const disciplina = params.disciplina ?? '';
  const fecha      = params.fecha      ?? '';
  const horaInicio = params.horaInicio ?? '';
  const horaFin    = params.horaFin    ?? '';
  const monto      = parseInt(params.monto ?? '0', 10);
  const descripcion = params.descripcion ?? `Reserva de clase de ${DisciplinaLabel[disciplina] ?? disciplina}`;

  const disciplinaLabel = DisciplinaLabel[disciplina] ?? disciplina;
  const emoji           = DISCIPLINA_EMOJI[disciplina] ?? '🏅';
  const montoFormateado = formatPesos(monto);
  const valorTotal      = formatPesos(monto * 2);

  async function handlePagar() {
    if (!claseId || !socioId) return;
    setProcesando(true);
    setIntentoFallido(false);

    // Simular delay de procesamiento del gateway
    await new Promise(r => setTimeout(r, 1500));

    // 80% de éxito / 20% de fallo (mock de Mercado Pago)
    const exitoso = Math.random() < 0.8;

    if (!exitoso) {
      setProcesando(false);
      setIntentoFallido(true);
      return;
    }

    // ── Pago aprobado: registrar la reserva en BD ─────────────────────────
    try {
      await reservarClaseEventual(socioId, claseId, monto, fecha, horaInicio);

      // Navegar a confirmación (sin creditosRestantes → eventual no usa créditos)
      router.replace({
        pathname: '/(socio)/reserva-confirmada' as any,
        params: {
          disciplina,
          fecha,
          horaInicio,
          horaFin,
          senaPagada: String(monto),
          creditosRestantes: '0',
        },
      });
    } catch (err: any) {
      // Conflicto de horario u otro error de negocio detectado luego del pago
      // (raro, pero posible si el estado cambió mientras el usuario estaba en esta pantalla)
      setProcesando(false);
      setIntentoFallido(true);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmar pago</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ── Badge de entorno mock ─────────────────────────────────────────── */}
        <View style={styles.mockBadge}>
          <Ionicons name="flask-outline" size={13} color={Colors.warning} />
          <Text style={styles.mockBadgeText}>Entorno de prueba · MVP</Text>
        </View>

        {/* ── Resumen de la clase ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DETALLE DE LA RESERVA</Text>
          <View style={styles.disciplinaRow}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={styles.disciplinaText}>{disciplinaLabel}</Text>
          </View>
          <View style={styles.divider} />
          <InfoRow label="Fecha"   value={formatFecha(fecha)}          capitalize />
          <InfoRow label="Horario" value={`${horaInicio} — ${horaFin}`} />
          <View style={styles.divider} />
          <View style={styles.montoRow}>
            <Text style={styles.montoLabel}>Valor total de la clase</Text>
            <Text style={styles.montoValorTotal}>{valorTotal}</Text>
          </View>
          <View style={styles.montoRow}>
            <Text style={[styles.montoLabel, { color: Colors.accent, fontWeight: '700' }]}>
              Seña a pagar (50%)
            </Text>
            <Text style={styles.montoSena}>{montoFormateado}</Text>
          </View>
        </View>

        {/* ── Tarjeta de pago decorativa ────────────────────────────────────── */}
        <View style={styles.cardPago}>
          {/* Chip */}
          <View style={styles.chip}>
            <View style={styles.chipInner} />
          </View>

          <Text style={styles.cardNumero}>•••• •••• •••• 4242</Text>
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardFooterLabel}>TITULAR</Text>
              <Text style={styles.cardFooterValue}>SOCIO L&J</Text>
            </View>
            <View>
              <Text style={styles.cardFooterLabel}>VENCE</Text>
              <Text style={styles.cardFooterValue}>12/28</Text>
            </View>
          </View>

          {/* Logotipo decorativo */}
          <View style={styles.cardLogo}>
            <View style={styles.logoCircle1} />
            <View style={styles.logoCircle2} />
          </View>
        </View>

        {/* ── Descripción del cobro ─────────────────────────────────────────── */}
        <View style={styles.descripcionCard}>
          <Ionicons name="receipt-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.descripcionText}>{descripcion}</Text>
        </View>

        {/* ── Error de pago fallido ─────────────────────────────────────────── */}
        {intentoFallido && (
          <View style={styles.errorCard}>
            <Ionicons name="close-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>
              El pago no pudo ser procesado. Por favor, intentá de nuevo.
            </Text>
          </View>
        )}

        {/* ── Botón de pago ─────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.ctaButton, procesando && styles.ctaButtonLoading]}
          onPress={handlePagar}
          activeOpacity={0.85}
          disabled={procesando}
          accessibilityLabel="Confirmar pago"
          accessibilityRole="button"
        >
          {procesando ? (
            <>
              <ActivityIndicator color={Colors.textInverse} />
              <Text style={styles.ctaText}>Procesando pago…</Text>
            </>
          ) : (
            <>
              <Ionicons name="lock-closed" size={18} color={Colors.textInverse} />
              <Text style={styles.ctaText}>Pagar {montoFormateado}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.legalText}>
          Simulación de pago para el MVP. No se realizan transacciones reales.
        </Text>

      </ScrollView>
    </View>
  );
}

// ─── Sub-componente ───────────────────────────────────────────────────────────

function InfoRow({ label, value, capitalize }: {
  label: string; value: string; capitalize?: boolean;
}) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, capitalize && { textTransform: 'capitalize' }]}>
        {value}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: Spacing.sm, alignItems: 'center' },
  label: { ...Typography.body, color: Colors.textSecondary, flex: 1 },
  value: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500', textAlign: 'right', flexShrink: 1 },
});

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.md, gap: Spacing.md },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary, fontWeight: '700' },

  // Mock badge
  mockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center',
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.warning + '50',
  },
  mockBadgeText: { ...Typography.caption, color: Colors.warning, fontWeight: '600' },

  // Card resumen de clase
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
    gap: 2,
  },
  cardLabel: {
    ...Typography.caption, color: Colors.textMuted,
    fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm,
  },
  disciplinaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  emoji: { fontSize: 24 },
  disciplinaText: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  montoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 2,
  },
  montoLabel: { ...Typography.body, color: Colors.textSecondary },
  montoValorTotal: { ...Typography.body, color: Colors.textMuted, textDecorationLine: 'line-through' },
  montoSena: { fontSize: 20, fontWeight: '800', color: Colors.accent },

  // Tarjeta de pago decorativa
  cardPago: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl ?? 20,
    padding: Spacing.lg,
    height: 180,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  chip: {
    width: 36, height: 28, borderRadius: 6,
    backgroundColor: '#E8C96B',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  chipInner: {
    width: 24, height: 18, borderRadius: 3,
    borderWidth: 1.5, borderColor: '#C4A854',
  },
  cardNumero: {
    ...Typography.h3,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  cardFooter: { flexDirection: 'row', gap: Spacing.xl },
  cardFooterLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
  cardFooterValue: { ...Typography.body, color: Colors.textInverse, fontWeight: '700' },
  cardLogo: {
    position: 'absolute', right: Spacing.lg, bottom: Spacing.lg,
    flexDirection: 'row',
  },
  logoCircle1: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,80,80,0.7)',
  },
  logoCircle2: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,160,0,0.7)',
    marginLeft: -14,
  },

  // Descripción del cobro
  descripcionCard: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.sm,
  },
  descripcionText: { ...Typography.bodySmall, color: Colors.textMuted, flex: 1 },

  // Error
  errorCard: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.danger + '12',
    borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.danger + '40',
    padding: Spacing.md,
  },
  errorText: { ...Typography.body, color: Colors.danger, flex: 1, lineHeight: 22 },

  // CTA
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  ctaButtonLoading: { opacity: 0.75, shadowOpacity: 0 },
  ctaText: { ...Typography.body, fontWeight: '700', color: Colors.textInverse, fontSize: 16 },

  legalText: {
    ...Typography.caption, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 16,
    paddingHorizontal: Spacing.md,
  },
});
