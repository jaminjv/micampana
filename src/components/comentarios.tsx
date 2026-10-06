import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { borrarComentario, comentariosDe, ocultarComentario, reaccionar, reaccionesDe } from '@/data/repo';
import type { Comentario } from '@/data/types';
import { hace } from '@/lib/fechas';
import { tocar } from '@/lib/tacto';
import { colors, radius, estilos } from '@/theme';
import { Text } from './Texto';
import { Avatar, Ionicons, RESORTE, type IconName } from './ui';

/** Ver los comentarios de una publicación. */
export const abrirComentarios = (pub: string) => router.push({ pathname: '/comentarios', params: { pub } });

/**
 * Manito arriba, manito abajo y comentarios bajo una publicación del feed.
 * soloLectura: el candidato ve los totales de sus publicaciones pero no reacciona.
 */
export function BarraReacciones({ pub, soloLectura }: { pub: string; soloLectura?: boolean }) {
  const r = reaccionesDe(pub);
  const n = comentariosDe(pub).length;
  return (
    <View style={s.barra}>
      <BotonReaccion
        icon={r.mia === 1 ? 'thumbs-up' : 'thumbs-up-outline'}
        n={r.aFavor}
        activo={r.mia === 1}
        color={colors.primaryOnTint}
        fondo={colors.primaryTint}
        label={r.mia === 1 ? 'Quitar me gusta' : 'Me gusta'}
        onPress={soloLectura ? undefined : () => reaccionar(pub, 1)}
      />
      <BotonReaccion
        icon={r.mia === -1 ? 'thumbs-down' : 'thumbs-down-outline'}
        n={r.enContra}
        activo={r.mia === -1}
        color={colors.accentOnTint}
        fondo={colors.accentTint}
        label={r.mia === -1 ? 'Quitar no me gusta' : 'No me gusta'}
        onPress={soloLectura ? undefined : () => reaccionar(pub, -1)}
      />
      <View style={{ flex: 1 }} />
      <BotonReaccion icon="chatbubble-outline" n={n} label={n === 1 ? '1 comentario' : `${n} comentarios`} texto={n ? undefined : 'Comentar'} onPress={() => abrirComentarios(pub)} />
    </View>
  );
}

function BotonReaccion({
  icon, n, activo, color = colors.muted, fondo, label, texto, onPress,
}: { icon: IconName; n: number; activo?: boolean; color?: string; fondo?: string; label: string; texto?: string; onPress?: () => void }) {
  const escala = useSharedValue(1);
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${n}`}
      accessibilityState={{ selected: !!activo, disabled: !onPress }}
      disabled={!onPress}
      hitSlop={6}
      onPress={() => {
        if (!onPress) return;
        // Al reaccionar, la manito salta un poco.
        escala.value = withSequence(withSpring(1.3, RESORTE), withSpring(1, RESORTE));
        tocar();
        onPress();
      }}
      style={({ pressed }) => [s.boton, activo && { backgroundColor: fondo }, pressed && { opacity: 0.8 }]}>
      <Animated.View style={animado}>
        <Ionicons name={icon} size={18} color={activo ? color : colors.muted} />
      </Animated.View>
      <Text style={[s.n, activo && { color }]}>{n}</Text>
      {texto ? <Text style={s.n}>{texto}</Text> : null}
    </Pressable>
  );
}

/** Los últimos comentarios bajo la publicación, para no tener que abrirla. */
export function ComentariosRecientes({ pub, max = 2 }: { pub: string; max?: number }) {
  const lista = comentariosDe(pub);
  if (!lista.length) return null;
  const ultimos = lista.slice(-max);
  return (
    <Pressable accessibilityRole="button" onPress={() => abrirComentarios(pub)} style={s.recientes}>
      {lista.length > max ? <Text style={s.verTodos}>{`Ver los ${lista.length} comentarios`}</Text> : null}
      {ultimos.map((c) => (
        <Text key={c.id} style={s.resumen} numberOfLines={2}>
          <Text style={[s.autor, c.deCampana && { color: colors.primary }]}>{`${c.autor} `}</Text>
          {c.texto}
        </Text>
      ))}
    </Pressable>
  );
}

/** Un comentario completo. Quien lo escribió puede borrarlo; el candidato, ocultarlo. */
export function ComentarioFila({ c, puedeOcultar }: { c: Comentario; puedeOcultar?: boolean }) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} layout={LinearTransition} style={[s.fila, c.oculto && { opacity: 0.6 }]}>
      <Avatar nombre={c.autor} foto={c.foto} size={34} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={s.cabeza}>
          <Text style={[s.autor, c.deCampana && { color: colors.primary }]}>{c.autor}</Text>
          {c.deCampana ? <Text style={s.etiqueta}>Campaña</Text> : null}
          <Text style={s.meta}>{[c.lugar, hace(c.fecha)].filter(Boolean).join(' · ')}</Text>
        </View>
        <Text style={s.texto}>{c.texto}</Text>
        {c.oculto ? (
          <Text style={s.meta}>{c.mio && !puedeOcultar ? 'La campaña ocultó tu comentario: solo tú lo ves.' : 'Oculto: el público no lo ve.'}</Text>
        ) : null}
        <View style={s.acciones}>
          {c.mio ? <Accion label="Borrar" onPress={() => borrarComentario(c.id)} /> : null}
          {puedeOcultar && !c.mio ? (
            <Accion label={c.oculto ? 'Volver a mostrar' : 'Ocultar'} onPress={() => ocultarComentario(c.id, !c.oculto)} />
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

const Accion = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress}>
    <Text style={s.accion}>{label}</Text>
  </Pressable>
);

const s = estilos(() => ({
  barra: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  boton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  n: { fontSize: 14, fontWeight: '600', color: colors.muted },
  recientes: { gap: 4, paddingHorizontal: 18, paddingBottom: 14 },
  verTodos: { fontSize: 13, fontWeight: '600', color: colors.muted },
  resumen: { fontSize: 14, lineHeight: 20, color: colors.inkSoft },
  autor: { fontSize: 14, fontWeight: '700', color: colors.ink },
  fila: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  etiqueta: { fontSize: 11, fontWeight: '700', color: colors.primaryOnTint, backgroundColor: colors.primaryTint, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm, overflow: 'hidden' },
  meta: { fontSize: 12, color: colors.muted },
  texto: { fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  acciones: { flexDirection: 'row', gap: 16, marginTop: 2 },
  accion: { fontSize: 13, fontWeight: '600', color: colors.muted },
}));
