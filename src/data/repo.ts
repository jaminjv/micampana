/**
 * Capa de acceso a datos. Hoy lee y escribe los datos de prueba en memoria;
 * cuando se configure Supabase, estas funciones se reemplazan por consultas
 * sin cambiar las pantallas.
 * Las reglas de visibilidad por territorio viven aquí para que sean una sola.
 */
import { useSyncExternalStore } from 'react';

import { CARGOS, municipiosDe, nombreDepartamento, nombreMunicipio, nombrePartido, zonasDe } from './catalogos';
import { APORTES, CANDIDATOS, EVENTOS, PROPUESTAS, PUBLICACIONES } from './mock';
import * as remoto from './remoto';
import type {
  Alcance, Aporte, Candidato, Cargo, Etapa, Evento, ModoUso, Propuesta, Publicacion, Tema, TipoAporte, TipoAval,
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
export function guardarCampana(d: DatosCampana, id?: string): string {
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
  };
  if (actual) Object.assign(actual, datos);
  else CANDIDATOS.push(datos);
  remoto.guardarCampana(datos);
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
export function publicarEvento(candidato: string, e: DatosEvento, texto: string) {
  const evento: Evento = { id: nuevoId(), candidato, ...e };
  const pub: Extract<Publicacion, { tipo: 'evento' }> = {
    id: nuevoId(), tipo: 'evento', candidato, evento: evento.id, texto, conPieza: false, fecha: new Date().toISOString(),
  };
  EVENTOS.push(evento);
  PUBLICACIONES.push(pub);
  remoto.publicarEvento(evento, pub);
  avisar();
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
