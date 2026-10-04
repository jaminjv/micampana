import { Body, Button, ChipRow, Badge, OptionCard, Progress, Screen, Small, Title, TopBar } from '@/components/ui';
import { useApp } from '@/state/app';
import { posicion, siguiente } from '@/state/pasos';
import { colors } from '@/theme';

export default function Etapa() {
  const { borrador, actualizarBorrador, confirmarCandidatura } = useApp();
  const { paso, total } = posicion(borrador, 'etapa');

  return (
    <Screen
      background={colors.surface}
      header={<TopBar title="Crear tu perfil" />}
      footer={
        <Button
          label="Continuar"
          disabled={!borrador.etapa}
          onPress={() => siguiente(borrador, 'etapa', false, confirmarCandidatura)}
        />
      }>
      <Progress paso={paso} total={total} etiqueta="Crear tu perfil" />
      <Title>¿En qué etapa estás?</Title>
      <Body>Puedes empezar como aspirante y pasar a candidato cuando tu candidatura sea oficial.</Body>

      <OptionCard
        title="Aspirante"
        description="Estoy considerando postularme y quiero conocer qué piensa la gente. Aún no tengo aval ni candidatura inscrita."
        selected={borrador.etapa === 'aspirante'}
        onPress={() => actualizarBorrador({ etapa: 'aspirante' })}>
        <ChipRow>
          <Badge label="Perfil público" />
          <Badge label="Ideas ciudadanas" />
          <Badge label="Sondeos" />
          <Badge label="Equipo inicial" />
        </ChipRow>
      </OptionCard>

      <OptionCard
        title="Candidato"
        description="Ya tengo aval de un partido, una coalición o apoyo por firmas, o mi candidatura está inscrita."
        selected={borrador.etapa === 'candidato'}
        onPress={() => actualizarBorrador({ etapa: 'candidato' })}>
        <Small>Todas las herramientas de campaña. Requiere verificación.</Small>
      </OptionCard>
    </Screen>
  );
}
