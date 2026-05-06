import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, NivelLabel, Radius, Spacing, Typography } from '@constants/theme';
import type { NivelClase } from '@app-types/index';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FiltroNivel = NivelClase | 'todos';

interface Props {
  value: FiltroNivel;
  onChange: (v: FiltroNivel) => void;
}

interface Opcion {
  key: FiltroNivel;
  label: string;
}

// ─── Opciones ─────────────────────────────────────────────────────────────────

const OPCIONES: Opcion[] = [
  { key: 'todos',        label: 'Todos' },
  { key: 'principiante', label: NivelLabel.principiante ?? 'Principiante' },
  { key: 'intermedio',   label: NivelLabel.intermedio   ?? 'Intermedio'   },
  { key: 'avanzado',     label: NivelLabel.avanzado     ?? 'Avanzado'     },
];

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Fila horizontal de pills para filtrar clases por nivel.
 * Solo debe mostrarse cuando hay una disciplina seleccionada (lógica del padre).
 */
export function NivelFiltro({ value, onChange }: Props) {
  const renderItem = useCallback(
    ({ item }: { item: Opcion }) => {
      const isActive = item.key === value;
      return (
        <TouchableOpacity
          style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
          onPress={() => onChange(item.key)}
          activeOpacity={0.7}
          accessibilityLabel={`Filtrar por nivel ${item.label}`}
          accessibilityState={{ selected: isActive }}
        >
          <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [value, onChange],
  );

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={OPCIONES}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  separator: {
    width: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  pillActive: {
    backgroundColor: Colors.primaryLight,
  },
  pillInactive: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillText: {
    ...Typography.label,
    fontWeight: '600',
  },
  pillTextActive: {
    color: Colors.textInverse,
  },
  pillTextInactive: {
    color: Colors.textSecondary,
  },
});
