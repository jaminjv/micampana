/**
 * Configuración general de la app.
 * El nombre es provisional: cambiarlo aquí lo cambia en todas las pantallas.
 */
export const APP_NAME = 'Mi Campaña';

/** Cuando existan estas variables, la app usa Supabase; si no, usa datos de prueba. */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
