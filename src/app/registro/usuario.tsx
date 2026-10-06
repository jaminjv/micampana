import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Field, Ionicons, OptionCard, Progress, Screen, Small, Title, TopBar } from '@/components/ui';
import { APP_NAME } from '@/config';
import { usuarioOcupado } from '@/data/repo';
import { useApp } from '@/state/app';
import { posicion } from '@/state/pasos';
import { colors } from '@/theme';
import { Text } from '@/components/Texto';

const FORMATO = /^[a-z0-9_]{3,20}$/;

/** Último paso: @usuario, QR para las piezas y modo de uso. */
export default function Usuario() {
  const { borrador, actualizarBorrador, confirmarCandidatura, campanaId } = useApp();
  const { paso, total } = posicion(borrador, 'usuario');
  const usuario = borrador.usuario ?? '';
  const formatoOk = FORMATO.test(usuario);
  const ocupado = usuarioOcupado(usuario, campanaId ?? undefined);
  const disponible = formatoOk && !ocupado;
  const nombreOk = (borrador.nombre ?? '').trim().length >= 3;
  const esCandidato = borrador.etapa === 'candidato';
  const modo = borrador.modo ?? 'campana_completa';

  const estado = !usuario
    ? { texto: 'Entre 3 y 20 caracteres: letras minúsculas, números o guion bajo.', color: colors.muted }
    : !formatoOk
      ? { texto: 'Solo letras minúsculas, números o guion bajo (3 a 20).', color: colors.dangerFg }
      : ocupado
        ? { texto: 'Ese usuario ya está en uso.', color: colors.dangerFg }
        : { texto: 'Disponible', color: colors.okFg };

  return (
    <Screen
      background={colors.surface}
      header={<TopBar title="Crear tu perfil" />}
      footer={
        <Button
          label={esCandidato ? 'Crear perfil y enviar a verificación' : 'Crear mi perfil'}
          disabled={!disponible || !nombreOk}
          onPress={() => {
            const b = { ...borrador, modo: esCandidato ? modo : undefined };
            confirmarCandidatura(b);
            router.dismissAll();
            router.replace('/campana');
          }}
        />
      }>
      <Progress paso={paso} total={total} etiqueta="Crear tu perfil" />
      <Title>Tu perfil público</Title>

      <Field
        label="Nombre público"
        value={borrador.nombre ?? ''}
        onChangeText={(t) => actualizarBorrador({ nombre: t })}
        placeholder="Como aparecerás en el tarjetón"
        autoCapitalize="words"
        hint="Los ciudadanos te buscarán por este nombre o por tu @usuario."
      />

      <View style={{ gap: 6 }}>
        <Field
          label="Nombre de usuario"
          prefix="@"
          value={usuario}
          onChangeText={(t) => actualizarBorrador({ usuario: t.toLowerCase().replace(/\s/g, '') })}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="tunombre"
          big
        />
        <Text style={{ fontSize: 13, fontWeight: disponible ? '600' : '400', color: estado.color }}>{estado.texto}</Text>
      </View>

      <Card style={{ backgroundColor: colors.background, borderWidth: 0, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <View style={s.qr}>
          <Ionicons name="qr-code" size={60} color={colors.ink} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={s.label}>Para tus piezas gráficas</Text>
          <Small>{`"Déjame tu mensaje en ${APP_NAME}: @${usuario || 'tunombre'}". El código QR abre tu perfil directo.`}</Small>
        </View>
      </Card>

      {esCandidato ? (
        <View style={{ gap: 10 }}>
          <Text style={s.label}>¿Cómo usarás la app?</Text>
          <OptionCard
            title="Solo recibir mensajes"
            description="Perfil público y bandeja de aportes ciudadanos."
            selected={modo === 'solo_mensajes'}
            onPress={() => actualizarBorrador({ modo: 'solo_mensajes' })}
          />
          <OptionCard
            title="Campaña completa"
            description="Además: propuestas, feed, equipos, agenda, tareas y marketing."
            selected={modo === 'campana_completa'}
            onPress={() => actualizarBorrador({ modo: 'campana_completa' })}
          />
        </View>
      ) : (
        <Small>Como aspirante tendrás perfil público, ideas ciudadanas, sondeos y un equipo inicial. Cuando tengas aval, actualizas a candidato.</Small>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 15, fontWeight: '600', color: colors.ink },
  qr: { width: 88, height: 88, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});
