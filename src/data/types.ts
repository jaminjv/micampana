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
