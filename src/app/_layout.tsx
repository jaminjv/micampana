import {
  Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, useFonts,
} from '@expo-google-fonts/outfit';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AvisoGuardado, EsperarCarga } from '@/components/EstadoConexion';
import { AppProvider } from '@/state/app';
import { TemaProvider } from '@/state/tema';
import { colors, esOscuro } from '@/theme';

// La pantalla de inicio se queda hasta que carga la tipografía de la marca.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fuentesListas, errorFuentes] = useFonts({ Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold });
  const listo = fuentesListas || !!errorFuentes;

  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  if (!listo) return null;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <TemaProvider>
          <StatusBar style={esOscuro() ? 'light' : 'dark'} />
          <EsperarCarga>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
            <AvisoGuardado />
          </EsperarCarga>
        </TemaProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
