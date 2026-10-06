import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Texto';
import { Body, Button, Card, Field, Notice, Screen, Small, Title, TopBar } from '@/components/ui';
import * as remoto from '@/data/remoto';
import { useApp } from '@/state/app';
import { colors, type } from '@/theme';

type Paso = 'numero' | 'codigo';

/** Celular colombiano: 10 dígitos que empiezan por 3. */
const CELULAR = /^3\d{9}$/;

/** Asegurar la cuenta con el celular (código SMS), o entrar desde otro teléfono. */
export default function Cuenta() {
  const { recargar } = useApp();
  const [telefonoActual, setTelefonoActual] = useState<string>();
  const [cargando, setCargando] = useState(remoto.conectado);
  const [paso, setPaso] = useState<Paso>('numero');
  const [numero, setNumero] = useState('');
  const [codigo, setCodigo] = useState('');
  const [modo, setModo] = useState<'vincular' | 'entrar'>('vincular');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string>();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!remoto.conectado) return;
    remoto
      .estadoCuenta()
      .then((e) => setTelefonoActual(e.telefono))
      .finally(() => setCargando(false));
  }, []);

  const telefono = `+57${numero}`;

  const enviar = async () => {
    setOcupado(true);
    setError(undefined);
    try {
      setModo(await remoto.enviarCodigo(telefono));
      setPaso('codigo');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(false);
    }
  };

  const verificar = async () => {
    setOcupado(true);
    setError(undefined);
    try {
      await remoto.verificarCodigo(telefono, codigo, modo);
      await recargar();
      setTelefonoActual(telefono);
      setListo(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(false);
    }
  };

  if (!remoto.conectado) {
    return (
      <Screen header={<TopBar title="Tu cuenta" />}>
        <Notice icon="information-circle" tone="primary">
          Estás usando datos de prueba. El ingreso con celular funciona cuando la app está conectada a Supabase.
        </Notice>
      </Screen>
    );
  }

  if (cargando) {
    return (
      <Screen header={<TopBar title="Tu cuenta" />}>
        <Small>Cargando…</Small>
      </Screen>
    );
  }

  if (telefonoActual && !listo) {
    return (
      <Screen header={<TopBar title="Tu cuenta" />}>
        <Card>
          <Text style={type.h3}>Cuenta asegurada</Text>
          <Body>{`Entras con tu celular ${telefonoActual}. Si cambias de teléfono, ingresa con ese número y recuperas todo.`}</Body>
        </Card>
        <Button
          label="Cerrar sesión en este teléfono"
          variant="secondary"
          onPress={async () => {
            await remoto.cerrarSesion();
            await recargar();
            router.replace('/');
          }}
        />
        <Small>Al cerrar sesión, este teléfono queda como nuevo. Tus datos siguen guardados en tu cuenta.</Small>
      </Screen>
    );
  }

  if (listo) {
    return (
      <Screen background={colors.surface} header={<TopBar title="Tu cuenta" />}>
        <Notice icon="checkmark-circle" tone="ok">
          {modo === 'vincular' ? `Listo: tu cuenta quedó asegurada con ${telefono}.` : `Entraste con ${telefono}.`}
        </Notice>
        <Body>
          {modo === 'vincular'
            ? 'Conservas todo lo que ya tenías. Si cambias de teléfono, ingresa con este número.'
            : 'Cargamos los datos de tu cuenta en este teléfono.'}
        </Body>
        <Button label="Volver al inicio" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen
      background={colors.surface}
      header={<TopBar title="Tu cuenta" />}
      footer={
        paso === 'numero' ? (
          <Button label={ocupado ? 'Enviando…' : 'Enviarme el código'} disabled={!CELULAR.test(numero) || ocupado} onPress={enviar} />
        ) : (
          <Button label={ocupado ? 'Verificando…' : 'Verificar'} disabled={codigo.length !== 6 || ocupado} onPress={verificar} />
        )
      }>
      <Title>{paso === 'numero' ? 'Asegura tu cuenta con tu celular' : 'Escribe el código'}</Title>
      {paso === 'numero' ? (
        <>
          <Body>Te enviamos un código por SMS. Así puedes entrar desde otro teléfono sin perder tus datos.</Body>
          <Field
            label="Número de celular"
            prefix="+57"
            value={numero}
            onChangeText={(t) => setNumero(t.replace(/\D/g, '').slice(0, 10))}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="3001234567"
            big
          />
          <Small>Si ese número ya tiene una cuenta en otro teléfono, entrarás a esa cuenta.</Small>
        </>
      ) : (
        <>
          <Body>{`Lo enviamos por SMS al ${telefono}. Puede tardar un minuto.`}</Body>
          <Field
            label="Código de 6 dígitos"
            value={codigo}
            onChangeText={(t) => setCodigo(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            big
          />
          {modo === 'entrar' ? (
            <Notice icon="information-circle" tone="primary">
              Ese número ya tiene una cuenta. Al verificar, este teléfono entra a esa cuenta y deja la actual.
            </Notice>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label="Cambiar número" variant="ghost" size="md" onPress={() => { setPaso('numero'); setCodigo(''); }} />
            <Button label="Reenviar código" variant="ghost" size="md" disabled={ocupado} onPress={enviar} />
          </View>
        </>
      )}
      {error ? <Notice icon="warning" tone="danger">{error}</Notice> : null}
    </Screen>
  );
}
