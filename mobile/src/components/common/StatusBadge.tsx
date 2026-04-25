import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@constants/theme';
import type { EstadoClase, EstadoReserva } from '@app-types/index';

// ─── types ───────────────────────────────────────────────────────────────────

type Estado = EstadoClase | EstadoReserva;

interface Props {
  estado: Estado;
}

// ─── config por estado ────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  // EstadoClase
  disponible:  { bg: Colors.successLight,  text: Colors.success,  label: 'Disponible' },
  completa:    { bg: Colors.dangerLight,   text: Colors.danger,   label: 'Completa' },
  suspendida:  { bg: '#f7fafc',            text: Colors.textMuted, label: 'Suspendida' },
  // EstadoReserva
  confirmada:  { bg: Colors.successLight,  text: Colors.success,  label: 'Confirmada' },
  cancelada:   { bg: Colors.dangerLight,   text: Colors.danger,   label: 'Cancelada' },
  asistio:     { bg: Colors.infoLight,     text: Colors.info,     label: 'Asistió' },
  ausente:     { bg: Colors.warningLight,  text: Colors.warning,  label: 'Ausente' },
};

// ─── component ───────────────────────────────────────────────────────────────

export function StatusBadge({ estado }: Props) {
  const config = ESTADO_CONFIG[estado] ?? {
    bg: Colors.border,
    text: Colors.textMuted,
    label: estado,
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  text: {
    ...Typography.label,
    fontWeight: '600',
  },
});
