import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';

export default function RegistroScreen() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', dni: '', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  function setField(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleRegistro() {
    if (!form.nombre || !form.apellido || !form.email || !form.dni || !form.password) {
      Alert.alert('Campos incompletos', 'Completá todos los campos para continuar.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Contraseñas distintas', 'Las contraseñas no coinciden. Revisalas e intentá de nuevo.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Contraseña muy corta', 'Usá al menos 6 caracteres para mayor seguridad.');
      return;
    }
    setLoading(true);
    try {
      await signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        dni: form.dni.trim(),
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
      });
    } catch (error: any) {
      Alert.alert('Error al registrarse', error.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  function inputStyle(field: string) {
    return [styles.inputWrapper, focused === field && styles.inputWrapperFocused];
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header oscuro */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>L&J</Text>
          </View>
          <Text style={styles.heroTitle}>Crear cuenta</Text>
          <Text style={styles.heroSubtitle}>Unite al Centro Deportivo</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>DATOS PERSONALES</Text>

          {/* Nombre / Apellido */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Nombre</Text>
              <View style={inputStyle('nombre')}>
                <TextInput
                  style={styles.input}
                  value={form.nombre}
                  onChangeText={v => setField('nombre', v)}
                  placeholder="Juan"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                  onFocus={() => setFocused('nombre')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Apellido</Text>
              <View style={inputStyle('apellido')}>
                <TextInput
                  style={styles.input}
                  value={form.apellido}
                  onChangeText={v => setField('apellido', v)}
                  placeholder="Pérez"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                  onFocus={() => setFocused('apellido')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>
          </View>

          {/* DNI */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>DNI</Text>
            <View style={inputStyle('dni')}>
              <Ionicons name="card-outline" size={17} color={focused === 'dni' ? Colors.accent : Colors.textMuted} style={styles.icon} />
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
              />
            </View>
          </View>

          <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>CUENTA</Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={inputStyle('email')}>
              <Ionicons name="mail-outline" size={17} color={focused === 'email' ? Colors.accent : Colors.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={v => setField('email', v)}
                placeholder="tu@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {/* Contraseña */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={inputStyle('password')}>
              <Ionicons name="lock-closed-outline" size={17} color={focused === 'password' ? Colors.accent : Colors.textMuted} style={styles.icon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={form.password}
                onChangeText={v => setField('password', v)}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPass}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn} activeOpacity={0.7}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmar */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={inputStyle('confirm')}>
              <Ionicons name="lock-closed-outline" size={17} color={focused === 'confirm' ? Colors.accent : Colors.textMuted} style={styles.icon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={form.confirmPassword}
                onChangeText={v => setField('confirmPassword', v)}
                placeholder="Repetí tu contraseña"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPass}
                onFocus={() => setFocused('confirm')}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegistro}
            disabled={loading}
            activeOpacity={0.85}
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

          {/* Footer */}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1 },
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
  logoText: { fontSize: 26, fontWeight: '900', color: Colors.textInverse, letterSpacing: -1 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: Colors.textInverse },
  heroSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  card: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  row: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  halfField: { flex: 1 },
  fieldGroup: { marginBottom: Spacing.sm },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
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
  icon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    paddingVertical: 13,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  eyeBtn: { padding: 4, marginLeft: Spacing.sm },
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
  buttonText: { ...Typography.body, fontWeight: '700', color: Colors.textInverse, fontSize: 16 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingBottom: 40,
  },
  footerText: { ...Typography.body, color: Colors.textSecondary },
  footerLink: { ...Typography.body, color: Colors.accent, fontWeight: '700' },
});
