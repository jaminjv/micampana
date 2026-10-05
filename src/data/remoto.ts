/**
 * Conexión con Supabase. Solo se usa cuando existen las variables de .env.
 *
 * La app trabaja sobre las listas en memoria de mock.ts y catalogos.ts:
 * - al abrir, cargarTodo() las llena con lo que hay en la base de datos;
 * - cada cambio se aplica primero en memoria y luego se guarda en la base de
 *   datos con escribir(), en orden. Si falla, se avisa con alFallar().
 * Los permisos reales los aplica la base de datos (RLS), no esta capa.
 */
import { supabase } from '@/lib/supabase';
import { DEPARTAMENTOS, MUNICIPIOS, PARTIDOS, ZONAS } from './catalogos';
import { APORTES, CANDIDATOS, EVENTOS, PROPUESTAS, PUBLICACIONES } from './mock';
import type {
  Alcance, Aporte, Candidato, Ciudadano, Evento, Propuesta, Publicacion, Zona,
} from './types';

export const conectado = !!supabase;

let uid: string | null = null;
/** Id del usuario autenticado (Supabase Auth). */
export const miUid = () => uid;

function db() {
  if (!supabase) throw new Error('Supabase no está configurado.');
  return supabase;
}

/* ---------- Escrituras en orden y aviso de errores ---------- */

type Resultado = PromiseLike<{ error: { message: string } | null }>;

const oyentesError = new Set<(mensaje: string) => void>();

/** Avisa cuando algo no se pudo guardar en el servidor. Devuelve cómo dejar de escuchar. */
export function alFallar(f: (mensaje: string) => void) {
  oyentesError.add(f);
  return () => {
    oyentesError.delete(f);
  };
}

const fallo = (m: string) => oyentesError.forEach((f) => f(m));

let cola: Promise<void> = Promise.resolve();

/**
 * Guarda un cambio en la base de datos. Las escrituras van una detrás de otra,
 * para que, por ejemplo, una propuesta exista antes de publicarse.
 */
export function escribir(que: string, op: () => Resultado) {
  if (!supabase) return;
  cola = cola.then(async () => {
    try {
      const { error } = await op();
      if (error) fallo(`No se pudo ${que}: ${error.message}`);
    } catch {
      fallo(`No se pudo ${que}: revisa tu conexión a internet.`);
    }
  });
}

/* ---------- De filas de la base de datos a tipos de la app ---------- */

/* eslint-disable @typescript-eslint/no-explicit-any -- filas sin tipos generados */

const alcanceDe = (r: any): Alcance => ({ nivel: r.nivel, ids: r.alcance_ids ?? [], etiqueta: r.alcance_texto ?? '' });

const candidatoDe = (r: any): Candidato => ({
  id: r.id,
  usuario: r.usuario,
  nombre: r.nombre_publico,
  etapa: r.etapa,
  verificado: r.verificacion === 'verificado',
  cargo: r.cargo,
  departamento: r.departamento,
  municipio: r.municipio ?? undefined,
  tipoAval: r.tipo_aval ?? undefined,
  partidos: (r.campana_partidos ?? []).map((p: any) => p.partido_id),
  grupoSignificativo: r.grupo_significativo ?? undefined,
  tipoLista: r.tipo_lista ?? undefined,
  numero: r.numero ?? undefined,
  seguidores: r.seguidores ?? 0,
  modo: r.modo,
});

const propuestaDe = (r: any): Propuesta => ({
  id: r.id,
  candidato: r.campana_id,
  titulo: r.titulo,
  resumen: r.resumen,
  tema: r.tema,
  alcance: alcanceDe(r),
  estado: r.estado,
  publicadaEl: r.publicada_el ?? r.creado,
  editada: r.version > 1,
  versiones: [...(r.propuesta_versiones ?? [])]
    .sort((a: any, b: any) => a.version - b.version)
    .map((v: any) => ({ titulo: v.titulo, resumen: v.resumen, guardadaEl: v.guardada_el })),
  lecturas: r.lecturas ?? 0,
  retirada: r.estado === 'retirada' ? { motivo: r.retirada_motivo ?? '', fecha: r.retirada_el ?? r.creado } : undefined,
});

