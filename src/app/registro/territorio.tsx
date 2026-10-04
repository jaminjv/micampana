import { StyleSheet, Text, View } from 'react-native';

import { ListPicker } from '@/components/ListPicker';
import { Body, Button, Card, CheckRow, H2, Notice, Progress, Screen, Small, Title, TopBar } from '@/components/ui';
import { CARGOS, DEPARTAMENTOS, municipiosDe, nombreMunicipio } from '@/data/catalogos';
import { useApp } from '@/state/app';
import { posicion, siguiente } from '@/state/pasos';
import { colors } from '@/theme';

/**
 * Territorio. Gobernación y Asamblea: se elige el departamento y sus municipios
 * se cargan solos (DIVIPOLA). Alcaldía y Concejo: departamento y municipio.
 */
export default function Territorio() {
  const { borrador, actualizarBorrador, confirmarCandidatura } = useApp();
  const { paso, total } = posicion(borrador, 'territorio');
  const cargo = borrador.cargo ?? 'alcaldia';
  const departamental = CARGOS[cargo].ambito === 'departamento';
  const municipios = borrador.departamento ? municipiosDe(borrador.departamento) : [];
  const listo = departamental ? !!borrador.departamento : !!borrador.municipio;

  return (
    <Screen
      background={colors.surface}
      header={<TopBar title="Crear tu perfil" subtitle={CARGOS[cargo].nombre} />}
      footer={<Button label="Continuar" disabled={!listo} onPress={() => siguiente(borrador, 'territorio', false, confirmarCandidatura)} />}>
      <Progress paso={paso} total={total} etiqueta="Crear tu perfil" />
      <Title>{departamental ? 'Tu departamento' : 'Tu municipio'}</Title>

      <H2>Departamento</H2>
      <ListPicker
        items={DEPARTAMENTOS.map((d) => ({ id: d.codigo, label: d.nombre }))}
        selected={borrador.departamento ? [borrador.departamento] : []}
        onToggle={(id) => actualizarBorrador({ departamento: id, municipio: undefined })}
        searchPlaceholder="Buscar departamento"
      />

      {departamental && borrador.departamento ? (
        <>
          <Notice icon="checkmark-circle" tone="ok">{`${municipios.length} municipios cargados automáticamente`}</Notice>
          <Card>
            {municipios.map((m) => (
              <View key={m.codigo} style={s.munRow}>
                <Text style={s.munText}>{m.nombre}</Text>
                {m.capital ? <Text style={s.capital}>Capital</Text> : null}
              </View>
            ))}
          </Card>
          <CheckRow
            checked={!!borrador.agruparSubregiones}
            onToggle={() => actualizarBorrador({ agruparSubregiones: !borrador.agruparSubregiones })}>
            <View style={{ gap: 2 }}>
              <Text style={s.label}>Agrupar municipios por subregiones</Text>
              <Small>Junta varios municipios bajo un mismo coordinador. Si no, cada municipio tendrá el suyo.</Small>
            </View>
          </CheckRow>
        </>
      ) : null}

      {!departamental && borrador.departamento ? (
        <>
          <H2>Municipio</H2>
          <ListPicker
            items={municipios.map((m) => ({ id: m.codigo, label: m.nombre, badge: m.capital ? 'Capital' : undefined }))}
            selected={borrador.municipio ? [borrador.municipio] : []}
            onToggle={(id) => actualizarBorrador({ municipio: id })}
            searchPlaceholder="Buscar municipio"
          />
        </>
      ) : null}

      {!departamental && borrador.municipio ? (
        <>
          <Card style={{ backgroundColor: colors.background, borderWidth: 0 }}>
            <Text style={s.label}>Así se organizará tu campaña</Text>
            <Nivel n={1} titulo={nombreMunicipio(borrador.municipio)} texto="Tú y tu coordinador general" />
            <Nivel
              n={2}
              titulo={borrador.sinComunas ? 'Sectores y veredas' : 'Comunas y corregimientos'}
              texto="Un coordinador por cada uno"
            />
            <Nivel n={3} titulo="Barrios y veredas" texto="Un líder comunal por cada uno" />
            <Small>Cargamos la división disponible de tu municipio. Podrás agregar, unir o renombrar zonas.</Small>
          </Card>
          <CheckRow checked={!!borrador.sinComunas} onToggle={() => actualizarBorrador({ sinComunas: !borrador.sinComunas })}>
            <View style={{ gap: 2 }}>
              <Text style={s.label}>Mi municipio no tiene comunas</Text>
              <Small>Organiza coordinadores por sectores o veredas.</Small>
            </View>
          </CheckRow>
        </>
      ) : null}

      {!borrador.departamento ? <Body>Elige el departamento para continuar.</Body> : null}
    </Screen>
  );
}

function Nivel({ n, titulo, texto }: { n: number; titulo: string; texto: string }) {
  return (
    <View style={s.nivel}>
      <View style={s.nivelNum}><Text style={s.nivelNumText}>{n}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{titulo}</Text>
        <Small>{texto}</Small>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  munRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  munText: { fontSize: 15, color: colors.ink },
  capital: { fontSize: 12, fontWeight: '600', color: colors.primary },
  label: { fontSize: 15, fontWeight: '600', color: colors.ink },
  nivel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nivelNum: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  nivelNumText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
