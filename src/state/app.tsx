/**
 * Estado global de la sesión. Sin Supabase vive en memoria; con Supabase, al
 * abrir se carga el ciudadano, la campaña y los aportes de quien usa la app,
 * y cada cambio se guarda en la base de datos.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as remoto from '@/data/remoto';
import {
  asistir, enviarAporte as guardarAporte, getCandidato, getMiembro, guardarCampana, ponerMiFoto, seguir, useDatos, usarInvitacion,
} from '@/data/repo';
import type {
  ArchivoLocal, Candidato, Cargo, Ciudadano, Miembro, Etapa, ModoUso, TipoAporte, TipoAval, TipoLista, Tema,
} from '@/data/types';

/** Borrador del registro de un aspirante o candidato, paso a paso. */
export interface BorradorCandidatura {
  etapa?: Etapa;
  cargo?: Cargo;
  departamento?: string;
  municipio?: string;
  agruparSubregiones?: boolean;
  sinComunas?: boolean;
  tipoAval?: TipoAval;
  partidos: string[];
  grupoSignificativo?: string;
  tipoLista?: TipoLista;
  numero?: string;
  nombre?: string;
  usuario?: string;
  modo?: ModoUso;
  /** Aval o constancia elegidos en el teléfono, por subir. */
  soporte?: ArchivoLocal;
}

/** Con Supabase, la app espera a cargar los datos antes de mostrarse. */
export type Carga = { estado: 'cargando' } | { estado: 'lista' } | { estado: 'error'; mensaje: string };

interface AppState {
  carga: Carga;
  reintentarCarga: () => void;
  /** Vuelve a cargar los datos sin mostrar la pantalla de carga (p. ej. tras entrar con el celular). */
  recargar: () => Promise<void>;

  ciudadano: Ciudadano | null;
  registrarCiudadano: (c: Omit<Ciudadano, 'siguiendo' | 'asistire'>) => void;
  alternarSeguir: (candidatoId: string) => void;
  alternarAsistire: (eventoId: string) => void;
  /** Foto de perfil de quien usa la app (ciudadano y equipo); null la quita. */
  cambiarMiFoto: (a: ArchivoLocal | null) => void;

  /** Ids de los aportes que envió este ciudadano. */
  misAportes: string[];
  enviarAporte: (a: { candidato: string; tipo: TipoAporte; tema: Tema; texto: string; lugar: string }) => void;

  borrador: BorradorCandidatura;
  actualizarBorrador: (cambios: Partial<BorradorCandidatura>) => void;
  reiniciarBorrador: () => void;
  candidatura: BorradorCandidatura | null;
  /** Id de la campaña de quien usa la app como aspirante o candidato. */
  campanaId: string | null;
  confirmarCandidatura: (b?: BorradorCandidatura) => void;
  cargarBorrador: (b: BorradorCandidatura) => void;
  /** Entra a la campaña de prueba con datos, como candidata, coordinador o líder. */
  entrarComoDemo: (rol?: 'candidato' | 'coordinador' | 'lider') => void;

