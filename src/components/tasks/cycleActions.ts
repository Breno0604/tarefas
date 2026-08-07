import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  ListTodo,
  PauseCircle,
  Play,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
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
    case 'A_FAZER':
      if (task.status === 'SUSPENSA')
        return { icon: Play, label: 'Reativar', cls: 'text-emerald-600 hover:bg-emerald-50', target };
      return { icon: ListTodo, label: 'Planejar', cls: 'text-cyan-600 hover:bg-cyan-50', target };
    case 'EM_ANDAMENTO':
      if (task.status === 'CONCLUIDA')
        return { icon: RotateCcw, label: 'Retomar', cls: 'text-rose-600 hover:bg-rose-50', target };
      return { icon: Play, label: 'Iniciar', cls: 'text-amber-600 hover:bg-amber-50', target };
    case 'SUSPENSA':
      return { icon: PauseCircle, label: 'Suspender', cls: 'text-violet-600 hover:bg-violet-50', target };
    case 'CONCLUIDA':
      return { icon: CheckCircle2, label: 'Concluir', cls: 'text-emerald-600 hover:bg-emerald-50', target };
    case 'ARQUIVADA':
      return { icon: Archive, label: 'Arquivar', cls: 'text-slate-600 hover:bg-slate-100', target };
    case 'CAIXA_ENTRADA':
      // Único caminho de volta para a caixa de entrada: desarquivar.
      if (task.status === 'ARQUIVADA')
        return { icon: ArchiveRestore, label: 'Desarquivar', cls: 'text-blue-600 hover:bg-blue-50', target };
      return null;
    default:
      return null;
  }
}
