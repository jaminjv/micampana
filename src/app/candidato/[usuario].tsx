import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { NumeroTarjeton, PropuestaCard } from '@/components/cards';
import { Avatar, Badge, Button, Card, Notice, Row, Screen, Segmented, Small, TopBar, VerifiedMark } from '@/components/ui';
import { CARGOS, nombreDepartamento, nombreMunicipio } from '@/data/catalogos';
import {
  cargoConTerritorio, contarLecturas, eventosDe, getCandidatoPorUsuario, nivelesPara, propuestasDe, textoAval, useDatos, type NivelPropuesta,
} from '@/data/repo';
import { diaCorto, horaTexto } from '@/lib/fechas';
import { useApp } from '@/state/app';
import { colors, estilos } from '@/theme';
import { Text } from '@/components/Texto';

/** Perfil público: quién es, qué propone para el territorio del ciudadano y sus eventos. */
export default function PerfilCandidato() {
  const { usuario } = useLocalSearchParams<{ usuario: string }>();
  const c = getCandidatoPorUsuario(usuario ?? '');
  const { ciudadano, alternarSeguir } = useApp();
  const niveles = c ? nivelesPara(c.cargo) : [];
  const [nivel, setNivel] = useState<NivelPropuesta>(niveles[0] ?? 'municipio');
  useDatos();
  const ub = ciudadano?.ubicacion;
  const visibles = c && c.etapa === 'candidato' ? propuestasDe(c.id, nivel, ub) : [];
  const idsVisibles = visibles.map((p) => p.id).join(',');

  // Cada vez que un ciudadano ve una propuesta en el perfil cuenta como una lectura.
  useEffect(() => {
    if (ciudadano && idsVisibles) contarLecturas(idsVisibles.split(','));
  }, [ciudadano, idsVisibles]);

  if (!c) {
    return (
      <Screen header={<TopBar title="Perfil" />}>
        <Text style={s.h2}>{`No encontramos a @${usuario}`}</Text>
        <Small>Puede que aún no se haya registrado en la app.</Small>
      </Screen>
    );
  }

  const siguiendo = !!ciudadano?.siguiendo.includes(c.id);
  const aspirante = c.etapa === 'aspirante';
  const propuestas = visibles;
  const eventos = eventosDe(c.id);

  const etiquetaNivel = (n: NivelPropuesta): string => {
    if (n === 'barrio') return 'Tu barrio';
    if (n === 'comuna') return 'Tu comuna';
    if (n === 'municipio') return ub ? nombreMunicipio(ub.municipio) : 'Municipio';
    return nombreDepartamento(c.departamento);
  };

  return (
    <Screen header={<TopBar title={`@${c.usuario}`} />}>
      <Card style={{ gap: 12 }}>
        <Row gap={12}>
          <Avatar nombre={c.nombre} foto={c.foto} size={64} />
          <View style={{ flex: 1, gap: 2 }}>
            <Row gap={6}>
              <Text style={s.name}>{c.nombre}</Text>
              {c.verificado ? <VerifiedMark /> : null}
            </Row>
            <Text style={s.user}>@{c.usuario}</Text>
            <Small>{cargoConTerritorio(c)}</Small>
            <Small>{textoAval(c)}</Small>
          </View>
          {c.numero && CARGOS[c.cargo].corporacion ? <NumeroTarjeton n={c.numero} /> : null}
        </Row>
        {aspirante ? <Badge label="Aspirante" tone="warn" /> : null}
        <Row gap={8}>
          <Button
            label="Dejar un mensaje"
            variant="accent"
            style={{ flex: 2 }}
            size="md"
            onPress={() =>
              ciudadano
                ? router.push({ pathname: '/escribir/[usuario]', params: { usuario: c.usuario } })
                : router.push('/ciudadano/registro')
            }
          />
          <Button
            label={siguiendo ? 'Siguiendo' : 'Seguir'}
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
            disabled={!ciudadano}
            onPress={() => alternarSeguir(c.id)}
          />
        </Row>
        <Small>{`${c.seguidores.toLocaleString('es-CO')} seguidores`}</Small>
      </Card>

      {aspirante ? (
        <Notice icon="information-circle" tone="primary">
          Es aspirante: está escuchando ideas antes de definir su candidatura. Aún no publica propuestas.
        </Notice>
      ) : (
        <>
          <Text style={s.h1}>¿Qué propone para ti?</Text>
          <Segmented<NivelPropuesta>
            value={nivel}
            onChange={setNivel}
            options={niveles.map((n) => ({ value: n, label: etiquetaNivel(n) }))}
          />
          {propuestas.map((p) => <PropuestaCard key={p.id} p={p} />)}
          {propuestas.length === 0 ? (
            <Small>
              {(nivel === 'barrio' && !ub?.barrio) || (nivel === 'comuna' && !ub?.comuna)
                ? 'Agrega tu barrio y comuna en tu registro para ver propuestas tan cercanas.'
                : 'Aún no ha publicado propuestas para este territorio.'}
            </Small>
          ) : null}
          <Small>Las propuestas publicadas no se pueden borrar. Si cambian, se ve la versión anterior.</Small>
        </>
      )}

      {eventos.length ? (
        <>
          <Text style={s.h2}>Próximos eventos públicos</Text>
          {eventos.map((e) => {
            const d = diaCorto(e.fecha);
            return (
              <Card key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={s.fecha}><Text style={s.fechaDia}>{d.dia}</Text><Text style={s.fechaNum}>{d.num}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.h3}>{e.titulo}</Text>
                  <Small>{`${horaTexto(e.fecha)} · ${e.lugar}`}</Small>
                </View>
              </Card>
            );
          })}
        </>
      ) : null}

      <Small>Tu mensaje lo lee el equipo del candidato. Solo él y su equipo verán tus datos.</Small>
    </Screen>
  );
}

const s = estilos(() => ({
  name: { fontSize: 19, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  user: { fontSize: 14, fontWeight: '600', color: colors.primary },
  h1: { fontSize: 21, fontWeight: '700', color: colors.ink },
  h2: { fontSize: 17, fontWeight: '700', color: colors.ink },
  h3: { fontSize: 15, fontWeight: '600', color: colors.ink },
  fecha: { width: 44, alignItems: 'center' },
  fechaDia: { fontSize: 11, fontWeight: '700', color: colors.primary },
  fechaNum: { fontSize: 20, fontWeight: '800', color: colors.ink },
}));
