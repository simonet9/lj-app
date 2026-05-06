import { useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@context/AuthContext';
import { Colors, DisciplinaLabel, NivelLabel, Typography, Spacing } from '@constants/theme';
import {
  ClassCard, EmptyState, DisciplinaFiltro, NivelFiltro,
} from '@components/common';
import { useClases } from '@hooks/useClases';
import type { Disciplina, NivelClase } from '@app-types/index';

// ─── Helper de saludo ─────────────────────────────────────────────────────────

function getDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// ─── Helper: mensaje de empty state contextual ────────────────────────────────

function emptyStateMessage(
  filtro: 'todas' | Disciplina,
  nivel: 'todos' | NivelClase,
): { title: string; subtitle: string } {
  if (filtro === 'todas') {
    return {
      title: 'No hay clases disponibles',
      subtitle: 'No hay clases programadas por el momento. Volvé más tarde.',
    };
  }
  const disciplinaLabel = DisciplinaLabel[filtro] ?? filtro;
  if (nivel === 'todos') {
    return {
      title: `No hay clases de ${disciplinaLabel}`,
      subtitle: 'No hay clases de esta disciplina para la fecha seleccionada.',
    };
  }
  const nivelLabel = NivelLabel[nivel] ?? nivel;
  return {
    title: `No hay clases de ${disciplinaLabel} nivel ${nivelLabel}`,
    subtitle: 'Probá cambiando el nivel o la disciplina.',
  };
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function ClasesScreen() {
  const { usuario } = useAuth();
  const insets      = useSafeAreaInsets();

  // ── Estados de filtro ──────────────────────────────────────────────────────
  const [filtro, setFiltro] = useState<'todas' | Disciplina>('todas');
  const [nivel, setNivel]   = useState<'todos' | NivelClase>('todos');

  // ── Datos (una sola llamada a la red, sin dependencia de filtros) ──────────
  const { clases, loading, refreshing, error, refresh } = useClases();

  // ── Filtrado en cliente — O(n) derivado, sin efectos secundarios ───────────
  const clasesFiltradas = useMemo(() => {
    return clases.filter(c => {
      const matchDisciplina = filtro === 'todas' || c.disciplina === filtro;
      const matchNivel      = nivel  === 'todos'  || c.nivel      === nivel;
      return matchDisciplina && matchNivel;
    });
  }, [clases, filtro, nivel]);

  const { title: emptyTitle, subtitle: emptySubtitle } =
    emptyStateMessage(filtro, nivel);

  return (
    <View style={styles.container}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerEyebrow}>
              {getDayGreeting()}, {usuario?.nombre ?? 'socio'} 👋
            </Text>
            <Text style={styles.title}>Clases disponibles</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="fitness-outline" size={22} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      </View>

      {/* ── Filtro de disciplina (siempre visible) ──────────────────────────── */}
      <DisciplinaFiltro
        value={filtro}
        onChange={v => {
          setFiltro(v);
          // Cuando se vuelve a "todas" reseteamos el nivel porque no tiene
          // sentido mantener un nivel seleccionado sin disciplina activa
          if (v === 'todas') setNivel('todos');
        }}
      />

      {/* ── Filtro de nivel (solo cuando hay disciplina seleccionada) ───────── */}
      {filtro !== 'todas' && (
        <NivelFiltro value={nivel} onChange={setNivel} />
      )}

      {/* ── Contenido ──────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <EmptyState
            icon="⚠️"
            title="No se pudieron cargar las clases"
            subtitle={error}
          />
        </View>
      ) : (
        <FlatList
          data={clasesFiltradas}
          keyExtractor={c => c.id}
          renderItem={({ item }) => (
            <ClassCard
              clase={item}
              onPress={() =>
                router.push({
                  pathname: '/(socio)/clase/[id]' as any,
                  params: { id: item.id },
                })
              }
            />
          )}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="📅"
              title={emptyTitle}
              subtitle={emptySubtitle}
            />
          }
        />
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerEyebrow: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textInverse,
    letterSpacing: -0.5,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  lista: {
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
