import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { diaCorto, horaTexto } from '@/lib/fechas';
import { colors, type } from '@/theme';
import { Text } from './Texto';
import { Chip, Small } from './ui';

const HORAS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

/** Los próximos `n` días, a medianoche. */
function proximosDias(n: number): Date[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => new Date(hoy.getTime() + i * 86400_000));
}

function etiquetaDia(d: Date, i: number): string {
  if (i === 0) return 'Hoy';
  if (i === 1) return 'Mañana';
  const { dia, num } = diaCorto(d.toISOString());
  return `${dia.charAt(0)}${dia.slice(1).toLowerCase()} ${num}`;
}

const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();

interface Props {
  /** Fecha y hora elegidas (ISO), o undefined si falta alguna. */
  value?: string;
  onChange: (iso: string | undefined) => void;
  dias?: number;
  /** Avisa si la hora elegida ya pasó. */
  soloFuturo?: boolean;
}

/** Día (próximos días en fichas) y hora en punto. */
export function SelectorFecha({ value, onChange, dias = 21, soloFuturo = true }: Props) {
  const lista = useMemo(() => proximosDias(dias), [dias]);
  const elegida = value ? new Date(value) : undefined;
  const iDia = elegida ? lista.findIndex((d) => mismoDia(d, elegida)) : -1;
  const hora = elegida?.getHours();
  // El día queda guardado aunque falte la hora: se usa el minuto 1 como marca de "sin hora".
  const sinHora = elegida?.getMinutes() === 1;

  const elegir = (i: number, h?: number) => {
    const f = new Date(lista[i]);
    if (h === undefined) f.setHours(0, 1, 0, 0);
    else f.setHours(h, 0, 0, 0);
    onChange(f.toISOString());
  };

  const pasada = !!elegida && !sinHora && soloFuturo && elegida.getTime() < Date.now();

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 8 }}>
        <Text style={type.label}>Día</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {lista.map((d, i) => (
            <Chip key={i} label={etiquetaDia(d, i)} selected={iDia === i} onPress={() => elegir(i, sinHora ? undefined : hora)} />
          ))}
        </ScrollView>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={type.label}>Hora</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {HORAS.map((h) => {
            const f = new Date();
            f.setHours(h, 0, 0, 0);
            return (
              <Chip
                key={h}
                label={horaTexto(f.toISOString())}
                selected={!sinHora && hora === h && iDia >= 0}
                onPress={() => elegir(iDia >= 0 ? iDia : 0, h)}
              />
            );
          })}
        </ScrollView>
        {pasada ? <Small style={{ color: colors.warnFg }}>Esa hora ya pasó. Elige una más tarde.</Small> : null}
      </View>
    </View>
  );
}

/** ¿La fecha del selector está completa (día y hora) y, si se pide, es futura? */
export function fechaCompleta(iso: string | undefined, soloFuturo = true): iso is string {
  if (!iso) return false;
  const f = new Date(iso);
  if (f.getMinutes() === 1) return false;
  return !soloFuturo || f.getTime() > Date.now();
}
