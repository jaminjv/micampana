import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CandidatoRow } from '@/components/cards';
import { Badge, Button, Card, Small } from '@/components/ui';
import { nombreMunicipio } from '@/data/catalogos';
import { getAporte, getCandidato, getEvento, useDatos } from '@/data/repo';
import type { EstadoAporte, TipoAporte } from '@/data/types';
import { diaCorto, hace, horaTexto } from '@/lib/fechas';
import { useApp } from '@/state/app';
import { colors } from '@/theme';

const ESTADO: Record<EstadoAporte, { label: string; tone: 'ok' | 'primary' | 'neutral' }> = {
  enviado: { label: 'Enviado', tone: 'neutral' },
  en_revision: { label: 'En revisión', tone: 'primary' },
  respondido: { label: 'Respondido', tone: 'ok' },
};
const TIPO: Record<TipoAporte, string> = { idea: 'Idea', consejo: 'Consejo', critica: 'Crítica', solicitud: 'Solicitud' };

/** Mis aportes, candidatos que sigo y eventos a los que asistiré. */
export default function Actividad() {
  const { ciudadano, misAportes } = useApp();
  useDatos();
  if (!ciudadano) return null;
  const aportes = misAportes.map(getAporte).filter((a) => !!a);
  const eventos = ciudadano.asistire.map(getEvento).filter((e) => !!e);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title} accessibilityRole="header">{`Hola, ${ciudadano.nombre.split(' ')[0]}`}</Text>
        <Small>{nombreMunicipio(ciudadano.ubicacion.municipio)}</Small>

        <Text style={s.h2}>Mis aportes</Text>
        {aportes.length === 0 ? <Small>Aún no has escrito a ningún candidato.</Small> : null}
        {aportes.map((a) => {
          const c = getCandidato(a.candidato);
          return (
            <Card key={a.id}>
              <View style={s.rowBetween}>
                <Text style={s.h3}>{`${TIPO[a.tipo]} · ${a.tema}`}</Text>
                <Badge label={ESTADO[a.estado].label} tone={ESTADO[a.estado].tone} />
              </View>
              <Text style={s.body} numberOfLines={3}>{a.texto}</Text>
              <Small>{`Para @${c?.usuario ?? ''} · ${hace(a.fecha)}`}</Small>
              {a.respuesta ? (
                <View style={s.respuesta}>
                  <Text style={s.respLabel}>Respuesta del equipo</Text>
                  <Text style={s.body}>{a.respuesta}</Text>
                </View>
              ) : null}
            </Card>
          );
        })}

        <Text style={s.h2}>Eventos a los que asistiré</Text>
        {eventos.length === 0 ? <Small>Marca “Asistiré” en un evento del feed y aparecerá aquí.</Small> : null}
        {eventos.map((e) => {
          const d = diaCorto(e.fecha);
          return (
            <Card key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={s.fecha}><Text style={s.fechaDia}>{d.dia}</Text><Text style={s.fechaNum}>{d.num}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.h3}>{e.titulo}</Text>
                <Small>{`${horaTexto(e.fecha)} · ${e.lugar}`}</Small>
              </View>
            </Card>
          );
        })}

        <Text style={s.h2}>Candidatos que sigo</Text>
        {ciudadano.siguiendo.length === 0 ? <Small>Aún no sigues a ningún candidato.</Small> : null}
        {ciudadano.siguiendo.map((id) => {
          const c = getCandidato(id);
          return c ? <CandidatoRow key={id} c={c} /> : null;
        })}

        <Pressable accessibilityRole="link" onPress={() => {}} style={{ paddingVertical: 8 }}>
          <Small>Mis datos: consultar, corregir o borrar (próximamente).</Small>
        </Pressable>
        <Button label="Salir al inicio" variant="secondary" onPress={() => router.replace('/')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink },
  h2: { fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 8 },
  h3: { fontSize: 15, fontWeight: '600', color: colors.ink },
  body: { fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  respuesta: { backgroundColor: colors.background, borderRadius: 10, padding: 12, gap: 4 },
  respLabel: { fontSize: 12, fontWeight: '700', color: colors.okFg },
  fecha: { width: 44, alignItems: 'center' },
  fechaDia: { fontSize: 11, fontWeight: '700', color: colors.primary },
  fechaNum: { fontSize: 20, fontWeight: '800', color: colors.ink },
});
