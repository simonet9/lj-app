import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@constants/theme';

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  creditos: number;
}

export function CreditBadge({ creditos }: Props) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        {creditos} {creditos === 1 ? 'crédito' : 'créditos'}
      </Text>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.accent + '1A', // 10% opacity
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.label,
    color: Colors.accent,
    fontWeight: '600',
  },
});
