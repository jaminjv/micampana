import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Body, Button, Chip, ChipRow, Field, Notice, Screen, Segmented, Small, Title, TopBar } from '@/components/ui';
import { nombreMunicipio, nombreZona, TEMAS } from '@/data/catalogos';
import { getCandidatoPorUsuario } from '@/data/repo';
import type { Tema, TipoAporte } from '@/data/types';
import { useApp } from '@/state/app';
import { colors } from '@/theme';
import { Text } from '@/components/Texto';

const PLACEHOLDER: Record<TipoAporte, string> = {
  idea: 'Sé concreto: qué propones, para quién y dónde.',
  consejo: '¿Qué debería tener en cuenta el candidato?',
  critica: '¿Qué no te gusta y qué harías distinto?',
  solicitud: '¿Qué necesita tu comunidad?',
};

/** Escribir un aporte a un candidato. */
export default function Escribir() {
  const { usuario } = useLocalSearchParams<{ usuario: string }>();
  const c = getCandidatoPorUsuario(usuario ?? '');
  const { enviarAporte, ciudadano } = useApp();
  const [tipo, setTipo] = useState<TipoAporte>('idea');
  const [tema, setTema] = useState<Tema>();
  const [texto, setTexto] = useState('');
  const [enviado, setEnviado] = useState(false);
  const valido = !!tema && texto.trim().length >= 15;

  if (!c || !ciudadano) {
    return (
      <Screen header={<TopBar title="Nuevo aporte" />}>
        <Body>{!ciudadano ? 'Regístrate para escribirle a un candidato.' : 'No encontramos a ese candidato.'}</Body>
        {!ciudadano ? <Button label="Registrarme" onPress={() => router.replace('/ciudadano/registro')} /> : null}
      </Screen>
    );
  }

  if (enviado) {
    return (
      <Screen background={colors.surface} header={<TopBar title="Nuevo aporte" />}>
        <Notice icon="checkmark-circle" tone="ok">{`Tu aporte llegó al equipo de ${c.nombre}.`}</Notice>
        <Body>El equipo revisa cada aporte. Verás su estado y la respuesta en Mi actividad.</Body>
        <Button label="Ver mi actividad" onPress={() => router.replace('/actividad')} />
        <Button label="Volver al perfil" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen
      background={colors.surface}
      header={<TopBar title="Nuevo aporte" subtitle={`Para ${c.nombre} · @${c.usuario}`} />}
      footer={
        <Button
          label="Enviar aporte"
          variant="accent"
          disabled={!valido}
          onPress={() => {
            const ub = ciudadano.ubicacion;
            const lugar = ub.barrio ? `Barrio ${nombreZona(ub.barrio)}` : nombreMunicipio(ub.municipio);
            enviarAporte({ candidato: c.id, tipo, tema: tema!, texto: texto.trim(), lugar });
            setEnviado(true);
          }}
        />
      }>
      <Title>¿Qué quieres enviar?</Title>
      <Segmented<TipoAporte>
        value={tipo}
        onChange={setTipo}
        options={[
          { value: 'idea', label: 'Idea' },
          { value: 'consejo', label: 'Consejo' },
          { value: 'critica', label: 'Crítica' },
          { value: 'solicitud', label: 'Solicitud' },
        ]}
      />
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>Tema</Text>
        <ChipRow>
          {TEMAS.map((t) => <Chip key={t} label={t} selected={tema === t} onPress={() => setTema(t)} />)}
        </ChipRow>
      </View>
      <Field
        label="Cuéntanos"
        value={texto}
        onChangeText={setTexto}
        placeholder={PLACEHOLDER[tipo]}
        multiline
        maxLength={1000}
        hint={`${texto.trim().length}/1000 · mínimo 15 caracteres`}
      />
      <Small>El equipo revisa cada aporte antes de responder. Verás su estado en Mi actividad.</Small>
    </Screen>
  );
}
