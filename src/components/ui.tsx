/** Componentes de interfaz compartidos. Todos usan el tema de src/theme.ts. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { colors, esOscuro, estilos, radius, shadow, space, TOUCH, type } from '@/theme';
import { Text, TextInput } from './Texto';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export { Ionicons };

/* ---------- Estructura de pantalla ---------- */

interface ScreenProps {
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  background?: string;
  scroll?: boolean;
  padded?: boolean;
  /** Parte superior en Azul Noche (vistas del candidato), con la barra de estado clara. */
  oscura?: boolean;
}

/** Pantalla con área segura, contenido desplazable y pie fijo opcional. */
export function Screen({ children, footer, header, background = colors.background, scroll = true, padded = true, oscura }: ScreenProps) {
  const contenido = padded ? styles.screenPad : undefined;
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: oscura ? colors.night : background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={oscura || esOscuro() ? 'light' : 'dark'} />
      {header}
      <View style={[styles.flex, { backgroundColor: background }]}>
        {scroll ? (
          <ScrollView style={styles.flex} contentContainerStyle={[contenido, styles.gap16, padded && styles.ancho]} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, contenido, styles.gap16, padded && styles.ancho]}>{children}</View>
        )}
      </View>
      {footer ? <SafeAreaView edges={['bottom']} style={styles.footer}>{footer}</SafeAreaView> : null}
    </SafeAreaView>
  );
}

/**
 * Barra superior con botón de volver. "oscura" (Azul Noche) es la de las
 * herramientas del candidato; la clara, la del ciudadano.
 */
export function TopBar({ title, subtitle, right, oscura }: { title: string; subtitle?: string; right?: ReactNode; oscura?: boolean }) {
  const tinta = oscura ? colors.onNight : colors.ink;
  return (
    <View style={[styles.topBar, oscura && styles.topBarOscura]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.iconBtn}
        hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={tinta} />
      </Pressable>
      <View style={styles.flex}>
        <Text style={[styles.topTitle, { color: tinta }]} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={[type.small, oscura && { color: colors.onNightMuted }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/* ---------- Texto ---------- */

export const Title = ({ children }: { children: ReactNode }) => (
  <Text style={type.title} accessibilityRole="header">{children}</Text>
);
export const H2 = ({ children }: { children: ReactNode }) => (
  <Text style={type.h2} accessibilityRole="header">{children}</Text>
);
export const Body = ({ children, style }: { children: ReactNode; style?: StyleProp<any> }) => (
  <Text style={[type.body, style]}>{children}</Text>
);
export const Small = ({ children, style }: { children: ReactNode; style?: StyleProp<any> }) => (
  <Text style={[type.small, style]}>{children}</Text>
);

/** Progreso del registro: "paso 2 de 4". */
export function Progress({ paso, total, etiqueta }: { paso: number; total: number; etiqueta: string }) {
  return (
    <View style={styles.gap8} accessibilityLabel={`${etiqueta}, paso ${paso} de ${total}`}>
      <View style={styles.progressRow}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.progressSeg, { backgroundColor: i < paso ? colors.primary : colors.border }]} />
        ))}
      </View>
      <Text style={type.small}>{`${etiqueta} · paso ${paso} de ${total}`}</Text>
    </View>
  );
}

/* ---------- Botones ---------- */

interface ButtonProps {
  label: string;
  onPress?: () => void;
  /** primary: Azul Eléctrico · accent: Naranja Coral, para el ciudadano. */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'whatsapp';
  disabled?: boolean;
  icon?: IconName;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', disabled, icon, size = 'lg', style }: ButtonProps) {
  const fondo = disabled
    ? variant === 'secondary' || variant === 'ghost' ? colors.surface : variant === 'accent' ? colors.accentTint : colors.primaryDisabled
    : variant === 'primary' ? colors.primary
    : variant === 'accent' ? colors.accent
    : variant === 'whatsapp' ? colors.whatsapp
    : variant === 'secondary' ? colors.surface : 'transparent';
  const presionado = variant === 'primary' ? colors.primaryPressed : variant === 'accent' ? colors.accentPressed : undefined;
  const texto =
    variant === 'secondary' || variant === 'ghost' ? (disabled ? colors.faint : colors.ink)
    : variant === 'accent' ? (disabled ? colors.accentOnTint : colors.onAccent)
    : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          height: size === 'lg' ? 52 : TOUCH,
          backgroundColor: pressed && presionado && !disabled ? presionado : fondo,
          opacity: pressed && !presionado ? 0.85 : 1,
        },
        variant === 'secondary' && styles.btnSecondary,
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={18} color={texto} /> : null}
      <Text style={[styles.btnText, { color: texto, fontSize: size === 'lg' ? 16 : 14 }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Formularios ---------- */

interface FieldProps extends TextInputProps {
  label: string;
  hint?: string;
  prefix?: string;
  big?: boolean;
}

export function Field({ label, hint, prefix, big, style, ...input }: FieldProps) {
  return (
    <View style={styles.gap6}>
      <Text style={type.label}>{label}</Text>
      <View style={[styles.inputBox, big && styles.inputBig]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.faint}
          style={[styles.input, big && styles.inputBigText, input.multiline && styles.inputMulti, style]}
          {...input}
        />
      </View>
      {hint ? <Text style={type.small}>{hint}</Text> : null}
    </View>
  );
}

/** Opción grande tipo radio, con título, descripción y contenido extra. */
export function OptionCard({
  title, description, selected, onPress, children,
}: { title: string; description?: string; selected: boolean; onPress: () => void; children?: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.option, selected && styles.optionOn]}>
      <View style={[styles.radio, selected && styles.radioOn]} />
      <View style={[styles.flex, styles.gap4]}>
        <Text style={[type.h3, selected && { fontWeight: '700' }]}>{title}</Text>
        {description ? <Text style={[type.small, { color: selected ? colors.inkSoft : colors.muted }]}>{description}</Text> : null}
        {children}
      </View>
    </Pressable>
  );
}

