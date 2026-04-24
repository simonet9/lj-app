import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@services/supabase';
import { Colors, Typography, Spacing, Radius, DisciplinaLabel, NivelLabel } from '@constants/theme';
import type { Clase } from '@app-types/index';

export default function ClaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [clase, setClase] = useState<Clase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('clases')
      .select('*, gestor:usuarios(nombre, apellido)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setClase(data as Clase);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!clase) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Clase no encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const disciplinaColors: Record<string, string> = {
    futbol5: Colors.futbol5,
    padel: Colors.padel,
    voley: Colors.voley,
    basquet: Colors.basquet,
  };
  const color = disciplinaColors[clase.disciplina] ?? Colors.primary;
  const completa = clase.estado === 'completa';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header con botón atrás */}
      <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        <Text style={styles.backLabel}>Clases</Text>
      </TouchableOpacity>

      {/* Acento de disciplina */}
      <View style={[styles.accentBar, { backgroundColor: color }]} />

      {/* Info principal */}
      <View style={styles.card}>
        <Text style={[styles.disciplina, { color }]}>
          {DisciplinaLabel[clase.disciplina] ?? clase.disciplina}
        </Text>
        <Text style={styles.nivel}>{NivelLabel[clase.nivel] ?? clase.nivel}</Text>

        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.rowText}>{formatFecha(clase.fecha)}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.rowText}>{clase.hora_inicio} — {clase.hora_fin}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="people-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.rowText}>
            {completa
              ? 'Sin lugares disponibles'
              : `${clase.cupo_disponible} de ${clase.cupo_maximo} lugares disponibles`}
          </Text>
        </View>

        {clase.gestor && (
          <View style={styles.row}>
            <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.rowText}>
              {clase.gestor.nombre} {clase.gestor.apellido}
            </Text>
          </View>
        )}

        {/* Badge de estado */}
        <View style={[styles.estadoBadge, { backgroundColor: completa ? Colors.dangerLight : Colors.successLight }]}>
          <Text style={[styles.estadoText, { color: completa ? Colors.danger : Colors.success }]}>
            {completa ? 'Clase completa' : 'Disponible'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function formatFecha(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  errorText: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: 48, paddingBottom: Spacing.md },
  backLabel: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
  accentBar: { height: 4, borderRadius: Radius.full, marginBottom: Spacing.md },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.md,
  },
  disciplina: { ...Typography.h1, fontWeight: '700' },
  nivel: { ...Typography.body, color: Colors.textSecondary, marginTop: -Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowText: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  estadoBadge: {
    alignSelf: 'flex-start', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, marginTop: Spacing.sm,
  },
  estadoText: { ...Typography.label, fontWeight: '700' },
  backBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  backBtnText: { ...Typography.body, color: Colors.textInverse, fontWeight: '600' },
});
