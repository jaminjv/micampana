/** Contenido de prueba: candidatos, propuestas, eventos y publicaciones ficticios. */
import type { Aporte, Candidato, Evento, Propuesta, Publicacion } from './types';

export const CANDIDATOS: Candidato[] = [
  {
    id: 'k1', usuario: 'lauragomez', nombre: 'Laura Gómez', etapa: 'candidato', verificado: true,
    cargo: 'alcaldia', departamento: '18', municipio: '18001',
    tipoAval: 'partido', partidos: ['liberal'], seguidores: 1240,
  },
  {
    id: 'k2', usuario: 'andresrojas', nombre: 'Andrés Rojas', etapa: 'candidato', verificado: true,
    cargo: 'gobernacion', departamento: '18',
    tipoAval: 'coalicion', partidos: ['u', 'conservador'], seguidores: 3410,
  },
  {
    id: 'k3', usuario: 'martavalencia', nombre: 'Marta Valencia', etapa: 'candidato', verificado: false,
    cargo: 'concejo', departamento: '18', municipio: '18001',
    tipoAval: 'partido', partidos: ['verde'], tipoLista: 'preferente', numero: 7, seguidores: 512,
  },
  {
    id: 'k4', usuario: 'juliancastro', nombre: 'Julián Castro', etapa: 'candidato', verificado: true,
    cargo: 'asamblea', departamento: '18',
    tipoAval: 'partido', partidos: ['cd'], tipoLista: 'preferente', numero: 3, seguidores: 860,
  },
  {
    id: 'k5', usuario: 'sofiaortiz', nombre: 'Sofía Ortiz', etapa: 'aspirante', verificado: false,
    cargo: 'alcaldia', departamento: '18', municipio: '18001',
    partidos: [], seguidores: 318,
  },
];

const ahora = Date.now();
const haceHoras = (h: number) => new Date(ahora - h * 3600_000).toISOString();
const enDias = (d: number, hora = 10) => {
  const f = new Date(ahora + d * 86400_000);
  f.setHours(hora, 0, 0, 0);
  return f.toISOString();
};

export const PROPUESTAS: Propuesta[] = [
  {
    id: 'p1', candidato: 'k1', tema: 'Vías', titulo: 'Pavimentar la vía principal de El Prado',
    resumen: 'Pavimentación completa de la vía principal y andenes accesibles, priorizada con la junta de acción comunal.',
    alcance: { nivel: 'barrio', ids: ['b-prado'], etiqueta: 'Barrio El Prado' },
    publicadaEl: haceHoras(72), editada: true,
  },
  {
    id: 'p2', candidato: 'k1', tema: 'Seguridad', titulo: 'Alumbrado y cámaras en la Comuna 1',
    resumen: 'Renovar el alumbrado público con luminarias LED y conectar cámaras al centro de monitoreo.',
    alcance: { nivel: 'comuna', ids: ['c1'], etiqueta: 'Comuna 1' },
    publicadaEl: haceHoras(120), editada: false,
  },
  {
    id: 'p3', candidato: 'k1', tema: 'Empleo', titulo: 'Primer empleo para jóvenes',
    resumen: 'Convenios con empresas locales para que jóvenes de 18 a 28 años consigan su primer trabajo formal.',
    alcance: { nivel: 'municipio', ids: ['18001'], etiqueta: 'Florencia' },
    publicadaEl: haceHoras(200), editada: false,
  },
  {
    id: 'p4', candidato: 'k2', tema: 'Vías', titulo: 'Vías terciarias para sacar la cosecha',
    resumen: 'Mantenimiento de vías terciarias en los 16 municipios con maquinaria propia del departamento.',
    alcance: { nivel: 'departamento', ids: ['18'], etiqueta: 'Caquetá' },
    publicadaEl: haceHoras(30), editada: false,
  },
  {
    id: 'p5', candidato: 'k3', tema: 'Medio ambiente', titulo: 'Parques de bolsillo en los barrios',
    resumen: 'Recuperar lotes abandonados como parques pequeños con árboles nativos.',
    alcance: { nivel: 'municipio', ids: ['18001'], etiqueta: 'Florencia' },
    publicadaEl: haceHoras(50), editada: false,
  },
];

export const EVENTOS: Evento[] = [
  {
    id: 'e1', candidato: 'k1', titulo: 'Encuentro con la comunidad',
    fecha: enDias(2, 10), lugar: 'Salón comunal El Prado',
    alcance: { nivel: 'barrio', ids: ['b-prado'], etiqueta: 'Barrio El Prado' },
  },
  {
    id: 'e2', candidato: 'k2', titulo: 'Foro de campesinos del Caquetá',
    fecha: enDias(5, 15), lugar: 'Coliseo de Florencia',
    alcance: { nivel: 'departamento', ids: ['18'], etiqueta: 'Caquetá' },
  },
];

export const PUBLICACIONES: Publicacion[] = [
  { id: 'f1', tipo: 'evento', candidato: 'k1', evento: 'e1', conPieza: true, fecha: haceHoras(2),
    texto: 'Nos vemos en El Prado para hablar de la vía principal y del alumbrado. ¡Te espero!' },
  { id: 'f2', tipo: 'propuesta', candidato: 'k2', propuesta: 'p4', fecha: haceHoras(30) },
  { id: 'f3', tipo: 'mensaje', candidato: 'k3', fecha: haceHoras(40),
    texto: 'Gracias a quienes nos escribieron sobre los parques. Ya incluimos sus ideas en nuestra propuesta.' },
  { id: 'f4', tipo: 'evento', candidato: 'k2', evento: 'e2', conPieza: true, fecha: haceHoras(52),
    texto: 'Invitamos a campesinos y productores a construir juntos el plan para el campo.' },
  { id: 'f5', tipo: 'propuesta', candidato: 'k1', propuesta: 'p1', fecha: haceHoras(72) },
];

export const APORTES_INICIALES: Aporte[] = [
  { id: 'a1', candidato: 'k1', tipo: 'idea', tema: 'Empleo', estado: 'respondido', fecha: haceHoras(96),
    texto: 'Ferias de empleo en los colegios para los que terminan el bachillerato.',
    respuesta: 'Gracias por la idea. La sumamos a la propuesta de primer empleo.' },
  { id: 'a2', candidato: 'k1', tipo: 'solicitud', tema: 'Seguridad', estado: 'en_revision', fecha: haceHoras(48),
    texto: 'El alumbrado de la calle 8 lleva meses dañado.' },
];
