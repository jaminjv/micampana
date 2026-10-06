import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius } from '@/theme';
import { Button, CheckRow, Ionicons, type IconName } from './ui';
import { Text } from './Texto';

interface Props {
  visible: boolean;
  /** "publicar" una propuesta nueva o "corregir" una ya publicada. */
  modo: 'publicar' | 'corregir';
  territorio: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Advertencia obligatoria antes de publicar o corregir una propuesta.
 * Sin marcar la casilla, el botón no se activa.
 */
export function AvisoPermanencia({ visible, modo, territorio, onConfirmar, onCancelar }: Props) {
  const [entiendo, setEntiendo] = useState(false);
  useEffect(() => {
    if (visible) setEntiendo(false);
  }, [visible]);

  const corrigiendo = modo === 'corregir';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancelar}>
      <Pressable style={s.fondo} onPress={onCancelar} accessibilityLabel="Cerrar advertencia" />
      <SafeAreaView edges={['bottom']} style={s.hoja} accessibilityViewIsModal>
        <View style={s.asa} />
        <View style={s.icono}>
          <Ionicons name="lock-closed" size={26} color={colors.warnFg} />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={s.titulo} accessibilityRole="header">
            {corrigiendo ? 'La corrección quedará a la vista' : 'Esta propuesta será permanente'}
          </Text>
          <Text style={s.texto}>
            {corrigiendo
              ? 'Los ciudadanos verán que la propuesta fue editada y podrán leer la versión anterior.'
              : `Al publicarla, los ciudadanos de ${territorio} la verán en tu perfil. Revísala bien antes de continuar.`}
          </Text>
        </View>
        <View style={s.reglas}>
          <Regla icon="close" color={colors.dangerFg}>
            <Text style={{ fontWeight: '700' }}>No podrás borrarla</Text>, ni durante ni después de la campaña.
          </Regla>
          <Regla icon="create-outline" color={colors.warnFg}>
            Si la corriges, quedará marcada como <Text style={{ fontWeight: '700' }}>Editada</Text> y se verá la versión anterior.
          </Regla>
          <Regla icon="remove-circle-outline" color={colors.muted}>
            Si cambias de posición, podrás marcarla como <Text style={{ fontWeight: '700' }}>Retirada</Text> con una explicación pública.
          </Regla>
        </View>
        <CheckRow checked={entiendo} onToggle={() => setEntiendo((v) => !v)}>
          <Text style={s.check}>
            {corrigiendo
              ? 'Entiendo que la versión anterior seguirá visible para los ciudadanos.'
              : 'Entiendo que esta propuesta quedará publicada de forma permanente.'}
          </Text>
        </CheckRow>
        <View style={{ gap: 10 }}>
          <Button label={corrigiendo ? 'Guardar corrección' : 'Publicar'} disabled={!entiendo} onPress={onConfirmar} />
          <Button label="Revisar de nuevo" variant="secondary" onPress={onCancelar} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Regla({ icon, color, children }: { icon: IconName; color: string; children: ReactNode }) {
  return (
    <View style={s.regla}>
      <Ionicons name={icon} size={18} color={color} style={{ marginTop: 1 }} />
      <Text style={s.reglaTexto}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(20,24,31,0.55)' },
  hoja: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, gap: 18 },
  asa: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.inputBorder },
  icono: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.warnBg, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 22, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  texto: { fontSize: 15, lineHeight: 22, color: colors.inkSoft },
  reglas: { gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.background },
  regla: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  reglaTexto: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.ink },
  check: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: colors.ink },
});
