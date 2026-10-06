import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { alFallar } from '@/data/remoto';
import { useApp } from '@/state/app';
import { colors, radius } from '@/theme';
import { Button, Ionicons } from './ui';
import { Text } from './Texto';

/** Con Supabase: muestra "Cargando" al abrir y un error con "Reintentar" si no se pudo. */
export function EsperarCarga({ children }: { children: ReactNode }) {
  const { carga, reintentarCarga } = useApp();
  if (carga.estado === 'lista') return <>{children}</>;
  return (
    <SafeAreaView style={s.centro}>
      {carga.estado === 'cargando' ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.texto}>Cargando…</Text>
        </>
      ) : (
        <>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.muted} />
          <Text style={s.titulo}>No pudimos conectarnos</Text>
          <Text style={s.texto}>{carga.mensaje}</Text>
          <Button label="Reintentar" onPress={reintentarCarga} style={{ alignSelf: 'stretch' }} />
        </>
      )}
    </SafeAreaView>
  );
}

/** Aviso en la parte de abajo cuando un cambio no se pudo guardar en el servidor. */
export function AvisoGuardado() {
  const [mensaje, setMensaje] = useState<string>();
  useEffect(() => alFallar(setMensaje), []);
  if (!mensaje) return null;
  return (
    <SafeAreaView edges={['bottom']} style={s.aviso} pointerEvents="box-none">
      <View style={s.caja} accessibilityRole="alert">
        <Ionicons name="warning" size={18} color={colors.dangerFg} />
        <Text style={s.avisoTexto}>{mensaje}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar aviso" onPress={() => setMensaje(undefined)} hitSlop={10}>
          <Ionicons name="close" size={20} color={colors.dangerFg} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: colors.background },
  titulo: { fontSize: 20, fontWeight: '700', color: colors.ink },
  texto: { fontSize: 15, lineHeight: 21, color: colors.inkSoft, textAlign: 'center' },
  aviso: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12 },
  caja: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.dangerBg, marginBottom: 72 },
  avisoTexto: { flex: 1, fontSize: 14, lineHeight: 19, color: colors.dangerFg, fontWeight: '600' },
});
