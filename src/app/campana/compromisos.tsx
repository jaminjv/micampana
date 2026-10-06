import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CompromisoCard } from '@/components/agenda';
import { Text } from '@/components/Texto';
import { Button, Card, Chip, ChipRow, Notice, Screen, Small, TopBar } from '@/components/ui';
import { ESTADOS_COMPROMISO } from '@/data/catalogos';
import { compromisosDe } from '@/data/repo';
import type { EstadoCompromiso } from '@/data/types';
import { useMiCampana } from '@/state/app';
import { colors, radius } from '@/theme';

/** Compromisos con comunidades: lo que la campaña se comprometió a impulsar, y en qué va. */
export default function Compromisos() {
  const c = useMiCampana();
  const [estado, setEstado] = useState<EstadoCompromiso>();

  if (!c || c.etapa !== 'candidato') {
    return (
      <Screen oscura header={<TopBar oscura title="Compromisos" />}>
        <Notice icon="lock-closed" tone="warn">Los compromisos se habilitan al ser candidato.</Notice>
      </Screen>
    );
  }

  const todos = compromisosDe(c.id);
  const lista = estado ? todos.filter((m) => m.estado === estado) : todos;
  const cuenta = (e: EstadoCompromiso) => todos.filter((m) => m.estado === e).length;

  return (
    <Screen oscura header={<TopBar oscura title="Compromisos" subtitle="Con las comunidades que visitas" />}>
      <View style={s.stats}>
        {(['registrado', 'en_estudio', 'incluido'] as EstadoCompromiso[]).map((e) => (
          <View key={e} style={s.stat}>
            <Text style={s.statN}>{cuenta(e)}</Text>
            <Text style={s.statL}>{ESTADOS_COMPROMISO[e].label}</Text>
          </View>
        ))}
      </View>

      <ChipRow>
        <Chip label="Todos" dark selected={!estado} onPress={() => setEstado(undefined)} />
        {(Object.keys(ESTADOS_COMPROMISO) as EstadoCompromiso[]).map((e) => (
          <Chip key={e} label={ESTADOS_COMPROMISO[e].label} dark selected={estado === e} onPress={() => setEstado(e)} />
        ))}
      </ChipRow>

      {lista.length === 0 ? (
        <Card>
          <Text style={s.h3}>{estado ? 'Nada en este estado' : 'Aún no hay compromisos'}</Text>
          <Small>Regístralos desde una visita de la agenda o desde un aporte ciudadano. Los que entren al programa se convierten en propuestas.</Small>
        </Card>
      ) : null}

      {lista.map((m) => (
        <CompromisoCard key={m.id} c={m} onPress={() => router.push({ pathname: '/campana/compromiso', params: { id: m.id } })} />
      ))}

      <Button label="Registrar compromiso" variant="secondary" onPress={() => router.push('/campana/compromiso')} />
      <Small>Registra compromisos programáticos con comunidades, nunca beneficios individuales a cambio de votos.</Small>
    </Screen>
  );
}

const s = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, gap: 2 },
  statN: { fontSize: 22, fontWeight: '700', color: colors.ink },
  statL: { fontSize: 13, color: colors.muted },
  h3: { fontSize: 16, fontWeight: '700', color: colors.ink },
});