const eventoDe = (r: any): Evento => ({
  id: r.id, candidato: r.campana_id, titulo: r.titulo, fecha: r.fecha, lugar: r.lugar, alcance: alcanceDe(r),
});

function publicacionDe(r: any): Publicacion | null {
  const base = { id: r.id, candidato: r.campana_id, fecha: r.publicada_el };
  if (r.tipo === 'evento' && r.evento_id) {
    return { ...base, tipo: 'evento', evento: r.evento_id, texto: r.texto ?? '', conPieza: !!r.pieza_url };
  }
  if (r.tipo === 'propuesta' && r.propuesta_id) return { ...base, tipo: 'propuesta', propuesta: r.propuesta_id };
  if (r.tipo === 'mensaje') return { ...base, tipo: 'mensaje', texto: r.texto ?? '', alcance: alcanceDe(r) };
  return null;
}

const aporteDe = (r: any): Aporte => ({
  id: r.id, candidato: r.campana_id, lugar: r.lugar ?? '', tipo: r.tipo, tema: r.tema, texto: r.texto,
  estado: r.estado, fecha: r.creado, respuesta: r.respuesta ?? undefined,
});

const TIPOS_ZONA: Zona['tipo'][] = ['comuna', 'corregimiento', 'barrio', 'vereda'];

/* eslint-enable @typescript-eslint/no-explicit-any */

function reemplazar<T>(lista: T[], nuevos: T[]) {
  lista.splice(0, lista.length, ...nuevos);
}

