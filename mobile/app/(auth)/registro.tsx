import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';

// ─── Tipos de errores por campo ───────────────────────────────────────────────
interface FormErrors {
  nombre?: string;
  apellido?: string;
  dni?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

// ─── Regex de validación ──────────────────────────────────────────────────────
const SOLO_LETRAS = /^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const DNI_REGEX    = /^\d{7,8}$/;
const EMAIL_REGEX  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Validación completa del formulario ───────────────────────────────────────
function validarFormulario(form: {
  nombre: string; apellido: string; dni: string;
  email: string; password: string; confirmPassword: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!form.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio.';
  } else if (!SOLO_LETRAS.test(form.nombre.trim())) {
    errors.nombre = 'Solo se permiten letras.';
  }

  if (!form.apellido.trim()) {
    errors.apellido = 'El apellido es obligatorio.';
  } else if (!SOLO_LETRAS.test(form.apellido.trim())) {
    errors.apellido = 'Solo se permiten letras.';
  }

  if (!form.dni.trim()) {
    errors.dni = 'El DNI es obligatorio.';
  } else if (!DNI_REGEX.test(form.dni.trim())) {
    errors.dni = 'El DNI debe tener 7 u 8 dígitos numéricos.';
  }

  if (!form.email.trim()) {
    errors.email = 'El correo electrónico es obligatorio.';
  } else if (!EMAIL_REGEX.test(form.email.trim())) {
    errors.email = 'Ingresá un correo electrónico válido.';
  }

  if (!form.password) {
    errors.password = 'La contraseña es obligatoria.';
  } else if (form.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Confirmá tu contraseña.';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function RegistroScreen() {
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', dni: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors]     = useState<FormErrors>({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState<string | null>(null);

  function setField(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    // Limpiar el error de ese campo al empezar a escribir
    if (errors[key as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }

  async function handleRegistro() {
    // ── Validar formulario localmente ─────────────────────────────────────────
    const validationErrors = validarFormulario(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await signUp({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        dni:      form.dni.trim(),
        nombre:   form.nombre.trim(),
        apellido: form.apellido.trim(),
      });
      // ✅ El redirect a /(socio)/clases lo maneja AuthContext via onAuthStateChange
    } catch (error: any) {
      // Extraer el campo afectado del error enriquecido de AuthContext
      const field: keyof FormErrors = error.field ?? 'general';
      const message: string =
        error.message || 'No se pudo crear la cuenta. Intentá de nuevo.';
      setErrors({ [field]: message });
    } finally {
      setLoading(false);
    }
  }

  // ── Helpers de estilo ──────────────────────────────────────────────────────
  function wrapperStyle(field: string, hasError: boolean) {
    return [
      styles.inputWrapper,
      focused === field && styles.inputWrapperFocused,
      hasError && styles.inputWrapperError,
    ];
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header oscuro ────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Volver atrás"
          >
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>L&J</Text>
          </View>
          <Text style={styles.heroTitle}>Crear cuenta</Text>
          <Text style={styles.heroSubtitle}>Unité al Centro Deportivo</Text>
        </View>

        {/* ── Card ─────────────────────────────────────────────────────────── */}
        <View style={styles.card}>

          {/* Error general (no asociado a un campo específico) */}
          {errors.general ? (
            <View style={styles.generalError}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          ) : null}

          {/* ── Datos personales ─────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>DATOS PERSONALES</Text>

          {/* Nombre / Apellido en fila */}
          <View style={styles.row}>
            {/* Nombre */}
            <View style={styles.halfField}>
              <Text style={styles.label}>Nombre</Text>
              <View style={wrapperStyle('nombre', !!errors.nombre)}>
                <TextInput
                  style={styles.input}
                  value={form.nombre}
                  onChangeText={v => setField('nombre', v)}
                  placeholder="Juan"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                  onFocus={() => setFocused('nombre')}
                  onBlur={() => setFocused(null)}
                  accessibilityLabel="Nombre"
                />
              </View>
              {errors.nombre ? (
                <Text style={styles.fieldError}>{errors.nombre}</Text>
              ) : null}
            </View>

            {/* Apellido */}
            <View style={styles.halfField}>
              <Text style={styles.label}>Apellido</Text>
              <View style={wrapperStyle('apellido', !!errors.apellido)}>
                <TextInput
                  style={styles.input}
                  value={form.apellido}
                  onChangeText={v => setField('apellido', v)}
                  placeholder="Pérez"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                  onFocus={() => setFocused('apellido')}
                  onBlur={() => setFocused(null)}
                  accessibilityLabel="Apellido"
                />
              </View>
              {errors.apellido ? (
                <Text style={styles.fieldError}>{errors.apellido}</Text>
              ) : null}
            </View>
          </View>

          {/* DNI */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>DNI</Text>
            <View style={wrapperStyle('dni', !!errors.dni)}>
              <Ionicons
                name="card-outline"
                size={17}
                color={focused === 'dni' ? Colors.accent : errors.dni ? Colors.danger : Colors.textMuted}
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                value={form.dni}
                onChangeText={v => setField('dni', v)}
                placeholder="38111222"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                maxLength={8}
                onFocus={() => setFocused('dni')}
                onBlur={() => setFocused(null)}
                accessibilityLabel="DNI"
              />
            </View>
            {errors.dni ? (
              <Text style={styles.fieldError}>{errors.dni}</Text>
            ) : null}
          </View>

          {/* ── Cuenta ───────────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>CUENTA</Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={wrapperStyle('email', !!errors.email)}>
              <Ionicons
                name="mail-outline"
                size={17}
                color={focused === 'email' ? Colors.accent : errors.email ? Colors.danger : Colors.textMuted}
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={v => setField('email', v)}
                placeholder="tu@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                accessibilityLabel="Correo electrónico"
              />
            </View>
            {errors.email ? (
              <Text style={styles.fieldError}>{errors.email}</Text>
            ) : null}
          </View>

          {/* Contraseña */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={wrapperStyle('password', !!errors.password)}>
              <Ionicons
                name="lock-closed-outline"
                size={17}
                color={focused === 'password' ? Colors.accent : errors.password ? Colors.danger : Colors.textMuted}
                style={styles.icon}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={form.password}
                onChangeText={v => setField('password', v)}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPass}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                accessibilityLabel="Contraseña"
              />
              <TouchableOpacity
                onPress={() => setShowPass(v => !v)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
                accessibilityLabel={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={17}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.fieldError}>{errors.password}</Text>
            ) : null}
          </View>

          {/* Confirmar contraseña */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={wrapperStyle('confirm', !!errors.confirmPassword)}>
              <Ionicons
                name="lock-closed-outline"
                size={17}
                color={focused === 'confirm' ? Colors.accent : errors.confirmPassword ? Colors.danger : Colors.textMuted}
                style={styles.icon}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={form.confirmPassword}
                onChangeText={v => setField('confirmPassword', v)}
                placeholder="Repetí tu contraseña"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPass}
                onFocus={() => setFocused('confirm')}
                onBlur={() => setFocused(null)}
                accessibilityLabel="Confirmar contraseña"
              />
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
            ) : null}
          </View>

          {/* ── Botón CTA ─────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegistro}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityLabel="Crear cuenta"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <Text style={styles.buttonText}>Crear cuenta</Text>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.textInverse} />
              </>
            )}
          </TouchableOpacity>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tenés cuenta? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.footerLink}>Iniciá sesión</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1 },

  // Hero
  hero: {
    paddingTop: 56,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: Spacing.lg,
    padding: Spacing.sm,
  },
  logoContainer: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  logoText:     { fontSize: 26, fontWeight: '900', color: Colors.textInverse, letterSpacing: -1 },
  heroTitle:    { fontSize: 22, fontWeight: '700', color: Colors.textInverse },
  heroSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  // Card
  card: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  // Error general
  generalError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  generalErrorText: {
    ...Typography.bodySmall,
    color: Colors.danger,
    fontWeight: '600',
    flex: 1,
  },

  // Secciones
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },

  // Layout
  row:       { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
  halfField: { flex: 1 },
  fieldGroup: { marginBottom: Spacing.sm },

  // Labels
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },

  // Input wrappers
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  inputWrapperFocused: {
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },

  icon:  { marginRight: Spacing.sm },
  input: {
    flex: 1,
    paddingVertical: 13,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  eyeBtn: { padding: 4, marginLeft: Spacing.sm },

  // Error por campo
  fieldError: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 4,
    marginLeft: 2,
  },

  // Botón
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 16,
    marginTop: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.6, shadowOpacity: 0, elevation: 0 },
  buttonText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textInverse,
    fontSize: 16,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingBottom: 40,
  },
  footerText: { ...Typography.body, color: Colors.textSecondary },
  footerLink: { ...Typography.body, color: Colors.accent, fontWeight: '700' },
});
