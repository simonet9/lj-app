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

export default function GestorLayout() {
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
        name="agenda"
        options={{
          title: 'Mi agenda',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar-clear-outline" nameActive="calendar-clear" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="crear-clase"
        options={{
          title: 'Nueva clase',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="add-circle-outline" nameActive="add-circle" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-outline" nameActive="person" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
