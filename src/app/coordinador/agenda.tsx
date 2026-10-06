import { View } from 'react-native';

import { ListaActividades } from '@/components/agenda';
import { Text } from '@/components/Texto';
import { Card, Screen, Small, TopBar } from '@/components/ui';
import { agendaDe, enZona } from '@/data/repo';
import type { Actividad } from '@/data/types';
import { diaRelativo } from '@/lib/fechas';
import { useMiMiembro } from '@/state/app';
import { type } from '@/theme';

/** Agenda del candidato en la zona del coordinador (y lo que es para toda la ciudad). */
export default function AgendaCoordinador() {
  const m = useMiMiembro();
  if (!m) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const lista = agendaDe(m.candidato, hoy).filter((a) => a.estado !== 'cancelada' && enZona(m.zona, a.comunidad));
  const dias: { clave: string; titulo: string; items: Actividad[] }[] = [];
  lista.forEach((a) => {
    const clave = new Date(a.fecha).toDateString();
    const g = dias.find((d) => d.clave === clave);
    if (g) g.items.push(a);
    else dias.push({ clave, titulo: diaRelativo(a.fecha), items: [a] });
  });

  return (
    <Screen oscura header={<TopBar oscura title="Agenda del candidato" subtitle={m.delegadoAgenda ? 'Delegada a ti por el candidato' : m.zona.etiqueta} />}>
      {dias.length === 0 ? <Card><Small>No hay actividades próximas en tu zona.</Small></Card> : null}
      {dias.map((d) => (
        <View key={d.clave} style={{ gap: 8 }}>
          <Text style={type.h2}>{d.titulo}</Text>
          <ListaActividades items={d.items} soloLectura />
        </View>
      ))}
      <Small>Las visitas que propongan tus líderes llegan a Aprobar.</Small>
    </Screen>
  );
}
