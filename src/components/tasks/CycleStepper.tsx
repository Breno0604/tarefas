import { Check, RotateCcw } from 'lucide-react';
import type { TaskStatus } from '../../types';
import { STATUS_ORDER } from '../../utils/status';

function stepState(status: TaskStatus, index: number): 'done' | 'current' | 'todo' {
  if (status === 'DEVOLVIDA') {
    if (index < 3) return 'done';
    if (index === 3) return 'current';
    return 'todo';
  }
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
  const isDevolvida = status === 'DEVOLVIDA';

  return (
    <div className="flex items-center" title={`Ciclo: ${status}`}>
      {STATUS_ORDER.map((step, index) => {
        const state = stepState(status, index);
        return (
          <div key={step} className="flex items-center">
            {index > 0 && (
              <div
                className={`h-0.5 ${compact ? 'w-4' : 'w-8'} ${
                  state === 'todo' ? 'bg-slate-200' : 'bg-indigo-500'
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
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : 'border border-slate-300 bg-white text-slate-400'
              }`}
            >
              {state === 'done' ? <Check className={compact ? 'h-3 w-3' : 'h-4 w-4'} /> : index + 1}
            </div>
          </div>
        );
      })}
      {isDevolvida && (
        <div className="ml-2 flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
          <RotateCcw className="h-3 w-3" />
          Devolvida
        </div>
      )}
    </div>
  );
}
