import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AvisoGuardado, EsperarCarga } from '@/components/EstadoConexion';
import { AppProvider } from '@/state/app';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <EsperarCarga>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
          <AvisoGuardado />
        </EsperarCarga>
      </AppProvider>
    </SafeAreaProvider>
  );
}
