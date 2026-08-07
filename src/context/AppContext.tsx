import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { TAREFAS } from '../data/mockData';
import { EMPTY_FILTERS } from '../utils/tasks';
import { loadState, saveState } from '../services/storage';
import { useToast } from './ToastContext';
import { appReducer } from './appReducer';
import { toastMessage } from './toastMessage';
import type { AppAction, AppState } from './types';

export type { AppAction, AppState } from './types';

const initialState: AppState = {
  tasks: TAREFAS,
  view: 'lista',
  sidebarOpen: false,
  filters: EMPTY_FILTERS,
  kpiCollapsed: false,
  filtersOpen: true,
  modal: { type: 'none' },
  past: [],
  tema: 'claro',
};

const KPI_COLLAPSED_KEY = 'kpiCollapsed';
const TEMA_KEY = 'tarefas.tema';

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

function initState(): AppState {
  const saved = loadState();
  const kpiCollapsed = localStorage.getItem(KPI_COLLAPSED_KEY) === '1';
  const tema: AppState['tema'] = localStorage.getItem(TEMA_KEY) === 'escuro' ? 'escuro' : 'claro';
  if (saved) {
    // Persiste apenas as tarefas; demais campos são estado de sessão (não persistido).
    return {
      ...initialState,
      kpiCollapsed,
      tema,
      tasks: saved.tasks,
    };
  }
  return { ...initialState, kpiCollapsed, tema };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, initState);
  const toast = useToast();

  useEffect(() => {
    saveState({ tasks: state.tasks });
  }, [state.tasks]);

  useEffect(() => {
    localStorage.setItem(KPI_COLLAPSED_KEY, state.kpiCollapsed ? '1' : '0');
  }, [state.kpiCollapsed]);

  useEffect(() => {
    localStorage.setItem(TEMA_KEY, state.tema);
    document.documentElement.classList.toggle('dark', state.tema === 'escuro');
  }, [state.tema]);

  const dispatchWithToast = (action: AppAction) => {
    const next = appReducer(state, action);
    dispatch(action);
    if (next.tasks === state.tasks) return; // ação sem efeito (ex.: transição inválida)
    const message = toastMessage(action);
    if (message) {
      toast.success(message, {
        label: 'Desfazer',
        onClick: () => dispatch({ type: 'UNDO' }),
      });
    }
  };

  const value = useMemo(() => ({ state, dispatch: dispatchWithToast }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
