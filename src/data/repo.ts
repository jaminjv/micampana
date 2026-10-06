/**
 * Capa de acceso a datos. Hoy lee y escribe los datos de prueba en memoria;
 * cuando se configure Supabase, estas funciones se reemplazan por consultas
 * sin cambiar las pantallas.
 * Las reglas de visibilidad por territorio viven aquí para que sean una sola.
 */
import { useSyncExternalStore } from 'react';

import { CARGOS, municipiosDe, nombreDepartamento, nombreMunicipio, nombrePartido, ZONAS, zonasDe } from './catalogos';
import {
  ACTIVIDADES, APORTES, CANDIDATOS, COLABORADORES, COMPROMISOS, EVENTOS, INVITACIONES, MIEMBROS, PROPUESTAS, PUBLICACIONES,
  SOLICITUDES_VISITA, TAREAS,
} from './mock';
import * as remoto from './remoto';
import type {
  Actividad, Alcance, Aporte, ArchivoLocal, Colaborador, EstadoColaborador, Invitacion, Miembro, ReporteTarea, RolEquipo,
  SolicitudVisita, Tarea, Compromiso, EstadoCompromiso, Candidato, Cargo, Etapa, Evento, ModoUso, Propuesta, Publicacion, Tema, TipoAporte, TipoAval,
  TipoLista, Ubicacion,
} from './types';

/* ---------- Aviso de cambios ---------- */

let version = 0;
const oyentes = new Set<() => void>();

function avisar() {
  version++;
  oyentes.forEach((f) => f());
}

const suscribir = (f: () => void) => {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
};

/**
 * Vuelve a dibujar la pantalla cuando cambian los datos (p. ej. al publicar).
 * Por esto el React Compiler está apagado en app.json: guardaría en memoria
 * las consultas a estos datos mutables y no vería los cambios.
 */
export function useDatos(): number {
  return useSyncExternalStore(suscribir, () => version);
}

/** Id nuevo en formato UUID, el que usa la base de datos. */
const nuevoId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

/** ¿Un alcance territorial incluye la ubicación del ciudadano? */
export function alcanzaA(alcance: Alcance, ub: Ubicacion): boolean {
  switch (alcance.nivel) {
    case 'departamento':
      return alcance.ids.includes(ub.departamento);
    case 'municipio':
      return alcance.ids.includes(ub.municipio);
    case 'comuna':
      return !!ub.comuna && alcance.ids.includes(ub.comuna);
    case 'barrio':
      return !!ub.barrio && alcance.ids.includes(ub.barrio);
  }
}

/** ¿El candidato compite en la región del ciudadano? */
export function candidatoEnRegion(c: Candidato, ub: Ubicacion): boolean {
  if (c.departamento !== ub.departamento) return false;
  return !c.municipio || c.municipio === ub.municipio;
}

export const getCandidato = (id: string) => CANDIDATOS.find((c) => c.id === id);
export const getCandidatoPorUsuario = (u: string) =>
  CANDIDATOS.find((c) => c.usuario.toLowerCase() === u.replace(/^@/, '').toLowerCase());
export const getPropuesta = (id: string) => PROPUESTAS.find((p) => p.id === id);
export const getEvento = (id: string) => EVENTOS.find((e) => e.id === id);
export const getAporte = (id: string) => APORTES.find((a) => a.id === id);
export const usuarioOcupado = (usuario: string, salvo?: string) =>
  CANDIDATOS.some((c) => c.usuario === usuario && c.id !== salvo);

/** Texto del cargo con su territorio: "Alcaldía de Florencia". */
export function cargoConTerritorio(c: Candidato): string {
  const lugar = c.municipio ? nombreMunicipio(c.municipio) : nombreDepartamento(c.departamento);
  const pre: Record<Cargo, string> = {
    gobernacion: 'Gobernación del',
    asamblea: 'Asamblea del',
    alcaldia: 'Alcaldía de',
    concejo: 'Concejo de',
  };
  return `${pre[c.cargo]} ${lugar}`;
}

/** Texto del aval: partido, coalición o grupo significativo. */
export function textoAval(c: Candidato): string {
  if (c.etapa === 'aspirante' && c.partidos.length === 0) return 'Aspirante · sin aval aún';
  if (c.tipoAval === 'firmas') return c.grupoSignificativo ?? 'Grupo significativo de ciudadanos';
  if (c.tipoAval === 'coalicion') {
    return 'Coalición ' + c.partidos.map((p) => nombrePartido(p).replace(/^Partido /, '')).join(' y ');
  }
  return c.partidos[0] ? nombrePartido(c.partidos[0]) : '';
}

