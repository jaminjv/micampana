import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Texto';
import { Button, Chip, ChipRow, Field, Ionicons, Notice, Screen, Small, TopBar } from '@/components/ui';
import { colaboradoresDe, getMiembro, getTarea, reportarTarea } from '@/data/repo';
import type { ArchivoLocal } from '@/data/types';
import { useMiMiembro } from '@/state/app';
import { colors, radius, type } from '@/theme';

const MAX_FOTOS = 3;

/** Reportar una tarea: fotos de evidencia (cámara), cantidad, quiénes participaron y notas. */
export default function Reportar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = useMiMiembro();
  const t = getTarea(id ?? '');
  const [fotos, setFotos] = useState<ArchivoLocal[]>([]);
  const [cantidad, setCantidad] = useState('');
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string>();

  if (!m || !t || t.asignadaA !== m.id) {
    return (
      <Screen oscura header={<TopBar oscura title="Reportar tarea" />}>
        <Small>No encontramos esta tarea.</Small>
      </Screen>
    );
  }

  const gente = colaboradoresDe({ lider: m.id, estado: 'activo' });
  const por = getMiembro(t.asignadaPor);

  const tomar = async () => {
    setError(undefined);
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) return setError('Permite el uso de la cámara para tomar la foto.');
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    setFotos((p) => [...p, { uri: a.uri, nombre: a.fileName ?? `evidencia-${p.length + 1}.jpg`, tipo: a.mimeType ?? 'image/jpeg', tamano: a.fileSize }]);
  };

  const enviar = () => {
    setError(undefined);
    try {
      reportarTarea(t.id, { notas: notas.trim(), cantidad: cantidad ? Number(cantidad) : undefined, participantes }, fotos);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const valido = (!t.evidencia || fotos.length > 0) && (notas.trim().length > 0 || fotos.length > 0 || !!cantidad);

  return (
    <Screen
      oscura
      background={colors.surface}
      header={<TopBar oscura title="Reportar tarea" />}
      footer={<Button label="Enviar reporte" disabled={!valido} onPress={enviar} />}>
      <View style={{ gap: 4 }}>
        <Text style={type.h2}>{t.titulo}</Text>
        <Small>{`${m.zona.etiqueta} · asignada por ${por ? por.nombre : 'el candidato'}`}</Small>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={type.label}>{t.evidencia ? 'Fotos de evidencia (obligatoria al menos una)' : 'Fotos de evidencia (opcional)'}</Text>
        <View style={s.fotos}>
          {fotos.map((f, i) => (
            <Pressable key={f.uri} accessibilityLabel={`Quitar foto ${i + 1}`} onPress={() => setFotos((p) => p.filter((x) => x !== f))} style={s.foto}>
              <Image source={{ uri: f.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={s.quitar}><Ionicons name="close" size={14} color="#FFFFFF" /></View>
            </Pressable>
          ))}
          {fotos.length < MAX_FOTOS ? (
            <Pressable accessibilityRole="button" onPress={tomar} style={[s.foto, s.tomar]}>
              <Ionicons name="camera" size={24} color={colors.primary} />
              <Text style={s.tomarTexto}>Tomar foto</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Field
        label="¿Cuántos? (volantes, casas visitadas…)"
        value={cantidad}
        onChangeText={(x) => setCantidad(x.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        placeholder="Ej. 300"
      />
      {gente.length ? (
        <View style={{ gap: 8 }}>
          <Text style={type.label}>¿Quiénes participaron?</Text>
          <ChipRow>
            {gente.map((g) => (
              <Chip
                key={g.id}
                label={g.nombre}
                selected={participantes.includes(g.id)}
                onPress={() => setParticipantes((p) => (p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id]))}
              />
            ))}
          </ChipRow>
        </View>
      ) : null}
      <Field label="Notas para el coordinador" value={notas} onChangeText={setNotas} placeholder="Qué dijo la gente, qué faltó, qué pedir…" multiline maxLength={1000} />
      {error ? <Notice icon="warning" tone="danger">{error}</Notice> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  fotos: { flexDirection: 'row', gap: 8 },
  foto: { flex: 1, maxWidth: 120, height: 104, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.placeholder },
  tomar: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.inputBorder, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 6 },
  tomarTexto: { fontSize: 13, fontWeight: '600', color: colors.primary },
  quitar: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(15,23,42,0.7)', alignItems: 'center', justifyContent: 'center' },
});
