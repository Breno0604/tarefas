import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import { EMPTY_FILTERS } from '../utils/tasks';
import { loadState, saveState } from '../services/storage';
import { storageProvider } from '../services/index';
import { getSupabaseClient } from '../services/supabaseClient';
import { loginPorUsuario, sair } from '../services/auth';
import { useToast } from './ToastContext';
import { appReducer } from './appReducer';
import { toastMessage } from './toastMessage';
import type { AppAction, AppState } from './types';

export type { AppAction, AppState } from './types';

export type Boot =
  | { status: 'auth-carregando' }
  | { status: 'nao-autenticado' }
  | { status: 'carregando' }
  | { status: 'pronto' }
  | { status: 'erro'; mensagem: string };

const initialState: AppState = {
  tasks: [],
  view: 'lista',
  sidebarOpen: false,
  filters: EMPTY_FILTERS,
  kpiCollapsed: false,
  filtersOpen: true,
  modal: { type: 'none' },
  past: [],
  tema: 'claro',
};

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  boot: Boot;
  login: (usuario: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  tentarNovamente: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Estado inicial do reducer. Providers síncronos (apenas testes) já entregam
 * os dados aqui; o Supabase carrega de forma assíncrona logo após o login.
 */
function initState(): AppState {
  const salvos = storageProvider.loadSync?.() ?? null;
  if (!salvos) return initialState;
  return {
    ...initialState,
    tasks: salvos.tasks,
    tema: salvos.preferencias?.tema ?? initialState.tema,
    view: salvos.preferencias?.view ?? initialState.view,
    kpiCollapsed: salvos.preferencias?.kpiCollapsed ?? initialState.kpiCollapsed,
  };
}

const bootInicial: Boot = storageProvider.loadSync
  ? { status: 'pronto' }
  : { status: 'auth-carregando' };

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, initState);
  const [boot, setBoot] = useState<Boot>(bootInicial);
  const toast = useToast();
  const bootPronto = useRef(storageProvider.loadSync !== undefined);
  const jaSincronizou = useRef(false);
  const filaGravacoes = useRef<Promise<void>>(Promise.resolve());

  // Autenticação: acompanha a sessão do Supabase (só quando há login).
  useEffect(() => {
    if (!storageProvider.requiresAuth) return;
    let ativo = true;
    const client = getSupabaseClient();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!ativo) return;
      setBoot((atual) => {
        if (session) return atual.status === 'pronto' ? atual : { status: 'carregando' };
        return { status: 'nao-autenticado' };
      });
    });
    client.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setBoot(data.session ? { status: 'carregando' } : { status: 'nao-autenticado' });
    });
    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  // Carregamento dos dados (tarefas + preferências) quando há sessão.
  useEffect(() => {
    if (boot.status !== 'carregando') return;
    let ativo = true;
    loadState()
      .then((salvos) => {
        if (!ativo) return;
        dispatch({
          type: 'HYDRATE',
          tasks: salvos?.tasks ?? [],
          preferencias: salvos?.preferencias ?? null,
        });
        bootPronto.current = true;
        setBoot({ status: 'pronto' });
      })
      .catch(() => {
        if (!ativo) return;
        setBoot({
          status: 'erro',
          mensagem:
            'Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.',
        });
      });
    return () => {
      ativo = false;
    };
  }, [boot.status]);

  // Sincronização com o Supabase a cada mudança de dados/preferências.
  useEffect(() => {
    if (!bootPronto.current) return;
    if (!jaSincronizou.current) {
      jaSincronizou.current = true;
      return; // ignora a primeira execução (logo após o carregamento)
    }
    filaGravacoes.current = filaGravacoes.current
      .then(() =>
        saveState({
          tasks: state.tasks,
          preferencias: { tema: state.tema, view: state.view, kpiCollapsed: state.kpiCollapsed },
        })
      )
      .catch(() => {
        toast.error('Não foi possível salvar no Supabase. Verifique sua conexão.');
      });
  }, [state.tasks, state.tema, state.view, state.kpiCollapsed, toast]);

  // Aplica o tema ao <html> (classe dark) sempre que ele muda.
  useEffect(() => {
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

  const login = useMemo(
    () => async (usuario: string, senha: string) => {
      await loginPorUsuario(usuario, senha);
    },
    []
  );

  const logout = useMemo(
    () => async () => {
      await sair();
    },
    []
  );

  const tentarNovamente = useMemo(
    () => () => {
      setBoot({ status: 'carregando' });
    },
    []
  );

  const value = useMemo(
    () => ({ state, dispatch: dispatchWithToast, boot, login, logout, tentarNovamente }),
    [state, boot, login, logout, tentarNovamente]
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
