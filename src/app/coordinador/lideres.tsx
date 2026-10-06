import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Texto';
import { Avatar, Badge, Button, Card, Ionicons, Row, Screen, Small, TopBar } from '@/components/ui';
import { colaboradoresDe, cupoDe, invitacionesDe, miembrosDe, tareasDe, vencida } from '@/data/repo';
import { fechaCorta } from '@/lib/fechas';
import { useMiMiembro } from '@/state/app';
import { type, colors, radius, shadow, estilos } from '@/theme';

/** Los líderes comunales a cargo del coordinador, con su cupo y sus tareas. */
export default function Lideres() {
  const m = useMiMiembro();
  if (!m) return null;
  const lideres = miembrosDe(m.candidato, { rol: 'lider', superior: m.id });
  const pendientes = invitacionesDe(m.candidato, m.id);

  return (
    <Screen oscura header={<TopBar oscura title="Mis líderes" subtitle={`${lideres.length} en ${m.zona.etiqueta}`} />}>
      {lideres.length === 0 ? (
        <Card>
          <Text style={type.h3}>Aún no tienes líderes</Text>
          <Small>Invita a los líderes comunales de los barrios de tu zona. Cada uno recibe un código con su barrio.</Small>
        </Card>
      ) : null}
      {lideres.map((l) => {
        const cupo = cupoDe(l.id);
        const tareas = tareasDe(l.id);
        const pend = tareas.filter((t) => t.estado === 'pendiente').length;
        const venc = tareas.filter(vencida).length;
        const porVerificar = colaboradoresDe({ lider: l.id, estado: 'por_verificar' }).length;
        return (
          <Pressable
            key={l.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/colaboradores', params: { lider: l.id } })}
            style={({ pressed }) => [s.fila, pressed && { opacity: 0.9 }]}>
            <Avatar nombre={l.nombre} foto={l.foto} size={44} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.nombre}>{l.nombre}</Text>
              <Small>{`${l.zona.etiqueta} · ${cupo.usados} de ${cupo.total} colaboradores`}</Small>
              <Row gap={6} style={{ flexWrap: 'wrap', marginTop: 2 }}>
                {venc ? <Badge label={`${venc} vencidas`} tone="danger" /> : null}
                {pend ? <Badge label={`${pend} pendientes`} /> : null}
                {porVerificar ? <Badge label={`${porVerificar} por verificar`} tone="warn" /> : null}
              </Row>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </Pressable>
        );
      })}

      {pendientes.length ? (
        <>
          <Text style={type.h2}>Invitaciones sin usar</Text>
          {pendientes.map((i) => (
            <Card key={i.codigo} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={s.codigo}>{i.codigo}</Text>
              <Small style={{ flex: 1 }}>{`${i.zona.etiqueta} · vence ${fechaCorta(i.vence)}`}</Small>
            </Card>
          ))}
        </>
      ) : null}
      <Button label="Invitar líder" icon="person-add" onPress={() => router.push('/invitar')} />
    </Screen>
  );
}

const s = estilos(() => ({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadow.sm },
  nombre: { fontSize: 16, fontWeight: '600', color: colors.ink },
  codigo: { fontSize: 18, fontWeight: '700', color: colors.ink, letterSpacing: 1 },
}));
