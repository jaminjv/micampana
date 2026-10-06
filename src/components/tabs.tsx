/** Barra de pestañas flotante de vidrio (ciudadano, coordinador y líder). */
import { createContext, useContext } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fuentes, radius, shadow } from '@/theme';
import { Vidrio } from './Vidrio';

const ALTO = 64;
const MARGEN = 12;

/** Lo ponen los layouts con pestañas: el contenido sabe que debe dejar espacio abajo. */
export const EnTabs = createContext(false);

/** Espacio que hay que dejar al final del contenido para que la barra flotante no lo tape. */
export function useEspacioTabs(): number {
  const enTabs = useContext(EnTabs);
  const insets = useSafeAreaInsets();
  return enTabs ? ALTO + MARGEN * 2 + insets.bottom : 0;
}

/** Opciones de las pestañas: flotan sobre el contenido como una cápsula de vidrio. */
export function useOpcionesTabs() {
  const insets = useSafeAreaInsets();
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: { fontSize: 12, fontFamily: fuentes.semibold },
    tabBarItemStyle: { paddingTop: 6 },
    tabBarStyle: {
      position: 'absolute' as const,
      left: 16,
      right: 16,
      bottom: insets.bottom + MARGEN,
      height: ALTO,
      paddingBottom: 8,
      borderTopWidth: 0,
      borderRadius: radius.pill,
      backgroundColor: 'transparent',
      elevation: 0,
      ...shadow.md,
    },
    safeAreaInsets: { bottom: 0 },
    tabBarBackground: () => <Vidrio interactivo style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]} />,
  };
}
