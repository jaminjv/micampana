import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AlcancePicker, alcanceCompleto } from '@/components/AlcancePicker';
import { CompromisoCard } from '@/components/agenda';
import { fechaCompleta, SelectorFecha } from '@/components/SelectorFecha';
import { Text } from '@/components/Texto';
import { Badge, Button, Card, CheckRow, Chip, ChipRow, Field, Notice, Row, Screen, Small, TopBar } from '@/components/ui';
import { TIPOS_ACTIVIDAD } from '@/data/catalogos';
import { actualizarActividad, compromisosDe, crearActividad, cruces, getActividad } from '@/data/repo';
import type { Actividad, Alcance, TipoActividad } from '@/data/types';
import { diaRelativo, horaTexto } from '@/lib/fechas';
import { useMiCampana } from '@/state/app';
import { colors, type } from '@/theme';

const soloNumero = (t: string) => t.replace(/\D/g, '').slice(0, 5);

/** Nueva actividad, o el detalle de una existente (realizar, reprogramar, cancelar, compromisos). */
export default function PantallaActividad() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const c = useMiCampana();
  const a = id ? getActividad(id) : undefined;

  if (!c || c.etapa !== 'candidato' || (a && a.candidato !== c.id)) {
    return (
      <Screen oscura header={<TopBar oscura title="Actividad" />}>
        <Notice icon="lock-closed" tone="warn">La agenda se habilita al ser candidato.</Notice>
      </Screen>
    );
  }
  if (id && !a) {
    return (
      <Screen oscura header={<TopBar oscura title="Actividad" />}>
        <Small>No encontramos esta actividad.</Small>
      </Screen>
    );
  }
  return a ? <Detalle a={a} /> : <Nueva campanaId={c.id} />;
}

/* ---------- Nueva actividad ---------- */

function Nueva({ campanaId }: { campanaId: string }) {
  const c = useMiCampana()!;
  const [tipo, setTipo] = useState<TipoActividad>('visita');
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState<string>();
  const [lugar, setLugar] = useState('');
  const [comunidad, setComunidad] = useState<Alcance>();
  const [responsable, setResponsable] = useState('');
  const [esperados, setEsperados] = useState('');
  const [publicar, setPublicar] = useState(false);
  const [texto, setTexto] = useState('');

  const territorio = comunidad ?? alcanceCompleto(c);
  const choques = fechaCompleta(fecha) ? cruces(campanaId, fecha) : [];
  const valido = titulo.trim().length >= 3 && lugar.trim().length >= 3 && fechaCompleta(fecha) && territorio.ids.length > 0;

  const guardar = () => {
    if (!fechaCompleta(fecha)) return;
    crearActividad(
      campanaId,
      {
        tipo, titulo: titulo.trim(), fecha, lugar: lugar.trim(), comunidad: territorio,
        responsable: responsable.trim() || undefined,
        asistentesEsperados: esperados ? Number(esperados) : undefined,
      },
      publicar ? { texto: texto.trim() } : undefined,
    );
    router.back();
  };

  return (
    <Screen
      oscura
      background={colors.surface}
      header={<TopBar oscura title="Nueva actividad" />}
      footer={<Button label={publicar ? 'Agregar y publicar en el feed' : 'Agregar a la agenda'} disabled={!valido} onPress={guardar} />}>
      <View style={{ gap: 8 }}>
        <Text style={type.label}>Tipo</Text>
        <ChipRow>
          {(Object.keys(TIPOS_ACTIVIDAD) as TipoActividad[]).map((t) => (
            <Chip key={t} label={TIPOS_ACTIVIDAD[t]} selected={tipo === t} onPress={() => setTipo(t)} />
          ))}
        </ChipRow>
      </View>
      <Field
        label="Nombre"
        value={titulo}
        onChangeText={setTitulo}
        placeholder={tipo === 'visita' ? 'Ej. Visita barrio El Prado' : 'Ej. Reunión con comerciantes'}
      />
      <SelectorFecha value={fecha} onChange={setFecha} dias={45} />
      {choques.length ? (
        <Notice icon="alert-circle" tone="warn">
          {`Se cruza con "${choques[0].titulo}" a las ${horaTexto(choques[0].fecha)}.`}
        </Notice>
      ) : null}
      <Field label="Lugar" value={lugar} onChangeText={setLugar} placeholder="Ej. Salón comunal" />
      <AlcancePicker campana={c} value={territorio} onChange={setComunidad} titulo="¿En qué comunidad?" />
      <Field label="Responsable (opcional)" value={responsable} onChangeText={setResponsable} placeholder="Quién organiza o recibe" />
      {tipo === 'visita' || tipo === 'evento' ? (
        <Field
          label="Asistentes esperados (opcional)"
          value={esperados}
          onChangeText={(t) => setEsperados(soloNumero(t))}
          keyboardType="number-pad"
        />
      ) : null}

      <Card style={{ backgroundColor: colors.background, borderWidth: 0, boxShadow: 'none' }}>
        <CheckRow checked={publicar} onToggle={() => setPublicar((v) => !v)}>
          <View style={{ gap: 2 }}>
            <Text style={type.label}>Evento público</Text>
            <Small>Publicarlo en el feed para que los ciudadanos de esa comunidad marquen "Asistiré".</Small>
          </View>
        </CheckRow>
        {publicar ? (
          <Field label="Texto para el feed" value={texto} onChangeText={setTexto} placeholder="Invita a la gente: de qué se va a hablar." multiline maxLength={500} />
        ) : null}
      </Card>
      <Small>La agenda es interna: solo la ve tu equipo. Lo que no marques como público no lo ven los ciudadanos.</Small>
    </Screen>
  );
}

