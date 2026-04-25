import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, DisciplinaLabel, NivelLabel, Radius, Spacing, Typography } from '@constants/theme';
import type { Clase, EstadoClase } from '@app-types/index';
import { StatusBadge } from './StatusBadge';

// ─── helpers ─────────────────────────────────────────────────────────────────

function disciplinaColor(disciplina: string): string {
  return (Colors as Record<string, string>)[disciplina] ?? Colors.primary;
}

function formatFecha(fecha: string): string {
  const date = new Date(fecha + 'T00:00:00');
  return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  clase: Clase;
  onPress: () => void;
}

export function ClassCard({ clase, onPress }: Props) {
  const isCompleta = clase.estado === 'completa';
  const disciplineColor = disciplinaColor(clase.disciplina);

  return (
    <TouchableOpacity
      style={[styles.container, isCompleta && styles.containerDisabled]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isCompleta}
      accessibilityLabel={`Clase de ${DisciplinaLabel[clase.disciplina]}, ${clase.hora_inicio} a ${clase.hora_fin}`}
    >
      {/* Barra lateral de color por disciplina */}
      <View style={[styles.disciplineBar, { backgroundColor: disciplineColor }]} />

      <View style={styles.content}>
        {/* Header: tag de disciplina + badge de estado */}
        <View style={styles.header}>
          <View style={[styles.disciplineTag, { backgroundColor: disciplineColor + '1A' }]}>
            <Text style={[styles.disciplineText, { color: disciplineColor }]}>
              {DisciplinaLabel[clase.disciplina] ?? clase.disciplina}
            </Text>
          </View>
          <StatusBadge estado={clase.estado as EstadoClase} />
        </View>

        {/* Body: horario */}
        <Text style={styles.horario}>
          {clase.hora_inicio} – {clase.hora_fin}
        </Text>

        {/* Fecha */}
        <Text style={styles.fecha}>{formatFecha(clase.fecha)}</Text>

        {/* Footer: nivel + cupo */}
        <View style={styles.footer}>
          <Text style={styles.nivel}>{NivelLabel[clase.nivel] ?? clase.nivel}</Text>
          <Text style={styles.cupo}>
            {clase.cupo_disponible}/{clase.cupo_maximo} lugares
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  containerDisabled: {
    opacity: 0.6,
  },
  disciplineBar: {
    width: 4,
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  disciplineTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  disciplineText: {
    ...Typography.label,
    fontWeight: '600',
  },
  horario: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  fecha: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  nivel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  cupo: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
