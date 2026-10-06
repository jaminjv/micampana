import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { EnTabs, useOpcionesTabs } from '@/components/tabs';
import { Ionicons } from '@/components/ui';
import { tareasDe } from '@/data/repo';
import { useMiMiembro } from '@/state/app';
import { colors } from '@/theme';

/** Versión líder comunal. Sin membresía de líder, lleva a ingresar un código. */
export default function LiderLayout() {
  const opciones = useOpcionesTabs();
  const m = useMiMiembro();
  if (!m || m.rol !== 'lider') return <Redirect href="/invitacion" />;
  const pendientes = tareasDe(m.id).filter((t) => t.estado === 'pendiente').length;

  return (
    <EnTabs.Provider value>
      <Tabs screenOptions={opciones}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Mis tareas',
            tabBarBadge: pendientes || undefined,
            tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.onAccent },
            tabBarIcon: ({ color, size }) => <Ionicons name="checkbox" color={color} size={size} />,
          }}
        />
        <Tabs.Screen name="gente" options={{ title: 'Mi gente', tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} /> }} />
        <Tabs.Screen name="proponer" options={{ title: 'Proponer', tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} /> }} />
        <Tabs.Screen name="colaborador" options={{ href: null }} />
      </Tabs>
    </EnTabs.Provider>
  );
}
