/**
 * Cliente de Supabase. Solo se crea si existen EXPO_PUBLIC_SUPABASE_URL y
 * EXPO_PUBLIC_SUPABASE_ANON_KEY (ver .env.example). Mientras tanto la app
 * funciona con datos de prueba.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_URL, USE_SUPABASE } from '@/config';

export const supabase: SupabaseClient | null = USE_SUPABASE
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
