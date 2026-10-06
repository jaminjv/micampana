/** Tipos del dominio. Reflejan el esquema de supabase/migrations. */

export type Etapa = 'aspirante' | 'candidato';

export type Cargo = 'gobernacion' | 'asamblea' | 'alcaldia' | 'concejo';

export type TipoAval = 'partido' | 'coalicion' | 'firmas';

export type TipoLista = 'preferente' | 'cerrada';

export type ModoUso = 'solo_mensajes' | 'campana_completa';

export type TipoAporte = 'idea' | 'consejo' | 'critica' | 'solicitud';

export type EstadoAporte = 'enviado' | 'en_revision' | 'respondido';

export type Tema =
  | 'Empleo'
  | 'Vías'
  | 'Salud'
  | 'Seguridad'
  | 'Educación'
  | 'Medio ambiente'
  | 'Otro';

export interface Partido {
  id: string;
  nombre: string;
  sigla?: string;
}

export interface Departamento {
  codigo: string; // DIVIPOLA
  nombre: string;
}

export interface Municipio {
  codigo: string; // DIVIPOLA
  nombre: string;
  departamento: string; // código DIVIPOLA del departamento
  capital?: boolean;
}

export interface Zona {
  id: string;
  nombre: string;
  tipo: 'comuna' | 'corregimiento' | 'barrio' | 'vereda';
  municipio: string;
  padre?: string; // id de la comuna o corregimiento
}

/** Territorio donde vive un ciudadano. */
export interface Ubicacion {
  departamento: string;
  municipio: string;
  comuna?: string;
  barrio?: string;
}

/** Alcance de una propuesta o publicación. */
export interface Alcance {
  nivel: 'departamento' | 'municipio' | 'comuna' | 'barrio';
  ids: string[]; // códigos o ids del nivel elegido
  etiqueta: string; // texto legible, p. ej. "Barrio El Prado"
}

export interface Candidato {
  id: string;
  usuario: string; // @usuario, sin la arroba
  nombre: string;
  etapa: Etapa;
  verificado: boolean;
  cargo: Cargo;
  departamento: string;
  municipio?: string; // vacío para Gobernación y Asamblea
  tipoAval?: TipoAval;
  partidos: string[]; // ids de partido
  grupoSignificativo?: string;
  tipoLista?: TipoLista;
  numero?: number;
  seguidores: number;
  modo?: ModoUso;
  /** Aval o constancia de inscripción: ruta en el almacenamiento privado (o nombre, con datos de prueba). */
  soporte?: string;
  /** Colaboradores que puede registrar cada líder, salvo que el líder tenga un cupo propio. */
  cupoPorLider?: number;
}

/** Archivo elegido en el teléfono, antes de subirlo. */
export interface ArchivoLocal {
  uri: string;
  nombre: string;
  tipo: string; // tipo MIME, p. ej. application/pdf
  tamano?: number; // bytes
}

export type EstadoPropuesta = 'borrador' | 'publicada' | 'retirada';

/** Versión anterior de una propuesta publicada que luego se corrigió. */
export interface VersionPropuesta {
  titulo: string;
  resumen: string;
  guardadaEl: string; // ISO
}

export interface Propuesta {
  id: string;
  candidato: string;
  titulo: string;
  resumen: string;
  tema: Tema;
  alcance: Alcance;
  estado: EstadoPropuesta;
  publicadaEl: string; // ISO; en un borrador, la fecha de creación
  editada: boolean;
  versiones: VersionPropuesta[]; // de la más antigua a la más reciente
  lecturas: number;
  retirada?: { motivo: string; fecha: string };
}

export interface Evento {
  id: string;
  candidato: string;
  titulo: string;
  fecha: string; // ISO con hora
  lugar: string;
  alcance: Alcance;
}

export type Publicacion =
  | { id: string; tipo: 'evento'; candidato: string; texto: string; evento: string; fecha: string; conPieza: boolean }
  | { id: string; tipo: 'propuesta'; candidato: string; propuesta: string; fecha: string }
  | { id: string; tipo: 'mensaje'; candidato: string; texto: string; fecha: string; alcance?: Alcance };

/** Totales de reacciones de una publicación y la de quien usa la app. */
export interface Reacciones {
  aFavor: number;
  enContra: number;
  mia?: 1 | -1;
}

export interface Comentario {
  id: string;
  publicacion: string;
  /** Nombre corto ("Rosa C.") o, si responde la campaña, el nombre del candidato. */
  autor: string;
  lugar?: string;
  deCampana: boolean;
  texto: string;
  fecha: string;
  mio: boolean;
  /** Ocultado por el candidato: solo lo ven él y su autor. */
  oculto: boolean;
}

export interface Aporte {
  id: string;
  candidato: string;
  lugar: string; // barrio o municipio de quien escribe, p. ej. "Barrio El Prado"
  tipo: TipoAporte;
  tema: Tema;
  texto: string;
  estado: EstadoAporte;
  fecha: string;
  respuesta?: string;
}

