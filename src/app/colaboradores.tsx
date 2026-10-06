import { useLocalSearchParams } from 'expo-router';

import { ColaboradorCard } from '@/components/equipo';
import { Card, Screen, Small, TopBar } from '@/components/ui';
import { colaboradoresDe, cupoDe, getMiembro, puedeAprobar, verificarColaborador } from '@/data/repo';
import { useMiCampana, useMiMiembro } from '@/state/app';

/** Los colaboradores de un líder, con foto y datos. Lo ven el candidato y los coordinadores. */
export default function Colaboradores() {
  const { lider } = useLocalSearchParams<{ lider: string }>();
  const campana = useMiCampana();
  const miembro = useMiMiembro();
  const l = getMiembro(lider);
  const permitido = !!l && ((campana && campana.id === l.candidato) || (miembro?.rol === 'coordinador' && miembro.candidato === l.candidato));

  if (!l || !permitido) {
    return (
      <Screen oscura header={<TopBar oscura title="Colaboradores" />}>
        <Small>No tienes acceso a este equipo.</Small>
      </Screen>
    );
  }

  const lista = colaboradoresDe({ lider: l.id });
  const cupo = cupoDe(l.id);
  const aprueba = campana ? true : puedeAprobar(miembro);

  return (
    <Screen oscura header={<TopBar oscura title={l.nombre} subtitle={`${l.zona.etiqueta} · ${cupo.usados} de ${cupo.total} colaboradores`} />}>
      {lista.length === 0 ? <Card><Small>Este líder aún no ha registrado colaboradores.</Small></Card> : null}
      {lista.map((c) => (
        <ColaboradorCard
          key={c.id}
          c={c}
          onAprobar={aprueba ? () => verificarColaborador(c.id, 'activo', campana ? undefined : miembro?.id) : undefined}
          onRechazar={aprueba ? () => verificarColaborador(c.id, 'rechazado', campana ? undefined : miembro?.id) : undefined}
        />
      ))}
      <Small>Datos personales protegidos: no los compartas fuera de la campaña.</Small>
    </Screen>
  );
}
