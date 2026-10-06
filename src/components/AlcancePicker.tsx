import { View } from 'react-native';

import { CARGOS, municipiosDe, nombreDepartamento, nombreMunicipio, nombreZona, zonasDe } from '@/data/catalogos';
import type { Alcance, Candidato } from '@/data/types';
import { colors, type } from '@/theme';
import { ListPicker } from './ListPicker';
import { Chip, ChipRow, Segmented, Small } from './ui';
import { Text } from './Texto';

type Nivel = Alcance['nivel'];

/** Niveles que puede elegir el candidato según su cargo, del más amplio al más cercano. */
export function nivelesDeCampana(c: Candidato): Nivel[] {
  return CARGOS[c.cargo].ambito === 'departamento' ? ['departamento', 'municipio'] : ['municipio', 'comuna', 'barrio'];
}

function unir(nombres: string[]): string {
  if (nombres.length <= 1) return nombres[0] ?? '';
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/** Texto legible del territorio: "Barrios El Prado y Centro", "Comuna 1", "Florencia". */
export function etiquetaAlcance(nivel: Nivel, ids: string[]): string {
  if (nivel === 'departamento') return nombreDepartamento(ids[0] ?? '');
  if (nivel === 'municipio') return unir(ids.map(nombreMunicipio));
  if (nivel === 'comuna') return unir(ids.map(nombreZona));
  const nombres = ids.map(nombreZona);
  return `${nombres.length > 1 ? 'Barrios' : 'Barrio'} ${unir(nombres)}`;
}

/** El territorio completo de la campaña: todo el municipio o todo el departamento. */
export function alcanceCompleto(c: Candidato): Alcance {
  return CARGOS[c.cargo].ambito === 'departamento' || !c.municipio
    ? { nivel: 'departamento', ids: [c.departamento], etiqueta: nombreDepartamento(c.departamento) }
    : { nivel: 'municipio', ids: [c.municipio], etiqueta: nombreMunicipio(c.municipio) };
}

interface Props {
  campana: Candidato;
  value: Alcance;
  onChange: (a: Alcance) => void;
  /** Texto bajo el selector; recibe la etiqueta del territorio elegido. */
  ayuda?: (etiqueta: string) => string;
}

/**
 * "¿Para dónde es?": todo el territorio de la campaña o zonas específicas
 * (comunas y barrios en Alcaldía y Concejo; municipios en Gobernación y Asamblea).
 */
export function AlcancePicker({ campana, value, onChange, ayuda }: Props) {
  const niveles = nivelesDeCampana(campana);
  const departamental = CARGOS[campana.cargo].ambito === 'departamento';
  const mun = campana.municipio ?? '';

  const opciones = (n: Nivel) => {
    if (n === 'municipio' && departamental) return municipiosDe(campana.departamento).map((m) => ({ id: m.codigo, label: m.nombre }));
    if (n === 'comuna' || n === 'barrio') return zonasDe(mun, n).map((z) => ({ id: z.id, label: z.nombre }));
    return [];
  };

  const cambiarNivel = (n: Nivel) => {
    if (n === 'departamento' || (n === 'municipio' && !departamental)) return onChange(alcanceCompleto(campana));
    onChange({ nivel: n, ids: [], etiqueta: '' });
  };

  const alternar = (id: string) => {
    const ids = value.ids.includes(id) ? value.ids.filter((x) => x !== id) : [...value.ids, id];
    onChange({ nivel: value.nivel, ids, etiqueta: ids.length ? etiquetaAlcance(value.nivel, ids) : '' });
  };

  const etiquetaNivel = (n: Nivel) => {
    if (n === 'departamento') return 'Todo el departamento';
    if (n === 'municipio') return departamental ? 'Municipios' : 'Toda la ciudad';
    return n === 'comuna' ? 'Comunas' : 'Barrios';
  };

  const lista = opciones(value.nivel);
  const eligeZonas = value.nivel === 'comuna' || value.nivel === 'barrio' || (value.nivel === 'municipio' && departamental);

  return (
    <View style={{ gap: 8 }}>
      <Text style={type.label}>¿Para dónde es?</Text>
      <Segmented<Nivel> value={value.nivel} onChange={cambiarNivel} options={niveles.map((n) => ({ value: n, label: etiquetaNivel(n) }))} />
      {eligeZonas && lista.length === 0 ? (
        <Small>Tu municipio aún no tiene comunas ni barrios cargados. Por ahora elige toda la ciudad.</Small>
      ) : null}
      {eligeZonas && lista.length > 0 ? (
        value.nivel === 'municipio' ? (
          <ListPicker items={lista} selected={value.ids} onToggle={alternar} multiple searchPlaceholder="Buscar municipio" />
        ) : (
          <ChipRow>
            {lista.map((z) => <Chip key={z.id} label={z.label} selected={value.ids.includes(z.id)} onPress={() => alternar(z.id)} />)}
          </ChipRow>
        )
      ) : null}
      {value.etiqueta && ayuda ? <Small>{ayuda(value.etiqueta)}</Small> : null}
      {eligeZonas && value.ids.length === 0 && lista.length > 0 ? (
        <Small style={{ color: colors.warnFg }}>Elige al menos uno.</Small>
      ) : null}
    </View>
  );
}
