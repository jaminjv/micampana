import { router } from 'expo-router';
import { View } from 'react-native';

import { CabeceraEquipo } from '@/components/equipo';
import { Text } from '@/components/Texto';
import { Badge, Button, Card, Row, Screen, Small } from '@/components/ui';
import { agendaDe, enZona, getCandidato, getMiembro, solicitudesDe, tareasDe, vencida } from '@/data/repo';
import type { Tarea } from '@/data/types';
import { diaRelativo, fechaCorta, horaTexto } from '@/lib/fechas';
import { useMiMiembro } from '@/state/app';
import { type, colors, radius, estilos } from '@/theme';

/** Mis tareas: la próxima actividad en el barrio, las tareas por hacer y las visitas propuestas. */
export default function MisTareas() {
  const m = useMiMiembro();
  if (!m) return null;
  const c = getCandidato(m.candidato);
  const tareas = tareasDe(m.id);
  const pendientes = tareas.filter((t) => t.estado === 'pendiente');
  const hechas = tareas.filter((t) => t.estado === 'reportada').slice(0, 5);
  const proxima = agendaDe(m.candidato, new Date()).find((a) => a.estado === 'programada' && enZona(m.zona, a.comunidad));
  const propuestas = solicitudesDe(m.candidato).filter((v) => v.propuestaPor === m.id).slice(-3).reverse();

  return (
    <Screen oscura padded={false}>
      <CabeceraEquipo m={m} titulo={`Hola, ${m.nombre.split(' ')[0]}`}>
        <Text style={s.sub}>{c ? `Campaña de ${c.nombre}` : ''}</Text>
        {proxima ? (
          <View style={s.proxima}>
            <Text style={s.proximaEtiqueta}>Próxima actividad</Text>
            <Text style={s.proximaTitulo}>{proxima.titulo}</Text>
            <Text style={s.proximaTexto}>{`${diaRelativo(proxima.fecha)} · ${horaTexto(proxima.fecha)}`}</Text>
            <Text style={s.proximaTexto}>{proxima.lugar}</Text>
          </View>
        ) : null}
      </CabeceraEquipo>

      <View style={s.cuerpo}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={type.h2}>Mis tareas</Text>
          <Small>{pendientes.length ? `${pendientes.length} pendientes` : 'Al día'}</Small>
        </Row>
        {pendientes.length === 0 ? <Card><Small>No tienes tareas pendientes. Tu coordinador te las asigna aquí.</Small></Card> : null}
        {pendientes.map((t) => <TareaCard key={t.id} t={t} />)}

        {hechas.length ? (
          <>
            <Text style={type.h2}>Reportadas</Text>
            {hechas.map((t) => <TareaCard key={t.id} t={t} />)}
          </>
        ) : null}

        {propuestas.length ? (
          <>
            <Text style={type.h2}>Visitas que propusiste</Text>
            {propuestas.map((v) => (
              <Card key={v.id} style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={type.h3}>{v.lugar}</Text>
                  <Badge
                    label={v.estado === 'aprobada' ? 'En la agenda' : v.estado === 'rechazada' ? 'No aprobada' : 'Esperando'}
                    tone={v.estado === 'aprobada' ? 'ok' : v.estado === 'rechazada' ? 'neutral' : 'warn'}
                  />
                </Row>
                <Small>{`${diaRelativo(v.fecha)}, ${horaTexto(v.fecha)}`}</Small>
                {v.motivo ? <Small>{v.motivo}</Small> : null}
              </Card>
            ))}
          </>
        ) : null}

        <Button label="Tu cuenta y tu celular" variant="ghost" icon="phone-portrait-outline" onPress={() => router.push('/cuenta')} />
        <Button label="Volver al inicio" variant="ghost" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

function TareaCard({ t }: { t: Tarea }) {
  const por = getMiembro(t.asignadaPor);
  const venc = vencida(t);
  const hoy = t.fechaLimite && new Date(t.fechaLimite).toDateString() === new Date().toDateString();
  const etiqueta =
    t.estado === 'reportada' ? <Badge label="Reportada" tone="ok" />
    : venc ? <Badge label="Vencida" tone="danger" />
    : hoy ? <Badge label="Hoy" tone="accent" />
    : t.fechaLimite ? <Badge label={fechaCorta(t.fechaLimite)} /> : null;
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }} gap={8}>
        <Text style={[type.h3, { flex: 1 }]}>{t.titulo}</Text>
        {etiqueta}
      </Row>
      <Small>
        {[`Asignada por ${por ? por.nombre : 'el candidato'}`, t.evidencia && t.estado === 'pendiente' ? 'pide foto' : ''].filter(Boolean).join(' · ')}
      </Small>
      {t.reporte ? <Small>{t.reporte.notas}</Small> : null}
      {t.estado === 'pendiente' ? (
        <Button label="Reportar" size="md" onPress={() => router.push({ pathname: '/reportar', params: { id: t.id } })} />
      ) : null}
    </Card>
  );
}

const s = estilos(() => ({
  sub: { fontSize: 14, color: colors.onNightMuted },
  proxima: { marginTop: 6, padding: 16, gap: 4, borderRadius: radius.lg, backgroundColor: colors.primary },
  proximaEtiqueta: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.6 },
  proximaTitulo: { fontSize: 19, fontWeight: '700', color: '#FFFFFF' },
  proximaTexto: { fontSize: 15, color: '#FFFFFF' },
  cuerpo: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, paddingBottom: 32, gap: 14 },
}));
