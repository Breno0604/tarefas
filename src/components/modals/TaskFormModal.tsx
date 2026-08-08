import { useState } from 'react';
import type { Priority, Recorrencia } from '../../types';
import { useApp } from '../../context/AppContext';
import { PRIORITY_LABELS } from '../../utils/status';
import { createTask, projetosDe } from '../../utils/tasks';
import Modal from '../modal/Modal';

interface TaskFormModalProps {
  open: boolean;
  taskId?: string; // presente = edição
  onClose: () => void;
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40';

const RECORRENCIA_LABELS: Record<Recorrencia, string> = {
  diaria: 'Diária',
  semanal: 'Semanal',
  mensal: 'Mensal',
};

export default function TaskFormModal({ open, taskId, onClose }: TaskFormModalProps) {
  const { state, dispatch } = useApp();
  const editing = taskId ? state.tasks.find((t) => t.id === taskId) : undefined;

  const [titulo, setTitulo] = useState(editing?.titulo ?? '');
  const [descricao, setDescricao] = useState(editing?.descricao ?? '');
  const [prioridade, setPrioridade] = useState<Priority>(editing?.prioridade ?? 'media');
  const [prazo, setPrazo] = useState(editing?.prazo ?? '');
  const [categoria, setCategoria] = useState(editing?.categoria ?? '');
  const [tags, setTags] = useState(editing?.tags?.join(', ') ?? '');
  const [projeto, setProjeto] = useState(editing?.projeto ?? '');
  const [lembrete, setLembrete] = useState(editing?.lembrete?.slice(0, 16) ?? '');
  const [recorrencia, setRecorrencia] = useState<Recorrencia | ''>(editing?.recorrencia ?? '');

  const isEdit = Boolean(editing);
  const valid = titulo.trim().length > 0;
  const projetos = projetosDe(state.tasks);

  const submit = () => {
    if (!valid) return;
    const changes = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      prioridade,
      prazo: prazo || null,
      categoria: categoria.trim() || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      projeto: projeto.trim() || undefined,
      lembrete: lembrete || null,
      recorrencia: recorrencia || null,
    };
    if (isEdit && editing) {
      dispatch({ type: 'UPDATE_TASK', taskId: editing.id, changes });
    } else {
      dispatch({
        type: 'CREATE_TASK',
        task: createTask(changes),
      });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Editar tarefa' : 'Nova tarefa'}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus-visible:ring-indigo-400/70"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-white/70"
          >
            {isEdit ? 'Salvar alterações' : 'Criar tarefa'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="task-titulo" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Título *</label>
          <input id="task-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputCls} placeholder="Ex.: Corrigir bug de checkout" />
        </div>
        <div>
          <label htmlFor="task-descricao" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
          <textarea
            id="task-descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={4}
            className={inputCls}
            placeholder="Detalhes da atividade..."
          />
        </div>
        <div>
          <label htmlFor="task-prioridade" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Prioridade</label>
          <select id="task-prioridade" value={prioridade} onChange={(e) => setPrioridade(e.target.value as Priority)} className={inputCls}>
            {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="task-prazo" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Prazo</label>
          <input id="task-prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-categoria" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Categoria</label>
            <input id="task-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputCls} placeholder="Ex.: Desenvolvimento" />
          </div>
          <div>
            <label htmlFor="task-tags" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tags (separadas por vírgula)</label>
            <input id="task-tags" value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="Ex.: bug, urgente" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-projeto" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Projeto / área</label>
            <input
              id="task-projeto"
              value={projeto}
              onChange={(e) => setProjeto(e.target.value)}
              className={inputCls}
              placeholder="Ex.: Lançamento 2.0"
              list="datalist-projetos"
            />
            <datalist id="datalist-projetos">
              {projetos.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="task-recorrencia" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Recorrência</label>
            <select id="task-recorrencia" value={recorrencia} onChange={(e) => setRecorrencia(e.target.value as Recorrencia | '')} className={inputCls}>
              <option value="">Nenhuma</option>
              {(Object.keys(RECORRENCIA_LABELS) as Recorrencia[]).map((r) => (
                <option key={r} value={r}>
                  {RECORRENCIA_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="task-lembrete" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Lembrete</label>
          <input
            id="task-lembrete"
            type="datetime-local"
            value={lembrete}
            onChange={(e) => setLembrete(e.target.value)}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            O navegador notificará nesse horário (ative as notificações no topo da tela).
          </p>
        </div>
      </div>
    </Modal>
  );
}
