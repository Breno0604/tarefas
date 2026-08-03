import type { Dispatch } from 'react';
import type { Filters } from '../types';
import type { AppAction } from './types';

/**
 * Navega para a seção Tarefas aplicando filtros (ou limpando-os quando nenhum é passado).
 * Unifica os atalhos da Sidebar e os KPIs.
 */
export function openTarefas(
  dispatch: Dispatch<AppAction>,
  filters?: Partial<Filters>
): void {
  dispatch({ type: 'SET_SECTION', section: 'tarefas' });
  if (filters) {
    dispatch({ type: 'SET_FILTERS', filters });
  } else {
    dispatch({ type: 'RESET_FILTERS' });
  }
}
