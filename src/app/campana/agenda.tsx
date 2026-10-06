import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Texto';
import { ListaActividades } from '@/components/agenda';
import { Button, Card, Ionicons, Notice, Screen, Segmented, Small, TopBar } from '@/components/ui';
import { SolicitudCard } from '@/components/equipo';
import { agendaDe, aprobarVisita, rechazarVisita, solicitudesDe } from '@/data/repo';
import type { Actividad } from '@/data/types';
import { diaRelativo } from '@/lib/fechas';
import { useMiCampana } from '@/state/app';
import { colors, radius, estilos } from '@/theme';

type Vista = 'proximas' | 'pasadas';

/** Agenda de la campaña: actividades, visitas y eventos, agrupadas por día. */
export default function Agenda() {
  const c = useMiCampana();
  const [vista, setVista] = useState<Vista>('proximas');

  if (!c || c.etapa !== 'candidato') {
    return (
      <Screen oscura header={<TopBar oscura title="Agenda" />}>
        <Notice icon="lock-closed" tone="warn">La agenda, las visitas y los compromisos se habilitan al ser candidato.</Notice>
      </Screen>
    );
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const porConfirmar = solicitudesDe(c.id, 'pendiente');
  const lista =
    vista === 'proximas' ? agendaDe(c.id, hoy) : agendaDe(c.id, undefined, hoy).reverse();

  // Agrupar por día.
  const dias: { clave: string; titulo: string; items: Actividad[] }[] = [];
  lista.forEach((a) => {
    const clave = new Date(a.fecha).toDateString();
    const g = dias.find((d) => d.clave === clave);
    if (g) g.items.push(a);
    else dias.push({ clave, titulo: diaRelativo(a.fecha), items: [a] });
  });

  return (
    <Screen
      oscura
      header={
        <TopBar
          oscura
          title="Agenda"
          subtitle="Actividades, visitas y eventos"
          right={
            <Pressable accessibilityRole="button" onPress={() => router.push('/campana/actividad')} style={s.nueva}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={s.nuevaText}>Nueva</Text>
            </Pressable>
          }
        />
      }>
      <Segmented<Vista>
        value={vista}
        onChange={setVista}
        options={[{ value: 'proximas', label: 'Próximas' }, { value: 'pasadas', label: 'Pasadas' }]}
      />

      {porConfirmar.length && vista === 'proximas' ? (
        <View style={{ gap: 8 }}>
          <Text style={s.h2}>Visitas propuestas por confirmar</Text>
          {porConfirmar.map((v) => (
            <SolicitudCard
              key={v.id}
              v={v}
              onAprobar={() => aprobarVisita(v.id)}
              onRechazar={() => rechazarVisita(v.id, 'Por ahora no se puede en esa fecha. Propón otra.')}
            />
          ))}
        </View>
      ) : null}

      {dias.length === 0 ? (
        <Card>
          <Text style={s.h3}>{vista === 'proximas' ? 'No hay actividades programadas' : 'Aún no hay actividades pasadas'}</Text>
          <Small>Agrega visitas a barrios, reuniones, eventos y entrevistas. Después de cada visita, registra lo que la comunidad pidió.</Small>
          {vista === 'proximas' ? <Button label="Agregar actividad" size="md" onPress={() => router.push('/campana/actividad')} /> : null}
        </Card>
      ) : null}

      {dias.map((d) => (
        <View key={d.clave} style={{ gap: 8 }}>
          <Text style={s.h2}>{d.titulo}</Text>
          <ListaActividades items={d.items} />
        </View>
      ))}
    </Screen>
  );
}

const s = estilos(() => ({
  nueva: { height: 40, paddingHorizontal: 14, marginRight: 8, borderRadius: radius.md, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 4 },
  nuevaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  h2: { fontSize: 17, fontWeight: '700', color: colors.ink },
  h3: { fontSize: 16, fontWeight: '700', color: colors.ink },
}));
