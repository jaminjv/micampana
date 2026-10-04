import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, TOUCH, type } from '@/theme';
import { Ionicons } from './ui';

export interface PickerItem {
  id: string;
  label: string;
  hint?: string;
  badge?: string;
}

interface Props {
  items: PickerItem[];
  selected: string[];
  onToggle: (id: string) => void;
  multiple?: boolean;
  searchPlaceholder?: string;
  maxVisible?: number;
}

/** Lista con buscador para elegir una o varias opciones (partidos, municipios, barrios). */
export function ListPicker({ items, selected, onToggle, multiple, searchPlaceholder = 'Buscar', maxVisible = 8 }: Props) {
  const [q, setQ] = useState('');
  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    const filtrados = t ? items.filter((i) => i.label.toLowerCase().includes(t)) : items;
    return filtrados.slice(0, maxVisible);
  }, [items, q, maxVisible]);
  const ocultos = items.length - visibles.length;

  return (
    <View style={{ gap: 10 }}>
      {items.length > 6 ? (
        <View style={s.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.faint}
            accessibilityLabel={searchPlaceholder}
            style={s.searchInput}
          />
        </View>
      ) : null}
      <View style={s.list}>
        {visibles.map((item, i) => {
          const on = selected.includes(item.id);
          return (
            <Pressable
              key={item.id}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: on }}
              onPress={() => onToggle(item.id)}
              style={[s.row, i > 0 && s.rowBorder]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.body, { color: colors.ink }, on && { fontWeight: '600' }]}>{item.label}</Text>
                {item.hint ? <Text style={type.small}>{item.hint}</Text> : null}
              </View>
              {item.badge ? <Text style={s.badge}>{item.badge}</Text> : null}
              <View style={[multiple ? s.check : s.radio, on && (multiple ? s.checkOn : s.radioOn)]}>
                {on && multiple ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
              </View>
            </Pressable>
          );
        })}
        {visibles.length === 0 ? <Text style={[type.small, { padding: 14 }]}>Sin resultados para “{q}”.</Text> : null}
      </View>
      {ocultos > 0 && !q ? <Text style={type.small}>{`Y ${ocultos} más. Usa el buscador.`}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, backgroundColor: colors.surface },
  searchInput: { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 10 },
  list: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH + 8, paddingHorizontal: 14, paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  badge: { fontSize: 12, fontWeight: '600', color: colors.primary, backgroundColor: colors.primaryTint, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, overflow: 'hidden' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.faint },
  radioOn: { borderWidth: 7, borderColor: colors.primary },
  check: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
