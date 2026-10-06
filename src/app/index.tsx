import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotonTema } from '@/components/SelectorTema';
import { Ionicons, type IconName } from '@/components/ui';
import { APP_NAME } from '@/config';
import { conectado } from '@/data/remoto';
import { ROLES } from '@/components/equipo';
import { getCandidato } from '@/data/repo';
import { useApp, useMiMiembro } from '@/state/app';
import { type, colors, radius, shadow, esOscuro, estilos } from '@/theme';
import { Text } from '@/components/Texto';

/** Bienvenida: cada tipo de usuario elige por dónde entrar. */
export default function Bienvenida() {
  const { reiniciarBorrador, ciudadano, candidatura, miembroId } = useApp();
  const miembro = useMiMiembro();

  return (
    <SafeAreaView style={s.root}>
      <View style={s.arriba}>
        <BotonTema />
      </View>
      <Animated.View entering={ZoomIn.duration(500)} style={s.hero}>
        <Image source={esOscuro() ? require('@/../assets/images/logo-nexo-blanco.png') : require('@/../assets/images/logo-nexo.png')} style={s.logo} contentFit="contain" accessibilityLabel={APP_NAME} />
        <Animated.View entering={FadeIn.delay(350).duration(600)}>
          <Text style={s.tagline}>Construyamos</Text>
        </Animated.View>
      </Animated.View>

      <View style={s.options}>
        <Entrada
          icon="people"
          orden={1}
          acento
          title="Soy ciudadano"
          text="Conoce a los candidatos de tu región, sus propuestas y escríbeles."
          onPress={() => router.push(ciudadano ? '/feed' : '/ciudadano/registro')}
        />
        <Entrada
          icon="flag"
          orden={2}
          title="Soy aspirante o candidato"
          text="Crea tu perfil público y organiza tu campaña."
          onPress={() => {
            if (candidatura) return router.push('/campana');
            reiniciarBorrador();
            router.push('/registro/etapa');
          }}
        />
        {miembro ? (
          <Entrada
            icon="briefcase"
            orden={3}
            title={`Mi equipo: ${ROLES[miembro.rol]}`}
            text={`${miembro.zona.etiqueta} · campaña de ${getCandidato(miembro.candidato)?.nombre ?? ''}`}
            onPress={() => router.push(miembro.rol === 'coordinador' ? '/coordinador' : '/lider')}
          />
        ) : (
          <Entrada
            icon="key"
            orden={3}
            title="Tengo un código de invitación"
            text="Para coordinadores, líderes y equipos de marketing."
            onPress={() => router.push('/invitacion')}
          />
        )}
        {conectado && !candidatura && !ciudadano ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/cuenta')} style={s.demo}>
            <Text style={s.demoText}>Ya tengo cuenta: entrar con mi celular</Text>
          </Pressable>
        ) : null}
        {!candidatura && !miembroId && !conectado ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/demo')} style={s.demo}>
            <Text style={s.demoText}>Ver una campaña de ejemplo</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function Entrada({
  icon, title, text, onPress, acento, orden = 0,
}: { icon: IconName; title: string; text: string; onPress: () => void; acento?: boolean; orden?: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(200 + orden * 90).springify().damping(16)}>
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.entrada, pressed && { opacity: 0.85 }]}>
      <View style={[s.entradaIcon, acento && { backgroundColor: colors.accentTint }]}>
        <Ionicons name={icon} size={22} color={acento ? colors.accent : colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={type.h3}>{title}</Text>
        <Text style={type.small}>{text}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.faint} />
    </Pressable>
    </Animated.View>
  );
}

const s = estilos(() => ({
  arriba: { position: 'absolute', top: 12, right: 16, zIndex: 1 },
  root: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between', padding: 24 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo: { width: 180, height: 44 },
  tagline: { fontSize: 16, color: colors.inkSoft, textAlign: 'center', maxWidth: 300, lineHeight: 22 },
  options: { gap: 12, paddingBottom: 8 },
  entrada: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadow.sm },
  demo: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  demoText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  entradaIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
}));
