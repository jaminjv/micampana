/**
 * Text y TextInput con la tipografía de la marca (Outfit). Se usan en lugar de
 * los de react-native: convierten el fontWeight en la familia de Outfit de ese
 * peso, porque en Android cada peso es una fuente distinta.
 */
import { createContext, useContext } from 'react';
import {
  StyleSheet, Text as RNText, TextInput as RNTextInput,
  type StyleProp, type TextInputProps, type TextProps, type TextStyle,
} from 'react-native';

import { familiaPara } from '@/theme';

/** Un texto dentro de otro hereda la fuente si no pide un peso propio. */
const DentroDeTexto = createContext(false);

function conFuente(style: StyleProp<TextStyle>, heredar: boolean): StyleProp<TextStyle> {
  const plano = StyleSheet.flatten(style) ?? {};
  if (plano.fontFamily || (heredar && plano.fontWeight === undefined)) return style;
  return [style, { fontFamily: familiaPara(plano.fontWeight), fontWeight: 'normal' }];
}

export function Text({ style, ...props }: TextProps) {
  const dentro = useContext(DentroDeTexto);
  return (
    <DentroDeTexto.Provider value>
      <RNText {...props} style={conFuente(style, dentro)} />
    </DentroDeTexto.Provider>
  );
}

export function TextInput({ style, ...props }: TextInputProps) {
  return <RNTextInput {...props} style={conFuente(style, false)} />;
}
