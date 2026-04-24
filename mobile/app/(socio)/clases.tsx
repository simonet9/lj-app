import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
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

  function onRefresh() {
    setRefreshing(true);
    fetchClases();
  }

  function renderClase({ item }: { item: Clase }) {
    const color = DISCIPLINA_COLORS[item.disciplina] ?? Colors.primary;
    const completa = item.estado === 'completa';

    return (
      <TouchableOpacity
        style={[styles.card, completa && styles.cardCompleta]}
        onPress={() => router.push({ pathname: '/(socio)/clase/[id]' as any, params: { id: item.id } })}
        activeOpacity={0.7}
        disabled={completa}
      >
        <View style={[styles.cardAccent, { backgroundColor: color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.disciplinaTag, { color }]}>
              {DisciplinaLabel[item.disciplina]}
            </Text>
            <View style={[styles.estadoBadge, { backgroundColor: completa ? Colors.dangerLight : Colors.successLight }]}>
              <Text style={[styles.estadoText, { color: completa ? Colors.danger : Colors.success }]}>
                {completa ? 'Completa' : `${item.cupo_disponible} lugares`}
              </Text>
            </View>
          </View>
          <Text style={styles.horario}>
            {item.hora_inicio} — {item.hora_fin}
          </Text>
          <Text style={styles.fecha}>{formatFecha(item.fecha)}</Text>
          <Text style={styles.nivel}>{item.nivel.charAt(0).toUpperCase() + item.nivel.slice(1)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clases disponibles</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTROS}
          keyExtractor={f => f.key}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: Spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filtroBtn, filtro === item.key && styles.filtroBtnActive]}
              onPress={() => setFiltro(item.key)}
            >
              <Text style={[styles.filtroText, filtro === item.key && styles.filtroTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={clases}
          keyExtractor={c => c.id}
          renderItem={renderClase}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay clases disponibles</Text>
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
  header: { paddingHorizontal: Spacing.md, paddingTop: 60, paddingBottom: Spacing.sm },
  title: { ...Typography.h1, color: Colors.textPrimary },
  filtrosContainer: { paddingVertical: Spacing.sm },
  filtroBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  filtroBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtroText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500' },
  filtroTextActive: { color: Colors.textInverse },
  lista: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', overflow: 'hidden',
  },
  cardCompleta: { opacity: 0.6 },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  disciplinaTag: { ...Typography.label, fontWeight: '700' },
  estadoBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  estadoText: { ...Typography.caption, fontWeight: '600' },
  horario: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 2 },
  fecha: { ...Typography.bodySmall, color: Colors.textSecondary, textTransform: 'capitalize' },
  nivel: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { ...Typography.h3, color: Colors.textSecondary },
  emptySubtext: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.sm },
});
