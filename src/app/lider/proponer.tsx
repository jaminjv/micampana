import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { fechaCompleta, SelectorFecha } from '@/components/SelectorFecha';
import { Text } from '@/components/Texto';
import { Button, Chip, ChipRow, Field, Notice, Row, Screen, Small, TopBar } from '@/components/ui';
import { TEMAS } from '@/data/catalogos';
import { getMiembro, proponerVisita } from '@/data/repo';
import { useMiMiembro } from '@/state/app';
import { colors, radius, type } from '@/theme';

/** Proponer una visita del candidato a la comunidad. */
export default function Proponer() {
  const m = useMiMiembro();
  const [lugar, setLugar] = useState('');
  const [fecha, setFecha] = useState<string>();
  const [esperados, setEsperados] = useState('');
  const [temas, setTemas] = useState<string[]>([]);
  const [enviada, setEnviada] = useState(false);
  if (!m) return null;
  const coordinador = getMiembro(m.superior);
  const valido = lugar.trim().length >= 3 && fechaCompleta(fecha);

  if (enviada) {
    return (
      <Screen oscura background={colors.surface} header={<TopBar oscura title="Proponer visita" />}>
        <Notice icon="checkmark-circle" tone="ok">{`Enviada a ${coordinador?.nombre ?? 'tu coordinador'}. Te avisaremos cuando quede en la agenda.`}</Notice>
        <Button label="Ver mis tareas" onPress={() => router.navigate('/lider')} />
        <Button label="Proponer otra" variant="secondary" onPress={() => { setEnviada(false); setLugar(''); setFecha(undefined); setEsperados(''); setTemas([]); }} />
      </Screen>
    );
  }

  return (
    <Screen
      oscura
      background={colors.surface}
      header={<TopBar oscura title="Proponer visita" subtitle={m.zona.etiqueta} />}
      footer={
        <Button
          label={`Enviar a ${coordinador?.nombre.split(' ')[0] ?? 'tu coordinador'}`}
          disabled={!valido}
          onPress={() => {
            if (!fechaCompleta(fecha)) return;
            proponerVisita(m.id, {
              lugar: lugar.trim(), fecha, comunidad: m.zona, asistentesEsperados: esperados ? Number(esperados) : undefined, temas,
            });
            setEnviada(true);
          }}
        />
      }>
      <Row gap={6} style={s.pasos}>
        <Paso n={1} texto="Tú propones" activo />
        <Text style={s.flecha}>→</Text>
        <Paso n={2} texto="Coordinador valida" />
        <Text style={s.flecha}>→</Text>
        <Paso n={3} texto="Queda en agenda" />
      </Row>
      <Field label="Lugar" value={lugar} onChangeText={setLugar} placeholder="Ej. Salón comunal El Prado" />
      <SelectorFecha value={fecha} onChange={setFecha} dias={45} />
      <Field
        label="Asistentes esperados (opcional)"
        value={esperados}
        onChangeText={(t) => setEsperados(t.replace(/\D/g, '').slice(0, 5))}
        keyboardType="number-pad"
        placeholder="Ej. 60"
      />
      <View style={{ gap: 8 }}>
        <Text style={type.label}>Temas que la comunidad quiere tratar</Text>
        <ChipRow>
          {TEMAS.map((t) => (
            <Chip key={t} label={t} selected={temas.includes(t)} onPress={() => setTemas((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))} />
          ))}
        </ChipRow>
      </View>
      <Small>{`La visita será en ${m.zona.etiqueta}. Si tu coordinador la aprueba, queda en la agenda del candidato contigo como anfitrión.`}</Small>
    </Screen>
  );
}

function Paso({ n, texto, activo }: { n: number; texto: string; activo?: boolean }) {
  return (
    <View style={[s.paso, activo && s.pasoActivo]}>
      <Text style={[s.pasoN, activo && { color: '#FFFFFF' }]}>{n}</Text>
      <Text style={[s.pasoTexto, activo && { color: '#FFFFFF' }]}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pasos: { flexWrap: 'wrap' },
  paso: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.background },
  pasoActivo: { backgroundColor: colors.primary },
  pasoN: { fontSize: 12, fontWeight: '700', color: colors.primary },
  pasoTexto: { fontSize: 12, fontWeight: '600', color: colors.inkSoft },
  flecha: { color: colors.faint },
});
