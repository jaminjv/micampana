import { Body, Button, OptionCard, Progress, Screen, Title, TopBar } from '@/components/ui';
import { CARGOS } from '@/data/catalogos';
import type { Cargo } from '@/data/types';
import { useApp } from '@/state/app';
import { posicion, siguiente } from '@/state/pasos';
import { colors } from '@/theme';

const ORDEN: Cargo[] = ['gobernacion', 'asamblea', 'alcaldia', 'concejo'];

export default function CargoScreen() {
  const { borrador, actualizarBorrador, confirmarCandidatura } = useApp();
  const { paso, total } = posicion(borrador, 'cargo');

  return (
    <Screen
      background={colors.surface}
      header={<TopBar title="Crear tu perfil" />}
      footer={
        <Button
          label="Continuar"
          disabled={!borrador.cargo}
          onPress={() => siguiente(borrador, 'cargo', false, confirmarCandidatura)}
        />
      }>
      <Progress paso={paso} total={total} etiqueta="Crear tu perfil" />
      <Title>¿A qué cargo aspiras?</Title>
      <Body>La app organiza tu territorio, tus equipos y tus opciones según el cargo.</Body>
      {ORDEN.map((c) => (
        <OptionCard
          key={c}
          title={CARGOS[c].nombre}
          description={CARGOS[c].descripcion}
          selected={borrador.cargo === c}
          onPress={() =>
            // Cambiar de cargo limpia el territorio y la lista, porque dependen del cargo.
            actualizarBorrador({ cargo: c, departamento: undefined, municipio: undefined, tipoLista: undefined, numero: undefined })
          }
        />
      ))}
    </Screen>
  );
}
