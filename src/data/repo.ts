/**
 * Capa de acceso a datos. Hoy lee los datos de prueba; cuando se configure
 * Supabase, estas funciones se reemplazan por consultas sin cambiar las pantallas.
 * Las reglas de visibilidad por territorio viven aquí para que sean una sola.
 */
import { CARGOS, nombreDepartamento, nombreMunicipio, nombrePartido } from './catalogos';
import { CANDIDATOS, EVENTOS, PROPUESTAS, PUBLICACIONES } from './mock';
import type { Alcance, Candidato, Cargo, Evento, Propuesta, Publicacion, Ubicacion } from './types';

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
      return !!p && alcanzaA(p.alcance, ub);
    }
    return true;
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
    if (p.candidato !== candidato || p.alcance.nivel !== nivel) return false;
    return ub ? alcanzaA(p.alcance, ub) : true;
  }).sort((a, b) => b.publicadaEl.localeCompare(a.publicadaEl));
}

export function eventosDe(candidato: string): Evento[] {
  return EVENTOS.filter((e) => e.candidato === candidato).sort((a, b) => a.fecha.localeCompare(b.fecha));
}
