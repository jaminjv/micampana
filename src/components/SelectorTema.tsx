import { Pressable, View } from 'react-native';

import { useTema } from '@/state/tema';
import { colors, type PreferenciaTema } from '@/theme';
import { Text } from './Texto';
import { Ionicons, Segmented, Small } from './ui';

/** Apariencia: igual que el teléfono, clara u oscura. */
export function SelectorTema() {
  const { preferencia, cambiarTema } = useTema();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>Apariencia</Text>
      <Segmented<PreferenciaTema>
        value={preferencia}
        onChange={cambiarTema}
        options={[
          { value: 'sistema', label: 'Como el teléfono' },
          { value: 'claro', label: 'Clara' },
          { value: 'oscuro', label: 'Oscura' },
        ]}
      />
      <Small>Cambia los colores de toda la app.</Small>
    </View>
  );
}

/** Botón redondo de sol / luna para cambiar rápido entre claro y oscuro. */
export function BotonTema({ color = colors.ink }: { color?: string }) {
  const { oscuro, cambiarTema } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={oscuro ? 'Usar apariencia clara' : 'Usar apariencia oscura'}
      hitSlop={10}
      onPress={() => cambiarTema(oscuro ? 'claro' : 'oscuro')}
      style={({ pressed }) => [
        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.segmented },
        pressed && { transform: [{ scale: 0.92 }] },
      ]}>
      <Ionicons name={oscuro ? 'sunny' : 'moon'} size={20} color={color} />
    </Pressable>
  );
}
