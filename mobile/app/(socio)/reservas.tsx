import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@constants/theme';

export default function ReservasScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis reservas</Text>
      </View>
      {/* TODO: Listar reservas activas del socio */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Tus reservas aparecerán aquí</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.md, paddingTop: 60, paddingBottom: Spacing.sm },
  title: { ...Typography.h1, color: Colors.textPrimary },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { ...Typography.body, color: Colors.textMuted },
});
