import { ArrowDownToLine, CheckCircle2, Play, RotateCcw, XCircle, type LucideIcon } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';

export interface CycleAction {
  icon: LucideIcon;
  label: string;
  cls: string;
  target: TaskStatus;
}

/** Ação visual do ciclo para um alvo de transição (rótulo varia conforme o status atual). */
export function cycleActionFor(task: Task, target: TaskStatus): CycleAction | null {
  switch (target) {
    case 'RECEBIDA':
      return { icon: ArrowDownToLine, label: 'Receber', cls: 'text-cyan-600 hover:bg-cyan-50', target };
    case 'EM_EXECUCAO':
      if (task.status === 'DEVOLVIDA')
        return { icon: RotateCcw, label: 'Retomar', cls: 'text-rose-600 hover:bg-rose-50', target };
      if (task.status === 'CONCLUIDA')
        return { icon: RotateCcw, label: 'Reabrir', cls: 'text-rose-600 hover:bg-rose-50', target };
      if (task.status === 'FINALIZADA')
        return { icon: RotateCcw, label: 'Reabrir aprovação', cls: 'text-rose-600 hover:bg-rose-50', target };
      return { icon: Play, label: 'Iniciar', cls: 'text-amber-600 hover:bg-amber-50', target };
    case 'CONCLUIDA':
      return { icon: CheckCircle2, label: 'Concluir', cls: 'text-violet-600 hover:bg-violet-50', target };
    case 'CANCELADA':
      return { icon: XCircle, label: 'Cancelar', cls: 'text-slate-600 hover:bg-slate-100', target };
    default:
      return null;
  }
}
