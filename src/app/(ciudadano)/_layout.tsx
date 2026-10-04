import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';

import { Ionicons } from '@/components/ui';
import { useApp } from '@/state/app';
import { colors } from '@/theme';

/** Pestañas de la versión ciudadano. Sin registro, lleva al registro. */
export default function CiudadanoLayout() {
  const { ciudadano } = useApp();
  if (!ciudadano) return <Redirect href="/ciudadano/registro" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: Platform.OS === 'web' ? { borderTopColor: colors.border, height: 64, paddingBottom: 8 } : { borderTopColor: colors.border },
      }}>
      <Tabs.Screen name="feed" options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="aportar" options={{ title: 'Aportar', tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} /> }} />
      <Tabs.Screen name="buscar" options={{ title: 'Buscar', tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} /> }} />
      <Tabs.Screen name="actividad" options={{ title: 'Mi actividad', tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }} />
    </Tabs>
  );
}
