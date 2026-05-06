import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius, DisciplinaLabel, NivelLabel } from '@constants/theme';
import { useCrearClase } from '@hooks/useCrearClase';
import {
  formatFechaUI, sumarDias, hoyISO, calcularHoraFin,
  generarHorariosDisponibles,
} from '@utils/fechas';
import type { Disciplina, NivelClase } from '@app-types/index';

// ─── Constantes ───────────────────────────────────────────────────────────────

const NIVELES: { value: NivelClase; label: string }[] = [
  { value: 'principiante', label: NivelLabel.principiante },
  { value: 'intermedio',   label: NivelLabel.intermedio   },
  { value: 'avanzado',     label: NivelLabel.avanzado     },
];

const DURACIONES: { value: 60 | 90 | 120; label: string }[] = [
  { value: 60,  label: '60 min' },
  { value: 90,  label: '90 min' },
  { value: 120, label: '120 min' },
];

const HORARIOS = generarHorariosDisponibles();

const DISCIPLINA_COLORS: Record<string, string> = {
  futbol5: Colors.futbol5,
  padel:   Colors.padel,
  voley:   Colors.voley,
  basquet: Colors.basquet,
};

// ─── Sub-componente: FieldLabel ───────────────────────────────────────────────

function FieldLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.fieldLabel}>
      <Ionicons name={icon as any} size={14} color={Colors.textMuted} />
      <Text style={styles.fieldLabelText}>{label}</Text>
    </View>
  );
}

// ─── Sub-componente: OptionPills ──────────────────────────────────────────────

