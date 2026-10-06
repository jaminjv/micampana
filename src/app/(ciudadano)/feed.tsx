import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEspacioTabs } from '@/components/tabs';
import { Vidrio } from '@/components/Vidrio';
import { PostCard } from '@/components/cards';
import { Chip, Small } from '@/components/ui';
import { APP_NAME } from '@/config';
import { nombreMunicipio, nombreZona } from '@/data/catalogos';
import { feedPara, useDatos, type FiltroFeed } from '@/data/repo';
import { useApp } from '@/state/app';
import { colors, esOscuro, estilos } from '@/theme';
import { Text } from '@/components/Texto';

const FILTROS: { value: FiltroFeed; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'siguiendo', label: 'Siguiendo' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'propuestas', label: 'Propuestas' },
];

/** Feed de la región del ciudadano, en orden cronológico. */
export default function Feed() {
  const espacio = useEspacioTabs();
  const { ciudadano, alternarAsistire } = useApp();
  const [filtro, setFiltro] = useState<FiltroFeed>('todos');
  // La cabecera de vidrio flota sobre el feed; la lista empieza debajo de ella.
  const [altoCabecera, setAltoCabecera] = useState(150);
  const insets = useSafeAreaInsets();
  useDatos();
  if (!ciudadano) return null;
  const ub = ciudadano.ubicacion;
  const items = feedPara(ub, filtro, ciudadano.siguiendo);
  const lugar = [nombreMunicipio(ub.municipio), ub.barrio ? `Barrio ${nombreZona(ub.barrio)}` : ''].filter(Boolean).join(' · ');

  return (
    <View style={s.root}>
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[s.list, { paddingTop: altoCabecera + 8, paddingBottom: espacio }]}
        scrollIndicatorInsets={{ top: altoCabecera }}
        renderItem={({ item, index }) => (
          // Las publicaciones entran deslizándose, una tras otra.
          <Animated.View entering={FadeInDown.delay(Math.min(index, 5) * 70).duration(420)}>
            <PostCard
              pub={item}
              asistire={item.tipo === 'evento' && ciudadano.asistire.includes(item.evento)}
              onAsistire={alternarAsistire}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>
              {filtro === 'siguiendo' ? 'Aún no sigues a ningún candidato' : 'Todavía no hay publicaciones en tu región'}
            </Text>
            <Small style={{ textAlign: 'center' }}>
              {filtro === 'siguiendo' ? 'Búscalos en la pestaña Buscar y toca Seguir.' : 'Cuando los candidatos de tu región publiquen, lo verás aquí.'}
            </Small>
          </View>
        }
        ListFooterComponent={items.length ? <Small style={s.footer}>Publicaciones en orden de llegada. Ningún candidato paga por aparecer primero.</Small> : null}
      />
      {/* Va después de la lista para quedar encima de ella también en Android. */}
      <Vidrio style={[s.header, { paddingTop: insets.top + 12 }]} intensidad={60}>
        <View onLayout={(e) => setAltoCabecera(e.nativeEvent.layout.height + insets.top + 24)} style={{ gap: 4 }}>
        <Image source={esOscuro() ? require('@/../assets/images/logo-nexo-blanco.png') : require('@/../assets/images/logo-nexo.png')} style={s.logo} contentFit="contain" accessibilityLabel={APP_NAME} />
        <Small>{lugar}</Small>
        <View style={s.filtros}>
          {FILTROS.map((f) => (
            <Chip key={f.value} label={f.label} selected={filtro === f.value} dark onPress={() => setFiltro(f.value)} />
          ))}
        </View>
        </View>
      </Vidrio>
    </View>
  );
}

const s = estilos(() => ({
  root: { flex: 1, backgroundColor: colors.background },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, paddingHorizontal: 20, paddingBottom: 12, borderWidth: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
  logo: { width: 96, height: 24 },
  filtros: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  list: { padding: 20, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  empty: { alignItems: 'center', gap: 6, padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.ink, textAlign: 'center' },
  footer: { textAlign: 'center', paddingVertical: 12 },
}));