/* ---------- Detalle ---------- */

function Detalle({ a }: { a: Actividad }) {
  const [modo, setModo] = useState<'ver' | 'realizar' | 'reprogramar'>('ver');
  const [reales, setReales] = useState(a.asistentesReales ? String(a.asistentesReales) : '');
  const [notas, setNotas] = useState(a.notas ?? '');
  const [fecha, setFecha] = useState<string>();
  const compromisos = compromisosDe(a.candidato, { actividad: a.id });
  const programada = a.estado === 'programada';
  const choques = fechaCompleta(fecha) ? cruces(a.candidato, fecha, a.id) : [];

  return (
    <Screen oscura header={<TopBar oscura title={TIPOS_ACTIVIDAD[a.tipo]} subtitle={a.comunidad.etiqueta} />}>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={type.small}>{`${diaRelativo(a.fecha)} · ${horaTexto(a.fecha)}`}</Text>
          {a.estado === 'realizada' ? <Badge label="Realizada" tone="ok" /> : null}
          {a.estado === 'cancelada' ? <Badge label="Cancelada" tone="neutral" /> : null}
          {programada ? <Badge label="Programada" /> : null}
        </Row>
        <Text style={type.title}>{a.titulo}</Text>
        <Small>{a.lugar}</Small>
        {a.responsable ? <Small>{`Responsable: ${a.responsable}`}</Small> : null}
        {a.asistentesEsperados !== undefined || a.asistentesReales !== undefined ? (
          <Small>
            {[
              a.asistentesEsperados !== undefined ? `${a.asistentesEsperados} esperados` : '',
              a.asistentesReales !== undefined ? `${a.asistentesReales} asistieron` : '',
            ].filter(Boolean).join(' · ')}
          </Small>
        ) : null}
        {a.evento ? <Badge label="Publicada en el feed" tone="accent" /> : null}
        {a.notas && modo !== 'realizar' ? (
          <View style={{ gap: 4, paddingTop: 4 }}>
            <Text style={type.label}>Notas</Text>
            <Text style={type.body}>{a.notas}</Text>
          </View>
        ) : null}
      </Card>

      {modo === 'realizar' ? (
        <Card>
          <Text style={type.h3}>¿Cómo te fue?</Text>
          <Field label="¿Cuántas personas asistieron?" value={reales} onChangeText={(t) => setReales(soloNumero(t))} keyboardType="number-pad" />
          <Field label="Notas de la visita" value={notas} onChangeText={setNotas} placeholder="Temas que planteó la comunidad, acuerdos, pendientes." multiline maxLength={1500} />
          <Button
            label="Guardar"
            onPress={() => {
              actualizarActividad(a.id, { estado: 'realizada', asistentesReales: reales ? Number(reales) : undefined, notas: notas.trim() || undefined });
              setModo('ver');
            }}
          />
          <Button label="Cancelar" variant="secondary" onPress={() => setModo('ver')} />
        </Card>
      ) : null}

      {modo === 'reprogramar' ? (
        <Card>
          <SelectorFecha value={fecha} onChange={setFecha} dias={45} />
          {choques.length ? (
            <Notice icon="alert-circle" tone="warn">{`Se cruza con "${choques[0].titulo}" a las ${horaTexto(choques[0].fecha)}.`}</Notice>
          ) : null}
          <Button
            label="Guardar nueva fecha"
            disabled={!fechaCompleta(fecha)}
            onPress={() => {
              if (fechaCompleta(fecha)) actualizarActividad(a.id, { fecha });
              setModo('ver');
            }}
          />
          <Button label="Cancelar" variant="secondary" onPress={() => setModo('ver')} />
          {a.evento ? <Small>El evento publicado en el feed conserva su fecha; avísale a la gente con un mensaje.</Small> : null}
        </Card>
      ) : null}

      {modo === 'ver' ? (
        <View style={{ gap: 10 }}>
          {programada ? <Button label="Marcar como realizada" onPress={() => setModo('realizar')} /> : null}
          {a.estado === 'realizada' ? <Button label="Editar asistencia y notas" variant="secondary" onPress={() => setModo('realizar')} /> : null}
          {programada ? (
            <Row gap={8}>
              <Button label="Reprogramar" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => setModo('reprogramar')} />
              <Button label="Cancelar actividad" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => actualizarActividad(a.id, { estado: 'cancelada' })} />
            </Row>
          ) : null}
          {a.estado === 'cancelada' ? (
            <Button label="Volver a programarla" variant="secondary" onPress={() => actualizarActividad(a.id, { estado: 'programada' })} />
          ) : null}
        </View>
      ) : null}

      <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={type.h2}>Compromisos</Text>
        <Small>{compromisos.length ? `${compromisos.length} registrados` : ''}</Small>
      </Row>
      {compromisos.map((m) => (
        <CompromisoCard key={m.id} c={m} onPress={() => router.push({ pathname: '/campana/compromiso', params: { id: m.id } })} />
      ))}
      {compromisos.length === 0 ? <Small>Lo que la comunidad pida y la campaña se comprometa a impulsar, regístralo aquí.</Small> : null}
      <Button
        label="Registrar compromiso"
        variant="secondary"
        onPress={() => router.push({ pathname: '/campana/compromiso', params: { actividad: a.id } })}
      />
    </Screen>
  );
}
