import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AYUDA_EN, FotoCamara } from '@/components/equipo';
import { Text } from '@/components/Texto';
import { Body, Button, Card, CheckRow, Chip, ChipRow, Field, Notice, Row, Screen, Small, TopBar } from '@/components/ui';
import { nombreZona, zonasDe } from '@/data/catalogos';
import { cupoDe, edad, getCandidato, registrarColaborador } from '@/data/repo';
import type { ArchivoLocal } from '@/data/types';
import { useMiMiembro } from '@/state/app';
import { colors, type } from '@/theme';

const soloDigitos = (t: string, n: number) => t.replace(/\D/g, '').slice(0, n);

/**
 * Registrar un colaborador: fotos de rostro y cédula tomadas con la cámara,
 * datos, en qué ayuda y su autorización de tratamiento de datos.
 */
export default function NuevoColaborador() {
  const m = useMiMiembro();
  const [rostro, setRostro] = useState<ArchivoLocal>();
  const [cedulaFoto, setCedulaFoto] = useState<ArchivoLocal>();
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [celular, setCelular] = useState('');
  const [dia, setDia] = useState('');
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('');
  const [barrio, setBarrio] = useState<string>();
  const [ayuda, setAyuda] = useState<string[]>([]);
  const [autoriza, setAutoriza] = useState(false);
  const [verPolitica, setVerPolitica] = useState(false);
  const [error, setError] = useState<string>();
  if (!m) return null;

  const c = getCandidato(m.candidato);
  const cupo = cupoDe(m.id);
  // Barrios de la zona del líder: su barrio, o los barrios de su comuna.
  const mun = c?.municipio ?? '';
  const barrios =
    m.zona.nivel === 'barrio' ? m.zona.ids.map((id) => ({ id, nombre: nombreZona(id) }))
    : m.zona.nivel === 'comuna' ? zonasDe(mun, 'barrio', m.zona.ids[0])
    : zonasDe(mun, 'barrio');
  const barrioId = barrio ?? (barrios.length === 1 ? barrios[0].id : undefined);

  const fecha = anio.length === 4 && mes && dia ? `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}` : '';
  const fechaValida = !!fecha && !Number.isNaN(new Date(fecha).getTime()) && Number(mes) <= 12 && Number(dia) <= 31;
  const anios = fechaValida ? edad(fecha) : undefined;
  const menor = anios !== undefined && anios < 18;
  const valido =
    !!rostro && !!cedulaFoto && nombre.trim().length >= 5 && cedula.length >= 6 && fechaValida && !menor && autoriza &&
    cupo.usados < cupo.total;

  const registrar = () => {
    setError(undefined);
    try {
      registrarColaborador(
        m.id,
        {
          nombre: nombre.trim(), cedula, celular: celular || undefined, fechaNacimiento: fecha, barrio: barrioId,
          barrioTexto: barrioId ? nombreZona(barrioId) || barrios.find((b) => b.id === barrioId)?.nombre || '' : m.zona.etiqueta, ayudaEn: ayuda,
        },
        { rostro: rostro!, cedula: cedulaFoto! },
      );
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Screen
      oscura
      background={colors.surface}
      header={<TopBar oscura title="Nuevo colaborador" subtitle={`Cupo ${cupo.usados} de ${cupo.total}`} />}
      footer={<Button label="Firmar y registrar" disabled={!valido} onPress={registrar} />}>
      <View style={{ gap: 8 }}>
        <Text style={type.label}>Fotos <Text style={{ color: colors.muted, fontWeight: '400' }}>· obligatorias</Text></Text>
        <Row gap={10} style={{ alignItems: 'flex-start' }}>
          <FotoCamara label="Foto de rostro" value={rostro} onChange={setRostro} frontal />
          <FotoCamara label="Foto de cédula" value={cedulaFoto} onChange={setCedulaFoto} />
        </Row>
        <Small>Se toman con la cámara en el momento; no se suben desde la galería.</Small>
      </View>

      <Field label="Nombre completo" value={nombre} onChangeText={setNombre} autoCapitalize="words" />
      <Field label="Cédula" value={cedula} onChangeText={(t) => setCedula(soloDigitos(t, 10))} keyboardType="number-pad" />
      <Field label="Celular (opcional)" value={celular} onChangeText={(t) => setCelular(soloDigitos(t, 10))} keyboardType="phone-pad" prefix="+57" />

      <View style={{ gap: 8 }}>
        <Text style={type.label}>Fecha de nacimiento</Text>
        <Row gap={8}>
          <View style={{ flex: 1 }}><Field label="Día" value={dia} onChangeText={(t) => setDia(soloDigitos(t, 2))} keyboardType="number-pad" placeholder="dd" /></View>
          <View style={{ flex: 1 }}><Field label="Mes" value={mes} onChangeText={(t) => setMes(soloDigitos(t, 2))} keyboardType="number-pad" placeholder="mm" /></View>
          <View style={{ flex: 1.4 }}><Field label="Año" value={anio} onChangeText={(t) => setAnio(soloDigitos(t, 4))} keyboardType="number-pad" placeholder="aaaa" /></View>
        </Row>
        {menor ? <Notice icon="close-circle" tone="danger">Es menor de edad: no se puede registrar como colaborador.</Notice> : null}
      </View>

      {barrios.length > 1 ? (
        <View style={{ gap: 8 }}>
          <Text style={type.label}>Barrio o vereda</Text>
          <ChipRow>
            {barrios.map((b) => <Chip key={b.id} label={b.nombre} selected={barrioId === b.id} onPress={() => setBarrio(b.id)} />)}
          </ChipRow>
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Text style={type.label}>¿En qué puede ayudar?</Text>
        <ChipRow>
          {AYUDA_EN.map((a) => (
            <Chip key={a} label={a} selected={ayuda.includes(a)} onPress={() => setAyuda((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]))} />
          ))}
        </ChipRow>
      </View>

      <Card style={{ backgroundColor: colors.background, borderWidth: 0, boxShadow: 'none' }}>
        <CheckRow checked={autoriza} onToggle={() => setAutoriza((v) => !v)}>
          <Text style={type.body}>
            {`${nombre.trim() || 'El colaborador'} autoriza, con su firma en esta pantalla, el tratamiento de sus datos y fotos por la campaña de ${c?.nombre ?? 'este candidato'}.`}
          </Text>
        </CheckRow>
        <Button label={verPolitica ? 'Ocultar política' : 'Leer política'} variant="ghost" size="md" onPress={() => setVerPolitica((v) => !v)} />
        {verPolitica ? (
          <Body>
            Sus datos (nombre, cédula, celular, fecha de nacimiento, barrio y fotos) los usa solo esta campaña para organizar las tareas de su
            equipo. Las fotos de la cédula solo las ve quien verifica. Puede pedir consultar, corregir o borrar sus datos en cualquier momento, y
            no está obligado a entregarlos. Este texto debe revisarlo el abogado de la campaña.
          </Body>
        ) : null}
      </Card>
      <Small>Si es empleado público, la Constitución restringe su participación en política.</Small>
      {error ? <Notice icon="warning" tone="danger">{error}</Notice> : null}
    </Screen>
  );
}
