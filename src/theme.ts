/**
 * Identidad visual de nexo (design tokens). Toda la app toma sus colores,
 * tipografía, radios y sombras de aquí.
 *
 * Marca: Azul Eléctrico #2A5CFF · Azul Noche #0F172A · Naranja Coral #FF5E3A ·
 * Verde Menta #00E676 · Gris Nube #F8FAFC.
 */
export const colors = {
  /** Azul Eléctrico: marca, botones principales, enlaces, estados activos. */
  primary: '#2A5CFF',
  primaryPressed: '#1F47D6',
  /** Azul claro del manual de marca: fondo de lo seleccionado. */
  primaryTint: '#D9EEFF',
  primaryDisabled: '#A9BCFF',
  /** Texto azul sobre primaryTint (más oscuro para que se lea bien). */
  primaryOnTint: '#1F47D6',

  /** Naranja Coral: llamados a la acción del ciudadano, notificaciones, insignias. */
  accent: '#FF5E3A',
  /** Texto sobre coral: Azul Noche (5,9:1). El blanco sobre coral solo llega a 3:1. */
  onAccent: '#0F172A',
  accentPressed: '#E84A27',
  accentTint: '#FFE9E3',
  accentOnTint: '#B9381B',

  /** Verde Menta: confirmaciones, metas, crecimiento. Como relleno, con texto oscuro. */
  success: '#00E676',
  okBg: '#DCFCE9',
  okFg: '#047A3F',

  /** Azul Noche: superficies del candidato y texto principal sobre fondos claros. */
  night: '#0F172A',
  nightSoft: '#1E293B',
  nightBorder: '#334155',
  onNight: '#F8FAFC',
  onNightMuted: '#94A3B8',

  ink: '#0F172A',
  inkSoft: '#334155',
  muted: '#64748B',
  faint: '#94A3B8',
  /** Gris Nube: fondo de la app. */
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  inputBorder: '#CBD5E1',
  placeholder: '#E2E8F0',
  segmented: '#EEF2F7',
  warnBg: '#FEF3C7',
  warnFg: '#92400E',
  dangerBg: '#FEECEC',
  dangerFg: '#B42318',
  whatsapp: '#128C4A',
} as const;

/** Familias de Outfit por peso. En Android cada peso es una fuente distinta. */
export const fuentes = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
} as const;

/** Familia de Outfit que corresponde a un fontWeight. */
export function familiaPara(peso?: string | number): string {
  const n = peso === 'bold' ? 700 : Number(peso ?? 400) || 400;
  if (n >= 700) return fuentes.bold;
  if (n >= 600) return fuentes.semibold;
  if (n >= 500) return fuentes.medium;
  return fuentes.regular;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

/** Esquinas: 12 px en botones y tarjetas. */
export const radius = { sm: 8, md: 12, lg: 12, xl: 16, pill: 999 } as const;

/** Sombras planas y muy suaves, solo para separar tarjetas del fondo. */
export const shadow = {
  sm: { boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.05)' },
  md: { boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.06)' },
} as const;

export const type = {
  title: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.ink },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.ink },
  h3: { fontSize: 16, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.inkSoft },
  label: { fontSize: 15, fontWeight: '600' as const, color: colors.ink },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted },
  tiny: { fontSize: 12, color: colors.muted },
} as const;

/** Tamaño mínimo de cualquier área táctil. */
export const TOUCH = 44;
