import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ArchivoLocal } from '@/data/types';
import { colors, radius, type } from '@/theme';
import { Text } from './Texto';
import { Button, Ionicons, Small } from './ui';

/** Tamaño máximo del aval o la constancia. */
const MAX_MB = 10;

const peso = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`);

interface Props {
  value?: ArchivoLocal;
  onChange: (a: ArchivoLocal | undefined) => void;
  /** Ya hay un soporte enviado antes (p. ej. al registrarse). */
  yaEnviado?: boolean;
}

/** Elegir el aval o la constancia de inscripción (PDF o foto) para verificar la candidatura. */
export function SubirSoporte({ value, onChange, yaEnviado }: Props) {
  const [error, setError] = useState<string>();

  const elegir = async () => {
    setError(undefined);
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true, multiple: false });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    if (a.size && a.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo pesa más de ${MAX_MB} MB. Prueba con una foto o un PDF más liviano.`);
      return;
    }
    onChange({ uri: a.uri, nombre: a.name, tipo: a.mimeType ?? 'application/octet-stream', tamano: a.size });
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={type.label}>Aval o constancia de inscripción</Text>
      {value ? (
        <View style={s.archivo}>
          <Ionicons name={value.tipo.startsWith('image/') ? 'image' : 'document-text'} size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.nombre} numberOfLines={1}>{value.nombre}</Text>
            {value.tamano ? <Small>{peso(value.tamano)}</Small> : null}
          </View>
          <Button label="Cambiar" variant="ghost" size="md" onPress={elegir} />
        </View>
      ) : (
        <Button
          label={yaEnviado ? 'Cambiar el soporte enviado' : 'Elegir PDF o foto'}
          variant="secondary"
          icon="cloud-upload-outline"
          onPress={elegir}
        />
      )}
      {error ? <Small style={{ color: colors.dangerFg }}>{error}</Small> : null}
      <Small>
        {yaEnviado && !value
          ? 'Ya enviaste un soporte. Solo cámbialo si te piden uno nuevo.'
          : 'Lo revisa el equipo de verificación y no es público. Con él se activa la insignia de verificado.'}
      </Small>
    </View>
  );
}

const s = StyleSheet.create({
  archivo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 14, paddingVertical: 4, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  nombre: { fontSize: 15, fontWeight: '600', color: colors.ink },
});
