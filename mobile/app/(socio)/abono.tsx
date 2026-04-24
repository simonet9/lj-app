import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@constants/theme';

export default function AbonoScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Abono mensual</Text>
      </View>
      {/* TODO: Flujo de compra de abono mensual con Mercado Pago mock */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Gestión de abono — próximamente</Text>
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
