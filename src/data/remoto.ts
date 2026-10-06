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
import {
  ACTIVIDADES, APORTES, CANDIDATOS, COLABORADORES, COMENTARIOS, COMPROMISOS, EVENTOS, INVITACIONES, MIEMBROS, PROPUESTAS, PUBLICACIONES,
  REACCIONES, SOLICITUDES_VISITA, TAREAS,
} from './mock';
import type {
  Actividad, Alcance, Aporte, ArchivoLocal, Colaborador, Comentario, Invitacion, Miembro, SolicitudVisita, Tarea, Compromiso, Candidato, Ciudadano, Evento, Propuesta, Publicacion, Zona,
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
 * Copia de los datos en el momento de pedir la escritura. Las escrituras esperan
 * su turno en la cola y los objetos de la app pueden cambiar mientras tanto
 * (p. ej. una actividad a la que luego se le asigna su evento público).
 */
const foto = <T extends object>(o: T): T => {
  const copia = { ...o } as Record<string, unknown>;
  for (const k of Object.keys(copia)) if (Array.isArray(copia[k])) copia[k] = [...(copia[k] as unknown[])];
  return copia as T;
};

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
  soporte: r.soporte_url ?? undefined,
  cupoPorLider: r.cupo_por_lider ?? undefined,
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

const comentarioDe = (r: any): Comentario => ({
  id: r.id, publicacion: r.publicacion_id, autor: r.autor_nombre, lugar: r.lugar ?? undefined, deCampana: !!r.de_campana,
  texto: r.texto, fecha: r.creado, mio: r.perfil_id === uid, oculto: !!r.oculto,
});

const aporteDe = (r: any): Aporte => ({
  id: r.id, candidato: r.campana_id, lugar: r.lugar ?? '', tipo: r.tipo, tema: r.tema, texto: r.texto,
  estado: r.estado, fecha: r.creado, respuesta: r.respuesta ?? undefined,
});

const actividadDe = (r: any): Actividad => ({
  id: r.id, candidato: r.campana_id, tipo: r.tipo, titulo: r.titulo, fecha: r.fecha, lugar: r.lugar,
  comunidad: alcanceDe(r), responsable: r.responsable ?? undefined, estado: r.estado,
  asistentesEsperados: r.asistentes_esperados ?? undefined, asistentesReales: r.asistentes_reales ?? undefined,
  notas: r.notas ?? undefined, evento: r.evento_id ?? undefined,
});

const compromisoDe = (r: any): Compromiso => ({
  id: r.id, candidato: r.campana_id, que: r.que, conQuien: r.con_quien, comunidad: alcanceDe(r), estado: r.estado,
  fecha: r.creado, actividad: r.actividad_id ?? undefined, aporte: r.aporte_id ?? undefined, propuesta: r.propuesta_id ?? undefined,
});

const miembroDe = (r: any): Miembro => ({
  id: r.id, candidato: r.campana_id, nombre: r.nombre || 'Sin nombre', rol: r.rol, superior: r.superior ?? undefined,
  zona: r.nivel ? alcanceDe(r) : { nivel: 'municipio', ids: [], etiqueta: 'Toda la campaña' },
  delegadoAgenda: !!r.delegado_agenda, delegadoAprobaciones: !!r.delegado_aprobaciones, cupo: r.cupo ?? undefined,
  activo: !!r.activo, desde: r.creado,
});

const invitacionDe = (r: any): Invitacion => ({
  codigo: r.codigo, candidato: r.campana_id, rol: r.rol, zona: alcanceDe(r), superior: r.superior ?? undefined,
  delegadoAgenda: !!r.delegado_agenda, delegadoAprobaciones: !!r.delegado_aprobaciones, vence: r.vence,
  usadaPor: r.usada_por ?? undefined,
});

const colaboradorDe = (r: any): Colaborador => ({
  id: r.id, candidato: r.campana_id, lider: r.lider, nombre: r.nombre, cedula: r.cedula, celular: r.celular ?? undefined,
  fechaNacimiento: r.fecha_nacimiento, barrio: r.barrio ?? undefined, barrioTexto: r.barrio_texto ?? '', ayudaEn: r.ayuda_en ?? [],
  fotoRostro: r.foto_rostro_url, fotoCedula: r.foto_cedula_url, autorizacion: r.autorizacion_firmada, estado: r.estado, creado: r.creado,
});

const tareaDe = (r: any): Tarea => ({
  id: r.id, candidato: r.campana_id, grupo: r.grupo, titulo: r.titulo, asignadaA: r.asignada_a, asignadaPor: r.asignada_por ?? undefined,
  fechaLimite: r.fecha_limite ?? undefined, evidencia: !!r.evidencia, estado: r.estado, creada: r.creada,
  reporte: r.reportada_el
    ? { notas: r.reporte_notas ?? '', cantidad: r.reporte_cantidad ?? undefined, participantes: r.reporte_participantes ?? [],
        fotos: r.reporte_fotos ?? [], fecha: r.reportada_el }
    : undefined,
});

const solicitudDe = (r: any): SolicitudVisita => ({
  id: r.id, candidato: r.campana_id, propuestaPor: r.propuesta_por, lugar: r.lugar, fecha: r.fecha, comunidad: alcanceDe(r),
  asistentesEsperados: r.asistentes_esperados ?? undefined, temas: r.temas ?? [], estado: r.estado,
  actividad: r.actividad_id ?? undefined, motivo: r.motivo ?? undefined, creada: r.creada,
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
  /** Id de la membresía (coordinador, líder o marketing) de quien usa la app. */
  miembro?: string;
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

  const [partidos, deps, muns, zonas, campanas, propuestas, eventos, pubs, aportes, perfiles, sigo, voy, agenda, compromisos,
    membresias, invitaciones, colaboradores, tareas, solicitudes, misReacciones, comentarios] =
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
      // RLS: solo llegan la agenda y los compromisos de la campaña de la que haces parte.
      leer(sb.from('actividades').select('*').order('fecha'), 'la agenda'),
      leer(sb.from('compromisos').select('*').order('creado', { ascending: false }), 'los compromisos'),
      // Equipo: RLS deja ver solo lo de las campañas de las que haces parte.
      leer(sb.from('membresias').select('*'), 'el equipo'),
      leer(sb.from('invitaciones').select('*'), 'las invitaciones'),
      leer(sb.from('colaboradores').select('*'), 'los colaboradores'),
      leer(sb.from('tareas').select('*'), 'las tareas'),
      leer(sb.from('solicitudes_visita').select('*'), 'las visitas propuestas'),
      leer(sb.from('reacciones').select('publicacion_id, valor').eq('perfil_id', uid), 'tus reacciones'),
      leer(sb.from('comentarios').select('*').order('creado', { ascending: false }).limit(2000), 'los comentarios'),
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
  reemplazar(ACTIVIDADES, agenda.map(actividadDe));
  reemplazar(COMPROMISOS, compromisos.map(compromisoDe));
  reemplazar(MIEMBROS, membresias.map(miembroDe));
  reemplazar(INVITACIONES, invitaciones.map(invitacionDe));
  reemplazar(COLABORADORES, colaboradores.map(colaboradorDe));
  reemplazar(TAREAS, tareas.map(tareaDe));
  reemplazar(SOLICITUDES_VISITA, solicitudes.map(solicitudDe));
  for (const k of Object.keys(REACCIONES)) delete REACCIONES[k];
  for (const p of pubs as any[]) REACCIONES[p.id] = { aFavor: p.a_favor ?? 0, enContra: p.en_contra ?? 0 };
  for (const r of misReacciones as any[]) if (REACCIONES[r.publicacion_id]) REACCIONES[r.publicacion_id].mia = r.valor;
  reemplazar(COMENTARIOS, comentarios.map(comentarioDe));

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
    miembro: membresias.find((m: any) => m.perfil_id === uid && m.activo)?.id,
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/* ---------- Escrituras ---------- */

export function guardarPerfilCiudadano(c0: Omit<Ciudadano, 'siguiendo' | 'asistire'>) {
  const c = foto(c0);
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

/** Ruta privada del soporte: una carpeta por usuario (así lo exige la política de almacenamiento). */
export function rutaSoporte(nombre: string): string {
  const limpio = nombre.normalize('NFD').replace(/[^\w.-]+/g, '_').slice(-80);
  return `${uid}/${Date.now()}-${limpio}`;
}

/**
 * Guarda la campaña. Si trae un soporte nuevo, primero lo sube; si la subida
 * falla, la campaña no se actualiza (la base de datos exige el soporte para
 * pasar de aspirante a candidato).
 */
export function guardarCampana(c0: Candidato, soporte?: ArchivoLocal) {
  const c = foto(c0);
  let subido = true;
  if (soporte && c.soporte) {
    const ruta = c.soporte;
    escribir('subir el aval', async () => {
      try {
        const datos = await (await fetch(soporte.uri)).arrayBuffer();
        const r = await db().storage.from('soportes').upload(ruta, datos, { contentType: soporte.tipo, upsert: false });
        if (r.error) subido = false;
        return { error: r.error ? { message: r.error.message } : null };
      } catch {
        subido = false;
        return { error: { message: 'no se pudo leer el archivo en el teléfono.' } };
      }
    });
  }
  // La campaña cuelga de un perfil: se crea si aún no existe (sin tocar uno existente).
  escribir('crear tu perfil', () =>
    db().from('perfiles').upsert({ id: uid, nombre: c.nombre }, { onConflict: 'id', ignoreDuplicates: true }),
  );
  escribir('guardar tu campaña', async () => {
    if (!subido) return { error: { message: 'primero hay que subir el aval. Inténtalo de nuevo.' } };
    return db().from('campanas').upsert({
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
      soporte_url: c.soporte ?? null,
    });
  });
  escribir('guardar el aval', () => db().from('campana_partidos').delete().eq('campana_id', c.id));
  if (c.partidos.length) {
    escribir('guardar el aval', () =>
      db().from('campana_partidos').insert(c.partidos.map((p) => ({ campana_id: c.id, partido_id: p }))),
    );
  }
}

const filaAlcance = (a: Alcance) => ({ nivel: a.nivel, alcance_ids: a.ids, alcance_texto: a.etiqueta });

export function crearBorrador(p0: Propuesta) {
  const p = foto(p0);
  escribir('guardar la propuesta', () =>
    db().from('propuestas').insert({
      id: p.id, campana_id: p.candidato, titulo: p.titulo, resumen: p.resumen, tema: p.tema,
      ...filaAlcance(p.alcance), estado: 'borrador', redactada_por: uid,
    }),
  );
}

export function editarBorrador(p0: Propuesta) {
  const p = foto(p0);
  escribir('guardar la propuesta', () =>
    db().from('propuestas')
      .update({ titulo: p.titulo, resumen: p.resumen, tema: p.tema, ...filaAlcance(p.alcance) })
      .eq('id', p.id),
  );
}

export function publicarPropuesta(p0: Propuesta, publicacionId: string) {
  const p = foto(p0);
  escribir('publicar la propuesta', () =>
    db().from('propuestas')
      .update({ estado: 'publicada', publicada_el: p.publicadaEl, acepto_permanencia: new Date().toISOString() })
      .eq('id', p.id),
  );
  anunciarPropuesta(p, publicacionId, p.publicadaEl);
}

export function anunciarPropuesta(p0: Propuesta, publicacionId: string, fecha: string) {
  const p = foto(p0);
  escribir('anunciar la propuesta en el feed', () =>
    db().from('publicaciones').insert({
      id: publicacionId, campana_id: p.candidato, tipo: 'propuesta', propuesta_id: p.id,
      nivel: p.alcance.nivel, alcance_ids: p.alcance.ids, publicada_el: fecha,
    }),
  );
}

export function corregirPropuesta(p0: Propuesta) {
  const p = foto(p0);
  escribir('guardar la corrección', () =>
    db().from('propuestas').update({ titulo: p.titulo, resumen: p.resumen }).eq('id', p.id),
  );
}

export function retirarPropuesta(p0: Propuesta) {
  const p = foto(p0);
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

export function publicarMensaje(pub0: Extract<Publicacion, { tipo: 'mensaje' }>) {
  const pub = foto(pub0);
  escribir('publicar el mensaje', () =>
    db().from('publicaciones').insert({
      id: pub.id, campana_id: pub.candidato, tipo: 'mensaje', texto: pub.texto,
      nivel: pub.alcance?.nivel ?? 'municipio', alcance_ids: pub.alcance?.ids ?? [], publicada_el: pub.fecha,
    }),
  );
}

export function publicarEvento(e0: Evento, pub0: Extract<Publicacion, { tipo: 'evento' }>) {
  const e = foto(e0);
  const pub = foto(pub0);
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

export function enviarAporte(a0: Aporte) {
  const a = foto(a0);
  escribir('enviar tu aporte', () =>
    db().from('aportes').insert({
      id: a.id, campana_id: a.candidato, autor: uid, tipo: a.tipo, tema: a.tema, texto: a.texto, lugar: a.lugar,
    }),
  );
}

export function actualizarAporte(a0: Aporte) {
  const a = foto(a0);
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

export function guardarActividad(a0: Actividad) {
  const a = foto(a0);
  escribir('guardar la actividad', () =>
    db().from('actividades').upsert({
      id: a.id, campana_id: a.candidato, tipo: a.tipo, titulo: a.titulo, fecha: a.fecha, lugar: a.lugar,
      ...filaAlcance(a.comunidad), responsable: a.responsable ?? null, estado: a.estado,
      asistentes_esperados: a.asistentesEsperados ?? null, asistentes_reales: a.asistentesReales ?? null,
      notas: a.notas ?? null, evento_id: a.evento ?? null, creado_por: uid,
    }),
  );
}

export function guardarCompromiso(c0: Compromiso) {
  const c = foto(c0);
  escribir('guardar el compromiso', () =>
    db().from('compromisos').upsert({
      id: c.id, campana_id: c.candidato, que: c.que, con_quien: c.conQuien, ...filaAlcance(c.comunidad),
      estado: c.estado, actividad_id: c.actividad ?? null, aporte_id: c.aporte ?? null,
      propuesta_id: c.propuesta ?? null, registrado_por: uid,
    }),
  );
}

/* ---------- Cuenta con celular (código SMS) ---------- */

/** Explica en español los errores más comunes del ingreso por SMS. */
function errorCuenta(e: { code?: string; message: string }): Error {
  const porCodigo: Record<string, string> = {
    phone_provider_disabled: 'El ingreso por SMS aún no está activado: falta configurar el proveedor de SMS en Supabase.',
    sms_send_failed: 'No se pudo enviar el SMS. Revisa el número o inténtalo en unos minutos.',
    over_sms_send_rate_limit: 'Pediste muchos códigos seguidos. Espera unos minutos e inténtalo de nuevo.',
    over_request_rate_limit: 'Demasiados intentos. Espera unos minutos.',
    otp_expired: 'El código no es correcto o ya venció. Pide uno nuevo.',
    user_not_found: 'No hay una cuenta con ese número.',
    phone_exists: 'Ese número ya tiene una cuenta.',
  };
  return new Error((e.code && porCodigo[e.code]) || e.message);
}

export interface EstadoCuenta {
  /** Celular con el que está asegurada la cuenta, si ya lo verificó. */
  telefono?: string;
}

export async function estadoCuenta(): Promise<EstadoCuenta> {
  const { data } = await db().auth.getUser();
  const tel = data.user?.phone;
  return { telefono: tel ? `+${tel.replace(/^\+/, '')}` : undefined };
}

/**
 * Pide el código por SMS. Si este teléfono tiene una cuenta anónima, el número
 * se le agrega a esa misma cuenta (no se pierde nada). Si el número ya tiene
 * una cuenta, se entra a esa otra cuenta.
 * Devuelve cuál de los dos casos es, para verificar el código igual.
 */
export async function enviarCodigo(telefono: string): Promise<'vincular' | 'entrar'> {
  const sb = db();
  const { data } = await sb.auth.getUser();
  if (data.user?.is_anonymous) {
    const r = await sb.auth.updateUser({ phone: telefono });
    if (!r.error) return 'vincular';
    if (r.error.code !== 'phone_exists') throw errorCuenta(r.error);
  }
  const r = await sb.auth.signInWithOtp({ phone: telefono, options: { shouldCreateUser: true } });
  if (r.error) throw errorCuenta(r.error);
  return 'entrar';
}

export async function verificarCodigo(telefono: string, codigo: string, modo: 'vincular' | 'entrar') {
  const r = await db().auth.verifyOtp({ phone: telefono, token: codigo, type: modo === 'vincular' ? 'phone_change' : 'sms' });
  if (r.error) throw errorCuenta(r.error);
}

/** Cierra la sesión; al volver a cargar, el teléfono entra con una cuenta anónima nueva. */
export async function cerrarSesion() {
  await db().auth.signOut();
  uid = null;
}

/* ---------- Equipo ---------- */

const BUCKET_EQUIPO = 'equipo';

/** Ruta privada de una foto del equipo: carpeta de la campaña (así lo exige la política de almacenamiento). */
export function rutaEquipo(campana: string, nombre: string, original: string): string {
  const ext = (original.match(/\.(\w{2,5})$/)?.[1] ?? 'jpg').toLowerCase();
  return `${campana}/${nombre}.${ext}`;
}

/** Sube un archivo local a la carpeta privada del equipo. */
async function subir(ruta: string, a: ArchivoLocal) {
  try {
    const datos = await (await fetch(a.uri)).arrayBuffer();
    const r = await db().storage.from(BUCKET_EQUIPO).upload(ruta, datos, { contentType: a.tipo, upsert: false });
    return { error: r.error ? { message: r.error.message } : null };
  } catch {
    return { error: { message: 'no se pudo leer la foto en el teléfono.' } };
  }
}

/** Dirección temporal (1 hora) para ver una foto privada. */
export async function urlFoto(ruta: string): Promise<string | undefined> {
  const r = await db().storage.from(BUCKET_EQUIPO).createSignedUrl(ruta, 3600);
  return r.data?.signedUrl;
}

export function crearInvitacion(i0: Invitacion) {
  const i = foto(i0);
  escribir('crear la invitación', () =>
    db().rpc('crear_invitacion', {
      p_codigo: i.codigo, p_campana: i.candidato, p_rol: i.rol, p_nivel: i.zona.nivel, p_ids: i.zona.ids, p_texto: i.zona.etiqueta,
      p_superior: i.superior ?? null, p_agenda: i.delegadoAgenda, p_aprobaciones: i.delegadoAprobaciones,
    }),
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function verInvitacion(codigo: string) {
  const { data, error } = await db().rpc('ver_invitacion', { p_codigo: codigo });
  if (error) throw new Error(error.message);
  const r: any = Array.isArray(data) ? data[0] : data;
  if (!r) return null;
  return {
    codigo: r.codigo, rol: r.rol, zona: alcanceDe(r), campana: r.campana_id, candidatoNombre: r.candidato_nombre,
    cargoTexto: r.cargo_texto, delegadoAgenda: !!r.delegado_agenda, delegadoAprobaciones: !!r.delegado_aprobaciones,
    superiorNombre: r.superior_nombre ?? undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Se une a la campaña. Espera a que terminen las escrituras pendientes y devuelve el id de la membresía. */
export async function usarInvitacion(codigo: string, nombre: string): Promise<string> {
  await cola;
  const { data, error } = await db().rpc('usar_invitacion', { p_codigo: codigo, p_nombre: nombre });
  if (error) throw new Error(error.message);
  return data as string;
}

export function guardarMiembro(m0: Miembro) {
  const m = foto(m0);
  escribir('guardar las funciones delegadas', () =>
    db().from('membresias').update({ delegado_agenda: m.delegadoAgenda, delegado_aprobaciones: m.delegadoAprobaciones }).eq('id', m.id),
  );
}

export function registrarColaborador(c0: Colaborador, fotos: { rostro: ArchivoLocal; cedula: ArchivoLocal }) {
  const c = foto(c0);
  let subidas = true;
  escribir('subir la foto de rostro', async () => {
    const r = await subir(c.fotoRostro!, fotos.rostro);
    if (r.error) subidas = false;
    return r;
  });
  escribir('subir la foto de la cédula', async () => {
    if (!subidas) return { error: null };
    const r = await subir(c.fotoCedula!, fotos.cedula);
    if (r.error) subidas = false;
    return r;
  });
  escribir('registrar el colaborador', async () => {
    if (!subidas) return { error: { message: 'primero hay que subir las dos fotos. Inténtalo de nuevo.' } };
    return db().from('colaboradores').insert({
      id: c.id, campana_id: c.candidato, lider: c.lider, nombre: c.nombre, cedula: c.cedula, celular: c.celular ?? null,
      fecha_nacimiento: c.fechaNacimiento, barrio: c.barrio ?? null, barrio_texto: c.barrioTexto, ayuda_en: c.ayudaEn,
      foto_rostro_url: c.fotoRostro, foto_cedula_url: c.fotoCedula, autorizacion_firmada: c.autorizacion,
    });
  });
}

export function verificarColaborador(c0: Colaborador, aprobadoPor?: string) {
  const c = foto(c0);
  escribir('guardar la verificación', () =>
    db().from('colaboradores').update({ estado: c.estado, aprobado_por: aprobadoPor ?? null }).eq('id', c.id),
  );
}

export function guardarTarea(t0: Tarea) {
  const t = foto(t0);
  escribir('asignar la tarea', () =>
    db().from('tareas').insert({
      id: t.id, campana_id: t.candidato, grupo: t.grupo, titulo: t.titulo, asignada_a: t.asignadaA, asignada_por: t.asignadaPor ?? null,
      fecha_limite: t.fechaLimite ?? null, evidencia: t.evidencia,
    }),
  );
}

export function reportarTarea(t0: Tarea, fotos: ArchivoLocal[]) {
  const t = foto(t0);
  const r = t.reporte!;
  let subidas = true;
  fotos.forEach((f, i) =>
    escribir('subir la foto de evidencia', async () => {
      if (!subidas) return { error: null };
      const res = await subir(r.fotos[i], f);
      if (res.error) subidas = false;
      return res;
    }),
  );
  escribir('enviar el reporte', async () => {
    if (!subidas) return { error: { message: 'no se subieron las fotos. Inténtalo de nuevo.' } };
    return db().from('tareas').update({
      estado: 'reportada', reporte_notas: r.notas, reporte_cantidad: r.cantidad ?? null, reporte_participantes: r.participantes,
      reporte_fotos: r.fotos, reportada_el: r.fecha,
    }).eq('id', t.id);
  });
}

export function guardarSolicitud(v0: SolicitudVisita) {
  const v = foto(v0);
  // Proponer es un insert (lo hace el líder); decidir es un update (candidato o
  // coordinador con agenda). No se usa upsert: exigiría permiso de insertar al que decide.
  if (v.estado === 'pendiente') {
    escribir('proponer la visita', () =>
      db().from('solicitudes_visita').insert({
        id: v.id, campana_id: v.candidato, propuesta_por: v.propuestaPor, lugar: v.lugar, fecha: v.fecha, ...filaAlcance(v.comunidad),
        asistentes_esperados: v.asistentesEsperados ?? null, temas: v.temas, estado: v.estado,
      }),
    );
  } else {
    escribir('guardar la visita', () =>
      db().from('solicitudes_visita').update({ estado: v.estado, actividad_id: v.actividad ?? null, motivo: v.motivo ?? null }).eq('id', v.id),
    );
  }
}

/* ---------- Reacciones y comentarios ---------- */

/** valor undefined quita la reacción; antes dice si ya había una (update en vez de insert). */
export function reaccionar(publicacion: string, valor: 1 | -1 | undefined, antes: 1 | -1 | undefined) {
  escribir('guardar tu reacción', () => {
    if (!valor) return db().from('reacciones').delete().eq('publicacion_id', publicacion).eq('perfil_id', uid);
    if (antes) return db().from('reacciones').update({ valor }).eq('publicacion_id', publicacion).eq('perfil_id', uid);
    return db().from('reacciones').insert({ publicacion_id: publicacion, perfil_id: uid, valor });
  });
}

/** El nombre y el barrio de quien comenta los pone la base de datos. */
export function comentar(c0: Comentario) {
  const c = foto(c0);
  escribir('publicar tu comentario', () =>
    db().from('comentarios').insert({ id: c.id, publicacion_id: c.publicacion, perfil_id: uid, texto: c.texto }),
  );
}

export function borrarComentario(id: string) {
  escribir('borrar el comentario', () => db().from('comentarios').delete().eq('id', id));
}

export function ocultarComentario(id: string, oculto: boolean) {
  escribir(oculto ? 'ocultar el comentario' : 'mostrar el comentario', () => db().from('comentarios').update({ oculto }).eq('id', id));
}
