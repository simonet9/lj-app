import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { Colors } from '@constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name, nameActive, color, focused,
}: {
  name: IoniconsName; nameActive: IoniconsName; color: string; focused: boolean;
}) {
  return <Ionicons name={focused ? nameActive : name} size={24} color={color} />;
}

export default function SocioLayout() {
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
            />
          ),
        }}
      />
      {/* Ruta de detalle: oculta la tab bar */}
      <Tabs.Screen
        name="clase/[id]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}
