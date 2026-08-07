import type { Dispatch } from 'react';
import type { Filters } from '../types';
import type { AppAction } from './types';

/**
 * Abre a lista de Tarefas aplicando filtros (ou limpando-os quando nenhum é passado).
 * A navegação é fixa em Tarefas; unifica os atalhos da Sidebar e os KPIs.
 */
export function openTarefas(
  dispatch: Dispatch<AppAction>,
  filters?: Partial<Filters>
): void {
  dispatch({ type: 'RESET_FILTERS' });
  if (filters) {
    dispatch({ type: 'SET_FILTERS', filters });
  }
}
