import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Platform } from 'react-native';

import { Ionicons } from '@/components/ui';
import { solicitudesDe, colaboradoresDe, miembrosDe } from '@/data/repo';
import { useMiMiembro } from '@/state/app';
import { colors, fuentes } from '@/theme';

/** Versión coordinador. Sin membresía de coordinador, lleva a ingresar un código. */
export default function CoordinadorLayout() {
  const m = useMiMiembro();
  if (!m || m.rol !== 'coordinador') return <Redirect href="/invitacion" />;

  const lideres = miembrosDe(m.candidato, { rol: 'lider', superior: m.id }).map((l) => l.id);
  const porAprobar =
    solicitudesDe(m.candidato, 'pendiente').filter((v) => lideres.includes(v.propuestaPor)).length +
    colaboradoresDe({ candidato: m.candidato, estado: 'por_verificar' }).filter((c) => lideres.includes(c.lider)).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontFamily: fuentes.semibold },
        tabBarStyle: Platform.OS === 'web' ? { borderTopColor: colors.border, height: 64, paddingBottom: 8 } : { borderTopColor: colors.border },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Mi zona', tabBarIcon: ({ color, size }) => <Ionicons name="location" color={color} size={size} /> }} />
      <Tabs.Screen
        name="aprobar"
        options={{
          title: 'Aprobar',
          tabBarBadge: porAprobar || undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.onAccent },
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} /> }} />
      <Tabs.Screen name="lideres" options={{ title: 'Líderes', tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} /> }} />
      <Tabs.Screen name="tarea" options={{ href: null }} />
    </Tabs>
  );
}
