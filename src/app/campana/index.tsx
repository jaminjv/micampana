import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Button, Card, Ionicons, Notice, Screen, Small, Title, type IconName } from '@/components/ui';
import { CARGOS, nombreDepartamento, nombreMunicipio, nombrePartido } from '@/data/catalogos';
import { aportesDeCampana, propuestasDeCampana } from '@/data/repo';
import { useApp, useMiCampana } from '@/state/app';
import { colors, radius, shadow } from '@/theme';
import { Text } from '@/components/Texto';

interface Herramienta {
  icon: IconName;
  titulo: string;
  texto: string;
  aspirante: boolean;
  /** Pantalla de la herramienta; sin destino, aún está en construcción. */
  destino?: Href;
}

const HERRAMIENTAS: Herramienta[] = [
  { icon: 'chatbubbles', titulo: 'Ideas ciudadanas', texto: 'Lo que te escribe la gente', aspirante: true, destino: '/campana/voces' },
  { icon: 'stats-chart', titulo: 'Sondeos', texto: 'Pregunta a tu región', aspirante: true },
  { icon: 'person-circle', titulo: 'Mi perfil', texto: 'Perfil público y QR', aspirante: true },
  { icon: 'people', titulo: 'Equipo', texto: 'Coordinadores y líderes', aspirante: true },
  { icon: 'document-text', titulo: 'Propuestas', texto: 'Públicas y permanentes', aspirante: false, destino: '/campana/propuestas' },
  { icon: 'newspaper', titulo: 'Publicar en el feed', texto: 'Eventos y mensajes', aspirante: false, destino: '/campana/publicar' },
  { icon: 'calendar', titulo: 'Agenda y visitas', texto: 'Delegable a un coordinador', aspirante: false },
  { icon: 'images', titulo: 'Marketing', texto: 'Material por evento', aspirante: false },
];

/** Herramientas que se pueden usar en el modo "Solo recibir mensajes". */
const SOLO_MENSAJES = ['Ideas ciudadanas', 'Mi perfil'];

