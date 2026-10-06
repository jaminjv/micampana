import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { PostCard } from '@/components/cards';
import { ComentarioFila } from '@/components/comentarios';
import { TextInput } from '@/components/Texto';
import { Body, Button, Card, Notice, Screen, Small, TopBar } from '@/components/ui';
import { nombreMunicipio, nombreZona } from '@/data/catalogos';
import { comentar, comentariosDe, getCandidato, getPublicacion, MAX_COMENTARIO, useDatos } from '@/data/repo';
import { useApp, useMiCampana } from '@/state/app';
import { colors, radius, estilos } from '@/theme';

/**
 * Comentarios de una publicación del feed. El ciudadano comenta con su nombre
 * corto y su barrio; el candidato responde como campaña y puede ocultar
 * comentarios ofensivos en sus publicaciones.
 */
export default function Comentarios() {
  const { pub: id } = useLocalSearchParams<{ pub: string }>();
  const { ciudadano, alternarAsistire } = useApp();
  const campana = useMiCampana();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string>();
  useDatos();

  const pub = getPublicacion(id ?? '');
  const c = pub ? getCandidato(pub.candidato) : undefined;
  if (!pub || !c) {
    return (
      <Screen header={<TopBar title="Comentarios" />}>
        <Body>Esta publicación ya no está disponible.</Body>
      </Screen>
    );
  }

  const esMia = campana?.id === pub.candidato;
  const lista = comentariosDe(pub.id, esMia);
  const puedeComentar = esMia || !!ciudadano;

  const enviar = () => {
    setError(undefined);
    try {
      if (esMia) {
        comentar(pub.id, texto, { nombre: c.nombre, foto: c.foto, deCampana: true });
      } else if (ciudadano) {
        const ub = ciudadano.ubicacion;
        const lugar = ub.barrio ? `Barrio ${nombreZona(ub.barrio)}` : nombreMunicipio(ub.municipio);
        comentar(pub.id, texto, { nombre: ciudadano.nombre, lugar, foto: ciudadano.foto, deCampana: false });
      }
      setTexto('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        oscura={esMia}
        header={<TopBar oscura={esMia} title="Comentarios" subtitle={`${lista.length} ${lista.length === 1 ? 'comentario' : 'comentarios'}`} />}
        footer={
          puedeComentar ? (
            <View style={s.escribir}>
              <TextInput
                accessibilityLabel={esMia ? 'Responder como campaña' : 'Escribe un comentario'}
                value={texto}
                onChangeText={setTexto}
                placeholder={esMia ? 'Responde como campaña…' : 'Escribe un comentario…'}
                placeholderTextColor={colors.faint}
                multiline
                maxLength={MAX_COMENTARIO}
                style={s.input}
              />
              <Button label={esMia ? 'Responder' : 'Comentar'} variant={esMia ? 'primary' : 'accent'} size="md" disabled={!texto.trim()} onPress={enviar} />
            </View>
          ) : (
            <Button label="Regístrate para comentar" variant="accent" onPress={() => router.push('/ciudadano/registro')} />
          )
        }>
        <PostCard
          pub={pub}
          soloLectura={esMia}
          sinRecientes
          asistire={pub.tipo === 'evento' && !!ciudadano?.asistire.includes(pub.evento)}
          onAsistire={alternarAsistire}
        />
        {error ? <Notice icon="warning" tone="danger">{error}</Notice> : null}
        {lista.length ? (
          <Card style={{ paddingVertical: 6, gap: 0 }}>
            {lista.map((x, i) => (
              <View key={x.id} style={i > 0 && s.separador}>
                <ComentarioFila c={x} puedeOcultar={esMia} />
              </View>
            ))}
          </Card>
        ) : (
          <Small style={{ textAlign: 'center' }}>{esMia ? 'Aún nadie comenta esta publicación.' : 'Sé el primero en comentar.'}</Small>
        )}
        <Small style={{ textAlign: 'center' }}>
          {esMia
            ? 'Puedes ocultar comentarios ofensivos; su autor sigue viéndolos. Responder con respeto también es campaña.'
            : 'Comenta con respeto. Se muestra tu nombre corto y tu barrio.'}
        </Small>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const s = estilos(() => ({
  escribir: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.ink,
    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.md, backgroundColor: colors.surface,
  },
  separador: { borderTopWidth: 1, borderTopColor: colors.divider },
}));
