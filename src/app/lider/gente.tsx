import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { FotoPrivada } from '@/components/equipo';
import { Text } from '@/components/Texto';
import { Badge, Button, Card, Chip, ChipRow, Row, Screen, Small, TopBar } from '@/components/ui';
import { colaboradoresDe, cupoDe } from '@/data/repo';
import type { EstadoColaborador } from '@/data/types';
import { useMiMiembro } from '@/state/app';
import { type, colors, radius, shadow, estilos } from '@/theme';

/** Mi gente: los colaboradores que registró el líder, con su cupo. */
export default function MiGente() {
  const m = useMiMiembro();
  const [filtro, setFiltro] = useState<EstadoColaborador>();
  if (!m) return null;
  const todos = colaboradoresDe({ lider: m.id });
  const lista = filtro ? todos.filter((c) => c.estado === filtro) : todos;
  const cupo = cupoDe(m.id);
  const lleno = cupo.usados >= cupo.total;
  const porVerificar = todos.filter((c) => c.estado === 'por_verificar').length;

  return (
    <Screen oscura header={<TopBar oscura title="Mi gente" subtitle={m.zona.etiqueta} />}>
      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={type.label}>Cupos de tu equipo</Text>
            <Small>Tu coordinador define el límite y autoriza a cada colaborador.</Small>
          </View>
          <Text style={s.cupo}>
            {cupo.usados}
            <Text style={s.cupoTotal}>{` de ${cupo.total}`}</Text>
          </Text>
        </Row>
        <View style={s.barra}>
          <View style={[s.relleno, { width: `${Math.min(100, (cupo.usados / cupo.total) * 100)}%` }, lleno && { backgroundColor: colors.warnFg }]} />
        </View>
      </Card>

      <ChipRow>
        <Chip label={`Todos (${todos.length})`} dark selected={!filtro} onPress={() => setFiltro(undefined)} />
        <Chip label="Activos" dark selected={filtro === 'activo'} onPress={() => setFiltro('activo')} />
        <Chip label={`Por verificar (${porVerificar})`} dark selected={filtro === 'por_verificar'} onPress={() => setFiltro('por_verificar')} />
      </ChipRow>

      {lista.length === 0 ? <Card><Small>Aún no hay colaboradores aquí.</Small></Card> : null}
      {lista.map((c) => (
        <View key={c.id} style={s.fila}>
          <View style={{ width: 56 }}>
            <FotoPrivada ruta={c.fotoRostro} alto={56} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.nombre}>{c.nombre}</Text>
            <Small>{c.ayudaEn.join(', ') || 'Sin tareas definidas'}</Small>
          </View>
          {c.estado === 'activo' ? <Badge label="Activo" tone="ok" /> : c.estado === 'rechazado' ? <Badge label="Rechazado" tone="neutral" /> : <Badge label="Por verificar" tone="warn" />}
        </View>
      ))}

      <Button
        label={lleno ? 'Cupo lleno: pídele más a tu coordinador' : 'Agregar colaborador'}
        icon={lleno ? undefined : 'person-add'}
        disabled={lleno}
        onPress={() => router.push('/lider/colaborador')}
      />
    </Screen>
  );
}

const s = estilos(() => ({
  cupo: { fontSize: 28, fontWeight: '700', color: colors.ink },
  cupoTotal: { fontSize: 15, fontWeight: '500', color: colors.muted },
  barra: { height: 8, borderRadius: 4, backgroundColor: colors.segmented, overflow: 'hidden' },
  relleno: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadow.sm },
  nombre: { fontSize: 16, fontWeight: '600', color: colors.ink },
}));
