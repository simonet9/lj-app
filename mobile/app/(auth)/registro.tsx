import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@context/AuthContext';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';

export default function RegistroScreen() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', dni: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  function setField(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleRegistro() {
    if (!form.nombre || !form.apellido || !form.email || !form.dni || !form.password) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
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
      Alert.alert('Error', error.message || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>L&J</Text>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Completá tus datos para registrarte</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={form.nombre}
                onChangeText={v => setField('nombre', v)}
                placeholder="Juan"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Apellido</Text>
              <TextInput
                style={styles.input}
                value={form.apellido}
                onChangeText={v => setField('apellido', v)}
                placeholder="Pérez"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>

          <Text style={styles.label}>DNI</Text>
          <TextInput
            style={styles.input}
            value={form.dni}
            onChangeText={v => setField('dni', v)}
            placeholder="38111222"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            maxLength={8}
          />

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={v => setField('email', v)}
            placeholder="tu@email.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={form.password}
            onChangeText={v => setField('password', v)}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />

          <Text style={styles.label}>Confirmar contraseña</Text>
          <TextInput
            style={styles.input}
            value={form.confirmPassword}
            onChangeText={v => setField('confirmPassword', v)}
            placeholder="Repetí tu contraseña"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegistro}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.buttonText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tenés cuenta? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Iniciá sesión</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.lg, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { fontSize: 40, fontWeight: '800', color: Colors.primary, letterSpacing: -2 },
  title: { ...Typography.h2, color: Colors.textPrimary, marginTop: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  form: { gap: Spacing.xs },
  row: { flexDirection: 'row', gap: Spacing.sm },
  halfField: { flex: 1 },
  label: { ...Typography.label, color: Colors.textSecondary, marginBottom: 4, marginTop: Spacing.sm },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, ...Typography.body, color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center', marginTop: Spacing.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...Typography.body, fontWeight: '600', color: Colors.textInverse },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl, paddingBottom: 40 },
  footerText: { ...Typography.body, color: Colors.textSecondary },
  footerLink: { ...Typography.body, color: Colors.accent, fontWeight: '600' },
});