/** Panel del aspirante o candidato después del registro. */
export default function Panel() {
  const { candidatura, cargarBorrador } = useApp();
  const campana = useMiCampana();
  // En pantallas anchas el logo ya está en la barra lateral.
  const conLogo = useWindowDimensions().width < 900;

  if (!candidatura?.cargo || !campana) {
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
  const aportes = aportesDeCampana(campana.id);
  const sinLeer = aportes.filter((a) => a.estado === 'enviado').length;
  const publicadas = propuestasDeCampana(campana.id).filter((p) => p.estado === 'publicada').length;
  const temas = Object.entries(
    aportes
      .filter((a) => a.tema !== 'Otro')
      .reduce<Record<string, number>>((acc, a) => ({ ...acc, [a.tema]: (acc[a.tema] ?? 0) + 1 }), {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t.toLowerCase());

  const destinoDe = (h: Herramienta): Href | undefined =>
    h.titulo === 'Mi perfil' ? { pathname: '/candidato/[usuario]', params: { usuario: campana.usuario } } : h.destino;
  const detalle = (h: Herramienta) => {
    if (h.titulo === 'Ideas ciudadanas' && sinLeer) return `${sinLeer} sin leer`;
    if (h.titulo === 'Mi perfil') return `@${campana.usuario}`;
    return h.texto;
  };

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
    <Screen oscura padded={false}>
      <View style={s.hero}>
        <View style={s.ancho}>
          {conLogo ? (
            <Image source={require('@/../assets/images/logo-nexo-blanco.png')} style={s.logo} contentFit="contain" accessibilityLabel="nexo" />
          ) : null}
          <View style={[s.etiqueta, aspirante && { backgroundColor: colors.warnBg }]}>
            <Text style={[s.etiquetaTexto, aspirante && { color: colors.warnFg }]}>
              {`${aspirante ? 'Aspirante' : 'Candidato'} · ${cargo.nombre} · ${lugar}`}
            </Text>
          </View>
          <Text style={s.hola} accessibilityRole="header">{`Hola, ${campana.nombre.split(' ')[0]}`}</Text>
          {aval ? <Text style={s.aval}>{`${aval}${candidatura.numero ? ` · N.º ${candidatura.numero}` : ''}`}</Text> : null}
          <View style={s.stats}>
            <Stat n={campana.seguidores} label="Seguidores" />
            <Stat n={aportes.length} label="Aportes" nuevo={sinLeer} />
            {aspirante ? null : <Stat n={publicadas} label="Propuestas" />}
          </View>
          {temas.length ? <Text style={s.temas}>{`Lo que más te escriben: ${temas.join(', ')}`}</Text> : null}
        </View>
      </View>

      <View style={[s.cuerpo, s.ancho]}>
      {!aspirante && !campana.verificado ? (
        <Notice icon="time" tone="warn">Verificando tu aval. Mientras tanto puedes preparar tu perfil.</Notice>
      ) : null}

      <Text style={s.h2}>Tus herramientas</Text>
      <View style={s.grid}>
        {HERRAMIENTAS.map((h) => {
          const bloqueada = (aspirante && !h.aspirante) || (soloMensajes && !SOLO_MENSAJES.includes(h.titulo));
          const destino = destinoDe(h);
          const proximamente = !bloqueada && !destino;
          return (
            <Pressable
              key={h.titulo}
              accessibilityRole="button"
              accessibilityState={{ disabled: bloqueada || proximamente }}
              disabled={bloqueada || proximamente}
              onPress={() => destino && router.push(destino)}
              style={({ pressed }) => [s.tool, (bloqueada || proximamente) && s.toolLocked, pressed && { opacity: 0.85 }]}>
              <Ionicons name={bloqueada ? 'lock-closed' : h.icon} size={22} color={bloqueada || proximamente ? colors.faint : colors.primary} />
              <Text style={[s.toolTitle, (bloqueada || proximamente) && { color: colors.muted }]}>{h.titulo}</Text>
              <Text style={s.toolText}>{proximamente ? 'Próximamente' : detalle(h)}</Text>
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

      <Small>Sondeos, equipo, agenda y marketing se construyen en las siguientes fases.</Small>
      <Button label="Volver al inicio" variant="secondary" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

/** Dato del bloque oscuro; "nuevo" muestra una insignia coral con lo que falta por leer. */
function Stat({ n, label, nuevo }: { n: number; label: string; nuevo?: number }) {
  return (
    <View style={s.stat}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={s.statN}>{n.toLocaleString('es-CO')}</Text>
        {nuevo ? (
          <View style={s.nuevo} accessibilityLabel={`${nuevo} sin leer`}>
            <Text style={s.nuevoTexto}>{`${nuevo} nuevos`}</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.statL}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: colors.night, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  ancho: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 10 },
  cuerpo: { padding: 20, paddingBottom: 32, gap: 16 },
  logo: { width: 80, height: 20, marginBottom: 6 },
  etiqueta: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.nightSoft },
  etiquetaTexto: { fontSize: 12, fontWeight: '600', color: colors.onNight },
  hola: { fontSize: 28, fontWeight: '700', color: colors.onNight, letterSpacing: -0.3 },
  aval: { fontSize: 14, color: colors.onNightMuted },
  stats: { flexDirection: 'row', gap: 8, marginTop: 6 },
  stat: { flex: 1, gap: 2, padding: 12, borderRadius: radius.md, backgroundColor: colors.nightSoft },
  statN: { fontSize: 24, fontWeight: '700', color: colors.onNight },
  statL: { fontSize: 13, color: colors.onNightMuted },
  nuevo: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.accent },
  nuevoTexto: { fontSize: 11, fontWeight: '700', color: colors.onAccent },
  temas: { fontSize: 13, color: colors.onNightMuted },
  h2: { fontSize: 18, fontWeight: '700', color: colors.ink },
  h3: { fontSize: 16, fontWeight: '700', color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tool: { width: '48%', flexGrow: 1, minHeight: 104, padding: 14, gap: 4, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadow.sm },
  toolLocked: { backgroundColor: colors.background, boxShadow: 'none' },
  toolTitle: { fontSize: 15, fontWeight: '600', color: colors.ink, marginTop: 4 },
  toolText: { fontSize: 13, color: colors.muted },
});
