import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@constants/theme';
import { useAuth } from '@context/AuthContext';

export default function AgendaScreen() {
  const { usuario } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.subtitle}>Hola, {usuario?.nombre}</Text>
      </View>
      {/* TODO: Listar clases de la disciplina del gestor */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Tus clases aparecerán aquí</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.md, paddingTop: 60, paddingBottom: Spacing.sm },
  title: { ...Typography.h1, color: Colors.textPrimary },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { ...Typography.body, color: Colors.textMuted },
});
