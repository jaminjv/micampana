/**
 * Contenido de prueba: candidatos, propuestas, eventos y publicaciones ficticios.
 * Las listas son mutables: repo.ts les agrega lo que se crea en la app mientras
 * no esté conectado Supabase (al recargar se reinicia).
 */
import type { Actividad, Aporte, Candidato, Compromiso, Evento, Propuesta, Publicacion } from './types';

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
    publicadaEl: haceHoras(72), editada: true, estado: 'publicada', lecturas: 340,
    versiones: [{ titulo: 'Pavimentar la vía principal de El Prado', resumen: 'Pavimentación de la vía principal del barrio.', guardadaEl: haceHoras(72) }],
  },
  {
    id: 'p2', candidato: 'k1', tema: 'Seguridad', titulo: 'Alumbrado y cámaras en la Comuna 1',
    resumen: 'Renovar el alumbrado público con luminarias LED y conectar cámaras al centro de monitoreo.',
    alcance: { nivel: 'comuna', ids: ['c1'], etiqueta: 'Comuna 1' },
    publicadaEl: haceHoras(120), editada: false, estado: 'publicada', lecturas: 512, versiones: [],
  },
  {
    id: 'p3', candidato: 'k1', tema: 'Empleo', titulo: 'Primer empleo para jóvenes',
    resumen: 'Convenios con empresas locales para que jóvenes de 18 a 28 años consigan su primer trabajo formal.',
    alcance: { nivel: 'municipio', ids: ['18001'], etiqueta: 'Florencia' },
    publicadaEl: haceHoras(200), editada: false, estado: 'publicada', lecturas: 1204, versiones: [],
  },
  {
    id: 'p4', candidato: 'k2', tema: 'Vías', titulo: 'Vías terciarias para sacar la cosecha',
    resumen: 'Mantenimiento de vías terciarias en los 16 municipios con maquinaria propia del departamento.',
    alcance: { nivel: 'departamento', ids: ['18'], etiqueta: 'Caquetá' },
    publicadaEl: haceHoras(30), editada: false, estado: 'publicada', lecturas: 2210, versiones: [],
  },
  {
    id: 'p5', candidato: 'k3', tema: 'Medio ambiente', titulo: 'Parques de bolsillo en los barrios',
    resumen: 'Recuperar lotes abandonados como parques pequeños con árboles nativos.',
    alcance: { nivel: 'municipio', ids: ['18001'], etiqueta: 'Florencia' },
    publicadaEl: haceHoras(50), editada: false, estado: 'publicada', lecturas: 187, versiones: [],
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

/** Aportes de ciudadanos. a1 y a2 son del ciudadano de prueba que usa la app. */
export const APORTES: Aporte[] = [
  { id: 'a1', candidato: 'k1', lugar: 'Barrio El Prado', tipo: 'idea', tema: 'Empleo', estado: 'respondido', fecha: haceHoras(96),
    texto: 'Ferias de empleo en los colegios para los que terminan el bachillerato.',
    respuesta: 'Gracias por la idea. La sumamos a la propuesta de primer empleo.' },
  { id: 'a2', candidato: 'k1', lugar: 'Barrio El Prado', tipo: 'solicitud', tema: 'Seguridad', estado: 'en_revision', fecha: haceHoras(48),
    texto: 'El alumbrado de la calle 8 lleva meses dañado.' },
  { id: 'a3', candidato: 'k1', lugar: 'Barrio San Luis', tipo: 'idea', tema: 'Empleo', estado: 'enviado', fecha: haceHoras(5),
    texto: 'Una plaza de mercado campesino los sábados en San Luis daría trabajo a muchas familias.' },
  { id: 'a4', candidato: 'k1', lugar: 'Barrio Centro', tipo: 'critica', tema: 'Otro', estado: 'enviado', fecha: haceHoras(20),
    texto: 'En el último evento no hubo sillas para los adultos mayores y muchos se tuvieron que ir.' },
  { id: 'a5', candidato: 'k1', lugar: 'Barrio Las Palmas', tipo: 'solicitud', tema: 'Vías', estado: 'enviado', fecha: haceHoras(30),
    texto: 'La calle 12 se inunda cada vez que llueve; necesitamos alcantarillado pluvial.' },
  { id: 'a6', candidato: 'k1', lugar: 'Barrio El Prado', tipo: 'consejo', tema: 'Educación', estado: 'enviado', fecha: haceHoras(60),
    texto: 'Hablen con los rectores antes de proponer cambios en los colegios; ellos conocen el problema.' },
];

const prado = { nivel: 'barrio' as const, ids: ['b-prado'], etiqueta: 'Barrio El Prado' };
const florencia = { nivel: 'municipio' as const, ids: ['18001'], etiqueta: 'Florencia' };

/** Agenda interna de la campaña de prueba (Laura Gómez). */
export const ACTIVIDADES: Actividad[] = [
  { id: 'v1', candidato: 'k1', tipo: 'medios', titulo: 'Entrevista en emisora local', fecha: enDias(0, 8), lugar: 'Radio Florencia',
    comunidad: florencia, responsable: 'Jefe de prensa', estado: 'programada' },
  { id: 'v2', candidato: 'k1', tipo: 'visita', titulo: 'Visita barrio El Prado', fecha: enDias(0, 11), lugar: 'Salón comunal',
    comunidad: prado, responsable: 'Líder comunal de El Prado', estado: 'programada', asistentesEsperados: 60 },
  { id: 'v3', candidato: 'k1', tipo: 'reunion', titulo: 'Reunión con coordinadores', fecha: enDias(0, 17), lugar: 'Sede de campaña',
    comunidad: florencia, estado: 'programada' },
  { id: 'v4', candidato: 'k1', tipo: 'visita', titulo: 'Recorrido por San Luis', fecha: enDias(3, 10), lugar: 'Parque de San Luis',
    comunidad: { nivel: 'barrio', ids: ['b-sanluis'], etiqueta: 'Barrio San Luis' }, responsable: 'Coordinador Comuna 2',
    estado: 'programada', asistentesEsperados: 40 },
  { id: 'v5', candidato: 'k1', tipo: 'visita', titulo: 'Visita barrio Centro', fecha: enDias(-4, 10), lugar: 'Plaza de mercado',
    comunidad: { nivel: 'barrio', ids: ['b-centro'], etiqueta: 'Barrio Centro' }, estado: 'realizada',
    asistentesEsperados: 50, asistentesReales: 72, notas: 'Piden alumbrado en la calle 8 y control de motos en la noche.' },
];

/** Compromisos de la campaña de prueba. */
export const COMPROMISOS: Compromiso[] = [
  { id: 'm1', candidato: 'k1', que: 'Renovar el alumbrado de la calle 8', conQuien: 'Junta de acción comunal del Centro',
    comunidad: { nivel: 'barrio', ids: ['b-centro'], etiqueta: 'Barrio Centro' }, estado: 'incluido', fecha: haceHoras(96),
    actividad: 'v5', propuesta: 'p2' },
  { id: 'm2', candidato: 'k1', que: 'Estudiar un plan de control de motos en horario nocturno', conQuien: 'Comerciantes de la plaza',
    comunidad: { nivel: 'barrio', ids: ['b-centro'], etiqueta: 'Barrio Centro' }, estado: 'en_estudio', fecha: haceHoras(96),
    actividad: 'v5' },
];
