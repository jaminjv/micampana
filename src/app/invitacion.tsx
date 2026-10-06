import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ROLES } from '@/components/equipo';
import { Text } from '@/components/Texto';
import { Avatar, Body, Button, Field, Notice, Row, Screen, Small, Title, TopBar } from '@/components/ui';
import { verInvitacion, type ResumenInvitacion } from '@/data/repo';
import { useApp, useMiMiembro } from '@/state/app';
import { colors, radius, estilos } from '@/theme';

/** Entrar al equipo de una campaña con el código que trae el rol, el territorio y las funciones. */
export default function Invitacion() {
  const { unirseConCodigo, ciudadano } = useApp();
  const miembro = useMiMiembro();
  const [codigo, setCodigo] = useState('');
  const [resumen, setResumen] = useState<ResumenInvitacion | null>();
  const [nombre, setNombre] = useState(ciudadano?.nombre ?? '');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string>();

  const irAMiEquipo = (rol: string) => router.replace(rol === 'coordinador' ? '/coordinador' : '/lider');

  if (miembro) {
    return (
      <Screen background={colors.surface} header={<TopBar title="Código de invitación" />}>
        <Notice icon="checkmark-circle" tone="ok">{`Ya eres ${ROLES[miembro.rol].toLowerCase()} · ${miembro.zona.etiqueta}.`}</Notice>
        <Button label="Ir a mi equipo" onPress={() => irAMiEquipo(miembro.rol)} />
      </Screen>
    );
  }

  const buscar = async () => {
    setOcupado(true);
    setError(undefined);
    try {
      const r = await verInvitacion(codigo);
      setResumen(r);
      if (!r) setError('Ese código no existe, ya se usó o venció. Pídele uno nuevo a quien te invitó.');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(false);
    }
  };

  const unirme = async () => {
    if (!resumen) return;
    setOcupado(true);
    setError(undefined);
    try {
      await unirseConCodigo(resumen.codigo, nombre.trim());
      irAMiEquipo(resumen.rol);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOcupado(false);
    }
  };

  const funciones = resumen
    ? [resumen.delegadoAgenda ? 'Agenda del candidato' : '', resumen.delegadoAprobaciones ? 'Aprobar colaboradores' : ''].filter(Boolean)
    : [];

  return (
    <Screen
      background={colors.surface}
      header={<TopBar title="Código de invitación" />}
      footer={
        resumen ? (
          <Button label={ocupado ? 'Uniéndote…' : 'Unirme a la campaña'} disabled={nombre.trim().length < 3 || ocupado} onPress={unirme} />
        ) : (
          <Button label={ocupado ? 'Buscando…' : 'Continuar'} disabled={codigo.trim().length < 4 || ocupado} onPress={buscar} />
        )
      }>
      <Title>Únete a una campaña</Title>
      <Body>Ingresa el código que te envió el candidato o su coordinador. El código ya trae tu rol y tu territorio.</Body>
      <Field
        label="Código de invitación"
        value={codigo}
        onChangeText={(t) => {
          setCodigo(t.toUpperCase());
          setResumen(undefined);
        }}
        placeholder="MC-0000"
        autoCapitalize="characters"
        autoCorrect={false}
        big
      />

      {resumen ? (
        <View style={s.resumen}>
          <Row gap={12}>
            <Avatar nombre={resumen.candidatoNombre} size={52} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.nombre}>{resumen.candidatoNombre}</Text>
              <Small>{resumen.cargoTexto}</Small>
            </View>
          </Row>
          <View style={s.linea} />
          <Fila k="Tu rol" v={ROLES[resumen.rol]} />
          <Fila k="Tu territorio" v={resumen.zona.etiqueta} />
          {resumen.superiorNombre ? <Fila k="Tu coordinador" v={resumen.superiorNombre} /> : null}
          {funciones.length ? <Fila k="Funciones delegadas" v={funciones.join(' y ')} /> : null}
        </View>
      ) : null}

      {resumen ? (
        <>
          <Field label="Tu nombre" value={nombre} onChangeText={setNombre} autoCapitalize="words" hint="Así te verán el candidato y tu equipo." />
          <Small>Tu territorio y tus funciones los define quien te invitó. Puede cambiarlos después.</Small>
          <Notice icon="information-circle" tone="primary">
            Si eres empleado público, la Constitución restringe tu participación en política. Consulta antes de unirte.
          </Notice>
        </>
      ) : (
        <Small>Si no tienes código, pídeselo a quien coordina la campaña en tu zona.</Small>
      )}
      {error ? <Notice icon="warning" tone="danger">{error}</Notice> : null}
    </Screen>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }} gap={12}>
      <Small>{k}</Small>
      <Text style={s.valor}>{v}</Text>
    </Row>
  );
}

const s = estilos(() => ({
  resumen: { gap: 12, padding: 18, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  nombre: { fontSize: 17, fontWeight: '700', color: colors.ink },
  linea: { height: 1, backgroundColor: colors.border },
  valor: { flexShrink: 1, textAlign: 'right', fontSize: 14, fontWeight: '600', color: colors.ink },
}));
