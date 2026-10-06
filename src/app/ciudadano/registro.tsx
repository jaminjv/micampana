import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ListPicker } from '@/components/ListPicker';
import { Body, Button, Card, CheckRow, Field, H2, Screen, Small, Title, TopBar } from '@/components/ui';
import { DEPARTAMENTOS, municipiosDe, zonasDe } from '@/data/catalogos';
import { useApp } from '@/state/app';
import { colors } from '@/theme';
import { Text } from '@/components/Texto';

/** Registro del ciudadano: una sola vez, sirve para escribirle a cualquier candidato. */
export default function RegistroCiudadano() {
  const { registrarCiudadano } = useApp();
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [departamento, setDepartamento] = useState<string>();
  const [municipio, setMunicipio] = useState<string>();
  const [comuna, setComuna] = useState<string>();
  const [barrio, setBarrio] = useState<string>();
  const [autoriza, setAutoriza] = useState(false);

  const comunas = municipio ? zonasDe(municipio, 'comuna') : [];
  const barrios = municipio && comuna ? zonasDe(municipio, 'barrio', comuna) : [];
  const valido = nombre.trim().length >= 3 && /^\d{6,10}$/.test(cedula) && !!departamento && !!municipio && autoriza;

  return (
    <Screen
      background={colors.surface}
      header={<TopBar title="Registro" />}
      footer={
        <Button
          label="Crear mi cuenta"
          variant="accent"
          disabled={!valido}
          onPress={() => {
            registrarCiudadano({
              nombre: nombre.trim(),
              cedula,
              ubicacion: { departamento: departamento!, municipio: municipio!, comuna, barrio },
              autorizoDatos: true,
            });
            router.replace('/feed');
          }}
        />
      }>
      <Title>Tu voz llega a los candidatos</Title>
      <Body>Regístrate una vez y escribe ideas, consejos, críticas y solicitudes a cualquier candidato registrado en la app.</Body>

      <Field label="Nombre completo" value={nombre} onChangeText={setNombre} autoComplete="name" />
      <Field
        label="Número de cédula"
        value={cedula}
        onChangeText={(t) => setCedula(t.replace(/\D/g, '').slice(0, 10))}
        keyboardType="number-pad"
        hint="Para verificar que eres una persona real. No se muestra a nadie."
      />

      <H2>¿Dónde vives?</H2>
      <Small>Así te mostramos los candidatos y las propuestas de tu región.</Small>
      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>Departamento</Text>
      <ListPicker
        items={DEPARTAMENTOS.map((d) => ({ id: d.codigo, label: d.nombre }))}
        selected={departamento ? [departamento] : []}
        onToggle={(id) => { setDepartamento(id); setMunicipio(undefined); setComuna(undefined); setBarrio(undefined); }}
      />
      {departamento ? (
        <>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>Municipio</Text>
          <ListPicker
            items={municipiosDe(departamento).map((m) => ({ id: m.codigo, label: m.nombre }))}
            selected={municipio ? [municipio] : []}
            onToggle={(id) => { setMunicipio(id); setComuna(undefined); setBarrio(undefined); }}
            searchPlaceholder="Buscar municipio"
            maxVisible={6}
          />
        </>
      ) : null}
      {comunas.length > 0 ? (
        <>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>Comuna (opcional)</Text>
          <ListPicker
            items={comunas.map((z) => ({ id: z.id, label: z.nombre }))}
            selected={comuna ? [comuna] : []}
            onToggle={(id) => { setComuna(id); setBarrio(undefined); }}
          />
        </>
      ) : null}
      {barrios.length > 0 ? (
        <>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>Barrio (opcional)</Text>
          <ListPicker items={barrios.map((z) => ({ id: z.id, label: z.nombre }))} selected={barrio ? [barrio] : []} onToggle={setBarrio} />
        </>
      ) : null}

      <Card style={{ backgroundColor: colors.background, borderWidth: 0 }}>
        <CheckRow checked={autoriza} onToggle={() => setAutoriza(!autoriza)}>
          <Text style={{ fontSize: 14, lineHeight: 20, color: colors.inkSoft }}>
            Autorizo el tratamiento de mis datos para usar la app. Mis datos solo se comparten con los candidatos a los que yo escriba.
          </Text>
        </CheckRow>
        <View style={{ paddingLeft: 36 }}>
          <Small>Es voluntario. Puedes consultar, corregir o borrar tus datos cuando quieras.</Small>
        </View>
      </Card>
    </Screen>
  );
}
