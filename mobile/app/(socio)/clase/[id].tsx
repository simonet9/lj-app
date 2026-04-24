import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@services/supabase';
import { Colors, Typography, Spacing, Radius, DisciplinaLabel, NivelLabel } from '@constants/theme';
import type { Clase } from '@app-types/index';

const DISCIPLINA_COLORS: Record<string, string> = {
  futbol5: Colors.futbol5, padel: Colors.padel, voley: Colors.voley, basquet: Colors.basquet,
};

export default function ClaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [clase, setClase] = useState<Clase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('clases').select('*, gestor:usuarios(nombre, apellido)').eq('id', id).single()
      .then(({ data, error }) => { if (!error && data) setClase(data as Clase); setLoading(false); });
  }, [id]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.accent} size="large" /></View>;
  }

  if (!clase) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.errorText}>Clase no encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCta} activeOpacity={0.8}>
          <Text style={styles.backCtaText}>Volver a clases</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const color = DISCIPLINA_COLORS[clase.disciplina] ?? Colors.primary;
  const completa = clase.estado === 'completa';
  const ocupacion = Math.round(((clase.cupo_maximo - clase.cupo_disponible) / clase.cupo_maximo) * 100);

  return (
    <View style={styles.root}>
      {/* Hero oscuro */}
      <View style={[styles.hero, { backgroundColor: Colors.primary }]}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.7}>
          <View style={styles.backCircle}>
            <Ionicons name="arrow-back" size={18} color={Colors.textInverse} />
          </View>
          <Text style={styles.backLabel}>Clases</Text>
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <View style={[styles.colorDot, { backgroundColor: color }]} />
          <Text style={styles.heroDisciplina}>{DisciplinaLabel[clase.disciplina] ?? clase.disciplina}</Text>
          <Text style={styles.heroHorario}>{clase.hora_inicio} — {clase.hora_fin}</Text>
          <Text style={styles.heroFecha}>{formatFecha(clase.fecha)}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={styles.bodyContent}>
        {/* Estado */}
        <View style={[styles.estadoCard, { backgroundColor: completa ? Colors.dangerLight : Colors.successLight }]}>
          <Ionicons
            name={completa ? 'close-circle-outline' : 'checkmark-circle-outline'}
            size={22}
            color={completa ? Colors.danger : Colors.success}
          />
          <Text style={[styles.estadoCardText, { color: completa ? Colors.danger : Colors.success }]}>
            {completa ? 'Esta clase está completa' : `${clase.cupo_disponible} lugares disponibles`}
          </Text>
        </View>

        {/* Ocupación */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>OCUPACIÓN</Text>
          <View style={styles.ocupacionRow}>
            <Text style={styles.ocupacionPct}>{ocupacion}%</Text>
            <Text style={styles.ocupacionDetail}>
              {clase.cupo_maximo - clase.cupo_disponible}/{clase.cupo_maximo} inscriptos
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${ocupacion}%` as any, backgroundColor: color }]} />
          </View>
        </View>

        {/* Detalles */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DETALLES</Text>
          <DetailRow icon="layers-outline" label="Nivel" value={NivelLabel[clase.nivel] ?? clase.nivel} />
          <DetailRow icon="calendar-outline" label="Fecha" value={formatFecha(clase.fecha)} capitalize />
          <DetailRow icon="time-outline" label="Horario" value={`${clase.hora_inicio} — ${clase.hora_fin}`} />
          {clase.gestor && (
            <DetailRow
              icon="person-outline"
              label="Gestor"
              value={`${clase.gestor.nombre} ${clase.gestor.apellido}`}
              last
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, capitalize, last }: {
  icon: string; label: string; value: string; capitalize?: boolean; last?: boolean;
}) {
  return (
    <View style={[detailStyles.row, !last && detailStyles.rowBorder]}>
      <View style={detailStyles.iconWrap}>
        <Ionicons name={icon as any} size={16} color={Colors.textMuted} />
      </View>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={[detailStyles.value, capitalize && { textTransform: 'capitalize' }]}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  label: { ...Typography.body, color: Colors.textSecondary, flex: 1 },
  value: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
});

function formatFecha(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: Spacing.md },
  errorText: { ...Typography.h3, color: Colors.textSecondary },
  backCta: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  backCtaText: { ...Typography.body, color: Colors.textInverse, fontWeight: '600' },
  hero: { paddingTop: 56, paddingBottom: Spacing.xl, paddingHorizontal: Spacing.lg },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  backCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  backLabel: { ...Typography.body, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  heroContent: { gap: 4 },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  heroDisciplina: { fontSize: 28, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5 },
  heroHorario: { ...Typography.h3, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  heroFecha: { ...Typography.body, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' },
  body: { flex: 1 },
  bodyContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  estadoCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.lg, padding: Spacing.md,
  },
  estadoCardText: { ...Typography.body, fontWeight: '600', flex: 1 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  cardLabel: {
    ...Typography.caption, color: Colors.textMuted,
    fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm,
  },
  ocupacionRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: Spacing.sm },
  ocupacionPct: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 },
  ocupacionDetail: { ...Typography.body, color: Colors.textSecondary },
  barTrack: { height: 8, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.full },
});
