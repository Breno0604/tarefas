import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { GESTOR_ID, TAREFAS } from '../data/mockData';
import { EMPTY_FILTERS } from '../utils/tasks';
import { loadState, saveState } from '../services/storage';
import { useToast } from './ToastContext';
import { appReducer } from './appReducer';
import { toastMessage } from './toastMessage';
import type { AppAction, AppState } from './types';

export type { AppAction, AppState } from './types';

const initialState: AppState = {
  tasks: TAREFAS,
  currentUserId: GESTOR_ID,
  section: 'tarefas',
  view: 'lista',
  sidebarCollapsed: false,
  filters: EMPTY_FILTERS,
  modal: { type: 'none' },
  past: [],
};

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

function initState(): AppState {
  const saved = loadState();
  if (saved) {
    // Persiste apenas as tarefas; o app sempre abre como gestor (usuário atual é estado de sessão).
    return {
      ...initialState,
      tasks: saved.tasks,
    };
  }
  return initialState;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, initState);
  const toast = useToast();

  useEffect(() => {
    saveState({ tasks: state.tasks });
  }, [state.tasks]);

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
