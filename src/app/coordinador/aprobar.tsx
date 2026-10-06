import { useState } from 'react';

import { ColaboradorCard, SolicitudCard } from '@/components/equipo';
import { Card, Screen, Segmented, Small, TopBar } from '@/components/ui';
import {
  aprobarVisita, colaboradoresDe, miembrosDe, puedeAgendar, puedeAprobar, rechazarVisita, solicitudesDe, verificarColaborador,
} from '@/data/repo';
import { useMiMiembro } from '@/state/app';

type Vista = 'visitas' | 'colaboradores';

/** Aprobar: visitas que proponen los líderes y colaboradores que registraron. */
export default function Aprobar() {
  const m = useMiMiembro();
  const [vista, setVista] = useState<Vista>('visitas');
  if (!m) return null;
  const ids = miembrosDe(m.candidato, { rol: 'lider', superior: m.id }).map((l) => l.id);
  const visitas = solicitudesDe(m.candidato, 'pendiente').filter((v) => ids.includes(v.propuestaPor));
  const colaboradores = colaboradoresDe({ candidato: m.candidato, estado: 'por_verificar' }).filter((c) => ids.includes(c.lider));
  const agenda = puedeAgendar(m);
  const aprueba = puedeAprobar(m);

  return (
    <Screen oscura header={<TopBar oscura title="Aprobaciones" subtitle={m.zona.etiqueta} />}>
      <Segmented<Vista>
        value={vista}
        onChange={setVista}
        options={[
          { value: 'visitas', label: `Visitas (${visitas.length})` },
          { value: 'colaboradores', label: `Colaboradores (${colaboradores.length})` },
        ]}
      />
      {vista === 'visitas' ? (
        <>
          {visitas.length === 0 ? <Card><Small>No hay visitas por aprobar.</Small></Card> : null}
          {visitas.map((v) => (
            <SolicitudCard
              key={v.id}
              v={v}
              onAprobar={agenda ? () => aprobarVisita(v.id) : undefined}
              onRechazar={agenda ? () => rechazarVisita(v.id, 'Por ahora no se puede en esa fecha. Propón otra.') : undefined}
              nota={agenda ? undefined : 'La agenda la maneja el candidato: le llega para confirmar.'}
            />
          ))}
          {agenda ? <Small>Al agendarla, queda en la agenda del candidato con el líder como anfitrión.</Small> : null}
        </>
      ) : (
        <>
          {colaboradores.length === 0 ? <Card><Small>No hay colaboradores por verificar.</Small></Card> : null}
          {colaboradores.map((c) => (
            <ColaboradorCard
              key={c.id}
              c={c}
              onAprobar={aprueba ? () => verificarColaborador(c.id, 'activo', m.id) : undefined}
              onRechazar={aprueba ? () => verificarColaborador(c.id, 'rechazado', m.id) : undefined}
              nota={aprueba ? undefined : 'Los aprueba el candidato o un coordinador con esa función.'}
            />
          ))}
          <Small>Revisa que la foto coincida con la cédula. Las fotos de cédula solo las ve quien verifica.</Small>
        </>
      )}
    </Screen>
  );
}
