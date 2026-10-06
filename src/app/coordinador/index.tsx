import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CabeceraEquipo, DatoOscuro } from '@/components/equipo';
import { Text } from '@/components/Texto';
import { Button, Card, Ionicons, Row, Screen, Small } from '@/components/ui';
import { agendaDe, colaboradoresDe, enZona, getCandidato, miembrosDe, solicitudesDe, tareasDe, vencida } from '@/data/repo';
import type { Tarea } from '@/data/types';
import { hace } from '@/lib/fechas';
import { useMiMiembro } from '@/state/app';
import { colors, radius, shadow, type } from '@/theme';

const SEMANA = 7 * 86400_000;

/** Mi zona: lo que espera aprobación, alertas de los líderes y cómo va la semana. */
export default function MiZona() {
  const m = useMiMiembro();
  if (!m) return null;
  const c = getCandidato(m.candidato);
  const lideres = miembrosDe(m.candidato, { rol: 'lider', superior: m.id });
  const ids = lideres.map((l) => l.id);

  const visitas = solicitudesDe(m.candidato, 'pendiente').filter((v) => ids.includes(v.propuestaPor)).length;
  const colaboradores = colaboradoresDe({ candidato: m.candidato, estado: 'por_verificar' }).filter((x) => ids.includes(x.lider)).length;
  const tareas = lideres.flatMap((l) => tareasDe(l.id).map((t) => ({ t, lider: l.nombre })));
  const vencidas = tareas.filter(({ t }) => vencida(t));
  const recientes = tareas
    .filter(({ t }) => t.reporte && Date.now() - new Date(t.reporte.fecha).getTime() < 3 * 86400_000)
    .sort((a, b) => b.t.reporte!.fecha.localeCompare(a.t.reporte!.fecha));
  const hechasSemana = tareas.filter(({ t }) => t.reporte && Date.now() - new Date(t.reporte.fecha).getTime() < SEMANA).length;
  const ahora = new Date();
  const visitasSemana = agendaDe(m.candidato, ahora, new Date(ahora.getTime() + SEMANA)).filter(
    (a) => a.tipo === 'visita' && a.estado !== 'cancelada' && enZona(m.zona, a.comunidad),
  ).length;
  const misTareas = tareasDe(m.id).filter((t) => t.estado === 'pendiente');

  const alertas: { color: string; titulo: string; detalle: string; t?: Tarea }[] = [
    ...vencidas.map(({ t, lider }) => ({ color: colors.dangerFg, titulo: `${lider}: tarea vencida`, detalle: t.titulo })),
    ...lideres
      .filter((l) => tareasDe(l.id).length === 0)
      .map((l) => ({ color: colors.warnFg, titulo: `${l.nombre} no tiene tareas`, detalle: `${l.zona.etiqueta} · asígnale una` })),
    ...recientes.slice(0, 3).map(({ t, lider }) => ({
      color: colors.okFg,
      titulo: `${lider} reportó "${t.titulo}"`,
      detalle: `${hace(t.reporte!.fecha)}${t.reporte!.fotos.length ? ' · con fotos' : ''}${t.reporte!.cantidad ? ` · ${t.reporte!.cantidad}` : ''}`,
    })),
  ];

  return (
    <Screen oscura padded={false}>
      <CabeceraEquipo m={m} titulo={`Hola, ${m.nombre.split(' ')[0]}`}>
        <Text style={s.campana}>{c ? `Campaña de ${c.nombre}` : ''}</Text>
        <View style={s.datos}>
          <DatoOscuro n={lideres.length} label="Líderes" />
          <DatoOscuro n={visitas + colaboradores} label="Por aprobar" alerta />
          <DatoOscuro n={vencidas.length} label="Tareas vencidas" alerta />
        </View>
      </CabeceraEquipo>

      <View style={s.cuerpo}>
        {visitas + colaboradores > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/coordinador/aprobar')} style={s.aprobar}>
            <Text style={s.aprobarTitulo}>Esperan tu aprobación</Text>
            <Row gap={16}>
              <Text style={s.aprobarTexto}>{`${visitas} ${visitas === 1 ? 'visita' : 'visitas'}`}</Text>
              <Text style={s.aprobarTexto}>{`${colaboradores} ${colaboradores === 1 ? 'colaborador' : 'colaboradores'}`}</Text>
            </Row>
            <Text style={s.aprobarTexto}>Revisar ahora ›</Text>
          </Pressable>
        ) : null}

        <Text style={type.h2}>Alertas de la zona</Text>
        {alertas.length ? (
          <View style={s.lista}>
            {alertas.map((a, i) => (
              <View key={i} style={[s.alerta, i < alertas.length - 1 && s.borde]}>
                <View style={[s.punto, { backgroundColor: a.color }]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.alertaTitulo}>{a.titulo}</Text>
                  <Small>{a.detalle}</Small>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Card><Small>Todo al día en tu zona.</Small></Card>
        )}

        <Text style={type.h2}>Esta semana en tu zona</Text>
        <View style={s.datos}>
          <Dato n={lideres.length} label="Líderes activos" />
          <Dato n={hechasSemana} label="Tareas hechas" />
          <Dato n={visitasSemana} label="Visitas" />
        </View>

        {misTareas.length ? (
          <>
            <Text style={type.h2}>Tus tareas</Text>
            {misTareas.map((t) => (
              <Card key={t.id}>
                <Text style={type.h3}>{t.titulo}</Text>
                <Small>Asignada por el candidato</Small>
                <Button label="Reportar" size="md" onPress={() => router.push({ pathname: '/reportar', params: { id: t.id } })} />
              </Card>
            ))}
          </>
        ) : null}

        <Row gap={8}>
          <Button label="Nueva tarea" icon="add" style={{ flex: 1 }} disabled={!lideres.length} onPress={() => router.push('/coordinador/tarea')} />
          <Button label="Invitar líder" icon="person-add" variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/invitar')} />
        </Row>
        <Button label="Tu cuenta y tu celular" variant="ghost" icon="phone-portrait-outline" onPress={() => router.push('/cuenta')} />
        <Button label="Volver al inicio" variant="ghost" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

function Dato({ n, label }: { n: number; label: string }) {
  return (
    <View style={s.dato}>
      <Text style={s.datoN}>{n}</Text>
      <Small>{label}</Small>
    </View>
  );
}

const s = StyleSheet.create({
  campana: { fontSize: 14, color: colors.onNightMuted },
  datos: { flexDirection: 'row', gap: 8 },
  cuerpo: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, paddingBottom: 32, gap: 16 },
  aprobar: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: 18, gap: 10 },
  aprobarTitulo: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.6 },
  aprobarTexto: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  lista: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden', ...shadow.sm },
  alerta: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  borde: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  punto: { width: 10, height: 10, borderRadius: 5 },
  alertaTitulo: { fontSize: 15, fontWeight: '600', color: colors.ink },
  dato: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, gap: 2 },
  datoN: { fontSize: 22, fontWeight: '700', color: colors.ink },
});
