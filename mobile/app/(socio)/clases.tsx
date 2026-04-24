import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@services/supabase';
import { Colors, Typography, Spacing, Radius, DisciplinaLabel } from '@constants/theme';
import type { Clase, Disciplina } from '@app-types/index';

const FILTROS: { key: 'todas' | Disciplina; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'futbol5', label: 'Fútbol 5' },
  { key: 'padel', label: 'Pádel' },
  { key: 'voley', label: 'Vóley' },
  { key: 'basquet', label: 'Básquet' },
];

const DISCIPLINA_COLORS: Record<string, string> = {
  futbol5: Colors.futbol5,
  padel: Colors.padel,
  voley: Colors.voley,
  basquet: Colors.basquet,
};

export default function ClasesScreen() {
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

    return (
      <TouchableOpacity
        style={[styles.card, completa && styles.cardCompleta]}
        onPress={() => router.push({ pathname: '/(socio)/clase/[id]' as any, params: { id: item.id } })}
        activeOpacity={0.75}
        disabled={completa}
      >
        <View style={[styles.cardAccent, { backgroundColor: color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={[styles.disciplinaText, { color }]}>
              {DisciplinaLabel[item.disciplina]}
            </Text>
            <View style={[styles.estadoBadge, { backgroundColor: completa ? Colors.dangerLight : Colors.successLight }]}>
              <View style={[styles.estadoDot, { backgroundColor: completa ? Colors.danger : Colors.success }]} />
              <Text style={[styles.estadoText, { color: completa ? Colors.danger : Colors.success }]}>
                {completa ? 'Completa' : `${item.cupo_disponible} lugares`}
              </Text>
            </View>
          </View>
          <Text style={styles.horario}>{item.hora_inicio} — {item.hora_fin}</Text>
          <Text style={styles.fecha}>{formatFecha(item.fecha)}</Text>
          <View style={styles.cardFooter}>
            <View style={styles.nivelBadge}>
              <Text style={styles.nivelText}>{item.nivel.charAt(0).toUpperCase() + item.nivel.slice(1)}</Text>
            </View>
            {!completa && (
              <View style={styles.arrowCircle}>
                <Ionicons name="arrow-forward" size={14} color={Colors.accent} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Centro Deportivo</Text>
        <Text style={styles.title}>Clases disponibles</Text>
      </View>

      <FlatList
        horizontal showsHorizontalScrollIndicator={false}
        data={FILTROS} keyExtractor={f => f.key}
        style={styles.filtrosBar}
        contentContainerStyle={styles.filtrosContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filtroChip, filtro === item.key && styles.filtroChipActive]}
            onPress={() => setFiltro(item.key)} activeOpacity={0.7}
          >
            <Text style={[styles.filtroText, filtro === item.key && styles.filtroTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.accent} size="large" /></View>
      ) : (
        <FlatList
          data={clases} keyExtractor={c => c.id} renderItem={renderClase}
          contentContainerStyle={styles.lista} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={40} color={Colors.textMuted} />
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
    paddingTop: 60,
    paddingBottom: Spacing.xl,
  },
  headerEyebrow: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5 },
  filtrosBar: { flexShrink: 0, maxHeight: 52 },
  filtrosContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm, alignItems: 'center' },
  filtroChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  filtroChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtroText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '600' },
  filtroTextActive: { color: Colors.textInverse },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardCompleta: { opacity: 0.55 },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  disciplinaText: { ...Typography.label, fontWeight: '700' },
  estadoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  estadoDot: { width: 6, height: 6, borderRadius: 3 },
  estadoText: { ...Typography.caption, fontWeight: '600' },
  horario: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 2 },
  fecha: { ...Typography.bodySmall, color: Colors.textSecondary, textTransform: 'capitalize', marginBottom: Spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nivelBadge: { backgroundColor: Colors.background, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  nivelText: { ...Typography.caption, color: Colors.textMuted, fontWeight: '500' },
  arrowCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accent + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg,
  },
  emptyText: { ...Typography.h3, color: Colors.textSecondary, marginBottom: Spacing.sm },
  emptySubtext: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
});
