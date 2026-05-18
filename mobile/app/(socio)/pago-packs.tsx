import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius, DisciplinaLabel, NivelLabel } from '@constants/theme';
import { comprarPackAtomico } from '@services/packs';
import type { PackFecha, Disciplina, NivelClase } from '@app-types/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const DISCIPLINA_EMOJI: Record<string, string> = {
  futbol5: '⚽', padel: '🏓', voley: '🏐', basquet: '🏀',
};

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function PagoPacks() {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    packId:     string;
    disciplina: string;
    nivel:      string;
    diaSeamana: string;
    horaInicio: string;
    horaFin:    string;
    precio:     string;
    fechas:     string;
  }>();

  const [procesando, setProcesando] = useState(false);
  const [paso, setPaso] = useState<'detalle' | 'pago' | 'confirmado'>('detalle');

  // Reiniciar estado si la pantalla estaba cacheada por Expo Router
  useFocusEffect(
    useCallback(() => {
      setPaso('detalle');
      setProcesando(false);
    }, [])
  );

  // Parsear fechas del JSON
  const fechas: PackFecha[] = useMemo(() => {
    try { return JSON.parse(params.fechas ?? '[]'); }
    catch { return []; }
  }, [params.fechas]);

  const precio = Number(params.precio ?? 0);
  const disciplina = params.disciplina as Disciplina;
  const nivel = params.nivel as NivelClase;
  const emoji = DISCIPLINA_EMOJI[disciplina] ?? '🏅';

  // ── Paso 1 → Paso 2: ir a pantalla de pago mock ─────────────────────────
  function handleIrAPago() {
    setPaso('pago');
  }

  // ── Paso 2 → confirmar pago y ejecutar compra atómica ─────────────────
  async function handleConfirmarPago() {
    if (!usuario || !params.packId) return;
    setProcesando(true);
    try {
      const resultado = await comprarPackAtomico(usuario.id, params.packId, precio);
      setPaso('confirmado');
    } catch (err: any) {
      Alert.alert(
        'No se pudo completar la compra',
        err.mensaje ?? 'Hubo un problema al procesar el pago. Intentá de nuevo.',
        [{ text: 'Entendido' }],
      );
    } finally {
      setProcesando(false);
    }
  }

  // ── Estado confirmado ─────────────────────────────────────────────────
  if (paso === 'confirmado') {
    return (
      <View style={[styles.root, styles.centered]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
        </View>
        <Text style={styles.successTitle}>¡Pack comprado!</Text>
        <Text style={styles.successSubtitle}>
          Quedaste inscripto en las 4 clases de{' '}
          {DisciplinaLabel[disciplina] ?? disciplina}. Podés verlas en Mis reservas.
        </Text>
        <TouchableOpacity
          style={styles.ctaPrimary}
          onPress={() => router.replace('/(socio)/reservas' as any)}
          activeOpacity={0.85}
          accessibilityLabel="Ver mis reservas"
          accessibilityRole="button"
        >
          <Ionicons name="bookmark-outline" size={18} color={Colors.textInverse} />
          <Text style={styles.ctaText}>Ver mis reservas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ctaSecondary}
          onPress={() => router.replace('/(socio)/packs' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaSecondaryText}>Explorar más packs</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Estado: simulador de pago (paso 2) ────────────────────────────────
  if (paso === 'pago') {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setPaso('detalle')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={[styles.pagoContent, { paddingBottom: insets.bottom + 24 }]}>
          {/* Simulador Mercado Pago */}
          <View style={styles.mpHeader}>
            <Ionicons name="card" size={32} color='#009EE3' />
            <Text style={styles.mpTitle}>Mercado Pago</Text>
            <Text style={styles.mpSubtitle}>Pago seguro simulado (MVP)</Text>
          </View>

          <View style={styles.mpResumen}>
            <Text style={styles.mpResumenLabel}>Total a pagar</Text>
            <Text style={styles.mpMonto}>${precio.toLocaleString('es-AR')}</Text>
            <Text style={styles.mpDescripcion}>
              Pack {DisciplinaLabel[disciplina] ?? disciplina} · 4 clases
            </Text>
          </View>

          <View style={styles.mpForm}>
            {/* Campos mock de tarjeta */}
            <View style={styles.mpField}>
              <Text style={styles.mpFieldLabel}>Número de tarjeta</Text>
              <View style={styles.mpFieldInput}>
                <Text style={styles.mpFieldValue}>4242 4242 4242 4242</Text>
                <Ionicons name="card-outline" size={18} color={Colors.textMuted} />
              </View>
            </View>
            <View style={styles.mpRow}>
              <View style={[styles.mpField, { flex: 1 }]}>
                <Text style={styles.mpFieldLabel}>Vencimiento</Text>
                <View style={styles.mpFieldInput}>
                  <Text style={styles.mpFieldValue}>12/28</Text>
                </View>
              </View>
              <View style={[styles.mpField, { flex: 1 }]}>
                <Text style={styles.mpFieldLabel}>CVV</Text>
                <View style={styles.mpFieldInput}>
                  <Text style={styles.mpFieldValue}>123</Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.ctaPrimary, { marginTop: Spacing.lg }, procesando && { opacity: 0.6 }]}
            onPress={handleConfirmarPago}
            disabled={procesando}
            activeOpacity={0.85}
            accessibilityLabel="Confirmar pago"
            accessibilityRole="button"
          >
            {procesando ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textInverse} />
                <Text style={styles.ctaText}>Pagar ${precio.toLocaleString('es-AR')}</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.mpAviso}>
            🔒 Pago simulado — ningún dato real es procesado en este MVP.
          </Text>
        </ScrollView>
      </View>
    );
  }

  // ── Estado: detalle del pack (paso 1) ─────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={Colors.textInverse} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{emoji}</Text>
          <Text style={styles.heroDisciplina}>{DisciplinaLabel[disciplina] ?? disciplina}</Text>
          <Text style={styles.heroNivel}>{NivelLabel[nivel] ?? nivel}</Text>
          <Text style={styles.heroHorario}>
            {params.horaInicio} — {params.horaFin}
          </Text>
        </View>

        {/* Qué incluye */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>QUÉ INCLUYE</Text>
          {fechas.map((f) => (
            <View key={f.clase_id} style={styles.fechaRow}>
              <View style={styles.semanaBadge}>
                <Text style={styles.semanaNum}>{f.semana}</Text>
              </View>
              <View>
                <Text style={styles.fechaTexto} numberOfLines={1}>{formatFecha(f.fecha)}</Text>
                <Text style={styles.fechaHorario}>{params.horaInicio} — {params.horaFin}</Text>
              </View>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={Colors.success}
                style={{ marginLeft: 'auto' }}
              />
            </View>
          ))}
        </View>

        {/* Beneficios */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>BENEFICIOS</Text>
          {[
            'Cupo garantizado en las 4 clases',
            'Inscripción inmediata al confirmar el pago',
            'Cancelación individual disponible',
            'Precio pack con descuento incluido',
          ].map((b) => (
            <View key={b} style={styles.beneficioRow}>
              <Ionicons name="star-outline" size={14} color={Colors.accent} />
              <Text style={styles.beneficioText}>{b}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <View style={styles.footerPrecio}>
          <Text style={styles.footerLabel}>Total del pack</Text>
          <Text style={styles.footerMonto}>${precio.toLocaleString('es-AR')}</Text>
        </View>
        <TouchableOpacity
          style={styles.ctaPrimary}
          onPress={handleIrAPago}
          activeOpacity={0.85}
          accessibilityLabel="Proceder al pago"
          accessibilityRole="button"
        >
          <Ionicons name="bag-check-outline" size={18} color={Colors.textInverse} />
          <Text style={styles.ctaText}>Comprar pack</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: Spacing.md },
  backBtn: {
    position: 'absolute', top: 16, left: Spacing.md, zIndex: 10,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.07)',
    justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { gap: Spacing.md },

  // Hero
  hero: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    gap: 4,
  },
  heroEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  heroDisciplina: { fontSize: 28, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5 },
  heroNivel: { ...Typography.body, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' },
  heroHorario: { ...Typography.h3, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  // Cards
  card: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardLabel: {
    ...Typography.caption, color: Colors.textMuted,
    fontWeight: '700', letterSpacing: 1,
  },

  // Fechas
  fechaRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  semanaBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  semanaNum: { fontSize: 12, fontWeight: '800', color: Colors.textInverse },
  fechaTexto: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600', textTransform: 'capitalize' },
  fechaHorario: { ...Typography.caption, color: Colors.textSecondary },

  // Beneficios
  beneficioRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  beneficioText: { ...Typography.body, color: Colors.textSecondary, flex: 1 },

  // Footer sticky
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
  },
  footerPrecio: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { ...Typography.body, color: Colors.textSecondary },
  footerMonto: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },

  // CTAs
  ctaPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  ctaText: { ...Typography.body, fontWeight: '700', color: Colors.textInverse, fontSize: 16 },
  ctaSecondary: { paddingVertical: Spacing.sm, alignItems: 'center' },
  ctaSecondaryText: { ...Typography.body, color: Colors.textSecondary },

  // Success
  successIcon: { marginBottom: Spacing.md },
  successTitle: { ...Typography.h1, color: Colors.textPrimary, textAlign: 'center' },
  successSubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Mercado Pago mock
  pagoContent: { padding: Spacing.lg, gap: Spacing.md },
  mpHeader: {
    alignItems: 'center', gap: Spacing.sm,
    paddingTop: Spacing.xxl,
  },
  mpTitle: { fontSize: 22, fontWeight: '800', color: '#009EE3' },
  mpSubtitle: { ...Typography.caption, color: Colors.textMuted },
  mpResumen: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center', gap: 4,
  },
  mpResumenLabel: { ...Typography.caption, color: Colors.textMuted },
  mpMonto: { fontSize: 36, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 },
  mpDescripcion: { ...Typography.body, color: Colors.textSecondary },
  mpForm: { gap: Spacing.md },
  mpRow: { flexDirection: 'row', gap: Spacing.sm },
  mpField: { gap: 4 },
  mpFieldLabel: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  mpFieldInput: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  mpFieldValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  mpAviso: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
