/**
 * Tema claro u oscuro de toda la app. La elección se guarda en el teléfono;
 * "sistema" sigue la configuración del teléfono, también si cambia con la app abierta.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';

import { aplicarTema, type PreferenciaTema } from '@/theme';

const CLAVE = 'nexo.tema';

interface Tema {
  preferencia: PreferenciaTema;
  oscuro: boolean;
  cambiarTema: (p: PreferenciaTema) => void;
}

const TemaContext = createContext<Tema | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaTema | null>(null);
  const [oscuro, setOscuro] = useState(false);
  // Al cambiar el tema se vuelven a dibujar todas las pantallas con los colores nuevos.
  const [version, setVersion] = useState(0);

  const aplicar = useCallback((p: PreferenciaTema) => {
    setOscuro(aplicarTema(p));
    setPreferencia(p);
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .catch(() => null)
      .then((v) => aplicar(v === 'claro' || v === 'oscuro' ? v : 'sistema'));
  }, [aplicar]);

  useEffect(() => {
    if (preferencia !== 'sistema') return;
    const sub = Appearance.addChangeListener(() => aplicar('sistema'));
    return () => sub.remove();
  }, [preferencia, aplicar]);

  const value = useMemo<Tema>(
    () => ({
      preferencia: preferencia ?? 'sistema',
      oscuro,
      cambiarTema: (p) => {
        aplicar(p);
        AsyncStorage.setItem(CLAVE, p).catch(() => {});
      },
    }),
    [preferencia, oscuro, aplicar],
  );

  // Mientras se lee la preferencia no se dibuja nada (sigue la pantalla de inicio).
  if (!preferencia) return null;
  return (
    <TemaContext.Provider value={value}>
      <Fragment key={version}>{children}</Fragment>
    </TemaContext.Provider>
  );
}

export function useTema(): Tema {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error('useTema debe usarse dentro de TemaProvider');
  return ctx;
}
