import { Check, PauseCircle, XCircle } from 'lucide-react';
import type { TaskStatus } from '../../types';
import { STATUS_ORDER } from '../../utils/status';

// SUSPENSA e ARQUIVADA são estados laterais: não aparecem como etapa do ciclo.
const STEPS = STATUS_ORDER.filter((s) => s !== 'SUSPENSA' && s !== 'ARQUIVADA');

function stepState(status: TaskStatus, index: number): 'done' | 'current' | 'todo' {
  if (status === 'SUSPENSA' || status === 'ARQUIVADA') return 'todo';
  const pos = STATUS_ORDER.indexOf(status);
  if (index < pos) return 'done';
  if (index === pos) return 'current';
  return 'todo';
}

interface CycleStepperProps {
  status: TaskStatus;
  compact?: boolean;
}

export default function CycleStepper({ status, compact = false }: CycleStepperProps) {
  const isSuspensa = status === 'SUSPENSA';
  const isArquivada = status === 'ARQUIVADA';

  return (
    <div className="flex items-center" title={`Ciclo: ${status}`}>
      {STEPS.map((step, index) => {
        const state = stepState(status, index);
        return (
          <div key={step} className="flex items-center">
            {index > 0 && (
              <div
                className={`h-0.5 ${compact ? 'w-4' : 'w-8'} ${
                  state === 'todo' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-indigo-500'
                }`}
              />
            )}
            <div
              className={`flex items-center justify-center rounded-full font-semibold ${
                compact ? 'h-5 w-5 text-[10px]' : 'h-7 w-7 text-xs'
              } ${
                state === 'done'
                  ? 'bg-indigo-500 text-white'
                  : state === 'current'
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950/60'
                    : 'border border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              {state === 'done' ? <Check className={compact ? 'h-3 w-3' : 'h-4 w-4'} /> : index + 1}
            </div>
          </div>
        );
      })}
      {isSuspensa && (
        <div className="ml-2 flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-500/30">
          <PauseCircle className="h-3 w-3" />
          Suspensa
        </div>
      )}
      {isArquivada && (
        <div className="ml-2 flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-700/60 dark:text-slate-300 dark:ring-slate-500/40">
          <XCircle className="h-3 w-3" />
          Arquivada
        </div>
      )}
    </div>
  );
}
