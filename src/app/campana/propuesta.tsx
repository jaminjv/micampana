import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AlcancePicker, alcanceCompleto } from '@/components/AlcancePicker';
import { AvisoPermanencia } from '@/components/AvisoPermanencia';
import { PropuestaCard } from '@/components/cards';
import { Badge, Button, Card, Chip, ChipRow, Field, Ionicons, Notice, Row, Screen, Small, TopBar } from '@/components/ui';
import { TEMAS } from '@/data/catalogos';
import {
  borrarBorrador, corregirPropuesta, crearBorrador, editarBorrador, getCompromiso, getPropuesta, incluirEnPropuesta,
  publicarPropuesta, retirarPropuesta,
  type DatosPropuesta,
} from '@/data/repo';
import type { Alcance, Tema } from '@/data/types';
import { useMiCampana } from '@/state/app';
import { colors, type } from '@/theme';
import { Text } from '@/components/Texto';

/**
 * Nueva propuesta, borrador por publicar, o propuesta publicada para corregir o retirar.
 * Publicar y corregir siempre pasan por la advertencia de permanencia.
 */
export default function EditorPropuesta() {
  const { id, compromiso: compromisoId } = useLocalSearchParams<{ id?: string; compromiso?: string }>();
  const c = useMiCampana();
  const original = id ? getPropuesta(id) : undefined;
  // Una propuesta nueva puede nacer de un compromiso registrado en una visita.
  const compromiso = !id && compromisoId ? getCompromiso(compromisoId) : undefined;

  const [titulo, setTitulo] = useState(original?.titulo ?? compromiso?.que.slice(0, 90) ?? '');
  const [resumen, setResumen] = useState(original?.resumen ?? '');
  const [tema, setTema] = useState<Tema | undefined>(original?.tema);
  const [alcance, setAlcance] = useState<Alcance | undefined>(original?.alcance ?? compromiso?.comunidad);
  const [aviso, setAviso] = useState(false);
  const [retirando, setRetirando] = useState(false);
  const [motivo, setMotivo] = useState('');

  if (!c || c.etapa !== 'candidato' || (original && original.candidato !== c.id)) {
    return (
      <Screen oscura header={<TopBar oscura title="Propuesta" />}>
        <Notice icon="lock-closed" tone="warn">Las propuestas públicas se habilitan al ser candidato.</Notice>
      </Screen>
    );
  }

  const territorio = alcance ?? alcanceCompleto(c);
  const estado = original?.estado;
  const publicada = estado === 'publicada';

  if (estado === 'retirada' && original) {
    return (
      <Screen oscura header={<TopBar oscura title="Propuesta retirada" />}>
        <PropuestaCard p={original} />
        <Small>Una propuesta retirada sigue visible en tu perfil con tu explicación. No se puede borrar ni volver a publicar.</Small>
      </Screen>
    );
  }

  const datos = (): DatosPropuesta | null =>
    tema && territorio.ids.length ? { titulo: titulo.trim(), resumen: resumen.trim(), tema, alcance: territorio } : null;
  const completa = titulo.trim().length >= 5 && resumen.trim().length >= 20 && !!datos();
  const cambio = !!original && (titulo.trim() !== original.titulo || resumen.trim() !== original.resumen);

  const guardarBorrador = () => {
    const d = datos();
    if (!d) return;
    if (original) editarBorrador(original.id, d);
    else {
      const pid = crearBorrador(c.id, d);
      if (compromiso) incluirEnPropuesta(compromiso.id, pid);
    }
    router.back();
  };

  const confirmar = () => {
    if (publicada && original) {
      corregirPropuesta(original.id, titulo.trim(), resumen.trim(), true);
    } else {
      const d = datos();
      if (!d) return;
      let pid = original?.id;
      if (pid) editarBorrador(pid, d);
      else pid = crearBorrador(c.id, d);
      publicarPropuesta(pid, true);
      if (compromiso) incluirEnPropuesta(compromiso.id, pid);
    }
    setAviso(false);
    router.back();
  };

  const footer = publicada ? (
    <Button label="Guardar corrección" disabled={!cambio || !completa} onPress={() => setAviso(true)} />
  ) : (
    <>
      <Row gap={8} style={{ alignItems: 'flex-start' }}>
        <Ionicons name="lock-closed-outline" size={16} color={colors.inkSoft} style={{ marginTop: 2 }} />
        <Small style={{ flex: 1, color: colors.inkSoft }}>
          Una vez publicada no se podrá borrar. Las correcciones quedan visibles para los ciudadanos.
        </Small>
      </Row>
      <Row gap={8}>
        <Button label="Guardar borrador" variant="secondary" disabled={!completa} onPress={guardarBorrador} style={{ flex: 1 }} />
        <Button label="Publicar" disabled={!completa} onPress={() => setAviso(true)} style={{ flex: 1 }} />
      </Row>
    </>
  );

  return (
    <Screen oscura
      background={colors.surface}
      header={<TopBar oscura title={publicada ? 'Corregir propuesta' : original ? 'Revisar borrador' : 'Nueva propuesta'} />}
      footer={retirando ? undefined : footer}>
      {compromiso ? (
        <Notice icon="git-branch" tone="ok">{`Viene del compromiso con ${compromiso.conQuien}. Al guardarla, el compromiso queda en el programa.`}</Notice>
      ) : null}
      {publicada ? (
        <Notice icon="information-circle" tone="primary">
          Está publicada. Puedes corregir el título y la explicación; la versión anterior quedará visible.
        </Notice>
      ) : null}

      <Field
        label="Título"
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Ej. Pavimentar la vía principal del barrio"
        maxLength={90}
      />

      {publicada ? (
        <Card style={{ backgroundColor: colors.background, borderWidth: 0 }}>
          <Row gap={8}>
            <Badge label={original!.tema} />
            <Small>{original!.alcance.etiqueta}</Small>
          </Row>
          <Small>El tema y el territorio de una propuesta publicada no cambian.</Small>
        </Card>
      ) : (
        <>
          <View style={{ gap: 8 }}>
            <Text style={type.label}>Tema</Text>
            <ChipRow>
              {TEMAS.map((t) => <Chip key={t} label={t} selected={tema === t} onPress={() => setTema(t)} />)}
            </ChipRow>
          </View>
          <AlcancePicker
            campana={c}
            value={territorio}
            onChange={setAlcance}
            ayuda={(e) => `Los ciudadanos de ${e} la verán en "¿Qué propone para ti?".`}
          />
        </>
      )}

      <Field
        label="Explícala en pocas palabras"
        value={resumen}
        onChangeText={setResumen}
        placeholder="Qué vas a hacer, para quién y cómo."
        multiline
        maxLength={600}
        hint={`${resumen.trim().length}/600 · mínimo 20 caracteres`}
      />

      {!publicada ? (
        <Small>Fotos y videos llegan en la siguiente fase.</Small>
      ) : null}

      {original && estado === 'borrador' ? (
        <Button
          label="Borrar borrador"
          variant="ghost"
          onPress={() => {
            borrarBorrador(original.id);
            router.back();
          }}
        />
      ) : null}

      {publicada && original ? (
        <Card style={{ gap: 12 }}>
          <Text style={type.h3}>¿Cambiaste de posición?</Text>
          <Small>
            Puedes marcarla como retirada. Seguirá visible en tu perfil con tu explicación, para que la gente sepa por qué.
          </Small>
          {retirando ? (
            <>
              <Field
                label="Explicación pública"
                value={motivo}
                onChangeText={setMotivo}
                placeholder="Por qué la retiras"
                multiline
                maxLength={400}
                hint="Mínimo 20 caracteres. La verán los ciudadanos."
              />
              <Button
                label="Marcar como retirada"
                disabled={motivo.trim().length < 20}
                onPress={() => {
                  retirarPropuesta(original.id, motivo.trim());
                  router.back();
                }}
              />
              <Button label="Cancelar" variant="secondary" onPress={() => setRetirando(false)} />
            </>
          ) : (
            <Button label="Retirar propuesta" variant="secondary" size="md" onPress={() => setRetirando(true)} />
          )}
        </Card>
      ) : null}

      <AvisoPermanencia
        visible={aviso}
        modo={publicada ? 'corregir' : 'publicar'}
        territorio={territorio.etiqueta}
        onConfirmar={confirmar}
        onCancelar={() => setAviso(false)}
      />
    </Screen>
  );
}
