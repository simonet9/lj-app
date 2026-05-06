import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/theme';
import { useAuth } from '@context/AuthContext';
import { useNotificaciones } from '@hooks/useNotificaciones';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Icono con badge opcional ─────────────────────────────────────────────────

function TabIcon({
  name, nameActive, color, focused, badge,
}: {
  name: IoniconsName; nameActive: IoniconsName;
  color: string; focused: boolean; badge?: number;
}) {
  return (
    <View>
      <Ionicons name={focused ? nameActive : name} size={24} color={color} />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function SocioLayout() {
  const { usuario } = useAuth();
  const { noLeidas } = useNotificaciones(usuario?.id);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          minHeight: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="clases"
        options={{
          title: 'Clases',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="calendar-outline"
              nameActive="calendar"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Mis reservas',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="bookmark-outline"
              nameActive="bookmark"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="abono"
        options={{
          title: 'Abono',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="card-outline"
              nameActive="card"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="person-outline"
              nameActive="person"
              color={color}
              focused={focused}
              badge={noLeidas}
            />
          ),
        }}
      />
      {/* Rutas ocultas de la tab bar */}
      <Tabs.Screen
        name="clase/[id]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="reserva-confirmada"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="pago-mock"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
});
