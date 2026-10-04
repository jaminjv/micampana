/**
 * Tema visual provisional. Cuando llegue la identidad de marca,
 * se reemplazan los valores aquí y toda la app se actualiza.
 */
export const colors = {
  primary: '#1E44B8',
  primaryPressed: '#16348C',
  primaryTint: '#E8EDFB',
  primaryDisabled: '#A9B7E3',
  ink: '#14181F',
  inkSoft: '#3D4452',
  muted: '#5A6170',
  faint: '#9AA2B1',
  background: '#F4F5F7',
  surface: '#FFFFFF',
  border: '#E2E5EA',
  divider: '#EEF0F3',
  inputBorder: '#C9CED6',
  placeholder: '#DCE1E8',
  segmented: '#E4E7EC',
  okBg: '#E6F4EB',
  okFg: '#1C6B3A',
  warnBg: '#FDF0E6',
  warnFg: '#9A3F08',
  dangerBg: '#FDECEC',
  dangerFg: '#A61B1B',
  whatsapp: '#1C6B3A',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 14, xl: 16, pill: 999 } as const;

export const type = {
  title: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.2, color: colors.ink },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.ink },
  h3: { fontSize: 16, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  label: { fontSize: 15, fontWeight: '600' as const, color: colors.ink },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted },
  tiny: { fontSize: 12, color: colors.muted },
} as const;

/** Tamaño mínimo de cualquier área táctil. */
export const TOUCH = 44;
