/** Piezas de la agenda y los compromisos que se usan en varias pantallas. */
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ESTADOS_COMPROMISO, TIPOS_ACTIVIDAD } from '@/data/catalogos';
import { getActividad, getPropuesta } from '@/data/repo';
import type { Actividad, Compromiso } from '@/data/types';
import { fechaCorta, horaTexto } from '@/lib/fechas';
import { colors, radius, shadow } from '@/theme';
import { Text } from './Texto';
import { Badge, Row } from './ui';

/** Fila de la agenda: hora, título, lugar y estado. */
export function FilaActividad({ a, ultima }: { a: Actividad; ultima?: boolean }) {
  const cancelada = a.estado === 'cancelada';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/campana/actividad', params: { id: a.id } })}
      style={({ pressed }) => [s.fila, !ultima && s.filaBorde, pressed && { backgroundColor: colors.background }]}>
      <Text style={[s.hora, cancelada && { color: colors.faint }]}>{horaTexto(a.fecha)}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.titulo, cancelada && { color: colors.muted, textDecorationLine: 'line-through' }]}>{a.titulo}</Text>
        <Text style={s.meta} numberOfLines={2}>
          {[TIPOS_ACTIVIDAD[a.tipo], a.lugar, a.comunidad.etiqueta].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {a.estado === 'realizada' ? <Badge label="Realizada" tone="ok" /> : null}
      {cancelada ? <Badge label="Cancelada" tone="neutral" /> : null}
    </Pressable>
  );
}

/** Lista de filas de actividades dentro de una tarjeta. */
export function ListaActividades({ items }: { items: Actividad[] }) {
  return (
    <View style={s.lista}>
      {items.map((a, i) => <FilaActividad key={a.id} a={a} ultima={i === items.length - 1} />)}
    </View>
  );
}

/** Tarjeta de compromiso: qué, con quién, dónde, de dónde salió y su estado. */
export function CompromisoCard({ c, onPress }: { c: Compromiso; onPress?: () => void }) {
  const estado = ESTADOS_COMPROMISO[c.estado];
  const visita = c.actividad ? getActividad(c.actividad) : undefined;
  const propuesta = c.propuesta ? getPropuesta(c.propuesta) : undefined;
  const origen = visita ? `De la visita "${visita.titulo}"` : c.aporte ? 'De un aporte ciudadano' : `Registrado el ${fechaCorta(c.fecha)}`;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && onPress && { opacity: 0.9 }]}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Badge label={estado.label} tone={estado.tone} />
        <Text style={s.meta}>{c.comunidad.etiqueta}</Text>
      </Row>
      <Text style={s.que}>{c.que}</Text>
      <Text style={s.meta}>{`Con ${c.conQuien} · ${origen}`}</Text>
      {propuesta ? <Text style={[s.meta, { color: colors.okFg, fontWeight: '600' }]}>{`En la propuesta "${propuesta.titulo}"`}</Text> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  lista: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden', ...shadow.sm },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 56 },
  filaBorde: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  hora: { width: 72, fontSize: 14, fontWeight: '600', color: colors.primary },
  titulo: { fontSize: 15, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, gap: 8, ...shadow.sm },
  que: { fontSize: 16, fontWeight: '600', color: colors.ink, lineHeight: 22 },
});
