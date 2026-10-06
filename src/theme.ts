/**
 * Identidad visual de nexo (design tokens). Toda la app toma sus colores,
 * tipografía, radios y sombras de aquí.
 *
 * Marca: Azul Eléctrico #2A5CFF · Azul Noche #0F172A · Naranja Coral #FF5E3A ·
 * Verde Menta #00E676 · Gris Nube #F8FAFC.
 *
 * Hay tema claro y oscuro. `colors`, `type` y `shadow` cambian de valores al
 * aplicar un tema, y los estilos hechos con `estilos()` se recalculan solos.
 */
import { Appearance, StyleSheet } from 'react-native';

const CLARO = {
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
};

export type Paleta = Record<keyof typeof CLARO, string>;

/** Tema oscuro: fondos Azul Noche profundo, texto Gris Nube, la marca un poco más luminosa para que contraste. */
const OSCURO: Paleta = {
  primary: '#4D7BFF',
  primaryPressed: '#3A66F0',
  primaryTint: '#1B2A55',
  primaryDisabled: '#2A3B6E',
  primaryOnTint: '#AFC4FF',

  accent: '#FF6B4A',
  onAccent: '#0F172A',
  accentPressed: '#E85A3A',
  accentTint: '#3A1E17',
  accentOnTint: '#FFB4A2',

  success: '#00E676',
  okBg: '#0E3B26',
  okFg: '#5EE6A0',

  night: '#060B16',
  nightSoft: '#1E293B',
  nightBorder: '#334155',
  onNight: '#F8FAFC',
  onNightMuted: '#94A3B8',

  ink: '#F1F5F9',
  inkSoft: '#CBD5E1',
  muted: '#94A3B8',
  faint: '#64748B',
  background: '#0B1220',
  surface: '#151E2E',
  border: '#253247',
  divider: '#1C2638',
  inputBorder: '#3A4A63',
  placeholder: '#253247',
  segmented: '#1C2638',
  warnBg: '#3A2A0A',
  warnFg: '#FCD34D',
  dangerBg: '#3B1414',
  dangerFg: '#FCA5A5',
  whatsapp: '#1FA855',
};

export const colors: Paleta = { ...CLARO };


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
const sombras = (oscuro: boolean) => ({
  sm: { boxShadow: oscuro ? '0px 1px 2px rgba(0, 0, 0, 0.4)' : '0px 1px 2px rgba(15, 23, 42, 0.05)' },
  md: { boxShadow: oscuro ? '0px 4px 14px rgba(0, 0, 0, 0.45)' : '0px 2px 8px rgba(15, 23, 42, 0.06)' },
});
export const shadow = sombras(false);

const tipografia = () => ({
  title: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.ink },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.ink },
  h3: { fontSize: 16, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.inkSoft },
  label: { fontSize: 15, fontWeight: '600' as const, color: colors.ink },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted },
  tiny: { fontSize: 12, color: colors.muted },
});
export const type = tipografia();

/** Tamaño mínimo de cualquier área táctil. */
export const TOUCH = 44;

/* ---------- Tema claro u oscuro ---------- */

/** Lo que elige la persona; "sistema" sigue la configuración del teléfono. */
export type PreferenciaTema = 'sistema' | 'claro' | 'oscuro';

let versionTema = 0;
let oscuroActivo = false;

export const esOscuro = () => oscuroActivo;

/** Cambia los valores de colors, type y shadow. Devuelve si quedó oscuro. */
export function aplicarTema(pref: PreferenciaTema): boolean {
  const oscuro = pref === 'oscuro' || (pref === 'sistema' && Appearance.getColorScheme() === 'dark');
  if (oscuro === oscuroActivo && versionTema > 0) return oscuro;
  oscuroActivo = oscuro;
  Object.assign(colors, oscuro ? OSCURO : CLARO);
  Object.assign(type, tipografia());
  Object.assign(shadow, sombras(oscuro));
  versionTema++;
  return oscuro;
}

/**
 * Como StyleSheet.create, pero se vuelve a calcular cuando cambia el tema.
 * Se usa igual: const s = estilos(() => ({ ... })); y luego s.tarjeta.
 */
export function estilos<T extends StyleSheet.NamedStyles<T>>(fn: () => T & StyleSheet.NamedStyles<T>): T {
  let cache: T | undefined;
  let version = -1;
  const actual = (): T => {
    if (!cache || version !== versionTema) {
      cache = StyleSheet.create(fn());
      version = versionTema;
    }
    return cache;
  };
  return new Proxy({} as T, { get: (_, clave) => actual()[clave as keyof T] });
}
