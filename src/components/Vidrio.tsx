import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, conAlfa, esOscuro } from '@/theme';

/** En iPhone con iOS 26 o más reciente se usa el Liquid Glass del sistema. */
const glassNativo = Platform.OS === 'ios' && isLiquidGlassAvailable();

/**
 * Superficie de vidrio: deja ver borroso lo que pasa por debajo.
 * iOS 26+: Liquid Glass nativo. iOS anterior y web: desenfoque con un velo
 * del color de superficie. Android: velo casi opaco (el desenfoque allí es lento).
 */
export function Vidrio({
  children, style, intensidad = 50, interactivo,
}: { children?: ReactNode; style?: StyleProp<ViewStyle>; intensidad?: number; interactivo?: boolean }) {
  const borde: ViewStyle = { borderWidth: 1, borderColor: conAlfa('#FFFFFF', esOscuro() ? 0.08 : 0.6), overflow: 'hidden' };
  if (glassNativo) {
    return (
      <GlassView style={style} glassEffectStyle="regular" isInteractive={interactivo} colorScheme={esOscuro() ? 'dark' : 'light'}>
        {children}
      </GlassView>
    );
  }
  if (Platform.OS === 'android') {
    return <View style={[borde, { backgroundColor: conAlfa(colors.surface, 0.96) }, style]}>{children}</View>;
  }
  return (
    <BlurView intensity={intensidad} tint={esOscuro() ? 'dark' : 'light'} style={[borde, { backgroundColor: conAlfa(colors.surface, esOscuro() ? 0.55 : 0.6) }, style]}>
      {children}
    </BlurView>
  );
}
