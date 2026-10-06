import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CARGOS } from '@/data/catalogos';
import { cargoConTerritorio, getCandidato, getEvento, getPropuesta, textoAval } from '@/data/repo';
import type { Candidato, Propuesta, Publicacion } from '@/data/types';
import { diaCorto, fechaCorta, hace, horaTexto } from '@/lib/fechas';
import { colors, radius, shadow } from '@/theme';
import { BarraReacciones, ComentariosRecientes } from './comentarios';
import { Avatar, Badge, Button, Ionicons, Row, VerifiedMark } from './ui';
import { Text } from './Texto';

/** Fila de candidato: avatar, nombre, @usuario, cargo, aval y número. */
export function CandidatoRow({ c, compacto, destino = 'perfil' }: { c: Candidato; compacto?: boolean; destino?: 'perfil' | 'escribir' }) {
  const pathname = destino === 'escribir' ? '/escribir/[usuario]' : '/candidato/[usuario]';
  return (
    <Link href={{ pathname, params: { usuario: c.usuario } }} asChild>
      <Pressable accessibilityRole="link" style={StyleSheet.flatten([s.candRow, !compacto && s.candCard])}>
        <Avatar nombre={c.nombre} size={compacto ? 40 : 52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Row gap={6}>
            <Text style={s.candName}>{c.nombre}</Text>
            {c.verificado ? <VerifiedMark /> : null}
          </Row>
          <Text style={s.user}>@{c.usuario}</Text>
          <Text style={s.meta} numberOfLines={2}>
            {`${cargoConTerritorio(c)} · ${textoAval(c)}${c.etapa === 'candidato' && !c.verificado ? ' · verificación en curso' : ''}`}
          </Text>
        </View>
        {c.numero && CARGOS[c.cargo].corporacion ? <NumeroTarjeton n={c.numero} /> : null}
      </Pressable>
    </Link>
  );
}

export function NumeroTarjeton({ n }: { n: number }) {
  return (
    <View style={s.num} accessibilityLabel={`Número ${n} en el tarjetón`}>
      <Text style={s.numLabel}>N.º</Text>
      <Text style={s.numText}>{n}</Text>
    </View>
  );
}

/** Tarjeta de propuesta con su territorio, la marca de "Editada" y sus versiones anteriores. */
export function PropuestaCard({ p }: { p: Propuesta }) {
  const [verCambios, setVerCambios] = useState(false);
  const retirada = p.estado === 'retirada';
  return (
    <View style={[s.card, retirada && { backgroundColor: colors.background }]}>
      <Row gap={8}>
        <Badge label={p.tema} />
        <Text style={s.meta}>{p.alcance.etiqueta}</Text>
        {retirada ? <Badge label="Retirada" tone="neutral" /> : null}
      </Row>
      <Text style={[s.title, retirada && { color: colors.muted }]}>{p.titulo}</Text>
      <Text style={s.body}>{p.resumen}</Text>
      {p.retirada ? (
        <View style={s.version}>
          <Text style={s.versionLabel}>{`Retirada el ${fechaCorta(p.retirada.fecha)}. Explicación del candidato:`}</Text>
          <Text style={s.body}>{p.retirada.motivo}</Text>
        </View>
      ) : null}
      <Row gap={4} style={{ flexWrap: 'wrap' }}>
        <Text style={s.meta}>{`Publicada ${fechaCorta(p.publicadaEl)}`}</Text>
        {p.editada ? (
          <Pressable accessibilityRole="button" onPress={() => setVerCambios((v) => !v)} hitSlop={10}>
            <Text style={[s.meta, { color: colors.warnFg, fontWeight: '600' }]}>
              {verCambios ? '· Editada, ocultar cambios' : '· Editada, ver cambios'}
            </Text>
          </Pressable>
        ) : null}
      </Row>
      {verCambios
        ? [...p.versiones].reverse().map((v, i) => (
            <View key={v.guardadaEl + i} style={s.version}>
              <Text style={s.versionLabel}>{`Versión anterior, cambiada el ${fechaCorta(v.guardadaEl)}`}</Text>
              <Text style={[s.body, { fontWeight: '600' }]}>{v.titulo}</Text>
              <Text style={s.body}>{v.resumen}</Text>
            </View>
          ))
        : null}
    </View>
  );
}

interface PostProps {
  pub: Publicacion;
  /** Vista del candidato: ve los totales pero no reacciona a lo suyo. */
  soloLectura?: boolean;
  /** En la pantalla de comentarios no se repiten los últimos bajo la publicación. */
  sinRecientes?: boolean;
  asistire: boolean;
  onAsistire: (eventoId: string) => void;
}

/** Publicación del feed: evento (con "Asistiré"), propuesta o mensaje. */
export function PostCard({ pub, asistire, onAsistire, soloLectura, sinRecientes }: PostProps) {
  const c = getCandidato(pub.candidato);
  if (!c) return null;
  const etiqueta = pub.tipo === 'evento' ? 'Evento' : pub.tipo === 'propuesta' ? 'Propuesta' : 'Mensaje';
  const tono = pub.tipo === 'evento' ? 'ok' : pub.tipo === 'propuesta' ? 'primary' : 'neutral';

  return (
    <View style={s.post}>
      <Link href={{ pathname: '/candidato/[usuario]', params: { usuario: c.usuario } }} asChild>
        <Pressable accessibilityRole="link" style={s.postHead}>
          <Avatar nombre={c.nombre} size={40} />
          <View style={{ flex: 1 }}>
            <Row gap={6}>
              <Text style={s.candName} numberOfLines={1}>{c.nombre}</Text>
              {c.verificado ? <VerifiedMark size={14} /> : null}
            </Row>
            <Text style={s.meta} numberOfLines={1}>{`${cargoConTerritorio(c)} · ${hace(pub.fecha)}`}</Text>
          </View>
          <Badge label={etiqueta} tone={tono} />
        </Pressable>
      </Link>

      {pub.tipo === 'evento' ? <EventoBody pub={pub} asistire={asistire} onAsistire={onAsistire} /> : null}
      {pub.tipo === 'propuesta' ? <PropuestaBody id={pub.propuesta} /> : null}
      {pub.tipo === 'mensaje' ? <Text style={[s.body, s.pad]}>{pub.texto}</Text> : null}
      <BarraReacciones pub={pub.id} soloLectura={soloLectura} />
      {sinRecientes ? null : <ComentariosRecientes pub={pub.id} />}
    </View>
  );
}

function EventoBody({ pub, asistire, onAsistire }: PostProps & { pub: Extract<Publicacion, { tipo: 'evento' }> }) {
  const e = getEvento(pub.evento);
  if (!e) return null;
  const d = diaCorto(e.fecha);
  return (
    <>
      {pub.conPieza ? (
        <View style={s.pieza} accessibilityLabel="Pieza gráfica del evento">
          <Ionicons name="image-outline" size={32} color={colors.muted} />
          <Text style={s.meta}>Pieza gráfica del evento</Text>
        </View>
      ) : null}
      <View style={[s.pad, { gap: 10 }]}>
        <Text style={s.body}>{pub.texto}</Text>
        <View style={s.evento}>
          <View style={s.fecha}>
            <Text style={s.fechaDia}>{d.dia}</Text>
            <Text style={s.fechaNum}>{d.num}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.eventoTitle}>{e.titulo}</Text>
            <Text style={s.meta}>{`${horaTexto(e.fecha)} · ${e.lugar}`}</Text>
          </View>
        </View>
        <Button
          label={asistire ? 'Asistiré ✓' : 'Asistiré'}
          variant={asistire ? 'secondary' : 'accent'}
          size="md"
          onPress={() => onAsistire(e.id)}
        />
      </View>
    </>
  );
}

