import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  success: (message: string, action?: ToastAction) => void;
  error: (message: string, action?: ToastAction) => void;
  info: (message: string, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const COLORS: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-rose-500',
  info: 'text-sky-500',
};

const AUTO_DISMISS_MS = 4000;
const ACTION_DISMISS_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string, action?: ToastAction) => {
      const id = nextId.current++;
      setToasts((prev) => [
        // Ação de desfazer vale apenas para a última mutação: toasts anteriores perdem a ação.
        ...(action ? prev.map((t) => (t.action ? { ...t, action: undefined } : t)) : prev),
        { id, type, message, action },
      ]);
      window.setTimeout(() => remove(id), action ? ACTION_DISMISS_MS : AUTO_DISMISS_MS);
    },
    [remove]
  );

  const value = useMemo(
    () => ({
      success: (message: string, action?: ToastAction) => push('success', message, action),
      error: (message: string, action?: ToastAction) => push('error', message, action),
      info: (message: string, action?: ToastAction) => push('info', message, action),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[60] flex w-80 flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
              role="status"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${COLORS[t.type]}`} />
              <p className="flex-1 text-sm leading-relaxed text-slate-700">{t.message}</p>
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.onClick();
                    remove(t.id);
                  }}
                  className="shrink-0 rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => remove(t.id)}
                className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
                aria-label="Fechar notificação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
