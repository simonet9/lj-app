import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@services/supabase';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius, DisciplinaLabel } from '@constants/theme';
import type { Clase, Disciplina } from '@app-types/index';

const FILTROS: { key: 'todas' | Disciplina; label: string; emoji: string; color: string }[] = [
  { key: 'todas',   label: 'Todas',    emoji: '🏅', color: Colors.textMuted },
  { key: 'futbol5', label: 'Fútbol 5', emoji: '⚽', color: Colors.futbol5 },
  { key: 'padel',   label: 'Pádel',   emoji: '🏓', color: Colors.padel   },
  { key: 'voley',   label: 'Vóley',   emoji: '🏐', color: Colors.voley   },
  { key: 'basquet', label: 'Básquet', emoji: '🏀', color: Colors.basquet },
];

const DISCIPLINA_COLORS: Record<string, string> = {
  futbol5: Colors.futbol5,
  padel:   Colors.padel,
  voley:   Colors.voley,
  basquet: Colors.basquet,
};

function getDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function ClasesScreen() {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();

  const [clases, setClases] = useState<Clase[]>([]);
  const [filtro, setFiltro] = useState<'todas' | Disciplina>('todas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClases = useCallback(async () => {
    let query = supabase
      .from('clases')
      .select('*, gestor:usuarios(nombre, apellido)')
      .neq('estado', 'suspendida')
      .gte('fecha', new Date().toISOString().split('T')[0])
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (filtro !== 'todas') {
      query = query.eq('disciplina', filtro);
    }

    const { data, error } = await query;
    if (!error && data) setClases(data as Clase[]);
    setLoading(false);
    setRefreshing(false);
  }, [filtro]);

  useEffect(() => { fetchClases(); }, [fetchClases]);

  function onRefresh() { setRefreshing(true); fetchClases(); }

  function renderClase({ item }: { item: Clase }) {
    const color = DISCIPLINA_COLORS[item.disciplina] ?? Colors.primary;
    const completa = item.estado === 'completa';
    const ocupacion = item.cupo_maximo > 0
      ? Math.round(((item.cupo_maximo - item.cupo_disponible) / item.cupo_maximo) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={[styles.card, completa && styles.cardCompleta]}
        onPress={() => router.push({ pathname: '/(socio)/clase/[id]' as any, params: { id: item.id } })}
        activeOpacity={0.75}
        disabled={completa}
      >
        {/* Acento lateral de disciplina */}
        <View style={[styles.cardAccent, { backgroundColor: color }]} />

        <View style={styles.cardBody}>
          {/* Fila superior: disciplina + badge estado */}
          <View style={styles.cardTop}>
            <View style={styles.discRow}>
              <Text style={styles.discEmoji}>
                {FILTROS.find(f => f.key === item.disciplina)?.emoji ?? '🏅'}
              </Text>
              <Text style={[styles.disciplinaText, { color }]}>
                {DisciplinaLabel[item.disciplina]}
              </Text>
            </View>
            <View style={[
              styles.estadoBadge,
              { backgroundColor: completa ? Colors.dangerLight : Colors.successLight },
            ]}>
              <View style={[styles.estadoDot, { backgroundColor: completa ? Colors.danger : Colors.success }]} />
              <Text style={[styles.estadoText, { color: completa ? Colors.danger : Colors.success }]}>
                {completa ? 'Completa' : `${item.cupo_disponible} lugares`}
              </Text>
            </View>
          </View>

          {/* Horario principal */}
          <Text style={styles.horario}>{item.hora_inicio} — {item.hora_fin}</Text>
          <Text style={styles.fecha}>{formatFecha(item.fecha)}</Text>

          {/* Barra de ocupación */}
          {!completa && item.cupo_maximo > 0 && (
            <View style={styles.ocupBar}>
              <View style={[styles.ocupFill, { width: `${ocupacion}%` as any, backgroundColor: color + 'CC' }]} />
            </View>
          )}

          {/* Footer: nivel + flecha */}
          <View style={styles.cardFooter}>
            <View style={styles.nivelBadge}>
              <Ionicons name="layers-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.nivelText}>
                {item.nivel.charAt(0).toUpperCase() + item.nivel.slice(1)}
              </Text>
            </View>
            {!completa && (
              <View style={styles.arrowCircle}>
                <Ionicons name="arrow-forward" size={13} color={Colors.accent} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerEyebrow}>{getDayGreeting()}, {usuario?.nombre ?? 'socio'} 👋</Text>
            <Text style={styles.title}>Clases disponibles</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="fitness-outline" size={22} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      </View>

      {/* Filtros */}
      <FlatList
        horizontal showsHorizontalScrollIndicator={false}
        data={FILTROS} keyExtractor={f => f.key}
        style={styles.filtrosBar}
        contentContainerStyle={styles.filtrosContent}
        renderItem={({ item }) => {
          const active = filtro === item.key;
          return (
            <TouchableOpacity
              style={[
                styles.filtroChip,
                active && { backgroundColor: item.color, borderColor: item.color },
              ]}
              onPress={() => setFiltro(item.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.filtroEmoji}>{item.emoji}</Text>
              <Text style={[styles.filtroText, active && styles.filtroTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={clases}
          keyExtractor={c => c.id}
          renderItem={renderClase}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyEmoji}>📅</Text>
              </View>
              <Text style={styles.emptyText}>Sin clases disponibles</Text>
              <Text style={styles.emptySubtext}>Probá con otro filtro o volvé más tarde</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerEyebrow: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    marginBottom: 2,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5 },
  headerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  filtrosBar: { flexShrink: 0, maxHeight: 56, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filtrosContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  filtroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  filtroEmoji: { fontSize: 13 },
  filtroText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '600' },
  filtroTextActive: { color: Colors.textInverse },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardCompleta: { opacity: 0.5 },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  discRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  discEmoji: { fontSize: 14 },
  disciplinaText: { ...Typography.label, fontWeight: '700' },
  estadoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  estadoDot: { width: 6, height: 6, borderRadius: 3 },
  estadoText: { ...Typography.caption, fontWeight: '600' },
  horario: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 2 },
  fecha: { ...Typography.bodySmall, color: Colors.textSecondary, textTransform: 'capitalize', marginBottom: Spacing.sm },
  ocupBar: { height: 4, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.sm },
  ocupFill: { height: '100%', borderRadius: Radius.full },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nivelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  nivelText: { ...Typography.caption, color: Colors.textMuted, fontWeight: '500' },
  arrowCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accent + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: { ...Typography.h3, color: Colors.textSecondary, marginBottom: Spacing.sm },
  emptySubtext: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
});
