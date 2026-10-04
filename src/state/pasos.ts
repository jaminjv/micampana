/** Orden de pasos del registro según etapa y cargo. */
import { router } from 'expo-router';

import { CARGOS } from '@/data/catalogos';
import type { BorradorCandidatura } from './app';

export type Paso = 'etapa' | 'cargo' | 'territorio' | 'aval' | 'lista' | 'usuario';

export function pasosDe(b: BorradorCandidatura): Paso[] {
  const pasos: Paso[] = ['etapa', 'cargo', 'territorio'];
  if (b.etapa === 'candidato') {
    pasos.push('aval');
    if (b.cargo && CARGOS[b.cargo].corporacion) pasos.push('lista');
  }
  pasos.push('usuario');
  return pasos;
}

export function posicion(b: BorradorCandidatura, paso: Paso) {
  const pasos = pasosDe(b);
  return { paso: pasos.indexOf(paso) + 1, total: pasos.length };
}

/** Va al paso siguiente; si es una actualización desde aspirante, vuelve al panel al terminar. */
export function siguiente(b: BorradorCandidatura, actual: Paso, actualizando: boolean, confirmar: (b: BorradorCandidatura) => void) {
  const pasos = pasosDe(b);
  const sig = pasos[pasos.indexOf(actual) + 1];
  if (actualizando && (sig === 'usuario' || !sig)) {
    confirmar(b);
    router.dismissTo('/panel');
    return;
  }
  router.push({ pathname: `/registro/${sig}`, params: actualizando ? { actualizar: '1' } : {} });
}
