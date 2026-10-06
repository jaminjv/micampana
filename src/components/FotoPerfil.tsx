import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import type { ArchivoLocal } from '@/data/types';
import { colors, radius, shadow, estilos } from '@/theme';
import { Text } from './Texto';
import { Avatar, Button, Ionicons, Small } from './ui';

/**
 * Foto de perfil que se puede cambiar: al tocarla, tomar una foto, elegirla de
 * la galería o quitarla. Se recorta cuadrada para que se vea bien en el círculo.
 */
export function FotoPerfil({
  nombre, foto, size = 72, onCambiar, oscura,
}: { nombre: string; foto?: string; size?: number; onCambiar: (a: ArchivoLocal | null) => void; oscura?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string>();

  const elegir = async (camara: boolean) => {
    setError(undefined);
    if (camara) {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        setError('Permite el uso de la cámara para tomar la foto.');
        return;
      }
    }
    const opciones: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] };
    const r = camara
      ? await ImagePicker.launchCameraAsync({ ...opciones, cameraType: ImagePicker.CameraType.front })
      : await ImagePicker.launchImageLibraryAsync(opciones);
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    if (a.fileSize && a.fileSize > 3 * 1024 * 1024) {
      setError('La foto pesa más de 3 MB. Prueba con otra.');
      return;
    }
    onCambiar({ uri: a.uri, nombre: a.fileName ?? 'foto.jpg', tipo: a.mimeType ?? 'image/jpeg', tamano: a.fileSize });
    setAbierto(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={foto ? 'Cambiar tu foto de perfil' : 'Poner una foto de perfil'}
        onPress={() => {
          setError(undefined);
          setAbierto(true);
        }}
        style={({ pressed }) => [{ width: size, height: size }, pressed && { transform: [{ scale: 0.96 }] }]}>
        <Avatar nombre={nombre} foto={foto} size={size} />
        <View style={[s.insignia, { borderColor: oscura ? colors.night : colors.surface }]}>
          <Ionicons name="camera" size={14} color={colors.onNight} />
        </View>
      </Pressable>

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <Pressable style={s.fondo} onPress={() => setAbierto(false)} accessibilityLabel="Cerrar">
          <Pressable style={s.hoja} onPress={() => {}}>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Avatar nombre={nombre} foto={foto} size={88} />
              <Text style={s.titulo}>Foto de perfil</Text>
              <Small style={{ textAlign: 'center' }}>Se ve en tu perfil, en el feed y en tus comentarios.</Small>
            </View>
            <Button label="Tomar foto" icon="camera" onPress={() => elegir(true)} />
            <Button label="Elegir de la galería" icon="images" variant="secondary" onPress={() => elegir(false)} />
            {foto ? (
              <Button
                label="Quitar foto"
                variant="ghost"
                onPress={() => {
                  onCambiar(null);
                  setAbierto(false);
                }}
              />
            ) : null}
            {error ? <Small style={{ color: colors.dangerFg, textAlign: 'center' }}>{error}</Small> : null}
            <Button label="Cancelar" variant="ghost" onPress={() => setAbierto(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = estilos(() => ({
  insignia: {
    position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  fondo: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  hoja: {
    width: '100%', maxWidth: 520, gap: 10, padding: 20, paddingBottom: 32, backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, ...shadow.md,
  },
  titulo: { fontSize: 18, fontWeight: '700', color: colors.ink },
}));
