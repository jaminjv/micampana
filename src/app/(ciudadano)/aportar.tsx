import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CandidatoRow } from '@/components/cards';
import { Small } from '@/components/ui';
import { buscarCandidatos } from '@/data/repo';
import { useApp } from '@/state/app';
import { colors } from '@/theme';
import { Text } from '@/components/Texto';

/** Elegir a qué candidato escribirle. Primero los que sigue, luego los de su región. */
export default function Aportar() {
  const { ciudadano } = useApp();
  if (!ciudadano) return null;
  const region = buscarCandidatos({ texto: '', soloMiRegion: true }, ciudadano.ubicacion);
  const seguidos = region.filter((c) => ciudadano.siguiendo.includes(c.id));
  const otros = region.filter((c) => !ciudadano.siguiendo.includes(c.id));

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title} accessibilityRole="header">¿A quién le escribes?</Text>
        <Small>Envía una idea, un consejo, una crítica o una solicitud. Su equipo la lee y te responde aquí.</Small>
        {seguidos.length ? (
          <>
            <Text style={s.label}>Candidatos que sigues</Text>
            <View style={{ gap: 10 }}>{seguidos.map((c) => <CandidatoRow key={c.id} c={c} destino="escribir" />)}</View>
          </>
        ) : null}
        <Text style={s.label}>En tu región</Text>
        <View style={{ gap: 10 }}>{otros.map((c) => <CandidatoRow key={c.id} c={c} destino="escribir" />)}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink },
  label: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 8 },
});
