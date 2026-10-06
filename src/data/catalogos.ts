/**
 * Catálogos de referencia.
 *
 * IMPORTANTE: estos datos son de prueba para desarrollar sin conexión.
 * - Partidos: en producción se cargan del registro oficial de organizaciones
 *   políticas con personería jurídica vigente del Consejo Nacional Electoral (CNE),
 *   y el administrador los actualiza (tabla `partidos`).
 * - Departamentos y municipios: en producción se cargan completos de la
 *   DIVIPOLA del DANE (tablas `departamentos` y `municipios`).
 * - Comunas, corregimientos, barrios y veredas varían por municipio; el candidato
 *   puede completarlos o ajustarlos (tabla `zonas`).
 */
import type { Departamento, EstadoCompromiso, Municipio, Partido, Tema, TipoActividad, Zona } from './types';

export const PARTIDOS: Partido[] = [
  { id: 'liberal', nombre: 'Partido Liberal Colombiano' },
  { id: 'conservador', nombre: 'Partido Conservador Colombiano' },
  { id: 'cd', nombre: 'Partido Centro Democrático' },
  { id: 'cambio', nombre: 'Partido Cambio Radical' },
  { id: 'u', nombre: 'Partido de la U' },
  { id: 'verde', nombre: 'Partido Alianza Verde' },
  { id: 'pacto', nombre: 'Pacto Histórico' },
  { id: 'nuevolib', nombre: 'Partido Nuevo Liberalismo' },
  { id: 'comunes', nombre: 'Partido Comunes' },
  { id: 'enmarcha', nombre: 'Partido En Marcha' },
  { id: 'oxigeno', nombre: 'Partido Oxígeno' },
  { id: 'ecologista', nombre: 'Partido Ecologista Colombiano' },
  { id: 'cjl', nombre: 'Partido Colombia Justa Libres' },
  { id: 'mais', nombre: 'Movimiento Alternativo Indígena y Social', sigla: 'MAIS' },
  { id: 'aico', nombre: 'Movimiento Autoridades Indígenas de Colombia', sigla: 'AICO' },
];

export const DEPARTAMENTOS: Departamento[] = [
  { codigo: '18', nombre: 'Caquetá' },
  { codigo: '41', nombre: 'Huila' },
  { codigo: '86', nombre: 'Putumayo' },
  { codigo: '11', nombre: 'Bogotá D.C.' },
];

const CAQUETA = [
  'Florencia', 'Albania', 'Belén de los Andaquíes', 'Cartagena del Chairá', 'Curillo',
  'El Doncello', 'El Paujil', 'La Montañita', 'Milán', 'Morelia', 'Puerto Rico',
  'San José del Fragua', 'San Vicente del Caguán', 'Solano', 'Solita', 'Valparaíso',
];

export const MUNICIPIOS: Municipio[] = [
  ...CAQUETA.map((nombre, i) => ({
    codigo: `18${String(i + 1).padStart(3, '0')}`,
    nombre,
    departamento: '18',
    capital: nombre === 'Florencia',
  })),
  { codigo: '41001', nombre: 'Neiva', departamento: '41', capital: true },
  { codigo: '41551', nombre: 'Pitalito', departamento: '41' },
  { codigo: '86001', nombre: 'Mocoa', departamento: '86', capital: true },
  { codigo: '11001', nombre: 'Bogotá D.C.', departamento: '11', capital: true },
];

/** Zonas de prueba para Florencia. */
export const ZONAS: Zona[] = [
  { id: 'c1', nombre: 'Comuna 1', tipo: 'comuna', municipio: '18001' },
  { id: 'c2', nombre: 'Comuna 2', tipo: 'comuna', municipio: '18001' },
  { id: 'c3', nombre: 'Comuna 3', tipo: 'comuna', municipio: '18001' },
  { id: 'c4', nombre: 'Comuna 4', tipo: 'comuna', municipio: '18001' },
  { id: 'b-prado', nombre: 'El Prado', tipo: 'barrio', municipio: '18001', padre: 'c1' },
  { id: 'b-centro', nombre: 'Centro', tipo: 'barrio', municipio: '18001', padre: 'c1' },
  { id: 'b-sanluis', nombre: 'San Luis', tipo: 'barrio', municipio: '18001', padre: 'c2' },
  { id: 'b-palmas', nombre: 'Las Palmas', tipo: 'barrio', municipio: '18001', padre: 'c3' },
];

export const TEMAS: Tema[] = ['Empleo', 'Vías', 'Salud', 'Seguridad', 'Educación', 'Medio ambiente', 'Otro'];

export const CARGOS = {
  gobernacion: {
    nombre: 'Gobernación',
    descripcion: 'Todo el departamento, por municipios',
    ambito: 'departamento',
    corporacion: false,
  },
  asamblea: {
    nombre: 'Asamblea departamental',
    descripcion: 'Departamento · candidatura en lista de partido',
    ambito: 'departamento',
    corporacion: true,
  },
  alcaldia: {
    nombre: 'Alcaldía',
    descripcion: 'Un municipio, por comunas y corregimientos',
    ambito: 'municipio',
    corporacion: false,
  },
  concejo: {
    nombre: 'Concejo municipal',
    descripcion: 'Municipio · candidatura en lista de partido',
    ambito: 'municipio',
    corporacion: true,
  },
} as const;

export const nombrePartido = (id: string) => PARTIDOS.find((p) => p.id === id)?.nombre ?? id;
export const nombreDepartamento = (c: string) => DEPARTAMENTOS.find((d) => d.codigo === c)?.nombre ?? c;
export const nombreMunicipio = (c: string) => MUNICIPIOS.find((m) => m.codigo === c)?.nombre ?? c;
export const municipiosDe = (dep: string) => MUNICIPIOS.filter((m) => m.departamento === dep);
export const zonasDe = (mun: string, tipo: Zona['tipo'], padre?: string) =>
  ZONAS.filter((z) => z.municipio === mun && z.tipo === tipo && (padre ? z.padre === padre : true));
export const nombreZona = (id?: string) => ZONAS.find((z) => z.id === id)?.nombre ?? '';

export const TIPOS_ACTIVIDAD: Record<TipoActividad, string> = {
  visita: 'Visita',
  evento: 'Evento',
  reunion: 'Reunión',
  debate: 'Debate',
  caravana: 'Caravana',
  medios: 'Medios',
  otro: 'Otro',
};

export const ESTADOS_COMPROMISO: Record<EstadoCompromiso, { label: string; tone: 'neutral' | 'primary' | 'ok' | 'warn' }> = {
  registrado: { label: 'Registrado', tone: 'neutral' },
  en_estudio: { label: 'En estudio', tone: 'primary' },
  incluido: { label: 'En el programa', tone: 'ok' },
  descartado: { label: 'Descartado', tone: 'warn' },
};