function OptionPills<T extends string | number>({
  options, value, onChange, accentColor,
}: {
  options: { value: T; label: string }[];
  value:   T;
  onChange: (v: T) => void;
  accentColor?: string;
}) {
  const accent = accentColor ?? Colors.accent;
  return (
    <View style={styles.pillsRow}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={[styles.pill, active && { backgroundColor: accent, borderColor: accent }]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.75}
            accessibilityLabel={opt.label}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Sub-componente: HorarioScroll ────────────────────────────────────────────

function HorarioScroll({
  value, onChange, accentColor,
}: {
  value: string; onChange: (v: string) => void; accentColor: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horarioRow}
    >
      {HORARIOS.map(h => {
        const active = h === value;
        return (
          <TouchableOpacity
            key={h}
            style={[styles.horarioChip, active && { backgroundColor: accentColor, borderColor: accentColor }]}
            onPress={() => onChange(h)}
            activeOpacity={0.75}
            accessibilityLabel={`Horario ${h}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.horarioText, active && styles.horarioTextActive]}>
              {h}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function CrearClaseScreen() {
  const { usuario } = useAuth();
  const insets      = useSafeAreaInsets();

  // Guard: el gestor siempre tiene disciplina asignada
  const disciplina  = (usuario?.disciplina ?? 'futbol5') as Disciplina;
  const gestorId    = usuario?.id ?? '';
  const accentColor = DISCIPLINA_COLORS[disciplina] ?? Colors.accent;

  const {
    form, loading, error,
    setNivel, setFecha, setHoraInicio, setDuracion, setCupo,
    crearClase, esFormValido,
  } = useCrearClase(gestorId, disciplina);

  // ── Acción de envío ───────────────────────────────────────────────────────

  async function handleSubmit() {
    const clase = await crearClase();
    if (!clase) return; // error ya seteado en el hook

    Alert.alert('✓ Clase creada', 'La clase fue creada exitosamente.', [
      {
        text: 'Ver agenda',
        onPress: () => router.replace('/(gestor)/agenda'),
      },
      { text: 'Crear otra', style: 'cancel' },
    ]);
  }

  // ── Fecha: navegación con flechas ─────────────────────────────────────────
  const hoy = hoyISO();

  function irAyer()   { if (sumarDias(form.fecha, -1) >= hoy) setFecha(sumarDias(form.fecha, -1)); }
  function irMañana() { setFecha(sumarDias(form.fecha, 1)); }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: accentColor }]}>
        <Text style={styles.headerEyebrow}>GESTIÓN</Text>
        <Text style={styles.headerTitle}>Nueva clase</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Disciplina (solo lectura) ────────────────────────────────── */}
        <View style={styles.section}>
          <FieldLabel icon="trophy-outline" label="Disciplina" />
          <View style={[styles.readonlyChip, { borderColor: accentColor + '60', backgroundColor: accentColor + '12' }]}>
            <View style={[styles.readonlyDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.readonlyText, { color: accentColor }]}>
              {DisciplinaLabel[disciplina] ?? disciplina}
            </Text>
            <Ionicons name="lock-closed-outline" size={13} color={accentColor} style={{ marginLeft: 'auto' }} />
          </View>
          <Text style={styles.hint}>Asignada por el administrador</Text>
        </View>

        {/* ── Nivel ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <FieldLabel icon="bar-chart-outline" label="Nivel" />
          <OptionPills
            options={NIVELES}
            value={form.nivel}
            onChange={setNivel}
            accentColor={accentColor}
          />
        </View>

        {/* ── Fecha ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <FieldLabel icon="calendar-outline" label="Fecha" />
          <View style={styles.fechaRow}>
            <TouchableOpacity
              style={[styles.fechaArrow, sumarDias(form.fecha, -1) < hoy && styles.fechaArrowDisabled]}
              onPress={irAyer}
              disabled={sumarDias(form.fecha, -1) < hoy}
              activeOpacity={0.7}
              accessibilityLabel="Día anterior"
            >
              <Ionicons name="chevron-back" size={20} color={sumarDias(form.fecha, -1) < hoy ? Colors.textMuted : Colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.fechaDisplay}>
              <Text style={styles.fechaText}>{formatFechaUI(form.fecha)}</Text>
            </View>

            <TouchableOpacity
              style={styles.fechaArrow}
              onPress={irMañana}
              activeOpacity={0.7}
              accessibilityLabel="Día siguiente"
            >
              <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          {form.fecha === hoy && (
            <Text style={styles.hintWarning}>⚠ Solo se permiten fechas a partir de mañana</Text>
          )}
        </View>

        {/* ── Horario ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <FieldLabel icon="time-outline" label="Hora de inicio" />
          <HorarioScroll
            value={form.horaInicio}
            onChange={setHoraInicio}
            accentColor={accentColor}
          />
          <Text style={styles.hint}>
            Fin estimado: {calcularHoraFin(form.horaInicio, form.duracion)} ({form.duracion} min)
          </Text>
        </View>

        {/* ── Duración ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <FieldLabel icon="hourglass-outline" label="Duración" />
          <OptionPills
            options={DURACIONES}
            value={form.duracion}
            onChange={setDuracion}
            accentColor={accentColor}
          />
        </View>

        {/* ── Cupo máximo (stepper) ─────────────────────────────────────── */}
        <View style={styles.section}>
          <FieldLabel icon="people-outline" label="Cupo máximo" />
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepperBtn, form.cupo <= 4 && styles.stepperBtnDisabled]}
              onPress={() => setCupo(form.cupo - 1)}
              disabled={form.cupo <= 4}
              activeOpacity={0.7}
              accessibilityLabel="Reducir cupo"
            >
              <Ionicons name="remove" size={20} color={form.cupo <= 4 ? Colors.textMuted : Colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.stepperValue}>
              <Text style={styles.stepperValueText}>{form.cupo}</Text>
              <Text style={styles.stepperValueUnit}>socios</Text>
            </View>

            <TouchableOpacity
              style={[styles.stepperBtn, form.cupo >= 20 && styles.stepperBtnDisabled]}
              onPress={() => setCupo(form.cupo + 1)}
              disabled={form.cupo >= 20}
              activeOpacity={0.7}
              accessibilityLabel="Aumentar cupo"
            >
              <Ionicons name="add" size={20} color={form.cupo >= 20 ? Colors.textMuted : Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Mínimo 4 · Máximo 20</Text>
        </View>

        {/* ── Resumen ──────────────────────────────────────────────────── */}
        <View style={[styles.resumen, { borderColor: accentColor + '40', backgroundColor: accentColor + '08' }]}>
          <Text style={[styles.resumenTitle, { color: accentColor }]}>Resumen de la clase</Text>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Disciplina</Text>
            <Text style={styles.resumenValue}>{DisciplinaLabel[disciplina]}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Nivel</Text>
            <Text style={styles.resumenValue}>{NivelLabel[form.nivel]}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Fecha</Text>
            <Text style={styles.resumenValue}>{formatFechaUI(form.fecha)}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Horario</Text>
            <Text style={styles.resumenValue}>
              {form.horaInicio} — {calcularHoraFin(form.horaInicio, form.duracion)}
            </Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Cupo</Text>
            <Text style={styles.resumenValue}>{form.cupo} socios</Text>
          </View>
        </View>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── CTA: Crear clase ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            { backgroundColor: accentColor },
            (!esFormValido || loading) && styles.ctaBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!esFormValido || loading}
          activeOpacity={0.85}
          accessibilityLabel="Crear clase"
          accessibilityRole="button"
          id="btn-crear-clase"
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textInverse} />
          )}
          <Text style={styles.ctaBtnText}>
            {loading ? 'Creando clase…' : 'Crear clase'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 3,
  },
  headerEyebrow: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '700', letterSpacing: 1.2, marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5,
  },

  // Form
  form: { padding: Spacing.lg, gap: Spacing.xl },

  // Sección
  section: { gap: Spacing.sm },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldLabelText: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Disciplina (readonly)
  readonlyChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderRadius: Radius.md,
    paddingVertical: 12, paddingHorizontal: Spacing.md,
  },
  readonlyDot: { width: 8, height: 8, borderRadius: 4 },
  readonlyText: { ...Typography.body, fontWeight: '700', flex: 1 },

  // Pills (nivel, duración)
  pillsRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  pill: {
    flex: 1, minWidth: 80,
    paddingVertical: 10, paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  pillText:  { ...Typography.body, color: Colors.textSecondary, fontWeight: '600' },
  pillTextActive: { color: Colors.textInverse, fontWeight: '700' },

  // Horario scroll
  horarioRow: { gap: Spacing.sm, paddingRight: Spacing.md },
  horarioChip: {
    paddingVertical: 9, paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  horarioText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '600' },
  horarioTextActive: { color: Colors.textInverse, fontWeight: '700' },

  // Fecha
  fechaRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  fechaArrow: {
    padding: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  fechaArrowDisabled: { opacity: 0.3 },
  fechaDisplay: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12,
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border,
  },
  fechaText: { ...Typography.body, fontWeight: '700', color: Colors.textPrimary },

  // Stepper cupo
  stepperRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  stepperBtn: {
    padding: Spacing.md + 4,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperBtnDisabled: { opacity: 0.3 },
  stepperValue: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12,
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border,
    gap: 2,
  },
  stepperValueText: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  stepperValueUnit: { ...Typography.caption, color: Colors.textMuted },

  // Hints
  hint: { ...Typography.caption, color: Colors.textMuted },
  hintWarning: { ...Typography.caption, color: Colors.warning },

  // Resumen
  resumen: {
    borderWidth: 1, borderRadius: Radius.lg,
    padding: Spacing.md, gap: Spacing.sm,
  },
  resumenTitle: { ...Typography.label, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumenLabel: { ...Typography.bodySmall, color: Colors.textMuted },
  resumenValue: { ...Typography.bodySmall, color: Colors.textPrimary, fontWeight: '600' },

  // Error
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1, borderColor: Colors.danger + '40',
    borderRadius: Radius.md, padding: Spacing.md,
  },
  errorText: { ...Typography.bodySmall, color: Colors.danger, flex: 1 },

  // CTA
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderRadius: Radius.md,
    paddingVertical: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  ctaBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  ctaBtnText: { ...Typography.body, fontWeight: '700', color: Colors.textInverse },
});
