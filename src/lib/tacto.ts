import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Vibración corta al tocar (reacciones, cambios de estado). En la web no hace nada. */
export function tocar(fuerte = false) {
  if (Platform.OS === 'web') return;
  (fuerte ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) : Haptics.selectionAsync()).catch(() => {});
}
