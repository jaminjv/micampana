/**
 * Estado global de la sesión. Hoy vive en memoria; con Supabase, el ciudadano,
 * los aportes y la candidatura se guardan en la base de datos.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { APORTES_INICIALES } from '@/data/mock';
import type {
  Aporte, Cargo, Ciudadano, Etapa, ModoUso, TipoAporte, TipoAval, TipoLista, Tema,
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
  usuario?: string;
  modo?: ModoUso;
}

interface AppState {
  ciudadano: Ciudadano | null;
  registrarCiudadano: (c: Omit<Ciudadano, 'siguiendo' | 'asistire'>) => void;
  alternarSeguir: (candidatoId: string) => void;
  alternarAsistire: (eventoId: string) => void;

  aportes: Aporte[];
  enviarAporte: (a: { candidato: string; tipo: TipoAporte; tema: Tema; texto: string }) => void;

  borrador: BorradorCandidatura;
  actualizarBorrador: (cambios: Partial<BorradorCandidatura>) => void;
  reiniciarBorrador: () => void;
  candidatura: BorradorCandidatura | null;
  confirmarCandidatura: (b?: BorradorCandidatura) => void;
  cargarBorrador: (b: BorradorCandidatura) => void;
}

const AppContext = createContext<AppState | null>(null);

const BORRADOR_VACIO: BorradorCandidatura = { partidos: [] };

export function AppProvider({ children }: { children: ReactNode }) {
  const [ciudadano, setCiudadano] = useState<Ciudadano | null>(null);
  const [aportes, setAportes] = useState<Aporte[]>(APORTES_INICIALES);
  const [borrador, setBorrador] = useState<BorradorCandidatura>(BORRADOR_VACIO);
  const [candidatura, setCandidatura] = useState<BorradorCandidatura | null>(null);

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

      aportes,
      enviarAporte: (a) =>
        setAportes((prev) => [
          { ...a, id: `a${Date.now()}`, estado: 'enviado', fecha: new Date().toISOString() },
          ...prev,
        ]),

      borrador,
      actualizarBorrador: (cambios) => setBorrador((prev) => ({ ...prev, ...cambios })),
      reiniciarBorrador: () => setBorrador(BORRADOR_VACIO),
      candidatura,
      confirmarCandidatura: (b) => setCandidatura(b ?? borrador),
      cargarBorrador: (b) => setBorrador(b),
    }),
    [ciudadano, aportes, borrador, candidatura],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
