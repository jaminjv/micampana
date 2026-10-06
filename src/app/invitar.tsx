import { useState } from 'react';
import { Share, View } from 'react-native';

import { Text } from '@/components/Texto';
import { Button, Card, CheckRow, Chip, ChipRow, Notice, Screen, Small, Title, TopBar } from '@/components/ui';
import { APP_NAME } from '@/config';
import { CARGOS, municipiosDe, nombreMunicipio, nombreZona, zonasDe } from '@/data/catalogos';
import { crearInvitacion, getCandidato, invitacionesDe, miembrosDe } from '@/data/repo';
import type { Alcance, Invitacion } from '@/data/types';
import { fechaCorta } from '@/lib/fechas';
import { useMiCampana, useMiMiembro } from '@/state/app';
import { type, colors, radius, estilos } from '@/theme';

/** Un aspirante puede tener hasta 3 coordinadores (equipo inicial). */
const MAX_COORDINADORES_ASPIRANTE = 3;

/**
 * Crear un código de invitación. El candidato invita coordinadores (con su
 * zona y funciones delegadas); un coordinador invita líderes de su zona.
 */
export default function Invitar() {
  const campana = useMiCampana();
  const miembro = useMiMiembro();
  const comoCoordinador = !campana && miembro?.rol === 'coordinador';
  const c = campana ?? (miembro ? getCandidato(miembro.candidato) : undefined);
  const [zona, setZona] = useState<Alcance>();
  const [agenda, setAgenda] = useState(false);
  const [aprobaciones, setAprobaciones] = useState(false);
  const [creada, setCreada] = useState<Invitacion>();

  if (!c || (!campana && !comoCoordinador)) {
    return (
      <Screen oscura header={<TopBar oscura title="Invitar" />}>
        <Small>Solo el candidato y los coordinadores pueden invitar.</Small>
      </Screen>
    );
  }

  const rol = comoCoordinador ? 'lider' : 'coordinador';
  const mun = c.municipio ?? '';
  const departamental = CARGOS[c.cargo].ambito === 'departamento';

  // Territorios que se pueden asignar.
  const opciones: Alcance[] = comoCoordinador
    ? (miembro!.zona.nivel === 'comuna' ? zonasDe(mun, 'barrio', miembro!.zona.ids[0]) : zonasDe(mun, 'barrio')).map((z) => ({
        nivel: 'barrio', ids: [z.id], etiqueta: `Barrio ${z.nombre}`,
      }))
    : departamental
      ? municipiosDe(c.departamento).map((m) => ({ nivel: 'municipio', ids: [m.codigo], etiqueta: m.nombre }))
      : [
          { nivel: 'municipio', ids: [mun], etiqueta: `Toda ${nombreMunicipio(mun)}` },
          ...zonasDe(mun, 'comuna').map((z): Alcance => ({ nivel: 'comuna', ids: [z.id], etiqueta: nombreZona(z.id) })),
        ];

  const coordinadores = miembrosDe(c.id, { rol: 'coordinador' }).length + invitacionesDe(c.id).filter((i) => i.rol === 'coordinador').length;
  const limite = c.etapa === 'aspirante' && rol === 'coordinador' && coordinadores >= MAX_COORDINADORES_ASPIRANTE;

  const compartir = (i: Invitacion) =>
    Share.share({
      message: `Te invito a la campaña de ${c.nombre} en ${APP_NAME} como ${rol === 'lider' ? 'líder comunal' : 'coordinador'} de ${i.zona.etiqueta}. Abre la app, toca "Tengo un código de invitación" y escribe: ${i.codigo}`,
    });

  if (creada) {
    return (
      <Screen oscura background={colors.surface} header={<TopBar oscura title="Invitación lista" />}>
        <Card style={s.codigoCaja}>
          <Small>Código de invitación</Small>
          <Text style={s.codigo} selectable>{creada.codigo}</Text>
          <Small>{`${rol === 'lider' ? 'Líder comunal' : 'Coordinador'} · ${creada.zona.etiqueta} · vence el ${fechaCorta(creada.vence)}`}</Small>
        </Card>
        <Button label="Compartir por WhatsApp u otra app" variant="whatsapp" icon="share-social" onPress={() => compartir(creada)} />
        <Button label="Crear otra" variant="secondary" onPress={() => { setCreada(undefined); setZona(undefined); setAgenda(false); setAprobaciones(false); }} />
        <Small>El código sirve una sola vez. Quien lo use entra con el rol, el territorio y las funciones que elegiste.</Small>
      </Screen>
    );
  }

  return (
    <Screen
      oscura
      background={colors.surface}
      header={<TopBar oscura title={rol === 'lider' ? 'Invitar líder comunal' : 'Invitar coordinador'} />}
      footer={
        <Button
          label="Crear código"
          disabled={!zona || limite}
          onPress={() =>
            zona &&
            setCreada(
              crearInvitacion(c.id, {
                rol, zona, superior: comoCoordinador ? miembro!.id : undefined,
                delegadoAgenda: !comoCoordinador && agenda, delegadoAprobaciones: !comoCoordinador && aprobaciones,
              }),
            )
          }
        />
      }>
      <Title>{rol === 'lider' ? '¿De qué barrio será?' : '¿Qué zona coordinará?'}</Title>
      {limite ? (
        <Notice icon="information-circle" tone="warn">
          Como aspirante puedes tener hasta 3 coordinadores. Al ser candidato se habilita la red completa.
        </Notice>
      ) : null}
      {opciones.length === 0 ? <Small>Tu territorio aún no tiene barrios cargados.</Small> : null}
      <ChipRow>
        {opciones.map((o) => (
          <Chip key={o.ids.join()} label={o.etiqueta} selected={zona?.ids.join() === o.ids.join()} onPress={() => setZona(o)} />
        ))}
      </ChipRow>

      {rol === 'coordinador' ? (
        <View style={{ gap: 8 }}>
          <Text style={type.label}>Funciones delegadas</Text>
          <CheckRow checked={agenda} onToggle={() => setAgenda((v) => !v)}>
            <View>
              <Text style={type.body}>Manejar tu agenda</Text>
              <Small>Valida las visitas que proponen los líderes y las pone en tu agenda.</Small>
            </View>
          </CheckRow>
          <CheckRow checked={aprobaciones} onToggle={() => setAprobaciones((v) => !v)}>
            <View>
              <Text style={type.body}>Autorizar equipos</Text>
              <Small>Aprueba los colaboradores que registran los líderes.</Small>
            </View>
          </CheckRow>
          <Small>Puedes cambiarlas después en Equipo.</Small>
        </View>
      ) : (
        <Small>El líder registra a su gente con foto y autorización. Tú apruebas a cada colaborador si tienes esa función.</Small>
      )}
    </Screen>
  );
}

const s = estilos(() => ({
  codigoCaja: { alignItems: 'center', gap: 8, paddingVertical: 24, borderRadius: radius.xl },
  codigo: { fontSize: 40, fontWeight: '700', letterSpacing: 4, color: colors.ink },
}));
