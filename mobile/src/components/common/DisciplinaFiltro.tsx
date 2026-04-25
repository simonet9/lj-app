import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, DisciplinaLabel, Radius, Spacing, Typography } from '@constants/theme';
import type { Disciplina } from '@app-types/index';

// ─── types ───────────────────────────────────────────────────────────────────

type FiltroValue = Disciplina | 'todas';

interface Props {
  value: FiltroValue;
  onChange: (v: FiltroValue) => void;
}

interface Opcion {
  key: FiltroValue;
  label: string;
}

// ─── data ────────────────────────────────────────────────────────────────────

const OPCIONES: Opcion[] = [
  { key: 'todas',    label: 'Todas' },
  { key: 'futbol5',  label: DisciplinaLabel.futbol5  ?? 'Fútbol 5' },
  { key: 'padel',    label: DisciplinaLabel.padel    ?? 'Pádel' },
  { key: 'voley',    label: DisciplinaLabel.voley    ?? 'Vóley' },
  { key: 'basquet',  label: DisciplinaLabel.basquet  ?? 'Básquet' },
];

// ─── component ───────────────────────────────────────────────────────────────

export function DisciplinaFiltro({ value, onChange }: Props) {
  const renderItem = useCallback(
    ({ item }: { item: Opcion }) => {
      const isActive = item.key === value;
      return (
        <TouchableOpacity
          style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
          onPress={() => onChange(item.key)}
          activeOpacity={0.7}
          accessibilityLabel={`Filtrar por ${item.label}`}
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

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
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
    backgroundColor: Colors.primary,
  },
  pillInactive: {
    backgroundColor: Colors.surface,
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
