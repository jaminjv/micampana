import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AlcancePicker, alcanceCompleto } from '@/components/AlcancePicker';
import { CompromisoCard } from '@/components/agenda';
import { Text } from '@/components/Texto';
import { Button, Chip, ChipRow, Field, Notice, Screen, Small, TopBar } from '@/components/ui';
import { ESTADOS_COMPROMISO } from '@/data/catalogos';
import { cambiarEstadoCompromiso, getActividad, getAporte, getCompromiso, registrarCompromiso } from '@/data/repo';
import type { Alcance, EstadoCompromiso } from '@/data/types';
import { useMiCampana } from '@/state/app';
import { colors, type } from '@/theme';

/**
 * Registrar un compromiso (desde una visita, un aporte o suelto) o ver uno:
 * cambiar su estado y llevarlo al programa como propuesta.
 */
export default function PantallaCompromiso() {
  const { id, actividad, aporte } = useLocalSearchParams<{ id?: string; actividad?: string; aporte?: string }>();
  const c = useMiCampana();
  const existente = id ? getCompromiso(id) : undefined;
  const visita = actividad ? getActividad(actividad) : undefined;
  const deAporte = aporte ? getAporte(aporte) : undefined;

  const [que, setQue] = useState(deAporte?.texto ?? '');
  const [conQuien, setConQuien] = useState(visita?.responsable ?? (deAporte ? `Ciudadano de ${deAporte.lugar}` : ''));
  const [comunidad, setComunidad] = useState<Alcance | undefined>(visita?.comunidad);

  if (!c || c.etapa !== 'candidato' || (existente && existente.candidato !== c.id)) {
    return (
      <Screen oscura header={<TopBar oscura title="Compromiso" />}>
        <Notice icon="lock-closed" tone="warn">Los compromisos se habilitan al ser candidato.</Notice>
      </Screen>
    );
  }

  if (existente) {
    const origen = existente.actividad ? getActividad(existente.actividad) : undefined;
    return (
      <Screen oscura header={<TopBar oscura title="Compromiso" subtitle={existente.comunidad.etiqueta} />}>
        <CompromisoCard c={existente} />
        <View style={{ gap: 8 }}>
          <Text style={type.label}>¿En qué va?</Text>
          <ChipRow>
            {(Object.keys(ESTADOS_COMPROMISO) as EstadoCompromiso[]).map((e) => (
              <Chip key={e} label={ESTADOS_COMPROMISO[e].label} selected={existente.estado === e} onPress={() => cambiarEstadoCompromiso(existente.id, e)} />
            ))}
          </ChipRow>
        </View>
        {!existente.propuesta && existente.estado !== 'descartado' ? (
          <Button
            label="Convertir en propuesta"
            onPress={() => router.push({ pathname: '/campana/propuesta', params: { compromiso: existente.id } })}
          />
        ) : null}
        {existente.propuesta ? (
          <Button
            label="Ver la propuesta"
            variant="secondary"
            onPress={() => router.push({ pathname: '/campana/propuesta', params: { id: existente.propuesta } })}
          />
        ) : null}
        {origen ? (
          <Button
            label={`Ver la visita: ${origen.titulo}`}
            variant="ghost"
            onPress={() => router.push({ pathname: '/campana/actividad', params: { id: origen.id } })}
          />
        ) : null}
      </Screen>
    );
  }

  const territorio = comunidad ?? alcanceCompleto(c);
  const valido = que.trim().length >= 5 && conQuien.trim().length >= 2 && territorio.ids.length > 0;

  return (
    <Screen
      oscura
      background={colors.surface}
      header={<TopBar oscura title="Registrar compromiso" subtitle={visita ? visita.titulo : deAporte ? 'Desde un aporte ciudadano' : undefined} />}
      footer={
        <Button
          label="Registrar compromiso"
          disabled={!valido}
          onPress={() => {
            registrarCompromiso(c.id, {
              que: que.trim(), conQuien: conQuien.trim(), comunidad: territorio, actividad: visita?.id, aporte: deAporte?.id,
            });
            router.back();
          }}
        />
      }>
      <Notice icon="information-circle" tone="primary">
        Registra compromisos programáticos con la comunidad (una obra, un programa, un estudio), nunca beneficios individuales a cambio de votos.
      </Notice>
      <Field label="¿Qué se impulsará?" value={que} onChangeText={setQue} placeholder="Ej. Renovar el alumbrado de la calle 8" multiline maxLength={600} />
      <Field label="¿Con quién?" value={conQuien} onChangeText={setConQuien} placeholder="Ej. Junta de acción comunal, comerciantes" />
      <AlcancePicker campana={c} value={territorio} onChange={setComunidad} titulo="¿Para qué comunidad?" />
      <Small>Lo ve solo tu equipo. Si entra al programa, lo conviertes en una propuesta pública.</Small>
    </Screen>
  );
}
