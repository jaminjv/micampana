import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Ionicons, Notice, Row, Screen, Small, TopBar } from '@/components/ui';
import { CARGOS } from '@/data/catalogos';
import { propuestasDeCampana, territoriosSinPropuesta } from '@/data/repo';
import type { Propuesta } from '@/data/types';
import { fechaCorta } from '@/lib/fechas';
import { useMiCampana } from '@/state/app';
import { colors, radius } from '@/theme';

/** Mis propuestas: borradores por publicar y propuestas publicadas (permanentes). */
export default function MisPropuestas() {
  const c = useMiCampana();

  if (!c || c.etapa !== 'candidato') {
    return (
      <Screen header={<TopBar title="Mis propuestas" />}>
        <Notice icon="lock-closed" tone="warn">
          Las propuestas públicas se habilitan al ser candidato. Como aspirante puedes escuchar ideas y hacer sondeos.
        </Notice>
        <Button label="Volver al panel" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const todas = propuestasDeCampana(c.id);
  const borradores = todas.filter((p) => p.estado === 'borrador');
  const publicadas = todas.filter((p) => p.estado !== 'borrador');
  const sin = territoriosSinPropuesta(c);
  const departamental = CARGOS[c.cargo].ambito === 'departamento';

  return (
    <Screen
      header={
        <TopBar
          title="Mis propuestas"
          subtitle={`Perfil público · @${c.usuario}`}
          right={
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/campana/propuesta')}
              style={({ pressed }) => [s.nueva, pressed && { opacity: 0.85 }]}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={s.nuevaText}>Nueva</Text>
            </Pressable>
          }
        />
      }>
      <View style={s.stats}>
        <Stat n={publicadas.filter((p) => p.estado === 'publicada').length} label="Publicadas" />
        <Stat n={borradores.length} label="Borradores" warn={borradores.length > 0} />
        <Stat n={sin.length} label={departamental ? 'Municipios sin propuesta' : 'Barrios sin propuesta'} />
      </View>
      {sin.length > 0 && sin.length <= 6 ? <Small>{`Aún sin propuesta: ${sin.join(', ')}.`}</Small> : null}

      {borradores.length > 0 ? (
        <>
          <Text style={s.h2}>Por publicar</Text>
          {borradores.map((p) => (
            <Card key={p.id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Badge label="Borrador" tone="warn" />
                <Small>{`Creada ${fechaCorta(p.publicadaEl)}`}</Small>
              </Row>
              <Text style={s.titulo}>{p.titulo}</Text>
              <Small>{`${p.tema} · ${p.alcance.etiqueta}`}</Small>
              <Button
                label="Revisar y publicar"
                size="md"
                onPress={() => router.push({ pathname: '/campana/propuesta', params: { id: p.id } })}
              />
            </Card>
          ))}
        </>
      ) : null}

      <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={s.h2}>Publicadas</Text>
        <Small>No se pueden borrar</Small>
      </Row>
      {publicadas.length === 0 ? (
        <Card>
          <Text style={s.titulo}>Aún no has publicado propuestas</Text>
          <Small>Cuéntale a la gente qué harás por su barrio, su comuna o su ciudad. Cada propuesta llega a los ciudadanos del territorio que elijas.</Small>
          <Button label="Escribir mi primera propuesta" size="md" onPress={() => router.push('/campana/propuesta')} />
        </Card>
      ) : (
        <View style={s.lista}>
          {publicadas.map((p, i) => (
            <FilaPublicada key={p.id} p={p} ultima={i === publicadas.length - 1} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function Stat({ n, label, warn }: { n: number; label: string; warn?: boolean }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statN, warn && { color: colors.warnFg }]}>{n}</Text>
      <Text style={s.statL}>{label}</Text>
    </View>
  );
}

function FilaPublicada({ p, ultima }: { p: Propuesta; ultima: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Corregir o retirar la propuesta"
      onPress={() => router.push({ pathname: '/campana/propuesta', params: { id: p.id } })}
      style={({ pressed }) => [s.fila, !ultima && s.filaBorde, pressed && { backgroundColor: colors.background }]}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[s.filaTitulo, p.estado === 'retirada' && { color: colors.muted }]}>{p.titulo}</Text>
        <Text style={s.meta}>
          {`${p.tema} · ${p.alcance.etiqueta} · ${p.lecturas.toLocaleString('es-CO')} lecturas`}
          {p.editada ? <Text style={s.editada}> · Editada</Text> : null}
          {p.estado === 'retirada' ? <Text style={s.retirada}> · Retirada</Text> : null}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.faint} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  nueva: { height: 40, paddingHorizontal: 14, marginRight: 8, borderRadius: radius.md, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 4 },
  nuevaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, gap: 2 },
  statN: { fontSize: 22, fontWeight: '700', color: colors.ink },
  statL: { fontSize: 13, color: colors.muted },
  h2: { fontSize: 17, fontWeight: '700', color: colors.ink },
  titulo: { fontSize: 16, fontWeight: '700', color: colors.ink },
  lista: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 },
  filaBorde: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  filaTitulo: { fontSize: 15, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  editada: { color: colors.warnFg, fontWeight: '600' },
  retirada: { color: colors.inkSoft, fontWeight: '600' },
});
