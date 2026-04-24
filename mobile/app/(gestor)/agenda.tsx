import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@constants/theme';
import { useAuth } from '@context/AuthContext';

export default function AgendaScreen() {
  const { usuario } = useAuth();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Hola, {usuario?.nombre}</Text>
        <Text style={styles.title}>Tu agenda</Text>
      </View>

      {/* Empty State */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar-clear-outline" size={60} color={Colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Agenda vacía</Text>
        <Text style={styles.emptySubtitle}>
          Las clases de tu disciplina aparecerán aquí para que puedas gestionar la asistencia.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.xl,
  },
  headerEyebrow: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.5 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    paddingBottom: 100, // Offset visual
  },
  iconContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