/** Casilla de verificación con texto. */
export function CheckRow({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onToggle} style={styles.checkRow}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
      </View>
      <View style={styles.flex}>{typeof children === 'string' ? <Text style={type.body}>{children}</Text> : children}</View>
    </Pressable>
  );
}

/** Selector segmentado de 2 a 4 opciones. */
export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segItem, on && styles.segItemOn]}>
            <Text style={[styles.segText, on && styles.segTextOn]} numberOfLines={1}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Chip seleccionable (filtros, temas). */
export function Chip({ label, selected, onPress, dark }: { label: string; selected?: boolean; onPress?: () => void; dark?: boolean }) {
  const on = !!selected;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.chip, on && (dark ? styles.chipDark : styles.chipOn)]}>
      <Text style={[styles.chipText, on && (dark ? styles.chipTextDark : styles.chipTextOn)]}>{label}</Text>
    </Pressable>
  );
}

export const ChipRow = ({ children }: { children: ReactNode }) => <View style={styles.chipRow}>{children}</View>;

/* ---------- Contenedores ---------- */

export const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.card, style]}>{children}</View>
);

type Tono = 'primary' | 'accent' | 'ok' | 'warn' | 'danger' | 'neutral';
/** Fondo y texto de cada tono; es función para que siga el tema activo. */
const tonos = (): Record<Tono, [string, string]> => ({
  primary: [colors.primaryTint, colors.primaryOnTint],
  accent: [colors.accentTint, colors.accentOnTint],
  ok: [colors.okBg, colors.okFg],
  warn: [colors.warnBg, colors.warnFg],
  danger: [colors.dangerBg, colors.dangerFg],
  neutral: [colors.segmented, colors.inkSoft],
});

export function Badge({ label, tone = 'primary' }: { label: string; tone?: Tono }) {
  const [bg, fg] = tonos()[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Notice({ icon, children, tone = 'warn' }: { icon: IconName; children: ReactNode; tone?: Tono }) {
  const [bg, fg] = tonos()[tone];
  return (
    <View style={[styles.notice, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={18} color={fg} />
      <Text style={[styles.flex, { color: fg, fontSize: 14, lineHeight: 19, fontWeight: '600' }]}>{children}</Text>
    </View>
  );
}

/** Foto de perfil redonda; con iniciales mientras no hay foto. */
export function Avatar({ nombre, size = 48, foto }: { nombre: string; size?: number; foto?: string }) {
  const iniciales = nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const caja = { width: size, height: size, borderRadius: size / 2 };
  if (foto) {
    return <Image source={{ uri: foto }} style={[caja, { backgroundColor: colors.placeholder }]} contentFit="cover" transition={200} accessibilityLabel={`Foto de ${nombre}`} />;
  }
  return (
    <View style={[caja, { backgroundColor: colors.placeholder, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: colors.inkSoft, fontWeight: '700', fontSize: size * 0.36 }}>{iniciales}</Text>
    </View>
  );
}

export function VerifiedMark({ size = 16 }: { size?: number }) {
  return <Ionicons name="checkmark-circle" size={size} color={colors.primary} accessibilityLabel="Verificado" />;
}

export const Row = ({ children, gap = 8, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>
);

export const styles = estilos(() => ({
  flex: { flex: 1 },
  gap4: { gap: 4 },
  gap6: { gap: 6 },
  gap8: { gap: 8 },
  gap16: { gap: 16 },
  screenPad: { padding: space.xl, paddingBottom: space.xxxl },
  /** En pantallas anchas (web), el contenido no se estira más de 760 px. */
  ancho: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  footer: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.md, gap: 10 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: space.sm, paddingVertical: space.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topBarOscura: { backgroundColor: colors.night, borderBottomColor: colors.night },
  topTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  iconBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  progressRow: { flexDirection: 'row', gap: 6 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2 },
  btn: { borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: space.lg },
  btnSecondary: { borderWidth: 1, borderColor: colors.inputBorder },
  btnText: { fontWeight: '700' },
  inputBox: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, paddingHorizontal: 14 },
  inputBig: { borderWidth: 2, borderColor: colors.primary, minHeight: 56 },
  input: { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 12 },
  inputBigText: { fontSize: 20, fontWeight: '700' },
  inputMulti: { minHeight: 110, textAlignVertical: 'top' },
  prefix: { fontSize: 18, fontWeight: '600', color: colors.muted, marginRight: 2 },
  option: { flexDirection: 'row', gap: 14, padding: space.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface },
  optionOn: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryTint },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.faint, marginTop: 1 },
  radioOn: { borderWidth: 7, borderColor: colors.primary, backgroundColor: colors.surface },
  checkRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', minHeight: TOUCH, paddingVertical: 4 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: radius.md, backgroundColor: colors.segmented },
  segItem: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  segItemOn: { backgroundColor: colors.surface, ...shadow.sm },
  segText: { fontSize: 14, color: colors.muted, fontWeight: '500' },
  segTextOn: { color: colors.ink, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 38, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.primaryTint, borderColor: colors.primaryTint },
  chipDark: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.inkSoft },
  chipTextOn: { color: colors.primaryOnTint, fontWeight: '600' },
  chipTextDark: { color: '#FFFFFF', fontWeight: '600' },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.lg, gap: 10, ...shadow.sm },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 12, fontWeight: '600' },
  notice: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: radius.md },
}));
