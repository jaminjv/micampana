import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Ionicons, Notice, Screen, Small, Title, type IconName } from '@/components/ui';
import { CARGOS, nombreDepartamento, nombreMunicipio, nombrePartido } from '@/data/catalogos';
import { useApp } from '@/state/app';
import { colors, radius } from '@/theme';

interface Herramienta { icon: IconName; titulo: string; texto: string; aspirante: boolean }

const HERRAMIENTAS: Herramienta[] = [
  { icon: 'chatbubbles', titulo: 'Ideas ciudadanas', texto: 'Lo que te escribe la gente', aspirante: true },
  { icon: 'stats-chart', titulo: 'Sondeos', texto: 'Pregunta a tu región', aspirante: true },
  { icon: 'person-circle', titulo: 'Mi perfil', texto: 'Perfil público y QR', aspirante: true },
  { icon: 'people', titulo: 'Equipo', texto: 'Coordinadores y líderes', aspirante: true },
  { icon: 'document-text', titulo: 'Propuestas', texto: 'Públicas y permanentes', aspirante: false },
  { icon: 'newspaper', titulo: 'Publicar en el feed', texto: 'Eventos y mensajes', aspirante: false },
  { icon: 'calendar', titulo: 'Agenda y visitas', texto: 'Delegable a un coordinador', aspirante: false },
  { icon: 'images', titulo: 'Marketing', texto: 'Material por evento', aspirante: false },
];

/** Panel del aspirante o candidato después del registro. */
export default function Panel() {
  const { candidatura, cargarBorrador } = useApp();

  if (!candidatura?.cargo) {
    return (
      <Screen>
        <Title>Aún no tienes perfil</Title>
        <Button label="Crear mi perfil" onPress={() => router.replace('/registro/etapa')} />
      </Screen>
    );
  }

  const aspirante = candidatura.etapa === 'aspirante';
  const cargo = CARGOS[candidatura.cargo];
  const lugar = candidatura.municipio ? nombreMunicipio(candidatura.municipio) : nombreDepartamento(candidatura.departamento ?? '');
  const soloMensajes = candidatura.modo === 'solo_mensajes';

  const aval =
    candidatura.tipoAval === 'firmas'
      ? candidatura.grupoSignificativo
      : candidatura.tipoAval === 'coalicion'
        ? `Coalición: ${candidatura.partidos.map(nombrePartido).join(', ')}`
        : candidatura.partidos[0] ? nombrePartido(candidatura.partidos[0]) : undefined;

  const actualizar = () => {
    cargarBorrador({ ...candidatura, etapa: 'candidato', tipoAval: 'partido', partidos: [] });
    router.push({ pathname: '/registro/aval', params: { actualizar: '1' } });
  };

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Badge label={`${aspirante ? 'Aspirante' : 'Candidato'} · ${cargo.nombre} · ${lugar}`} tone={aspirante ? 'warn' : 'primary'} />
        <Title>{`Hola, @${candidatura.usuario}`}</Title>
        {aval ? <Small>{aval}{candidatura.numero ? ` · N.º ${candidatura.numero}` : ''}</Small> : null}
      </View>

      {!aspirante ? (
        <Notice icon="time" tone="warn">Verificando tu aval. Mientras tanto puedes preparar tu perfil.</Notice>
      ) : null}

      <Text style={s.h2}>Tus herramientas</Text>
      <View style={s.grid}>
        {HERRAMIENTAS.map((h) => {
          const bloqueada = (aspirante && !h.aspirante) || (soloMensajes && !['Ideas ciudadanas', 'Mi perfil'].includes(h.titulo));
          return (
            <Pressable
              key={h.titulo}
              accessibilityRole="button"
              accessibilityState={{ disabled: bloqueada }}
              disabled={bloqueada}
              style={[s.tool, bloqueada && s.toolLocked]}>
              <Ionicons name={bloqueada ? 'lock-closed' : h.icon} size={22} color={bloqueada ? colors.faint : colors.primary} />
              <Text style={[s.toolTitle, bloqueada && { color: colors.muted }]}>{h.titulo}</Text>
              <Text style={s.toolText}>{h.texto}</Text>
            </Pressable>
          );
        })}
      </View>

      {aspirante ? (
        <Card style={{ borderStyle: 'dashed', borderColor: colors.faint }}>
          <Text style={s.h3}>Al ser candidato se habilitan</Text>
          <Small>Propuestas públicas, publicaciones en el feed, líderes y colaboradores, agenda y visitas, tareas y equipo de marketing.</Small>
          <Button label="Ya tengo aval: actualizar a candidato" onPress={actualizar} />
          <Small>Conservas tu @usuario, tus seguidores, las ideas recibidas y tu equipo.</Small>
        </Card>
      ) : null}

      <Small>Las herramientas de cada módulo se construyen en las siguientes fases.</Small>
      <Button label="Volver al inicio" variant="secondary" onPress={() => router.replace('/')} />
    </Screen>
  );
}

const s = StyleSheet.create({
  h2: { fontSize: 18, fontWeight: '700', color: colors.ink },
  h3: { fontSize: 16, fontWeight: '700', color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tool: { width: '48%', flexGrow: 1, minHeight: 104, padding: 14, gap: 4, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  toolLocked: { backgroundColor: colors.background },
  toolTitle: { fontSize: 15, fontWeight: '600', color: colors.ink, marginTop: 4 },
  toolText: { fontSize: 13, color: colors.muted },
});
