import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius, DisciplinaLabel, NivelLabel } from '@constants/theme';
import { EmptyState } from '@components/common';
import { obtenerPacksDisponibles } from '@services/packs';
import type { Pack } from '@app-types/index';

// ─── Constantes ───────────────────────────────────────────────────────────────

const DISCIPLINA_COLORS: Record<string, string> = {
  futbol5: Colors.futbol5, padel: Colors.padel, voley: Colors.voley, basquet: Colors.basquet,
};

const DISCIPLINA_EMOJI: Record<string, string> = {
  futbol5: '⚽', padel: '🏓', voley: '🏐', basquet: '🏀',
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatFechaCorta(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── Sub-componente: PackCard ─────────────────────────────────────────────────

function PackCard({ pack, onComprar }: { pack: Pack; onComprar: (p: Pack) => void }) {
  const color = DISCIPLINA_COLORS[pack.disciplina] ?? Colors.primary;
  const emoji = DISCIPLINA_EMOJI[pack.disciplina] ?? '🏅';

  return (
    <View style={styles.card}>
      {/* Barra lateral de color */}
      <View style={[styles.cardBar, { backgroundColor: color }]} />

      <View style={styles.cardBody}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardEmoji}>{emoji}</Text>
            <View>
              <Text style={styles.cardDisciplina}>{DisciplinaLabel[pack.disciplina] ?? pack.disciplina}</Text>
              <Text style={styles.cardNivel}>{NivelLabel[pack.nivel] ?? pack.nivel}</Text>
            </View>
          </View>
          <View style={styles.precioBadge}>
            <Text style={styles.precioText}>${pack.precio.toLocaleString('es-AR')}</Text>
          </View>
        </View>

        {/* Horario */}
        <View style={styles.horarioRow}>
          <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.horarioText}>
            {pack.hora_inicio} — {pack.hora_fin} · {pack.dia_semana}
          </Text>
        </View>

        {/* 4 fechas */}
        <View style={styles.fechasGrid}>
          {pack.fechas.map((f) => (
            <View key={f.clase_id} style={styles.fechaChip}>
              <Text style={styles.fechaSemana}>Sem {f.semana}</Text>
              <Text style={styles.fechaDate}>{formatFechaCorta(f.fecha)}</Text>
            </View>
          ))}
        </View>

        {/* Cupo mínimo */}
        <View style={styles.cupoRow}>
          <Ionicons name="people-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.cupoText}>{pack.cupo_minimo} lugar{pack.cupo_minimo !== 1 ? 'es' : ''} disponible{pack.cupo_minimo !== 1 ? 's' : ''}</Text>
        </View>

        {/* CTA */}
        {pack.ya_comprado ? (
          <View style={[styles.ctaButton, { backgroundColor: Colors.border }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.textSecondary} />
            <Text style={[styles.ctaText, { color: Colors.textSecondary }]}>Ya compraste este pack</Text>
          </View>
        ) : pack.solapa_horarios ? (
          <View style={[styles.ctaButton, { backgroundColor: Colors.border }]}>
            <Ionicons name="warning-outline" size={18} color={Colors.textSecondary} />
            <Text style={[styles.ctaText, { color: Colors.textSecondary }]}>Solapa con tu reserva</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: color }]}
            onPress={() => onComprar(pack)}
            activeOpacity={0.85}
            accessibilityLabel={`Comprar pack de ${DisciplinaLabel[pack.disciplina]}`}
            accessibilityRole="button"
          >
            <Ionicons name="bag-check-outline" size={18} color={Colors.textInverse} />
            <Text style={styles.ctaText}>Comprar pack — 4 clases</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function PacksScreen() {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();

  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    if (!usuario) return;
    const data = await obtenerPacksDisponibles(usuario.id);
    setPacks(data);
    setLoading(false);
    setRefreshing(false);
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      cargar();
    }, [cargar])
  );

  function handleRefresh() {
    setRefreshing(true);
    cargar();
  }

  function handleComprar(pack: Pack) {
    router.push({
      pathname: '/(socio)/pago-packs' as any,
      params: {
        packId:      pack.pack_id,
        disciplina:  pack.disciplina,
        nivel:       pack.nivel,
        diaSeamana:  pack.dia_semana,
        horaInicio:  pack.hora_inicio,
        horaFin:     pack.hora_fin,
        precio:      String(pack.precio),
        fechas:      JSON.stringify(pack.fechas),
      },
    });
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerEyebrow}>4 CLASES · 4 SEMANAS</Text>
        <Text style={styles.title}>Packs disponibles</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={packs}
          keyExtractor={(p) => p.pack_id}
          renderItem={({ item }) => <PackCard pack={item} onComprar={handleComprar} />}
          contentContainerStyle={[styles.lista, { paddingBottom: insets.bottom + Spacing.xxl }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
          ListHeaderComponent={
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
              <Text style={styles.infoText}>
                Los packs que solapan con tus reservas o que ya compraste aparecerán deshabilitados.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <EmptyState
                icon="📦"
                title="No hay packs disponibles"
                subtitle="Por ahora no hay packs que se ajusten a tus horarios libres. Revisá más tarde."
              />
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

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
  lista: { padding: Spacing.md, gap: Spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  infoBox: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.infoLight ?? '#EBF8FF',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoText: { ...Typography.caption, color: Colors.info, flex: 1, lineHeight: 18 },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  cardBar: { width: 5 },
  cardBody: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardEmoji: { fontSize: 24 },
  cardDisciplina: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardNivel: { ...Typography.caption, color: Colors.textSecondary },
  precioBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  precioText: { ...Typography.caption, color: Colors.textInverse, fontWeight: '800' },

  // Horario
  horarioRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  horarioText: { ...Typography.bodySmall, color: Colors.textSecondary, textTransform: 'capitalize' },

  // Fechas
  fechasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  fechaChip: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    alignItems: 'center', minWidth: 72,
  },
  fechaSemana: { ...Typography.caption, color: Colors.textMuted, fontWeight: '700', fontSize: 9, letterSpacing: 0.5 },
  fechaDate: { ...Typography.caption, color: Colors.textPrimary, fontWeight: '600', textTransform: 'capitalize' },

  // Cupo
  cupoRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cupoText: { ...Typography.caption, color: Colors.textMuted },

  // CTA
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    paddingVertical: 13,
    marginTop: Spacing.xs,
  },
  ctaText: { ...Typography.body, fontWeight: '700', color: Colors.textInverse },
});
