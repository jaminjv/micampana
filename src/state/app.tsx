/**
 * Estado global de la sesión. Hoy vive en memoria; con Supabase, el ciudadano,
 * los aportes y la candidatura se guardan en la base de datos.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { enviarAporte as guardarAporte, getCandidato, guardarCampana, useDatos } from '@/data/repo';
import type {
  Candidato, Cargo, Ciudadano, Etapa, ModoUso, TipoAporte, TipoAval, TipoLista, Tema,
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
}

interface AppState {
  ciudadano: Ciudadano | null;
  registrarCiudadano: (c: Omit<Ciudadano, 'siguiendo' | 'asistire'>) => void;
  alternarSeguir: (candidatoId: string) => void;
  alternarAsistire: (eventoId: string) => void;

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
  /** Entra como una campaña de prueba con datos, para conocer las herramientas. */
  entrarComoDemo: () => void;
}

const AppContext = createContext<AppState | null>(null);

const BORRADOR_VACIO: BorradorCandidatura = { partidos: [] };
const CAMPANA_DEMO = 'k1';

export function AppProvider({ children }: { children: ReactNode }) {
  const [ciudadano, setCiudadano] = useState<Ciudadano | null>(null);
  const [misAportes, setMisAportes] = useState<string[]>(['a1', 'a2']);
  const [borrador, setBorrador] = useState<BorradorCandidatura>(BORRADOR_VACIO);
  const [candidatura, setCandidatura] = useState<BorradorCandidatura | null>(null);
  const [campanaId, setCampanaId] = useState<string | null>(null);

  const value = useMemo<AppState>(
    () => ({
      ciudadano,
      registrarCiudadano: (c) => setCiudadano({ ...c, siguiendo: [], asistire: [] }),
      alternarSeguir: (id) =>
        setCiudadano((prev) =>
          prev && {
            ...prev,
            siguiendo: prev.siguiendo.includes(id) ? prev.siguiendo.filter((x) => x !== id) : [...prev.siguiendo, id],
          },
        ),
      alternarAsistire: (id) =>
        setCiudadano((prev) =>
          prev && {
            ...prev,
            asistire: prev.asistire.includes(id) ? prev.asistire.filter((x) => x !== id) : [...prev.asistire, id],
          },
        ),

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
        );
        setCampanaId(id);
        setCandidatura(datos);
      },
      cargarBorrador: (b) => setBorrador(b),
      entrarComoDemo: () => {
        const c = getCandidato(CAMPANA_DEMO);
        if (!c) return;
        setCampanaId(c.id);
        setCandidatura({
          etapa: c.etapa, cargo: c.cargo, departamento: c.departamento, municipio: c.municipio,
          tipoAval: c.tipoAval, partidos: c.partidos, grupoSignificativo: c.grupoSignificativo,
          tipoLista: c.tipoLista, numero: c.numero ? String(c.numero) : undefined,
          nombre: c.nombre, usuario: c.usuario, modo: c.modo ?? 'campana_completa',
        });
      },
    }),
    [ciudadano, misAportes, borrador, candidatura, campanaId],
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
