import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@services/supabase';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius, DisciplinaLabel } from '@constants/theme';
import type { Clase } from '@app-types/index';

const DISCIPLINA_COLORS: Record<string, string> = {
  futbol5: Colors.futbol5, padel: Colors.padel, voley: Colors.voley, basquet: Colors.basquet,
};
const DISCIPLINA_EMOJI: Record<string, string> = {
  futbol5: '⚽', padel: '🏓', voley: '🏐', basquet: '🏀',
};

export default function AgendaScreen() {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();

  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAgenda = useCallback(async () => {
    if (!usuario?.id) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('clases')
      .select('*')
      .eq('gestor_id', usuario.id)
      .gte('fecha', new Date().toISOString().split('T')[0])
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (!error && data) setClases(data as Clase[]);
    setLoading(false);
    setRefreshing(false);
  }, [usuario?.id]);

  useEffect(() => { fetchAgenda(); }, [fetchAgenda]);

  function onRefresh() { setRefreshing(true); fetchAgenda(); }

  function renderClase({ item }: { item: Clase }) {
    const color = DISCIPLINA_COLORS[item.disciplina] ?? Colors.primary;
    const emoji = DISCIPLINA_EMOJI[item.disciplina] ?? '🏅';
    const ocupados = item.cupo_maximo - item.cupo_disponible;
    const pctOcup = item.cupo_maximo > 0 ? Math.round((ocupados / item.cupo_maximo) * 100) : 0;
    const completa = item.estado === 'completa';
    const suspendida = item.estado === 'suspendida';

    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: color }]} />
        <View style={styles.cardBody}>
          {/* Encabezado */}
          <View style={styles.cardTop}>
            <View style={styles.discRow}>
              <Text style={styles.emoji}>{emoji}</Text>
              <Text style={[styles.discLabel, { color }]}>
                {DisciplinaLabel[item.disciplina]}
              </Text>
            </View>
            <View style={[
              styles.estadoBadge,
              {
                backgroundColor: suspendida
                  ? Colors.border
                  : completa ? Colors.dangerLight : Colors.successLight,
              },
            ]}>
              <Text style={[
                styles.estadoText,
                {
                  color: suspendida
                    ? Colors.textMuted
                    : completa ? Colors.danger : Colors.success,
                },
              ]}>
                {suspendida ? 'Suspendida' : completa ? 'Completa' : 'Activa'}
              </Text>
            </View>
          </View>

          {/* Horario */}
          <Text style={styles.horario}>{item.hora_inicio} — {item.hora_fin}</Text>
          <Text style={styles.fecha}>{formatFecha(item.fecha)}</Text>

          {/* Inscriptos + barra */}
          <View style={styles.inscriptosRow}>
            <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.inscriptosText}>
              {ocupados} / {item.cupo_maximo} inscriptos
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[
              styles.barFill,
              { width: `${pctOcup}%` as any, backgroundColor: color },
            ]} />
          </View>

          {/* CTA ver asistentes */}
          <TouchableOpacity style={styles.asistentesBtn} activeOpacity={0.7}>
            <Text style={styles.asistentesBtnText}>Ver asistentes</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Inferimos la disciplina del gestor a partir de las clases cargadas
  const disciplinaLabel = useMemo(() => {
    if (clases.length === 0) return 'Gestor';
    const disc = clases[0]?.disciplina;
    return DisciplinaLabel[disc] ?? disc ?? 'Gestor';
  }, [clases]);

  const disciplinaEmojiInferred = useMemo(() => {
    if (clases.length === 0) return '🏅';
    return DISCIPLINA_EMOJI[clases[0]?.disciplina] ?? '🏅';
  }, [clases]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerEyebrow}>Hola, {usuario?.nombre} 👋</Text>
            <Text style={styles.title}>Tu agenda</Text>
          </View>
          <View style={styles.disciplinaPill}>
            <Text style={styles.disciplinaEmoji}>{disciplinaEmojiInferred}</Text>
            <Text style={styles.disciplinaLabel}>{disciplinaLabel}</Text>
          </View>
        </View>

        {/* Stats rápidas */}
        {!loading && (
          <View style={styles.quickStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{clases.length}</Text>
              <Text style={styles.statLabel}>próximas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {clases.filter(c => c.estado === 'disponible').length}
              </Text>
              <Text style={styles.statLabel}>disponibles</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {clases.reduce((sum, c) => sum + (c.cupo_maximo - c.cupo_disponible), 0)}
              </Text>
              <Text style={styles.statLabel}>inscriptos</Text>
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={clases}
          keyExtractor={c => c.id}
          renderItem={renderClase}
          contentContainerStyle={[styles.lista, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
          ListHeaderComponent={
            clases.length > 0
              ? <Text style={styles.listHeader}>Próximas clases</Text>
              : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyEmoji}>📅</Text>
              </View>
              <Text style={styles.emptyTitle}>Agenda vacía</Text>
              <Text style={styles.emptySubtitle}>
                Las clases que creés aparecerán aquí para gestionar asistencia.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function formatFecha(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.md,
  },
  headerEyebrow: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500', marginBottom: 2,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5 },
  disciplinaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
    borderRadius: Radius.full,
  },
  disciplinaEmoji: { fontSize: 14 },
  disciplinaLabel: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  quickStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.md, padding: Spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5 },
  statLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listHeader: {
    ...Typography.caption, color: Colors.textMuted,
    fontWeight: '700', letterSpacing: 1,
    marginBottom: Spacing.sm, textTransform: 'uppercase',
  },
  lista: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.md },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.sm,
  },
  discRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  emoji: { fontSize: 14 },
  discLabel: { ...Typography.label, fontWeight: '700' },
  estadoBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  estadoText: { ...Typography.caption, fontWeight: '700' },
  horario: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 2 },
  fecha: {
    ...Typography.bodySmall, color: Colors.textSecondary,
    textTransform: 'capitalize', marginBottom: Spacing.sm,
  },
  inscriptosRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginBottom: 6,
  },
  inscriptosText: { ...Typography.bodySmall, color: Colors.textSecondary },
  barTrack: {
    height: 6, backgroundColor: Colors.border,
    borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.md,
  },
  barFill: { height: '100%', borderRadius: Radius.full },
  asistentesBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
  },
  asistentesBtnText: { ...Typography.bodySmall, color: Colors.accent, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
