import { Image } from 'expo-image';
import { router, Stack, usePathname, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Texto';
import { Ionicons, type IconName } from '@/components/ui';
import { useMiCampana } from '@/state/app';
import { colors, radius } from '@/theme';

/** Desde este ancho (computador o tableta horizontal) se muestra la barra lateral. */
const ANCHO_SIDEBAR = 900;

interface Item { titulo: string; icon: IconName; destino: Href; ruta: string; soloCandidato?: boolean }

const ITEMS: Item[] = [
  { titulo: 'Panel', icon: 'grid', destino: '/campana', ruta: '/campana' },
  { titulo: 'Voces ciudadanas', icon: 'chatbubbles', destino: '/campana/voces', ruta: '/campana/voces' },
  { titulo: 'Propuestas', icon: 'document-text', destino: '/campana/propuestas', ruta: '/campana/propuesta', soloCandidato: true },
  { titulo: 'Publicar en el feed', icon: 'newspaper', destino: '/campana/publicar', ruta: '/campana/publicar', soloCandidato: true },
];

/**
 * Vistas del candidato. En el celular, cada pantalla lleva su cabecera oscura;
 * en pantallas anchas, una barra lateral en Azul Noche con el contenido en Gris Nube.
 */
export default function CampanaLayout() {
  const { width } = useWindowDimensions();
  const pila = <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
  if (width < ANCHO_SIDEBAR) return pila;
  return (
    <View style={s.fila}>
      <Sidebar />
      <View style={s.contenido}>{pila}</View>
    </View>
  );
}

function Sidebar() {
  const c = useMiCampana();
  const ruta = usePathname();
  const aspirante = c?.etapa === 'aspirante';

  return (
    <SafeAreaView edges={['top', 'bottom', 'left']} style={s.sidebar}>
      <ScrollView contentContainerStyle={{ gap: 24, padding: 20 }}>
        <Image source={require('@/../assets/images/logo-nexo-blanco.png')} style={s.logo} contentFit="contain" accessibilityLabel="nexo" />
        {c ? (
          <View style={{ gap: 2 }}>
            <Text style={s.nombre}>{c.nombre}</Text>
            <Text style={s.usuario}>{`@${c.usuario}`}</Text>
          </View>
        ) : null}
        <View style={{ gap: 4 }} accessibilityRole="menu">
          {ITEMS.map((it) => {
            const activo = it.ruta === '/campana' ? ruta === '/campana' : ruta.startsWith(it.ruta);
            const bloqueado = !!it.soloCandidato && aspirante;
            return (
              <Pressable
                key={it.titulo}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: activo, disabled: bloqueado }}
                disabled={bloqueado}
                onPress={() => router.navigate(it.destino)}
                style={({ pressed }) => [s.item, activo && s.itemActivo, pressed && !activo && s.itemPresionado]}>
                <Ionicons name={bloqueado ? 'lock-closed' : it.icon} size={20} color={activo ? '#FFFFFF' : colors.onNightMuted} />
                <Text style={[s.itemTexto, activo && { color: '#FFFFFF' }, bloqueado && { color: colors.nightBorder }]}>{it.titulo}</Text>
              </Pressable>
            );
          })}
          {c ? (
            <Pressable
              accessibilityRole="menuitem"
              onPress={() => router.push({ pathname: '/candidato/[usuario]', params: { usuario: c.usuario } })}
              style={({ pressed }) => [s.item, pressed && s.itemPresionado]}>
              <Ionicons name="person-circle" size={20} color={colors.onNightMuted} />
              <Text style={s.itemTexto}>Mi perfil público</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  fila: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  contenido: { flex: 1 },
  sidebar: { width: 260, backgroundColor: colors.night },
  logo: { width: 96, height: 24 },
  nombre: { fontSize: 16, fontWeight: '600', color: colors.onNight },
  usuario: { fontSize: 13, color: colors.onNightMuted },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingHorizontal: 12, borderRadius: radius.md },
  itemActivo: { backgroundColor: colors.primary },
  itemPresionado: { backgroundColor: colors.nightSoft },
  itemTexto: { fontSize: 15, fontWeight: '500', color: colors.onNightMuted },
});
