import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AlcancePicker, alcanceCompleto } from '@/components/AlcancePicker';
import {
  Body, Button, Chip, Field, Notice, OptionCard, Screen, Segmented, Small, Title, TopBar,
} from '@/components/ui';
import { anunciarPropuesta, propuestasDeCampana, publicarEvento, publicarMensaje } from '@/data/repo';
import type { Alcance } from '@/data/types';
import { diaCorto, horaTexto } from '@/lib/fechas';
import { useMiCampana } from '@/state/app';
import { colors, type } from '@/theme';

type Tipo = 'evento' | 'propuesta' | 'mensaje';

const HORAS = [7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19];

/** Los próximos 14 días, a medianoche. */
function proximosDias(): Date[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Array.from({ length: 14 }, (_, i) => new Date(hoy.getTime() + i * 86400_000));
}

function etiquetaDia(d: Date, i: number): string {
  if (i === 0) return 'Hoy';
  if (i === 1) return 'Mañana';
  const { dia, num } = diaCorto(d.toISOString());
  return `${dia.charAt(0)}${dia.slice(1).toLowerCase()} ${num}`;
}

/** Publicar en el feed ciudadano: un evento público, una propuesta o un mensaje. */
export default function PublicarEnFeed() {
  const c = useMiCampana();
  const [tipo, setTipo] = useState<Tipo>('evento');
  const [alcance, setAlcance] = useState<Alcance>();
  const [texto, setTexto] = useState('');
  const [titulo, setTitulo] = useState('');
  const [lugar, setLugar] = useState('');
  const [dia, setDia] = useState<number>();
  const [hora, setHora] = useState<number>();
  const [propuesta, setPropuesta] = useState<string>();
  const [listo, setListo] = useState(false);
  const dias = useMemo(proximosDias, []);

  if (!c || c.etapa !== 'candidato') {
    return (
      <Screen header={<TopBar title="Publicar en el feed" />}>
        <Notice icon="lock-closed" tone="warn">
          Publicar en el feed se habilita al ser candidato: la ley solo permite propaganda electoral a las candidaturas inscritas.
        </Notice>
      </Screen>
    );
  }

  const territorio = alcance ?? alcanceCompleto(c);
  const publicadas = propuestasDeCampana(c.id).filter((p) => p.estado === 'publicada');

  const fechaIso = () => {
    if (dia === undefined || hora === undefined) return undefined;
    const f = new Date(dias[dia]);
    f.setHours(hora, 0, 0, 0);
    return f.toISOString();
  };
  const fechaFutura = (() => {
    const f = fechaIso();
    return !!f && new Date(f).getTime() > Date.now();
  })();

  const valido =
    tipo === 'evento'
      ? titulo.trim().length >= 5 && lugar.trim().length >= 3 && fechaFutura && territorio.ids.length > 0
      : tipo === 'propuesta'
        ? !!propuesta
        : texto.trim().length >= 10 && territorio.ids.length > 0;

  const publicar = () => {
    if (tipo === 'evento') {
      publicarEvento(c.id, { titulo: titulo.trim(), fecha: fechaIso()!, lugar: lugar.trim(), alcance: territorio }, texto.trim());
    } else if (tipo === 'propuesta') {
      anunciarPropuesta(c.id, propuesta!);
    } else {
      publicarMensaje(c.id, texto.trim(), territorio);
    }
    setListo(true);
  };

  if (listo) {
    return (
      <Screen background={colors.surface} header={<TopBar title="Publicar en el feed" />}>
        <Notice icon="checkmark-circle" tone="ok">Publicado. Ya está en el feed de los ciudadanos de tu región.</Notice>
        <Body>El feed muestra a todos los candidatos en orden cronológico: nadie aparece primero por pagar más.</Body>
        <Button label="Volver al panel" onPress={() => router.back()} />
        <Button
          label="Publicar otra cosa"
          variant="secondary"
          onPress={() => {
            setListo(false);
            setTexto('');
            setTitulo('');
            setLugar('');
            setDia(undefined);
            setHora(undefined);
            setPropuesta(undefined);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      background={colors.surface}
      header={<TopBar title="Publicar en el feed" />}
      footer={<Button label="Publicar" disabled={!valido} onPress={publicar} />}>
      <Segmented<Tipo>
        value={tipo}
        onChange={setTipo}
        options={[
          { value: 'evento', label: 'Evento' },
          { value: 'propuesta', label: 'Propuesta' },
          { value: 'mensaje', label: 'Mensaje' },
        ]}
      />

      {tipo === 'evento' ? (
        <>
          <Field label="Nombre del evento" value={titulo} onChangeText={setTitulo} placeholder="Ej. Encuentro con la comunidad" />
          <View style={{ gap: 8 }}>
            <Text style={type.label}>Día</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {dias.map((d, i) => <Chip key={i} label={etiquetaDia(d, i)} selected={dia === i} onPress={() => setDia(i)} />)}
            </ScrollView>
          </View>
          <View style={{ gap: 8 }}>
            <Text style={type.label}>Hora</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {HORAS.map((h) => {
                const f = new Date();
                f.setHours(h, 0, 0, 0);
                return <Chip key={h} label={horaTexto(f.toISOString())} selected={hora === h} onPress={() => setHora(h)} />;
              })}
            </ScrollView>
            {dia !== undefined && hora !== undefined && !fechaFutura ? (
              <Small style={{ color: colors.warnFg }}>Esa hora ya pasó. Elige una más tarde.</Small>
            ) : null}
          </View>
          <Field label="Lugar" value={lugar} onChangeText={setLugar} placeholder="Ej. Salón comunal El Prado" />
          <Field label="Texto" value={texto} onChangeText={setTexto} placeholder="Invita a la gente: de qué se va a hablar." multiline maxLength={500} />
          <Small>Los ciudadanos podrán marcar "Asistiré". Las piezas gráficas de marketing llegan en la siguiente fase.</Small>
        </>
      ) : null}

      {tipo === 'propuesta' ? (
        publicadas.length === 0 ? (
          <Notice icon="information-circle" tone="primary">
            Aún no tienes propuestas publicadas. Publica una desde Mis propuestas y aparecerá aquí.
          </Notice>
        ) : (
          <View style={{ gap: 10 }}>
            <Title>¿Cuál quieres recordar?</Title>
            <Small>Cada propuesta ya salió en el feed al publicarla. Aquí puedes volver a anunciarla.</Small>
            {publicadas.map((p) => (
              <OptionCard
                key={p.id}
                title={p.titulo}
                description={`${p.tema} · ${p.alcance.etiqueta}`}
                selected={propuesta === p.id}
                onPress={() => setPropuesta(p.id)}
              />
            ))}
            <Small>La ven los ciudadanos del territorio de la propuesta.</Small>
          </View>
        )
      ) : null}

      {tipo === 'mensaje' ? (
        <Field label="Mensaje" value={texto} onChangeText={setTexto} placeholder="Escríbele a la gente de tu región." multiline maxLength={500} hint={`${texto.trim().length}/500`} />
      ) : null}

      {tipo !== 'propuesta' ? (
        <AlcancePicker
          campana={c}
          value={territorio}
          onChange={setAlcance}
          ayuda={(e) => `Lo verán los ciudadanos registrados en ${e}.`}
        />
      ) : null}
    </Screen>
  );
}