  /** Membresía en el equipo de una campaña (coordinador, líder o marketing). */
  miembroId: string | null;
  /** Se une a una campaña con un código de invitación. */
  unirseConCodigo: (codigo: string, nombre: string) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

const BORRADOR_VACIO: BorradorCandidatura = { partidos: [] };
const CAMPANA_DEMO = 'k1';
const MIEMBRO_DEMO = { coordinador: 'q1', lider: 'l1' } as const;

/** Datos de una campaña existente en el formato del registro paso a paso. */
function borradorDe(c: Candidato): BorradorCandidatura {
  return {
    etapa: c.etapa, cargo: c.cargo, departamento: c.departamento, municipio: c.municipio,
    tipoAval: c.tipoAval, partidos: c.partidos, grupoSignificativo: c.grupoSignificativo,
    tipoLista: c.tipoLista, numero: c.numero ? String(c.numero) : undefined,
    nombre: c.nombre, usuario: c.usuario, modo: c.modo ?? 'campana_completa',
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ciudadano, setCiudadano] = useState<Ciudadano | null>(null);
  // Sin Supabase, el ciudadano de prueba ya escribió los aportes a1 y a2.
  const [misAportes, setMisAportes] = useState<string[]>(remoto.conectado ? [] : ['a1', 'a2']);
  const [borrador, setBorrador] = useState<BorradorCandidatura>(BORRADOR_VACIO);
  const [candidatura, setCandidatura] = useState<BorradorCandidatura | null>(null);
  const [campanaId, setCampanaId] = useState<string | null>(null);
  const [miembroId, setMiembroId] = useState<string | null>(null);
  const [carga, setCarga] = useState<Carga>({ estado: remoto.conectado ? 'cargando' : 'lista' });

  const cargar = useCallback((silencioso?: boolean) => {
    if (!remoto.conectado) return Promise.resolve();
    if (!silencioso) setCarga({ estado: 'cargando' });
    return remoto
      .cargarTodo()
      .then((sesion) => {
        // Al cambiar de cuenta (p. ej. al entrar con el celular) se reemplaza todo lo anterior.
        setCiudadano(sesion.ciudadano);
        setMisAportes(sesion.misAportes);
        setCampanaId(sesion.campana?.id ?? null);
        setMiembroId(sesion.miembro ?? null);
        setCandidatura(sesion.campana ? borradorDe(sesion.campana) : null);
        setCarga({ estado: 'lista' });
      })
      .catch((e: unknown) => setCarga({ estado: 'error', mensaje: e instanceof Error ? e.message : String(e) }));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const value = useMemo<AppState>(
    () => ({
      carga,
      reintentarCarga: () => {
        cargar();
      },
      recargar: () => cargar(true),

      ciudadano,
      registrarCiudadano: (c) => {
        setCiudadano({ ...c, siguiendo: [], asistire: [] });
        remoto.guardarPerfilCiudadano(c);
      },
      alternarSeguir: (id) => {
        if (!ciudadano) return;
        const si = !ciudadano.siguiendo.includes(id);
        setCiudadano({ ...ciudadano, siguiendo: si ? [...ciudadano.siguiendo, id] : ciudadano.siguiendo.filter((x) => x !== id) });
        seguir(id, si);
      },
      alternarAsistire: (id) => {
        if (!ciudadano) return;
        const si = !ciudadano.asistire.includes(id);
        setCiudadano({ ...ciudadano, asistire: si ? [...ciudadano.asistire, id] : ciudadano.asistire.filter((x) => x !== id) });
        asistir(id, si);
      },

      cambiarMiFoto: (a) => {
        const foto = ponerMiFoto(a, miembroId);
        setCiudadano((prev) => (prev ? { ...prev, foto } : prev));
      },

      misAportes,
      enviarAporte: (a) => {
        const id = guardarAporte(a);
        setMisAportes((prev) => [id, ...prev]);
      },

      borrador,
      actualizarBorrador: (cambios) => setBorrador((prev) => ({ ...prev, ...cambios })),
      reiniciarBorrador: () => setBorrador(BORRADOR_VACIO),
      candidatura,
      campanaId,
      confirmarCandidatura: (b) => {
        const datos = b ?? borrador;
        if (!datos.etapa || !datos.cargo || !datos.departamento || !datos.usuario) return;
        const id = guardarCampana(
          {
            nombre: datos.nombre?.trim() || `@${datos.usuario}`,
            usuario: datos.usuario,
            etapa: datos.etapa,
            cargo: datos.cargo,
            departamento: datos.departamento,
            municipio: datos.municipio,
            tipoAval: datos.tipoAval,
            partidos: datos.partidos,
            grupoSignificativo: datos.grupoSignificativo,
            tipoLista: datos.tipoLista,
            numero: datos.numero ? Number(datos.numero) : undefined,
            modo: datos.modo,
          },
          campanaId ?? undefined,
          datos.soporte,
        );
        setCampanaId(id);
        // El archivo ya quedó en camino al servidor: no se vuelve a subir.
        setCandidatura({ ...datos, soporte: undefined });
      },
      cargarBorrador: (b) => setBorrador(b),
      entrarComoDemo: (rol = 'candidato') => {
        if (rol !== 'candidato') {
          setMiembroId(MIEMBRO_DEMO[rol]);
          return;
        }
        const c = getCandidato(CAMPANA_DEMO);
        if (!c) return;
        setCampanaId(c.id);
        setCandidatura(borradorDe(c));
      },

      miembroId,
      unirseConCodigo: async (codigo, nombre) => {
        const id = await usarInvitacion(codigo, nombre);
        // Con Supabase hay que traer los datos de la campaña a la que se unió.
        if (remoto.conectado) await cargar(true);
        setMiembroId(id);
      },
    }),
    [carga, cargar, ciudadano, misAportes, borrador, candidatura, campanaId, miembroId],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}

/** La campaña de quien usa la app como aspirante o candidato; se actualiza con cada cambio. */
export function useMiCampana(): Candidato | undefined {
  const { campanaId } = useApp();
  useDatos();
  return campanaId ? getCandidato(campanaId) : undefined;
}

/** La membresía de quien usa la app en el equipo de una campaña; se actualiza con cada cambio. */
export function useMiMiembro(): Miembro | undefined {
  const { miembroId } = useApp();
  useDatos();
  return getMiembro(miembroId ?? undefined);
}
