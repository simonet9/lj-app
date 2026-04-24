import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@constants/theme';

export default function CrearClaseScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nueva clase</Text>
      </View>
      {/* TODO: Formulario de creación de clase */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Formulario de clase — próximamente</Text>
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
