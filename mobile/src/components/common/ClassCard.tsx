import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, DisciplinaLabel, NivelLabel, Radius, Spacing, Typography } from '@constants/theme';
import type { Clase } from '@app-types/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function disciplinaColor(disciplina: string): string {
  return (Colors as Record<string, string>)[disciplina] ?? Colors.primary;
}

function formatFecha(fecha: string): string {
  // Forzar interpretación local para evitar desfase de zona horaria
  const date = new Date(fecha + 'T00:00:00');
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  clase: Clase;
  onPress: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ClassCard({ clase, onPress }: Props) {
  const isCompleta      = clase.estado === 'completa' || clase.cupo_disponible === 0;
  const disciplineColor = disciplinaColor(clase.disciplina);

  return (
    <TouchableOpacity
      style={[styles.container, isCompleta && styles.containerDisabled]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={isCompleta}
      accessibilityLabel={`Clase de ${DisciplinaLabel[clase.disciplina] ?? clase.disciplina}, ${clase.hora_inicio} a ${clase.hora_fin}`}
      accessibilityRole="button"
    >
      {/* ── Barra lateral de color por disciplina (4 px) ───────────────────── */}
      <View style={[styles.disciplineBar, { backgroundColor: disciplineColor }]} />

      <View style={styles.content}>
        {/* ── Header: tag disciplina + badge de cupo ─────────────────────────── */}
        <View style={styles.header}>
          {/* Tag de disciplina */}
          <View style={[styles.disciplineTag, { backgroundColor: disciplineColor + '1A' }]}>
            <Text style={[styles.disciplineText, { color: disciplineColor }]}>
              {DisciplinaLabel[clase.disciplina] ?? clase.disciplina}
            </Text>
          </View>

          {/* Badge de cupo: "X lugares" (verde) | "Completa" (rojo) */}
          <View style={[
            styles.cupoBadge,
            { backgroundColor: isCompleta ? Colors.dangerLight : Colors.successLight },
          ]}>
            <View style={[
              styles.cupoDot,
              { backgroundColor: isCompleta ? Colors.danger : Colors.success },
            ]} />
            <Text style={[
              styles.cupoText,
              { color: isCompleta ? Colors.danger : Colors.success },
            ]}>
              {isCompleta ? 'Completa' : `${clase.cupo_disponible} lugar${clase.cupo_disponible !== 1 ? 'es' : ''}`}
            </Text>
          </View>
        </View>

        {/* ── Horario (Typography.h3) ────────────────────────────────────────── */}
        <Text style={styles.horario}>
          {clase.hora_inicio} – {clase.hora_fin}
        </Text>

        {/* ── Fecha en español largo ─────────────────────────────────────────── */}
        <Text style={styles.fecha}>{formatFecha(clase.fecha)}</Text>

        {/* ── Footer: nivel + flecha (solo si disponible) ────────────────────── */}
        <View style={styles.footer}>
          {/* Nivel capitalizado */}
          <View style={styles.nivelBadge}>
            <Ionicons name="layers-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.nivel}>
              {NivelLabel[clase.nivel] ?? (clase.nivel.charAt(0).toUpperCase() + clase.nivel.slice(1))}
            </Text>
          </View>

          {/* Flecha de acción solo si hay cupo */}
          {!isCompleta && (
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={13} color={Colors.accent} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  containerDisabled: {
    opacity: 0.6,
  },

  // Barra lateral 4px — border-radius 0 en los extremos del lado izquierdo
  // para que se ajuste al borde del card
  disciplineBar: {
    width: 4,
  },

  content: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  disciplineTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  disciplineText: {
    ...Typography.label,
    fontWeight: '700',
  },

  // Badge de cupo
  cupoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  cupoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cupoText: {
    ...Typography.caption,
    fontWeight: '600',
  },

  // Horario
  horario: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },

  // Fecha
  fecha: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  nivelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  nivel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
