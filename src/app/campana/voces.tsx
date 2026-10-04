import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Chip, ChipRow, Field, Notice, Row, Screen, Small, TopBar } from '@/components/ui';
import { aportesDeCampana, marcarEnRevision, responderAporte } from '@/data/repo';
import type { Aporte, EstadoAporte, TipoAporte } from '@/data/types';
import { hace } from '@/lib/fechas';
import { useMiCampana } from '@/state/app';
import { colors } from '@/theme';

const FILTROS: { value?: TipoAporte; label: string }[] = [
  { label: 'Todas' },
  { value: 'idea', label: 'Ideas' },
  { value: 'consejo', label: 'Consejos' },
  { value: 'critica', label: 'Críticas' },
  { value: 'solicitud', label: 'Solicitudes' },
];

const TIPO: Record<TipoAporte, { label: string; tone: 'ok' | 'warn' | 'primary' | 'neutral' }> = {
  idea: { label: 'Idea', tone: 'ok' },
  consejo: { label: 'Consejo', tone: 'neutral' },
  critica: { label: 'Crítica', tone: 'warn' },
  solicitud: { label: 'Solicitud', tone: 'primary' },
};

const ESTADO: Record<EstadoAporte, string> = {
  enviado: 'Sin leer',
  en_revision: 'En revisión',
  respondido: 'Respondida',
};

/** Voces ciudadanas: la bandeja de ideas, consejos, críticas y solicitudes de la campaña. */
export default function Voces() {
  const c = useMiCampana();
  const [filtro, setFiltro] = useState<TipoAporte>();

  if (!c) {
    return (
      <Screen header={<TopBar title="Voces ciudadanas" />}>
        <Notice icon="information-circle" tone="primary">Crea tu perfil para recibir aportes de los ciudadanos.</Notice>
        <Button label="Crear mi perfil" onPress={() => router.replace('/registro/etapa')} />
      </Screen>
    );
  }

  const aportes = aportesDeCampana(c.id, filtro);
  const sinLeer = aportesDeCampana(c.id).filter((a) => a.estado === 'enviado').length;

  return (
    <Screen header={<TopBar title="Voces ciudadanas" subtitle={sinLeer ? `${sinLeer} sin leer` : 'Todo al día'} />}>
      <ChipRow>
        {FILTROS.map((f) => (
          <Chip key={f.label} label={f.label} dark selected={filtro === f.value} onPress={() => setFiltro(f.value)} />
        ))}
      </ChipRow>

      {aportes.length === 0 ? (
        <Card>
          <Text style={s.h3}>{filtro ? 'Nada de este tipo por ahora' : 'Aún no te han escrito'}</Text>
          <Small>{`Comparte tu @${c.usuario} y tu código QR en tus piezas para invitar a la gente a dejarte su mensaje.`}</Small>
        </Card>
      ) : null}

      {aportes.map((a) => <AporteCard key={a.id} a={a} />)}

      <Small>Solo tú y tu equipo ven los datos de quien escribe. El ciudadano ve el estado de su aporte y tu respuesta.</Small>
    </Screen>
  );
}

function AporteCard({ a }: { a: Aporte }) {
  const [respondiendo, setRespondiendo] = useState(false);
  const [texto, setTexto] = useState('');
  const t = TIPO[a.tipo];

  return (
    <Card>
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        <Badge label={t.label} tone={t.tone} />
        <Small>{`${a.tema} · ${a.lugar}`}</Small>
      </Row>
      <Text style={s.body}>{a.texto}</Text>
      <Small>{`${ESTADO[a.estado]} · ${hace(a.fecha)}`}</Small>

      {a.respuesta ? (
        <View style={s.respuesta}>
          <Text style={s.respLabel}>Tu respuesta</Text>
          <Text style={s.body}>{a.respuesta}</Text>
        </View>
      ) : null}

      {respondiendo ? (
        <>
          <Field
            label="Respuesta"
            value={texto}
            onChangeText={setTexto}
            placeholder="Agradece y cuenta qué harás con su aporte."
            multiline
            maxLength={600}
          />
          <Row gap={8}>
            <Button label="Cancelar" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => setRespondiendo(false)} />
            <Button
              label="Enviar respuesta"
              size="md"
              style={{ flex: 1 }}
              disabled={texto.trim().length < 5}
              onPress={() => {
                responderAporte(a.id, texto.trim());
                setRespondiendo(false);
              }}
            />
          </Row>
        </>
      ) : !a.respuesta ? (
        <Button
          label="Responder"
          variant="secondary"
          size="md"
          onPress={() => {
            marcarEnRevision(a.id);
            setRespondiendo(true);
          }}
        />
      ) : null}
    </Card>
  );
}

const s = StyleSheet.create({
  h3: { fontSize: 16, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, lineHeight: 21, color: colors.ink },
  respuesta: { backgroundColor: colors.background, borderRadius: 10, padding: 12, gap: 4 },
  respLabel: { fontSize: 12, fontWeight: '700', color: colors.okFg },
});
