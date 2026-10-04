import { useState } from 'react';

import { Body, Button, Field, Notice, Screen, Small, Title, TopBar } from '@/components/ui';
import { colors } from '@/theme';

/** Ingreso por código de invitación. La versión de coordinador, líder y marketing llega en la siguiente fase. */
export default function Invitacion() {
  const [codigo, setCodigo] = useState('');
  const [enviado, setEnviado] = useState(false);

  return (
    <Screen
      background={colors.surface}
      header={<TopBar title="Código de invitación" />}
      footer={<Button label="Unirme a la campaña" disabled={codigo.trim().length < 4} onPress={() => setEnviado(true)} />}>
      <Title>Únete a una campaña</Title>
      <Body>Ingresa el código que te envió el candidato o su coordinador. El código ya trae tu rol y tu territorio.</Body>
      <Field
        label="Código de invitación"
        value={codigo}
        onChangeText={(t) => setCodigo(t.toUpperCase())}
        placeholder="MC-0000"
        autoCapitalize="characters"
        big
      />
      {enviado ? (
        <Notice icon="construct" tone="primary">
          Las versiones de coordinador, líder comunal y marketing se construyen en la siguiente fase.
        </Notice>
      ) : (
        <Small>Si no tienes código, pídeselo a quien coordina la campaña en tu zona.</Small>
      )}
    </Screen>
  );
}