export interface Ciudadano {
  nombre: string;
  cedula: string;
  ubicacion: Ubicacion;
  autorizoDatos: boolean;
  siguiendo: string[]; // ids de candidato
  asistire: string[]; // ids de evento
}

/* ---------- Agenda y compromisos (lado candidato) ---------- */

export type TipoActividad = 'visita' | 'evento' | 'reunion' | 'debate' | 'caravana' | 'medios' | 'otro';

export type EstadoActividad = 'programada' | 'realizada' | 'cancelada';

/** Actividad de la agenda interna de la campaña. Una visita puede originar compromisos. */
export interface Actividad {
  id: string;
  candidato: string;
  tipo: TipoActividad;
  titulo: string;
  fecha: string; // ISO con hora
  lugar: string;
  comunidad: Alcance; // barrio, comuna o territorio donde ocurre
  responsable?: string;
  estado: EstadoActividad;
  asistentesEsperados?: number;
  asistentesReales?: number;
  notas?: string;
  evento?: string; // id del evento público, si se anunció en el feed
}

export type EstadoCompromiso = 'registrado' | 'en_estudio' | 'incluido' | 'descartado';

/**
 * Compromiso programático con una comunidad: qué se impulsará, con quién y dónde.
 * Nunca un beneficio individual a cambio de votos.
 */
export interface Compromiso {
  id: string;
  candidato: string;
  que: string;
  conQuien: string;
  comunidad: Alcance;
  estado: EstadoCompromiso;
  fecha: string; // ISO
  actividad?: string; // visita o actividad donde surgió
  aporte?: string; // aporte ciudadano del que viene
  propuesta?: string; // propuesta del programa en la que quedó incluido
}

/* ---------- Equipo de campaña ---------- */

export type RolEquipo = 'coordinador' | 'lider' | 'marketing';

/** Persona del equipo: coordinador (por zona), líder comunal (por barrio) o marketing. */
export interface Miembro {
  id: string;
  candidato: string;
  nombre: string;
  rol: RolEquipo;
  superior?: string; // id del coordinador de un líder
  zona: Alcance; // territorio a cargo (comuna, barrio o todo el municipio)
  delegadoAgenda: boolean; // valida visitas y maneja la agenda del candidato
  delegadoAprobaciones: boolean; // aprueba colaboradores y cupos
  cupo?: number; // colaboradores que puede registrar un líder
  activo: boolean;
  desde: string; // ISO
}

/** Código para unirse a una campaña con un rol, un territorio y unas funciones. */
export interface Invitacion {
  codigo: string;
  candidato: string;
  rol: RolEquipo;
  zona: Alcance;
  superior?: string;
  delegadoAgenda: boolean;
  delegadoAprobaciones: boolean;
  vence: string; // ISO
  usadaPor?: string; // id del miembro creado
}

export type EstadoColaborador = 'por_verificar' | 'activo' | 'rechazado';

/** Simpatizante registrado por un líder (sin cuenta propia en el MVP). */
export interface Colaborador {
  id: string;
  candidato: string;
  lider: string; // id del miembro
  nombre: string;
  cedula: string;
  celular?: string;
  fechaNacimiento: string; // AAAA-MM-DD
  barrio?: string; // id de zona
  barrioTexto: string;
  ayudaEn: string[];
  fotoRostro?: string; // ruta privada o uri local
  fotoCedula?: string;
  autorizacion: string; // ISO: cuándo firmó la autorización de datos
  estado: EstadoColaborador;
  creado: string; // ISO
}

/** Reporte de una tarea con su evidencia. */
export interface ReporteTarea {
  notas: string;
  cantidad?: number; // volantes, casas visitadas…
  participantes: string[]; // ids de colaboradores
  fotos: string[]; // rutas privadas o uris locales
  fecha: string; // ISO
}

export type EstadoTarea = 'pendiente' | 'reportada';

/** Tarea asignada a un miembro del equipo. Una tarea para varios líderes crea una por cada uno (mismo grupo). */
export interface Tarea {
  id: string;
  candidato: string;
  grupo: string;
  titulo: string;
  asignadaA: string; // id del miembro
  asignadaPor?: string; // id del miembro; vacío = el candidato
  fechaLimite?: string; // ISO
  evidencia: boolean; // foto obligatoria al reportar
  estado: EstadoTarea;
  reporte?: ReporteTarea;
  creada: string; // ISO
}

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada';

/** Visita propuesta por un líder; al aprobarla queda en la agenda del candidato. */
export interface SolicitudVisita {
  id: string;
  candidato: string;
  propuestaPor: string; // id del miembro
  lugar: string;
  fecha: string; // ISO con hora
  comunidad: Alcance;
  asistentesEsperados?: number;
  temas: string[];
  estado: EstadoSolicitud;
  actividad?: string; // la que se creó al aprobarla
  motivo?: string; // si se rechazó o se pidió otra hora
  creada: string; // ISO
}
