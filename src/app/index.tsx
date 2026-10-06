import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons, type IconName } from '@/components/ui';
import { APP_NAME } from '@/config';
import { conectado } from '@/data/remoto';
import { useApp } from '@/state/app';
import { colors, radius, shadow, type } from '@/theme';
import { Text } from '@/components/Texto';

/** Bienvenida: cada tipo de usuario elige por dónde entrar. */
export default function Bienvenida() {
  const { reiniciarBorrador, ciudadano, candidatura, entrarComoDemo } = useApp();

  return (
    <SafeAreaView style={s.root}>
      <View style={s.hero}>
        <Image source={require('@/../assets/images/logo-nexo.png')} style={s.logo} contentFit="contain" accessibilityLabel={APP_NAME} />
        <Text style={s.tagline}>Donde los candidatos proponen y la gente responde.</Text>
      </View>

      <View style={s.options}>
        <Entrada
          icon="people"
          acento
          title="Soy ciudadano"
          text="Conoce a los candidatos de tu región, sus propuestas y escríbeles."
          onPress={() => router.push(ciudadano ? '/feed' : '/ciudadano/registro')}
        />
        <Entrada
          icon="flag"
          title="Soy aspirante o candidato"
          text="Crea tu perfil público y organiza tu campaña."
          onPress={() => {
            if (candidatura) return router.push('/campana');
            reiniciarBorrador();
            router.push('/registro/etapa');
          }}
        />
        <Entrada
          icon="key"
          title="Tengo un código de invitación"
          text="Para coordinadores, líderes y equipos de marketing."
          onPress={() => router.push('/invitacion')}
        />
        {conectado && !candidatura && !ciudadano ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/cuenta')} style={s.demo}>
            <Text style={s.demoText}>Ya tengo cuenta: entrar con mi celular</Text>
          </Pressable>
        ) : null}
        {!candidatura && !conectado ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              entrarComoDemo();
              router.push('/campana');
            }}
            style={s.demo}>
            <Text style={s.demoText}>Ver una campaña de ejemplo</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function Entrada({ icon, title, text, onPress, acento }: { icon: IconName; title: string; text: string; onPress: () => void; acento?: boolean }) {
  return (
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
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between', padding: 24 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo: { width: 180, height: 44 },
  tagline: { fontSize: 16, color: colors.inkSoft, textAlign: 'center', maxWidth: 300, lineHeight: 22 },
  options: { gap: 12, paddingBottom: 8 },
  entrada: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadow.sm },
  demo: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  demoText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  entradaIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
});
