import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Texto';
import { Avatar, Badge, Button, Card, CheckRow, Ionicons, Row, Screen, Small, TopBar } from '@/components/ui';
import { colaboradoresDe, cupoDe, delegar, invitacionesDe, miembrosDe } from '@/data/repo';
import type { Miembro } from '@/data/types';
import { fechaCorta } from '@/lib/fechas';
import { useMiCampana } from '@/state/app';
import { type, colors, radius, shadow, estilos } from '@/theme';

/** Equipo: toda la red del candidato (coordinadores, líderes y colaboradores) y quién maneja qué. */
export default function Equipo() {
  const c = useMiCampana();
  if (!c) {
    return (
      <Screen oscura header={<TopBar oscura title="Equipo" />}>
        <Small>Crea tu perfil para armar tu equipo.</Small>
      </Screen>
    );
  }
  const coordinadores = miembrosDe(c.id, { rol: 'coordinador' });
  const lideres = miembrosDe(c.id, { rol: 'lider' });
  const sinCoordinador = lideres.filter((l) => !coordinadores.some((q) => q.id === l.superior));
  const colaboradores = colaboradoresDe({ candidato: c.id }).filter((x) => x.estado !== 'rechazado');
  const porVerificar = colaboradores.filter((x) => x.estado === 'por_verificar').length;
  const pendientes = invitacionesDe(c.id);
  const aspirante = c.etapa === 'aspirante';

  return (
    <Screen
      oscura
      header={<TopBar oscura title="Equipo" subtitle={`${coordinadores.length} coordinadores · ${lideres.length} líderes · ${colaboradores.length} colaboradores`} />}>
      {porVerificar ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="time" size={20} color={colors.warnFg} />
          <Small style={{ flex: 1 }}>{`${porVerificar} ${porVerificar === 1 ? 'colaborador espera' : 'colaboradores esperan'} verificación.`}</Small>
        </Card>
      ) : null}

      {coordinadores.length === 0 ? (
        <Card>
          <Text style={type.h3}>Arma tu equipo</Text>
          <Small>
            {aspirante
              ? 'Como aspirante puedes invitar hasta 3 coordinadores. Al ser candidato, ellos invitan a los líderes de sus barrios.'
              : 'Invita a tus coordinadores. Cada uno invita a los líderes de los barrios de su zona.'}
          </Small>
        </Card>
      ) : null}

      {coordinadores.map((q) => (
        <BloqueCoordinador key={q.id} q={q} lideres={lideres.filter((l) => l.superior === q.id)} />
      ))}

      {sinCoordinador.length ? (
        <View style={{ gap: 8 }}>
          <Text style={type.h2}>Líderes sin coordinador</Text>
          {sinCoordinador.map((l) => <FilaLider key={l.id} l={l} />)}
        </View>
      ) : null}

      {pendientes.length ? (
        <View style={{ gap: 8 }}>
          <Text style={type.h2}>Invitaciones sin usar</Text>
          {pendientes.map((i) => (
            <Card key={i.codigo} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={s.codigo}>{i.codigo}</Text>
              <Small style={{ flex: 1 }}>{`${i.rol === 'lider' ? 'Líder' : 'Coordinador'} · ${i.zona.etiqueta} · vence ${fechaCorta(i.vence)}`}</Small>
            </Card>
          ))}
        </View>
      ) : null}

      <Button label="Invitar coordinador" icon="person-add" onPress={() => router.push('/invitar')} />
    </Screen>
  );
}

function BloqueCoordinador({ q, lideres }: { q: Miembro; lideres: Miembro[] }) {
  return (
    <View style={s.bloque}>
      <Row gap={12}>
        <Avatar nombre={q.nombre} foto={q.foto} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={s.nombre}>{q.nombre}</Text>
          <Small>{`Coordinador · ${q.zona.etiqueta} · ${lideres.length} líderes`}</Small>
        </View>
      </Row>
      <View style={s.delegado}>
        <CheckRow checked={q.delegadoAgenda} onToggle={() => delegar(q.id, { delegadoAgenda: !q.delegadoAgenda })}>
          <Small style={{ color: colors.inkSoft }}>Maneja tu agenda y valida visitas</Small>
        </CheckRow>
        <CheckRow checked={q.delegadoAprobaciones} onToggle={() => delegar(q.id, { delegadoAprobaciones: !q.delegadoAprobaciones })}>
          <Small style={{ color: colors.inkSoft }}>Aprueba colaboradores</Small>
        </CheckRow>
      </View>
      {lideres.map((l) => <FilaLider key={l.id} l={l} />)}
    </View>
  );
}

function FilaLider({ l }: { l: Miembro }) {
  const cupo = cupoDe(l.id);
  const porVerificar = colaboradoresDe({ lider: l.id, estado: 'por_verificar' }).length;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/colaboradores', params: { lider: l.id } })}
      style={({ pressed }) => [s.lider, pressed && { opacity: 0.9 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.liderNombre}>{`${l.nombre} · ${l.zona.etiqueta}`}</Text>
        <Small>{`${cupo.usados} de ${cupo.total} colaboradores`}</Small>
      </View>
      {cupo.usados >= cupo.total ? <Badge label="Cupo lleno" tone="warn" /> : null}
      {porVerificar ? <Badge label={`${porVerificar} por verificar`} tone="warn" /> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.faint} />
    </Pressable>
  );
}

const s = estilos(() => ({
  bloque: { gap: 10, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadow.sm },
  nombre: { fontSize: 16, fontWeight: '700', color: colors.ink },
  delegado: { paddingHorizontal: 4 },
  lider: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.background },
  liderNombre: { fontSize: 15, fontWeight: '600', color: colors.ink },
  codigo: { fontSize: 18, fontWeight: '700', color: colors.ink, letterSpacing: 1 },
}));
