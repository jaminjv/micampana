import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { EnTabs, useOpcionesTabs } from '@/components/tabs';
import { Ionicons } from '@/components/ui';
import { useApp } from '@/state/app';

/** Pestañas de la versión ciudadano. Sin registro, lleva al registro. */
export default function CiudadanoLayout() {
  const opciones = useOpcionesTabs();
  const { ciudadano } = useApp();
  if (!ciudadano) return <Redirect href="/ciudadano/registro" />;

  return (
    <EnTabs.Provider value>
      <Tabs screenOptions={opciones}>
        <Tabs.Screen name="feed" options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
        <Tabs.Screen name="aportar" options={{ title: 'Aportar', tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} /> }} />
        <Tabs.Screen name="buscar" options={{ title: 'Buscar', tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} /> }} />
        <Tabs.Screen name="actividad" options={{ title: 'Mi actividad', tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }} />
      </Tabs>
    </EnTabs.Provider>
  );
}
