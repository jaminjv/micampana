import { useLocalSearchParams } from 'expo-router';

import { ListPicker } from '@/components/ListPicker';
import { SubirSoporte } from '@/components/SubirSoporte';
import { Body, Button, Chip, ChipRow, Field, Progress, Screen, Segmented, Small, Title, TopBar } from '@/components/ui';
import { CARGOS, nombrePartido, PARTIDOS } from '@/data/catalogos';
import type { TipoAval } from '@/data/types';
import { useApp, useMiCampana } from '@/state/app';
import { posicion, siguiente } from '@/state/pasos';
import { colors } from '@/theme';

/** Aval: un partido, una coalición (varios partidos) o un grupo significativo (firmas). */
export default function Aval() {
  const { actualizar } = useLocalSearchParams<{ actualizar?: string }>();
  const actualizando = actualizar === '1';
  const { borrador, actualizarBorrador, confirmarCandidatura } = useApp();
  const { paso, total } = posicion(borrador, 'aval');
  const tipo = borrador.tipoAval ?? 'partido';
  // Si ya es candidato y envió un soporte, no hace falta subir otro.
  const yaEnviado = !!useMiCampana()?.soporte;

  const avalElegido =
    (tipo === 'partido' && borrador.partidos.length === 1) ||
    (tipo === 'coalicion' && borrador.partidos.length >= 2) ||
    (tipo === 'firmas' && (borrador.grupoSignificativo ?? '').trim().length >= 3);
  const valido = avalElegido && (!!borrador.soporte || yaEnviado);

  const cambiarTipo = (t: TipoAval) =>
    actualizarBorrador({ tipoAval: t, partidos: t === 'firmas' ? [] : t === 'partido' ? borrador.partidos.slice(0, 1) : borrador.partidos });

  const alternar = (id: string) => {
    if (tipo === 'partido') return actualizarBorrador({ partidos: [id] });
    const ya = borrador.partidos.includes(id);
    actualizarBorrador({ partidos: ya ? borrador.partidos.filter((p) => p !== id) : [...borrador.partidos, id] });
  };

  const etiquetaBoton =
    tipo === 'coalicion' && borrador.partidos.length > 0 ? `Continuar con ${borrador.partidos.length} partidos` : 'Continuar';

  return (
    <Screen
      background={colors.surface}
      header={<TopBar title={actualizando ? 'Actualizar a candidato' : 'Crear tu perfil'} />}
      footer={
        <Button
          label={actualizando && !(borrador.cargo && CARGOS[borrador.cargo].corporacion) ? 'Enviar a verificación' : etiquetaBoton}
          disabled={!valido}
          onPress={() => {
            if (!borrador.tipoAval) actualizarBorrador({ tipoAval: tipo });
            siguiente({ ...borrador, tipoAval: tipo }, 'aval', actualizando, confirmarCandidatura);
          }}
        />
      }>
      {actualizando ? <Small>Tu candidatura</Small> : <Progress paso={paso} total={total} etiqueta="Crear tu perfil" />}
      <Title>¿Quién te avala?</Title>
      <Segmented<TipoAval>
        value={tipo}
        onChange={cambiarTipo}
        options={[
          { value: 'partido', label: 'Un partido' },
          { value: 'coalicion', label: 'Coalición' },
          { value: 'firmas', label: 'Firmas' },
        ]}
      />

      {tipo === 'firmas' ? (
        <>
          <Body>Te postulas por un grupo significativo de ciudadanos, con recolección de firmas.</Body>
          <Field
            label="Nombre del grupo significativo"
            value={borrador.grupoSignificativo ?? ''}
            onChangeText={(t) => actualizarBorrador({ grupoSignificativo: t })}
            placeholder="Ej. Florencia Primero"
          />
        </>
      ) : (
        <>
          <Body>
            {tipo === 'coalicion'
              ? 'Elige todos los partidos que avalan tu candidatura.'
              : 'Elige el partido o movimiento que te avala.'}
          </Body>
          {tipo === 'coalicion' && borrador.partidos.length > 0 ? (
            <ChipRow>
              {borrador.partidos.map((p) => (
                <Chip key={p} label={`${nombrePartido(p)}  ×`} selected dark onPress={() => alternar(p)} />
              ))}
            </ChipRow>
          ) : null}
          <ListPicker
            items={PARTIDOS.map((p) => ({ id: p.id, label: p.nombre, hint: p.sigla }))}
            selected={borrador.partidos}
            onToggle={alternar}
            multiple={tipo === 'coalicion'}
            searchPlaceholder="Buscar partido"
            maxVisible={PARTIDOS.length}
          />
          <Small>Lista de partidos y movimientos con personería jurídica vigente según el Consejo Nacional Electoral.</Small>
        </>
      )}

      <SubirSoporte value={borrador.soporte} onChange={(soporte) => actualizarBorrador({ soporte })} yaEnviado={yaEnviado} />
    </Screen>
  );
}
