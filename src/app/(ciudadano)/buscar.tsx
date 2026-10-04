import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CandidatoRow } from '@/components/cards';
import { Chip, Ionicons, Small } from '@/components/ui';
import { CARGOS, PARTIDOS } from '@/data/catalogos';
import { buscarCandidatos } from '@/data/repo';
import type { Cargo } from '@/data/types';
import { useApp } from '@/state/app';
import { colors, radius } from '@/theme';

/** Directorio de candidatos: por nombre o @usuario, con filtros de región, cargo y partido. */
export default function Buscar() {
  const { ciudadano } = useApp();
  const [texto, setTexto] = useState('');
  const [soloMiRegion, setSoloMiRegion] = useState(true);
  const [cargo, setCargo] = useState<Cargo>();
  const [partido, setPartido] = useState<string>();

  const resultados = buscarCandidatos({ texto, soloMiRegion, cargo, partido }, ciudadano?.ubicacion);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title} accessibilityRole="header">Buscar candidatos</Text>
        <View style={s.search}>
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Nombre o @usuario"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            accessibilityLabel="Buscar por nombre o usuario"
            style={s.input}
          />
          <View style={s.qr} accessibilityLabel="Escanear código QR (próximamente)">
            <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
          </View>
        </View>

        <View style={s.row}>
          <Chip label="Mi región" selected={soloMiRegion} dark onPress={() => setSoloMiRegion(true)} />
          <Chip label="Todo el país" selected={!soloMiRegion} dark onPress={() => setSoloMiRegion(false)} />
        </View>

        <Text style={s.label}>Cargo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          <Chip label="Todos" selected={!cargo} onPress={() => setCargo(undefined)} />
          {(Object.keys(CARGOS) as Cargo[]).map((c) => (
            <Chip key={c} label={CARGOS[c].nombre} selected={cargo === c} onPress={() => setCargo(cargo === c ? undefined : c)} />
          ))}
        </ScrollView>

        <Text style={s.label}>Partido</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          <Chip label="Todos" selected={!partido} onPress={() => setPartido(undefined)} />
          {PARTIDOS.map((p) => (
            <Chip
              key={p.id}
              label={p.sigla ?? p.nombre.replace(/^Partido /, '')}
              selected={partido === p.id}
              onPress={() => setPartido(partido === p.id ? undefined : p.id)}
            />
          ))}
        </ScrollView>
        {partido ? <Small>Incluye candidatos de coalición con este partido.</Small> : null}

        <Small>{`${resultados.length} ${resultados.length === 1 ? 'candidato' : 'candidatos'} registrados`}</Small>
        <View style={{ gap: 10 }}>
          {resultados.map((c) => <CandidatoRow key={c.id} c={c} />)}
        </View>
        {resultados.length === 0 ? (
          <Small style={{ textAlign: 'center', paddingVertical: 24 }}>
            No encontramos candidatos con esos filtros. Solo aparecen quienes se han registrado en la app.
          </Small>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 12 },
  qr: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink, marginTop: 4 },
});
