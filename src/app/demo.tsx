import { router } from 'expo-router';

import { Body, Button, OptionCard, Screen, Small, Title, TopBar } from '@/components/ui';
import { useApp } from '@/state/app';
import { colors } from '@/theme';

/** Elegir con qué rol conocer la campaña de ejemplo (Laura Gómez, Alcaldía de Florencia). */
export default function Demo() {
  const { entrarComoDemo } = useApp();
  const entrar = (rol: 'candidato' | 'coordinador' | 'lider') => {
    entrarComoDemo(rol);
    router.replace(rol === 'candidato' ? '/campana' : rol === 'coordinador' ? '/coordinador' : '/lider');
  };
  return (
    <Screen background={colors.surface} header={<TopBar title="Campaña de ejemplo" />}>
      <Title>¿Cómo quieres conocerla?</Title>
      <Body>Es la campaña de Laura Gómez a la Alcaldía de Florencia, con datos de prueba. Lo que hagas aquí se borra al recargar la app.</Body>
      <OptionCard title="Como la candidata" description="Panel, agenda, propuestas, voces ciudadanas y equipo." selected={false} onPress={() => entrar('candidato')} />
      <OptionCard title="Como coordinador" description="Carlos Rojas, Comuna 1: aprueba visitas y colaboradores, asigna tareas." selected={false} onPress={() => entrar('coordinador')} />
      <OptionCard title="Como líder comunal" description="Marta Díaz, barrio El Prado: tareas, su gente y proponer visitas." selected={false} onPress={() => entrar('lider')} />
      <Small>También puedes probar un código de invitación: MC-4821 (coordinador) o MC-7315 (líder).</Small>
      <Button label="Volver" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
