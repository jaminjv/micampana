import { router } from 'expo-router';
import { View } from 'react-native';

import { PostCard } from '@/components/cards';
import { Text } from '@/components/Texto';
import { Button, Card, Screen, Small, TopBar } from '@/components/ui';
import { comentariosDe, publicacionesDe, reaccionesDe, useDatos } from '@/data/repo';
import { useMiCampana } from '@/state/app';
import { type } from '@/theme';

/** Lo que el candidato ha publicado en el feed, con reacciones y comentarios para responder. */
export default function Publicaciones() {
  const c = useMiCampana();
  useDatos();
  if (!c) {
    return (
      <Screen oscura header={<TopBar oscura title="Publicaciones" />}>
        <Small>Crea tu perfil para publicar en el feed.</Small>
      </Screen>
    );
  }
  const lista = publicacionesDe(c.id);
  const totales = lista.reduce(
    (t, p) => {
      const r = reaccionesDe(p.id);
      return { aFavor: t.aFavor + r.aFavor, enContra: t.enContra + r.enContra, comentarios: t.comentarios + comentariosDe(p.id).length };
    },
    { aFavor: 0, enContra: 0, comentarios: 0 },
  );

  return (
    <Screen
      oscura
      header={
        <TopBar
          oscura
          title="Publicaciones"
          subtitle={`${totales.aFavor} a favor · ${totales.enContra} en contra · ${totales.comentarios} comentarios`}
        />
      }
      footer={c.etapa === 'candidato' ? <Button label="Publicar en el feed" icon="add" onPress={() => router.push('/campana/publicar')} /> : undefined}>
      {lista.length === 0 ? (
        <Card>
          <Text style={type.h3}>Aún no has publicado</Text>
          <Small>
            {c.etapa === 'candidato'
              ? 'Publica un evento o un mensaje: aquí verás las reacciones y los comentarios de la gente.'
              : 'Publicar en el feed se habilita al ser candidato.'}
          </Small>
        </Card>
      ) : null}
      {lista.map((p) => (
        <View key={p.id}>
          <PostCard pub={p} soloLectura asistire={false} onAsistire={() => {}} />
        </View>
      ))}
    </Screen>
  );
}