export type FiltroFeed = 'todos' | 'siguiendo' | 'eventos' | 'propuestas';

/**
 * Feed del ciudadano: solo candidatos de su región y solo publicaciones cuyo
 * alcance lo incluye. Orden estrictamente cronológico: nadie paga por salir primero.
 */
export function feedPara(ub: Ubicacion, filtro: FiltroFeed, siguiendo: string[]): Publicacion[] {
  return PUBLICACIONES.filter((pub) => {
    const c = getCandidato(pub.candidato);
    if (!c || c.etapa !== 'candidato' || !candidatoEnRegion(c, ub)) return false;
    if (filtro === 'siguiendo' && !siguiendo.includes(c.id)) return false;
    if (filtro === 'eventos' && pub.tipo !== 'evento') return false;
    if (filtro === 'propuestas' && pub.tipo !== 'propuesta') return false;
    if (pub.tipo === 'evento') {
      const e = getEvento(pub.evento);
      return !!e && alcanzaA(e.alcance, ub);
    }
    if (pub.tipo === 'propuesta') {
      const p = getPropuesta(pub.propuesta);
      return !!p && p.estado !== 'borrador' && alcanzaA(p.alcance, ub);
    }
    return !pub.alcance || alcanzaA(pub.alcance, ub);
  }).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export interface FiltrosBusqueda {
  texto: string;
  soloMiRegion: boolean;
  cargo?: Cargo;
  partido?: string;
}

/** Búsqueda de candidatos. El filtro de partido incluye las coaliciones de ese partido. */
export function buscarCandidatos(f: FiltrosBusqueda, ub?: Ubicacion): Candidato[] {
  const q = f.texto.trim().replace(/^@/, '').toLowerCase();
  return CANDIDATOS.filter((c) => {
    if (q && !c.nombre.toLowerCase().includes(q) && !c.usuario.toLowerCase().includes(q)) return false;
    if (f.soloMiRegion && ub && !candidatoEnRegion(c, ub)) return false;
    if (f.cargo && c.cargo !== f.cargo) return false;
    if (f.partido && !c.partidos.includes(f.partido)) return false;
    return true;
  }).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export type NivelPropuesta = Alcance['nivel'];

/** Niveles de "¿Qué propone para ti?" según el cargo. */
export function nivelesPara(cargo: Cargo): NivelPropuesta[] {
  return CARGOS[cargo].ambito === 'departamento' ? ['municipio', 'departamento'] : ['barrio', 'comuna', 'municipio'];
}

export function propuestasDe(candidato: string, nivel: NivelPropuesta, ub?: Ubicacion): Propuesta[] {
  return PROPUESTAS.filter((p) => {
    if (p.candidato !== candidato || p.estado === 'borrador' || p.alcance.nivel !== nivel) return false;
    return ub ? alcanzaA(p.alcance, ub) : true;
  }).sort((a, b) => b.publicadaEl.localeCompare(a.publicadaEl));
}

export function eventosDe(candidato: string): Evento[] {
  return EVENTOS.filter((e) => e.candidato === candidato).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/* ---------- Campaña del aspirante o candidato ---------- */

export interface DatosCampana {
  nombre: string;
  usuario: string;
  etapa: Etapa;
  cargo: Cargo;
  departamento: string;
  municipio?: string;
  tipoAval?: TipoAval;
  partidos: string[];
  grupoSignificativo?: string;
  tipoLista?: TipoLista;
  numero?: number;
  modo?: ModoUso;
}

/**
 * Crea la campaña o actualiza la existente (p. ej. al pasar de aspirante a
 * candidato). Conserva el id, el @usuario y los seguidores. Devuelve el id.
 */
export function guardarCampana(d: DatosCampana, id?: string, soporte?: ArchivoLocal): string {
  const actual = id ? getCandidato(id) : undefined;
  const corporacion = CARGOS[d.cargo].corporacion;
  const datos: Candidato = {
    id: actual?.id ?? nuevoId(),
    usuario: actual?.usuario ?? d.usuario,
    nombre: d.nombre,
    etapa: d.etapa,
    verificado: actual?.verificado ?? false,
    cargo: d.cargo,
    departamento: d.departamento,
    municipio: CARGOS[d.cargo].ambito === 'municipio' ? d.municipio : undefined,
    tipoAval: d.etapa === 'candidato' ? d.tipoAval : undefined,
    partidos: d.tipoAval === 'firmas' ? [] : d.partidos,
    grupoSignificativo: d.tipoAval === 'firmas' ? d.grupoSignificativo : undefined,
    tipoLista: corporacion ? d.tipoLista : undefined,
    numero: corporacion ? d.numero : undefined,
    seguidores: actual?.seguidores ?? 0,
    modo: d.modo,
    // Un soporte nuevo reemplaza al anterior; si no hay, se conserva el que ya estaba.
    soporte: soporte ? (remoto.conectado ? remoto.rutaSoporte(soporte.nombre) : soporte.nombre) : actual?.soporte,
  };
  if (actual) Object.assign(actual, datos);
  else CANDIDATOS.push(datos);
  remoto.guardarCampana(datos, soporte);
  avisar();
  return datos.id;
}

/* ---------- Propuestas (lado candidato) ---------- */

/** Todas las propuestas de una campaña, incluidos borradores y retiradas. */
export function propuestasDeCampana(candidato: string): Propuesta[] {
  return PROPUESTAS.filter((p) => p.candidato === candidato).sort((a, b) => b.publicadaEl.localeCompare(a.publicadaEl));
}

export interface DatosPropuesta {
  titulo: string;
  resumen: string;
  tema: Tema;
  alcance: Alcance;
}

/** Guarda una propuesta nueva como borrador. Devuelve su id. */
export function crearBorrador(candidato: string, d: DatosPropuesta): string {
  const p: Propuesta = {
    id: nuevoId(), candidato, ...d, estado: 'borrador', publicadaEl: new Date().toISOString(),
    editada: false, versiones: [], lecturas: 0,
  };
  PROPUESTAS.push(p);
  remoto.crearBorrador(p);
  avisar();
  return p.id;
}

/** Cambia un borrador. Una propuesta publicada se corrige con corregirPropuesta. */
export function editarBorrador(id: string, d: DatosPropuesta) {
  const p = getPropuesta(id);
  if (!p || p.estado !== 'borrador') throw new Error('Solo se puede editar libremente un borrador.');
  Object.assign(p, d);
  remoto.editarBorrador(p);
  avisar();
}

/**
 * Publica un borrador. Exige que el candidato haya aceptado la advertencia de
 * permanencia (la base de datos aplica la misma regla). También lo anuncia en el feed.
 */
export function publicarPropuesta(id: string, aceptoPermanencia: boolean) {
  const p = getPropuesta(id);
  if (!p || p.estado !== 'borrador') return;
  if (!aceptoPermanencia) throw new Error('Hay que aceptar la advertencia de permanencia.');
  const ahora = new Date().toISOString();
  p.estado = 'publicada';
  p.publicadaEl = ahora;
  const pub = nuevoId();
  PUBLICACIONES.push({ id: pub, tipo: 'propuesta', candidato: p.candidato, propuesta: p.id, fecha: ahora });
  remoto.publicarPropuesta(p, pub);
  avisar();
}

/**
 * Corrige una propuesta publicada: guarda la versión anterior y la marca como
 * "Editada". El tema y el territorio no cambian.
 */
export function corregirPropuesta(id: string, titulo: string, resumen: string, aceptoPermanencia: boolean) {
  const p = getPropuesta(id);
  if (!p || p.estado !== 'publicada') return;
  if (!aceptoPermanencia) throw new Error('Hay que aceptar la advertencia de permanencia.');
  if (p.titulo === titulo && p.resumen === resumen) return;
  p.versiones.push({ titulo: p.titulo, resumen: p.resumen, guardadaEl: new Date().toISOString() });
  p.titulo = titulo;
  p.resumen = resumen;
  p.editada = true;
  remoto.corregirPropuesta(p);
  avisar();
}

/** Marca una propuesta publicada como retirada, con una explicación pública. No se borra. */
export function retirarPropuesta(id: string, motivo: string) {
  const p = getPropuesta(id);
  if (!p || p.estado !== 'publicada') return;
  p.estado = 'retirada';
  p.retirada = { motivo, fecha: new Date().toISOString() };
  remoto.retirarPropuesta(p);
  avisar();
}

/** Solo se pueden borrar borradores: lo publicado es permanente. */
export function borrarBorrador(id: string) {
  const i = PROPUESTAS.findIndex((p) => p.id === id && p.estado === 'borrador');
  if (i < 0) return;
  PROPUESTAS.splice(i, 1);
  remoto.borrarBorrador(id);
  avisar();
}

/** Suma una lectura a cada propuesta que un ciudadano vio en un perfil. */
export function contarLecturas(ids: string[]) {
  ids.forEach((id) => {
    const p = getPropuesta(id);
    if (p) p.lecturas++;
  });
  remoto.contarLecturas(ids);
}

/**
 * Territorios del candidato que aún no tienen ninguna propuesta publicada:
 * barrios en Alcaldía y Concejo, municipios en Gobernación y Asamblea.
 */
export function territoriosSinPropuesta(c: Candidato): string[] {
  const vigentes = PROPUESTAS.filter((p) => p.candidato === c.id && p.estado === 'publicada');
  if (CARGOS[c.cargo].ambito === 'departamento') {
    if (vigentes.some((p) => p.alcance.nivel === 'departamento')) return [];
    const cubiertos = new Set(vigentes.filter((p) => p.alcance.nivel === 'municipio').flatMap((p) => p.alcance.ids));
    return municipiosDe(c.departamento).filter((m) => !cubiertos.has(m.codigo)).map((m) => m.nombre);
  }
  if (!c.municipio || vigentes.some((p) => p.alcance.nivel === 'municipio')) return [];
  const comunas = new Set(vigentes.filter((p) => p.alcance.nivel === 'comuna').flatMap((p) => p.alcance.ids));
  const barrios = new Set(vigentes.filter((p) => p.alcance.nivel === 'barrio').flatMap((p) => p.alcance.ids));
  return zonasDe(c.municipio, 'barrio')
    .filter((b) => !barrios.has(b.id) && !(b.padre && comunas.has(b.padre)))
    .map((b) => b.nombre);
}

/* ---------- Publicar en el feed ---------- */

export function publicarMensaje(candidato: string, texto: string, alcance: Alcance) {
  const pub: Extract<Publicacion, { tipo: 'mensaje' }> = {
    id: nuevoId(), tipo: 'mensaje', candidato, texto, alcance, fecha: new Date().toISOString(),
  };
  PUBLICACIONES.push(pub);
  remoto.publicarMensaje(pub);
  avisar();
}

export interface DatosEvento {
  titulo: string;
  fecha: string; // ISO con hora
  lugar: string;
  alcance: Alcance;
}

/** Crea un evento público y lo publica en el feed para que la gente marque "Asistiré". */
export function publicarEvento(candidato: string, e: DatosEvento, texto: string): string {
  const evento: Evento = { id: nuevoId(), candidato, ...e };
  const pub: Extract<Publicacion, { tipo: 'evento' }> = {
    id: nuevoId(), tipo: 'evento', candidato, evento: evento.id, texto, conPieza: false, fecha: new Date().toISOString(),
  };
  EVENTOS.push(evento);
  PUBLICACIONES.push(pub);
  remoto.publicarEvento(evento, pub);
  avisar();
  return evento.id;
}

/** Vuelve a anunciar en el feed una propuesta ya publicada. */
export function anunciarPropuesta(candidato: string, propuesta: string) {
  const p = getPropuesta(propuesta);
  if (!p || p.estado !== 'publicada') return;
  const pub = { id: nuevoId(), tipo: 'propuesta' as const, candidato, propuesta, fecha: new Date().toISOString() };
  PUBLICACIONES.push(pub);
  remoto.anunciarPropuesta(p, pub.id, pub.fecha);
  avisar();
}

/* ---------- Aportes ciudadanos ---------- */

export function enviarAporte(a: { candidato: string; tipo: TipoAporte; tema: Tema; texto: string; lugar: string }): string {
  const aporte: Aporte = { ...a, id: nuevoId(), estado: 'enviado', fecha: new Date().toISOString() };
  APORTES.push(aporte);
  remoto.enviarAporte(aporte);
  avisar();
  return aporte.id;
}

/** Bandeja de aportes de una campaña, los más recientes primero. */
export function aportesDeCampana(candidato: string, tipo?: TipoAporte): Aporte[] {
  return APORTES.filter((a) => a.candidato === candidato && (!tipo || a.tipo === tipo)).sort((a, b) =>
    b.fecha.localeCompare(a.fecha),
  );
}

/** El equipo empezó a revisar el aporte: el ciudadano lo ve "En revisión". */
export function marcarEnRevision(id: string) {
  const a = getAporte(id);
  if (a && a.estado === 'enviado') {
    a.estado = 'en_revision';
    remoto.actualizarAporte(a);
    avisar();
  }
}

export function responderAporte(id: string, respuesta: string) {
  const a = getAporte(id);
  if (!a) return;
  a.respuesta = respuesta;
  a.estado = 'respondido';
  remoto.actualizarAporte(a);
  avisar();
}

/* ---------- Seguir y asistir ---------- */

/** Seguir o dejar de seguir a un candidato; actualiza su número de seguidores. */
export function seguir(candidato: string, si: boolean) {
  const c = getCandidato(candidato);
  if (c) c.seguidores = Math.max(0, c.seguidores + (si ? 1 : -1));
  remoto.seguir(candidato, si);
  avisar();
}

export function asistir(evento: string, si: boolean) {
  remoto.asistir(evento, si);
}

/* ---------- Agenda (interna de la campaña) ---------- */

export const getActividad = (id: string) => ACTIVIDADES.find((a) => a.id === id);

/** Actividades de la campaña en orden cronológico; opcionalmente solo entre dos fechas. */
export function agendaDe(candidato: string, desde?: Date, hasta?: Date): Actividad[] {
  return ACTIVIDADES.filter((a) => {
    if (a.candidato !== candidato) return false;
    const t = new Date(a.fecha).getTime();
    return (!desde || t >= desde.getTime()) && (!hasta || t < hasta.getTime());
  }).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Actividades de un día (a medianoche) en adelante 24 horas. */
export function agendaDelDia(candidato: string, dia: Date): Actividad[] {
  const desde = new Date(dia);
  desde.setHours(0, 0, 0, 0);
  return agendaDe(candidato, desde, new Date(desde.getTime() + 86400_000));
}

/** Otras actividades programadas que empiezan menos de una hora antes o después. */
export function cruces(candidato: string, fecha: string, salvo?: string): Actividad[] {
  const t = new Date(fecha).getTime();
  return ACTIVIDADES.filter(
    (a) => a.candidato === candidato && a.id !== salvo && a.estado !== 'cancelada' &&
      Math.abs(new Date(a.fecha).getTime() - t) < 3600_000,
  );
}

export type DatosActividad = Omit<Actividad, 'id' | 'candidato' | 'estado' | 'evento'>;

/** Agrega una actividad a la agenda. Si es pública, la anuncia en el feed como evento. */
export function crearActividad(candidato: string, d: DatosActividad, publicar?: { texto: string }): string {
  const a: Actividad = { ...d, id: nuevoId(), candidato, estado: 'programada' };
  ACTIVIDADES.push(a);
  remoto.guardarActividad(a);
  if (publicar) {
    a.evento = publicarEvento(candidato, { titulo: a.titulo, fecha: a.fecha, lugar: a.lugar, alcance: a.comunidad }, publicar.texto);
    remoto.guardarActividad(a);
  }
  avisar();
  return a.id;
}

export function actualizarActividad(id: string, cambios: Partial<Omit<Actividad, 'id' | 'candidato'>>) {
  const a = getActividad(id);
  if (!a) return;
  Object.assign(a, cambios);
  remoto.guardarActividad(a);
  avisar();
}

/* ---------- Compromisos con comunidades ---------- */

export const getCompromiso = (id: string) => COMPROMISOS.find((c) => c.id === id);

/** Compromisos de la campaña, los más recientes primero; opcionalmente de un estado o de una actividad. */
export function compromisosDe(candidato: string, f: { estado?: EstadoCompromiso; actividad?: string } = {}): Compromiso[] {
  return COMPROMISOS.filter(
    (c) => c.candidato === candidato && (!f.estado || c.estado === f.estado) && (!f.actividad || c.actividad === f.actividad),
  ).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export type DatosCompromiso = Pick<Compromiso, 'que' | 'conQuien' | 'comunidad' | 'actividad' | 'aporte'>;

export function registrarCompromiso(candidato: string, d: DatosCompromiso): string {
  const c: Compromiso = { ...d, id: nuevoId(), candidato, estado: 'registrado', fecha: new Date().toISOString() };
  COMPROMISOS.push(c);
  remoto.guardarCompromiso(c);
  avisar();
  return c.id;
}

export function cambiarEstadoCompromiso(id: string, estado: EstadoCompromiso) {
  const c = getCompromiso(id);
  if (!c) return;
  c.estado = estado;
  remoto.guardarCompromiso(c);
  avisar();
}

/** El compromiso quedó incluido en una propuesta del programa. */
export function incluirEnPropuesta(id: string, propuesta: string) {
  const c = getCompromiso(id);
  if (!c) return;
  c.propuesta = propuesta;
  c.estado = 'incluido';
  remoto.guardarCompromiso(c);
  avisar();
}

/* ---------- Equipo de campaña ---------- */

export const getMiembro = (id?: string) => (id ? MIEMBROS.find((m) => m.id === id) : undefined);

export function miembrosDe(candidato: string, f: { rol?: RolEquipo; superior?: string } = {}): Miembro[] {
  return MIEMBROS.filter(
    (m) => m.candidato === candidato && m.activo && (!f.rol || m.rol === f.rol) && (!f.superior || m.superior === f.superior),
  ).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/**
 * ¿Un territorio (de una actividad, tarea o visita) cae en la zona de un miembro?
 * Lo que es para todo el municipio o departamento lo ven todas las zonas.
 */
export function enZona(zona: Alcance, a: Alcance): boolean {
  if (a.nivel === 'municipio' || a.nivel === 'departamento' || zona.nivel === 'municipio' || zona.nivel === 'departamento') return true;
  const padre = (id: string) => ZONAS.find((z) => z.id === id)?.padre;
  if (zona.nivel === 'comuna') {
    return a.ids.some((id) => zona.ids.includes(id) || zona.ids.includes(padre(id) ?? ''));
  }
  // Zona de barrio: los de su barrio y los de la comuna que lo contiene.
  return a.ids.some((id) => zona.ids.includes(id) || zona.ids.some((b) => padre(b) === id));
}

/** Quién puede poner visitas en la agenda: el candidato o un coordinador con la agenda delegada. */
export const puedeAgendar = (m?: Miembro) => !m || (m.rol === 'coordinador' && m.delegadoAgenda);
/** Quién aprueba colaboradores: el candidato o un coordinador con esa función delegada. */
export const puedeAprobar = (m?: Miembro) => !m || (m.rol === 'coordinador' && m.delegadoAprobaciones);

/* Invitaciones */

export function invitacionesDe(candidato: string, superior?: string): Invitacion[] {
  return INVITACIONES.filter(
    (i) => i.candidato === candidato && !i.usadaPor && (superior === undefined || i.superior === superior) &&
      new Date(i.vence).getTime() > Date.now(),
  );
}

export interface DatosInvitacion {
  rol: RolEquipo;
  zona: Alcance;
  superior?: string;
  delegadoAgenda?: boolean;
  delegadoAprobaciones?: boolean;
}

/** Crea un código de invitación (p. ej. MC-4821) que vence en 14 días. */
export function crearInvitacion(candidato: string, d: DatosInvitacion): Invitacion {
  let codigo = '';
  do codigo = `MC-${Math.floor(1000 + Math.random() * 9000)}`;
  while (INVITACIONES.some((i) => i.codigo === codigo));
  const inv: Invitacion = {
    codigo, candidato, rol: d.rol, zona: d.zona, superior: d.superior,
    delegadoAgenda: !!d.delegadoAgenda, delegadoAprobaciones: !!d.delegadoAprobaciones,
    vence: new Date(Date.now() + 14 * 86400_000).toISOString(),
  };
  INVITACIONES.push(inv);
  remoto.crearInvitacion(inv);
  avisar();
  return inv;
}

/** Lo que ve quien escribe un código antes de unirse. */
export interface ResumenInvitacion {
  codigo: string;
  rol: RolEquipo;
  zona: Alcance;
  campana: string; // id
  candidatoNombre: string;
  cargoTexto: string;
  delegadoAgenda: boolean;
  delegadoAprobaciones: boolean;
  superiorNombre?: string;
}

const normalizarCodigo = (c: string) => c.trim().toUpperCase().replace(/\s+/g, '');

export async function verInvitacion(codigo: string): Promise<ResumenInvitacion | null> {
  const cod = normalizarCodigo(codigo);
  if (remoto.conectado) return remoto.verInvitacion(cod);
  const inv = INVITACIONES.find((i) => i.codigo === cod && !i.usadaPor && new Date(i.vence).getTime() > Date.now());
  const c = inv ? getCandidato(inv.candidato) : undefined;
  if (!inv || !c) return null;
  return {
    codigo: inv.codigo, rol: inv.rol, zona: inv.zona, campana: c.id, candidatoNombre: c.nombre, cargoTexto: cargoConTerritorio(c),
    delegadoAgenda: inv.delegadoAgenda, delegadoAprobaciones: inv.delegadoAprobaciones, superiorNombre: getMiembro(inv.superior)?.nombre,
  };
}

/** Se une a la campaña con el código. Devuelve el id del nuevo miembro. */
export async function usarInvitacion(codigo: string, nombre: string): Promise<string> {
  const cod = normalizarCodigo(codigo);
  if (remoto.conectado) return remoto.usarInvitacion(cod, nombre);
  const inv = INVITACIONES.find((i) => i.codigo === cod && !i.usadaPor);
  if (!inv) throw new Error('El código no existe, ya se usó o venció.');
  const m: Miembro = {
    id: nuevoId(), candidato: inv.candidato, nombre, rol: inv.rol, superior: inv.superior, zona: inv.zona,
    delegadoAgenda: inv.delegadoAgenda, delegadoAprobaciones: inv.delegadoAprobaciones,
    cupo: inv.rol === 'lider' ? 15 : undefined, activo: true, desde: new Date().toISOString(),
  };
  MIEMBROS.push(m);
  inv.usadaPor = m.id;
  avisar();
  return m.id;
}

/** Cambia las funciones delegadas de un coordinador (solo el candidato). */
export function delegar(miembro: string, cambios: { delegadoAgenda?: boolean; delegadoAprobaciones?: boolean }) {
  const m = getMiembro(miembro);
  if (!m) return;
  Object.assign(m, cambios);
  remoto.guardarMiembro(m);
  avisar();
}

/* Colaboradores */

export const getColaborador = (id: string) => COLABORADORES.find((c) => c.id === id);

export function colaboradoresDe(f: { lider?: string; candidato?: string; estado?: EstadoColaborador }): Colaborador[] {
  return COLABORADORES.filter(
    (c) => (!f.lider || c.lider === f.lider) && (!f.candidato || c.candidato === f.candidato) && (!f.estado || c.estado === f.estado),
  ).sort((a, b) => b.creado.localeCompare(a.creado));
}

/** Cupo de un líder: cuántos colaboradores tiene (sin contar rechazados) y cuántos puede tener. */
export function cupoDe(lider: string): { usados: number; total: number } {
  const m = getMiembro(lider);
  const c = m ? getCandidato(m.candidato) : undefined;
  return {
    usados: COLABORADORES.filter((x) => x.lider === lider && x.estado !== 'rechazado').length,
    total: m?.cupo ?? c?.cupoPorLider ?? 15,
  };
}

/** Edad cumplida hoy a partir de AAAA-MM-DD. */
export function edad(fechaNacimiento: string): number {
  const [a, m, d] = fechaNacimiento.split('-').map(Number);
  const hoy = new Date();
  let e = hoy.getFullYear() - a;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) e--;
  return e;
}

export type DatosColaborador = Pick<Colaborador, 'nombre' | 'cedula' | 'celular' | 'fechaNacimiento' | 'barrio' | 'barrioTexto' | 'ayudaEn'>;

/**
 * Registra un colaborador con sus fotos (tomadas con la cámara) y su autorización.
 * Queda "por verificar" hasta que lo apruebe el coordinador o el candidato.
 */
export function registrarColaborador(lider: string, d: DatosColaborador, fotos: { rostro: ArchivoLocal; cedula: ArchivoLocal }): string {
  const m = getMiembro(lider);
  if (!m) throw new Error('No eres líder de esta campaña.');
  const { usados, total } = cupoDe(lider);
  if (usados >= total) throw new Error('Tu cupo de colaboradores está lleno.');
  if (edad(d.fechaNacimiento) < 18) throw new Error('Solo se pueden registrar mayores de edad.');
  if (COLABORADORES.some((c) => c.candidato === m.candidato && c.cedula === d.cedula)) throw new Error('Esa cédula ya está registrada en la campaña.');
  const id = nuevoId();
  const ruta = (cual: string, a: ArchivoLocal) => (remoto.conectado ? remoto.rutaEquipo(m.candidato, `colaboradores/${id}-${cual}`, a.nombre) : a.uri);
  const c: Colaborador = {
    ...d, id, candidato: m.candidato, lider, fotoRostro: ruta('rostro', fotos.rostro), fotoCedula: ruta('cedula', fotos.cedula),
    autorizacion: new Date().toISOString(), estado: 'por_verificar', creado: new Date().toISOString(),
  };
  COLABORADORES.push(c);
  remoto.registrarColaborador(c, fotos);
  avisar();
  return id;
}

export function verificarColaborador(id: string, estado: 'activo' | 'rechazado', aprobadoPor?: string) {
  const c = getColaborador(id);
  if (!c) return;
  c.estado = estado;
  remoto.verificarColaborador(c, aprobadoPor);
  avisar();
}

/* Tareas */

export const getTarea = (id: string) => TAREAS.find((t) => t.id === id);

/** Tareas de un miembro (las que le asignaron), las pendientes primero y por fecha límite. */
export function tareasDe(miembro: string): Tarea[] {
  return TAREAS.filter((t) => t.asignadaA === miembro).sort(
    (a, b) => (a.estado === b.estado ? (a.fechaLimite ?? '9').localeCompare(b.fechaLimite ?? '9') : a.estado === 'pendiente' ? -1 : 1),
  );
}

/** Tareas que asignó un miembro (o el candidato, si no se indica), las más recientes primero. */
export function tareasAsignadas(candidato: string, por?: string): Tarea[] {
  return TAREAS.filter((t) => t.candidato === candidato && (por === undefined || t.asignadaPor === por)).sort((a, b) =>
    b.creada.localeCompare(a.creada),
  );
}

/** ¿Se venció sin reporte? */
export const vencida = (t: Tarea) => t.estado === 'pendiente' && !!t.fechaLimite && new Date(t.fechaLimite).getTime() < Date.now();

/** Asigna la misma tarea a varios miembros (una por cada uno, del mismo grupo). */
export function asignarTarea(
  candidato: string,
  d: { titulo: string; para: string[]; fechaLimite?: string; evidencia: boolean },
  asignadaPor?: string,
): number {
  const grupo = nuevoId();
  d.para.forEach((asignadaA) => {
    const t: Tarea = {
      id: nuevoId(), candidato, grupo, titulo: d.titulo, asignadaA, asignadaPor, fechaLimite: d.fechaLimite,
      evidencia: d.evidencia, estado: 'pendiente', creada: new Date().toISOString(),
    };
    TAREAS.push(t);
    remoto.guardarTarea(t);
  });
  avisar();
  return d.para.length;
}

export function reportarTarea(id: string, r: Omit<ReporteTarea, 'fotos' | 'fecha'>, fotos: ArchivoLocal[]) {
  const t = getTarea(id);
  if (!t) return;
  if (t.evidencia && fotos.length === 0) throw new Error('Esta tarea pide al menos una foto de evidencia.');
  const rutas = fotos.map((f, i) => (remoto.conectado ? remoto.rutaEquipo(t.candidato, `tareas/${t.id}-${i + 1}`, f.nombre) : f.uri));
  t.estado = 'reportada';
  t.reporte = { ...r, fotos: rutas, fecha: new Date().toISOString() };
  remoto.reportarTarea(t, fotos);
  avisar();
}

/* Visitas propuestas por líderes */

export function solicitudesDe(candidato: string, estado?: SolicitudVisita['estado']): SolicitudVisita[] {
  return SOLICITUDES_VISITA.filter((v) => v.candidato === candidato && (!estado || v.estado === estado)).sort((a, b) =>
    a.fecha.localeCompare(b.fecha),
  );
}

export type DatosSolicitud = Pick<SolicitudVisita, 'lugar' | 'fecha' | 'comunidad' | 'asistentesEsperados' | 'temas'>;

export function proponerVisita(lider: string, d: DatosSolicitud): string {
  const m = getMiembro(lider);
  if (!m) throw new Error('No eres parte del equipo.');
  const v: SolicitudVisita = { ...d, id: nuevoId(), candidato: m.candidato, propuestaPor: lider, estado: 'pendiente', creada: new Date().toISOString() };
  SOLICITUDES_VISITA.push(v);
  remoto.guardarSolicitud(v);
  avisar();
  return v.id;
}

/** Aprueba la visita: queda en la agenda del candidato, con el líder como anfitrión. */
export function aprobarVisita(id: string) {
  const v = SOLICITUDES_VISITA.find((x) => x.id === id);
  if (!v || v.estado !== 'pendiente') return;
  const lider = getMiembro(v.propuestaPor);
  v.actividad = crearActividad(v.candidato, {
    tipo: 'visita', titulo: `Visita ${v.comunidad.etiqueta}`, fecha: v.fecha, lugar: v.lugar, comunidad: v.comunidad,
    responsable: lider ? `${lider.nombre} (líder)` : undefined, asistentesEsperados: v.asistentesEsperados,
    notas: v.temas.length ? `Temas que pide la comunidad: ${v.temas.join(', ')}.` : undefined,
  });
  v.estado = 'aprobada';
  remoto.guardarSolicitud(v);
  avisar();
}

export function rechazarVisita(id: string, motivo: string) {
  const v = SOLICITUDES_VISITA.find((x) => x.id === id);
  if (!v) return;
  v.estado = 'rechazada';
  v.motivo = motivo;
  remoto.guardarSolicitud(v);
  avisar();
}
