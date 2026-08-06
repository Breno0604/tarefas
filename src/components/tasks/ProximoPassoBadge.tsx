import { Clock, UserRound } from 'lucide-react';
import type { Task } from '../../types';
import { idadeRelativa } from '../../utils/date';
import { proximoPasso } from '../../utils/status';
import { diasAguardandoAprovacao } from '../../utils/tasks';

interface ProximoPassoBadgeProps {
  task: Task;
  now?: Date;
}

export default function ProximoPassoBadge({ task, now }: ProximoPassoBadgeProps) {
  const passo = proximoPasso(task.status);
  if (passo === 'nenhum') return null;

  if (passo === 'gestor') {
    const dias = diasAguardandoAprovacao(task, now);
    const texto = dias >= 1 ? `aguardando gestor ${idadeRelativa(dias)}` : 'aguardando gestor';
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
        <Clock className="h-3 w-3" />
        {texto}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      <UserRound className="h-3 w-3" />
      vez do colaborador
    </span>
  );
}