function PropuestaBody({ id }: { id: string }) {
  const p = getPropuesta(id);
  if (!p) return null;
  return (
    <View style={[s.pad, { gap: 6 }]}>
      <Text style={s.title}>{p.titulo}</Text>
      <Text style={s.body} numberOfLines={3}>{p.resumen}</Text>
      <Text style={s.meta}>{`Para ${p.alcance.etiqueta}`}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  candRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  candCard: { padding: 16, ...shadow.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  candName: { fontSize: 16, fontWeight: '600', color: colors.ink, flexShrink: 1 },
  user: { fontSize: 13, fontWeight: '600', color: colors.primary },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  num: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  numLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  numText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', lineHeight: 22 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18, gap: 10, ...shadow.sm },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink },
  version: { backgroundColor: colors.background, borderRadius: 10, padding: 12, gap: 4 },
  versionLabel: { fontSize: 12, fontWeight: '700', color: colors.muted },
  body: { fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  post: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden', ...shadow.sm },
  postHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  pad: { paddingHorizontal: 18, paddingBottom: 18 },
  pieza: { height: 200, backgroundColor: colors.placeholder, alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 },
  evento: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.background },
  fecha: { width: 44, alignItems: 'center' },
  fechaDia: { fontSize: 11, fontWeight: '700', color: colors.primary },
  fechaNum: { fontSize: 20, fontWeight: '800', color: colors.ink },
  eventoTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
});
