import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar, Body, Button, Card, Field, Progress, Screen, Segmented, Small, Title, TopBar } from '@/components/ui';
import { CARGOS, nombreDepartamento, nombreMunicipio } from '@/data/catalogos';
import type { TipoLista } from '@/data/types';
import { useApp } from '@/state/app';
import { posicion, siguiente } from '@/state/pasos';
import { colors } from '@/theme';
import { Text } from '@/components/Texto';

/** Asamblea y Concejo: tipo de lista y número del candidato en el tarjetón. */
export default function Lista() {
  const { actualizar } = useLocalSearchParams<{ actualizar?: string }>();
  const actualizando = actualizar === '1';
  const { borrador, actualizarBorrador, confirmarCandidatura } = useApp();
  const { paso, total } = posicion(borrador, 'lista');
  const tipo = borrador.tipoLista ?? 'preferente';
  const numero = borrador.numero ?? '';
  const valido = /^\d{1,3}$/.test(numero) && Number(numero) > 0;

  const cargo = borrador.cargo ?? 'concejo';
  const lugar = borrador.municipio ? nombreMunicipio(borrador.municipio) : nombreDepartamento(borrador.departamento ?? '');
  const corporacion = cargo === 'asamblea' ? `Asamblea del ${lugar}` : `Concejo de ${lugar}`;

  return (
    <Screen
      background={colors.surface}
      header={<TopBar title={actualizando ? 'Actualizar a candidato' : 'Crear tu perfil'} subtitle={corporacion} />}
      footer={
        <Button
          label={actualizando ? 'Enviar a verificación' : 'Continuar'}
          disabled={!valido}
          onPress={() => {
            const b = { ...borrador, tipoLista: tipo };
            actualizarBorrador({ tipoLista: tipo });
            siguiente(b, 'lista', actualizando, confirmarCandidatura);
          }}
        />
      }>
      {actualizando ? <Small>Tu candidatura</Small> : <Progress paso={paso} total={total} etiqueta="Crear tu perfil" />}
      <Title>Tu lista</Title>

      <View style={{ gap: 8 }}>
        <Text style={s.label}>Tipo de lista</Text>
        <Segmented<TipoLista>
          value={tipo}
          onChange={(v) => actualizarBorrador({ tipoLista: v })}
          options={[{ value: 'preferente', label: 'Voto preferente' }, { value: 'cerrada', label: 'Lista cerrada' }]}
        />
        <Small>
          {tipo === 'preferente'
            ? 'La gente marca el partido y tu número en el tarjetón.'
            : 'La gente vota por la lista; tu número indica tu posición en ella.'}
        </Small>
      </View>

      <Field
        label="Tu número en el tarjetón"
        value={numero}
        onChangeText={(t) => actualizarBorrador({ numero: t.replace(/\D/g, '').slice(0, 3) })}
        keyboardType="number-pad"
        placeholder="Ej. 7"
        hint="Lo asigna el partido al inscribir la lista. Aparecerá en tu perfil, tu QR y tus piezas."
        big
      />

      <Card>
        <Text style={s.preTitle}>Así te verán los ciudadanos</Text>
        <View style={s.preview}>
          <Avatar nombre="Tu Nombre" />
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Tu nombre</Text>
            <Small>{`${CARGOS[cargo].nombre} · ${lugar}`}</Small>
          </View>
          <View style={s.numBox} accessibilityLabel={`Número ${numero || 'sin definir'}`}>
            <Text style={s.numLabel}>N.º</Text>
            <Text style={s.num}>{numero || '–'}</Text>
          </View>
        </View>
      </Card>
      {!valido && numero.length > 0 ? <Body style={{ color: colors.dangerFg }}>Escribe un número válido.</Body> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 15, fontWeight: '600', color: colors.ink },
  preTitle: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  numBox: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  numLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  num: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', lineHeight: 24 },
});
