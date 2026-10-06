import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { fechaCompleta, SelectorFecha } from '@/components/SelectorFecha';
import { Text } from '@/components/Texto';
import { Button, Card, CheckRow, Chip, ChipRow, Field, Notice, Screen, Small, TopBar } from '@/components/ui';
import { asignarTarea, colaboradoresDe, miembrosDe } from '@/data/repo';
import { useMiMiembro } from '@/state/app';
import { colors, radius, type } from '@/theme';

const SUGERIDAS = ['Volanteo', 'Puerta a puerta', 'Perifoneo', 'Logística de evento', 'Convocar a la visita'];

/** Asignar una tarea a los líderes de la zona (una por cada líder elegido). */
export default function NuevaTarea() {
  const m = useMiMiembro();
  const lideres = m ? miembrosDe(m.candidato, { rol: 'lider', superior: m.id }) : [];
  const [titulo, setTitulo] = useState('');
  const [para, setPara] = useState<string[]>(lideres.map((l) => l.id));
  const [fecha, setFecha] = useState<string>();
  const [evidencia, setEvidencia] = useState(true);
  const [listo, setListo] = useState(0);
  if (!m) return null;

  const alternar = (id: string) => setPara((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const todos = para.length === lideres.length;
  const valido = titulo.trim().length >= 4 && para.length > 0 && fechaCompleta(fecha);

  if (listo) {
    return (
      <Screen oscura background={colors.surface} header={<TopBar oscura title="Nueva tarea" />}>
        <Notice icon="checkmark-circle" tone="ok">{`Asignada a ${listo} ${listo === 1 ? 'líder' : 'líderes'}. La verán en Mis tareas.`}</Notice>
        <Button label="Volver a mi zona" onPress={() => router.navigate('/coordinador')} />
        <Button label="Asignar otra" variant="secondary" onPress={() => { setListo(0); setTitulo(''); setFecha(undefined); }} />
      </Screen>
    );
  }

  return (
    <Screen
      oscura
      background={colors.surface}
      header={<TopBar oscura title="Nueva tarea" subtitle={m.zona.etiqueta} />}
      footer={
        <Button
          label={`Asignar a ${para.length} ${para.length === 1 ? 'líder' : 'líderes'}`}
          disabled={!valido}
          onPress={() => {
            if (!fechaCompleta(fecha)) return;
            setListo(asignarTarea(m.candidato, { titulo: titulo.trim(), para, fechaLimite: fecha, evidencia }, m.id));
          }}
        />
      }>
      <Field label="Tarea" value={titulo} onChangeText={setTitulo} placeholder="Ej. Volanteo de propuestas de seguridad" />
      <ChipRow>
        {SUGERIDAS.map((t) => <Chip key={t} label={t} selected={titulo === t} onPress={() => setTitulo(t)} />)}
      </ChipRow>

      <View style={{ gap: 8 }}>
        <Text style={type.label}>¿Para quién?</Text>
        <View style={s.lista}>
          <View style={[s.item, s.borde]}>
            <CheckRow checked={todos} onToggle={() => setPara(todos ? [] : lideres.map((l) => l.id))}>
              <View>
                <Text style={type.label}>{`Todos los líderes de ${m.zona.etiqueta}`}</Text>
                <Small>{`${lideres.length} líderes`}</Small>
              </View>
            </CheckRow>
          </View>
          {lideres.map((l, i) => (
            <View key={l.id} style={[s.item, i < lideres.length - 1 && s.borde]}>
              <CheckRow checked={para.includes(l.id)} onToggle={() => alternar(l.id)}>
                <View>
                  <Text style={type.body}>{l.zona.etiqueta}</Text>
                  <Small>{`Líder: ${l.nombre} · ${colaboradoresDe({ lider: l.id, estado: 'activo' }).length} colaboradores`}</Small>
                </View>
              </CheckRow>
            </View>
          ))}
        </View>
      </View>

      <Text style={type.label}>Fecha límite</Text>
      <SelectorFecha value={fecha} onChange={setFecha} dias={30} />

      <Card style={{ backgroundColor: colors.background, borderWidth: 0, boxShadow: 'none' }}>
        <CheckRow checked={evidencia} onToggle={() => setEvidencia((v) => !v)}>
          <View>
            <Text style={type.label}>Foto de evidencia obligatoria</Text>
            <Small>El líder no puede reportarla sin al menos una foto.</Small>
          </View>
        </CheckRow>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  lista: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },
  item: { paddingHorizontal: 14, paddingVertical: 6 },
  borde: { borderBottomWidth: 1, borderBottomColor: colors.divider },
});