async function leer<T>(consulta: PromiseLike<{ data: T[] | null; error: { message: string } | null }>, que: string): Promise<T[]> {
  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudo cargar ${que}: ${error.message}`);
  return data ?? [];
}

/* ---------- Al abrir la app ---------- */

export interface SesionRemota {
  ciudadano: Ciudadano | null;
  /** Nombre del perfil, aunque aún no se haya registrado como ciudadano. */
  nombrePerfil?: string;
  campana?: Candidato;
  misAportes: string[];
}

/**
 * Inicia sesión y carga todo lo que la app muestra. Mientras no esté el ingreso
 * por celular, cada teléfono entra con una cuenta anónima que se conserva.
 */
export async function cargarTodo(): Promise<SesionRemota> {
  const sb = db();
  let { data: { session } } = await sb.auth.getSession();
  if (!session) {
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) throw new Error(`No se pudo iniciar sesión: ${error.message}`);
    session = data.session;
  }
  uid = session?.user.id ?? null;
  if (!uid) throw new Error('No se pudo iniciar sesión.');

  const [partidos, deps, muns, zonas, campanas, propuestas, eventos, pubs, aportes, perfiles, sigo, voy] =
    await Promise.all([
      leer(sb.from('partidos').select('id, nombre, sigla').eq('vigente', true).order('nombre'), 'los partidos'),
      leer(sb.from('departamentos').select('codigo, nombre').order('nombre'), 'los departamentos'),
      // La capital primero: es donde se registra la mayoría.
      leer(
        sb.from('municipios').select('codigo, nombre, departamento, capital').order('capital', { ascending: false }).order('nombre'),
        'los municipios',
      ),
      leer(sb.from('zonas').select('id, nombre, tipo, municipio, padre').order('nombre'), 'las zonas'),
      leer(sb.from('campanas').select('*, campana_partidos(partido_id)'), 'las campañas'),
      leer(sb.from('propuestas').select('*, propuesta_versiones(version, titulo, resumen, guardada_el)'), 'las propuestas'),
      leer(sb.from('eventos').select('*'), 'los eventos'),
      leer(sb.from('publicaciones').select('*').order('publicada_el', { ascending: false }).limit(500), 'el feed'),
      leer(sb.from('aportes').select('*').order('creado', { ascending: false }), 'los aportes'),
      leer(sb.from('perfiles').select('*').eq('id', uid), 'tu perfil'),
      leer(sb.from('seguidores').select('campana_id').eq('perfil_id', uid), 'a quién sigues'),
      leer(sb.from('asistencias').select('evento_id').eq('perfil_id', uid), 'tus eventos'),
    ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  reemplazar(PARTIDOS, partidos.map((p: any) => ({ id: p.id, nombre: p.nombre, sigla: p.sigla ?? undefined })));
  reemplazar(DEPARTAMENTOS, deps as any[]);
  reemplazar(MUNICIPIOS, muns.map((m: any) => ({ ...m, capital: !!m.capital })));
  reemplazar(
    ZONAS,
    zonas
      .filter((z: any) => TIPOS_ZONA.includes(z.tipo) && z.municipio)
      .map((z: any) => ({ id: z.id, nombre: z.nombre, tipo: z.tipo, municipio: z.municipio, padre: z.padre ?? undefined })),
  );
  reemplazar(CANDIDATOS, campanas.map(candidatoDe));
  reemplazar(PROPUESTAS, propuestas.map(propuestaDe));
  reemplazar(EVENTOS, eventos.map(eventoDe));
  reemplazar(PUBLICACIONES, pubs.map(publicacionDe).filter((p): p is Publicacion => !!p));
  reemplazar(APORTES, aportes.map(aporteDe));

  const perfil: any = perfiles[0];
  const campana = campanas.find((c: any) => c.titular === uid);
  const ciudadano: Ciudadano | null =
    perfil?.autorizo_datos && perfil.departamento && perfil.municipio
      ? {
          nombre: perfil.nombre,
          cedula: perfil.cedula ?? '',
          ubicacion: {
            departamento: perfil.departamento,
            municipio: perfil.municipio,
            comuna: perfil.comuna ?? undefined,
            barrio: perfil.barrio ?? undefined,
          },
          autorizoDatos: true,
          siguiendo: sigo.map((s: any) => s.campana_id),
          asistire: voy.map((a: any) => a.evento_id),
        }
      : null;

  return {
    ciudadano,
    nombrePerfil: perfil?.nombre,
    campana: campana ? candidatoDe(campana) : undefined,
    misAportes: aportes.filter((a: any) => a.autor === uid).map((a: any) => a.id),
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/* ---------- Escrituras ---------- */

export function guardarPerfilCiudadano(c: Omit<Ciudadano, 'siguiendo' | 'asistire'>) {
  escribir('guardar tu registro', () =>
    db().from('perfiles').upsert({
      id: uid,
      nombre: c.nombre,
      cedula: c.cedula,
      departamento: c.ubicacion.departamento,
      municipio: c.ubicacion.municipio,
      comuna: c.ubicacion.comuna ?? null,
      barrio: c.ubicacion.barrio ?? null,
      autorizo_datos: new Date().toISOString(),
    }),
  );
}

export function guardarCampana(c: Candidato) {
  // La campaña cuelga de un perfil: se crea si aún no existe (sin tocar uno existente).
  escribir('crear tu perfil', () =>
    db().from('perfiles').upsert({ id: uid, nombre: c.nombre }, { onConflict: 'id', ignoreDuplicates: true }),
  );
  escribir('guardar tu campaña', () =>
    db().from('campanas').upsert({
      id: c.id,
      titular: uid,
      usuario: c.usuario,
      nombre_publico: c.nombre,
      etapa: c.etapa,
      cargo: c.cargo,
      departamento: c.departamento,
      municipio: c.municipio ?? null,
      tipo_aval: c.tipoAval ?? null,
      grupo_significativo: c.grupoSignificativo ?? null,
      tipo_lista: c.tipoLista ?? null,
      numero: c.numero ?? null,
      modo: c.modo ?? 'campana_completa',
    }),
  );
  escribir('guardar el aval', () => db().from('campana_partidos').delete().eq('campana_id', c.id));
  if (c.partidos.length) {
    escribir('guardar el aval', () =>
      db().from('campana_partidos').insert(c.partidos.map((p) => ({ campana_id: c.id, partido_id: p }))),
    );
  }
}

const filaAlcance = (a: Alcance) => ({ nivel: a.nivel, alcance_ids: a.ids, alcance_texto: a.etiqueta });

export function crearBorrador(p: Propuesta) {
  escribir('guardar la propuesta', () =>
    db().from('propuestas').insert({
      id: p.id, campana_id: p.candidato, titulo: p.titulo, resumen: p.resumen, tema: p.tema,
      ...filaAlcance(p.alcance), estado: 'borrador', redactada_por: uid,
    }),
  );
}

export function editarBorrador(p: Propuesta) {
  escribir('guardar la propuesta', () =>
    db().from('propuestas')
      .update({ titulo: p.titulo, resumen: p.resumen, tema: p.tema, ...filaAlcance(p.alcance) })
      .eq('id', p.id),
  );
}

export function publicarPropuesta(p: Propuesta, publicacionId: string) {
  escribir('publicar la propuesta', () =>
    db().from('propuestas')
      .update({ estado: 'publicada', publicada_el: p.publicadaEl, acepto_permanencia: new Date().toISOString() })
      .eq('id', p.id),
  );
  anunciarPropuesta(p, publicacionId, p.publicadaEl);
}

export function anunciarPropuesta(p: Propuesta, publicacionId: string, fecha: string) {
  escribir('anunciar la propuesta en el feed', () =>
    db().from('publicaciones').insert({
      id: publicacionId, campana_id: p.candidato, tipo: 'propuesta', propuesta_id: p.id,
      nivel: p.alcance.nivel, alcance_ids: p.alcance.ids, publicada_el: fecha,
    }),
  );
}

export function corregirPropuesta(p: Propuesta) {
  escribir('guardar la corrección', () =>
    db().from('propuestas').update({ titulo: p.titulo, resumen: p.resumen }).eq('id', p.id),
  );
}

export function retirarPropuesta(p: Propuesta) {
  escribir('retirar la propuesta', () =>
    db().from('propuestas')
      .update({ estado: 'retirada', retirada_motivo: p.retirada?.motivo, retirada_el: p.retirada?.fecha })
      .eq('id', p.id),
  );
}

export function borrarBorrador(id: string) {
  escribir('borrar el borrador', () => db().from('propuestas').delete().eq('id', id));
}

export function contarLecturas(ids: string[]) {
  escribir('contar las lecturas', () => db().rpc('contar_lecturas', { ids }));
}

export function publicarMensaje(pub: Extract<Publicacion, { tipo: 'mensaje' }>) {
  escribir('publicar el mensaje', () =>
    db().from('publicaciones').insert({
      id: pub.id, campana_id: pub.candidato, tipo: 'mensaje', texto: pub.texto,
      nivel: pub.alcance?.nivel ?? 'municipio', alcance_ids: pub.alcance?.ids ?? [], publicada_el: pub.fecha,
    }),
  );
}

export function publicarEvento(e: Evento, pub: Extract<Publicacion, { tipo: 'evento' }>) {
  escribir('crear el evento', () =>
    db().from('eventos').insert({
      id: e.id, campana_id: e.candidato, titulo: e.titulo, fecha: e.fecha, lugar: e.lugar, ...filaAlcance(e.alcance),
    }),
  );
  escribir('publicar el evento', () =>
    db().from('publicaciones').insert({
      id: pub.id, campana_id: pub.candidato, tipo: 'evento', texto: pub.texto, evento_id: e.id,
      nivel: e.alcance.nivel, alcance_ids: e.alcance.ids, publicada_el: pub.fecha,
    }),
  );
}

export function enviarAporte(a: Aporte) {
  escribir('enviar tu aporte', () =>
    db().from('aportes').insert({
      id: a.id, campana_id: a.candidato, autor: uid, tipo: a.tipo, tema: a.tema, texto: a.texto, lugar: a.lugar,
    }),
  );
}

export function actualizarAporte(a: Aporte) {
  escribir('guardar la respuesta', () =>
    db().from('aportes')
      .update({ estado: a.estado, respuesta: a.respuesta ?? null, respondido_por: a.respuesta ? uid : null })
      .eq('id', a.id),
  );
}

export function seguir(campana: string, si: boolean) {
  escribir(si ? 'seguir al candidato' : 'dejar de seguir', () =>
    si
      ? db().from('seguidores').insert({ campana_id: campana, perfil_id: uid })
      : db().from('seguidores').delete().eq('campana_id', campana).eq('perfil_id', uid),
  );
}

export function asistir(evento: string, si: boolean) {
  escribir(si ? 'marcar Asistiré' : 'quitar Asistiré', () =>
    si
      ? db().from('asistencias').insert({ evento_id: evento, perfil_id: uid })
      : db().from('asistencias').delete().eq('evento_id', evento).eq('perfil_id', uid),
  );
}
