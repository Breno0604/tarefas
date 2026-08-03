import { useState } from 'react';
import type { Priority } from '../../types';
import { useApp } from '../../context/AppContext';
import { COLABORADORES, NOME_POR_ID } from '../../data/mockData';
import { PRIORITY_LABELS } from '../../utils/status';
import { createTask } from '../../utils/tasks';
import Modal from '../modal/Modal';

interface TaskFormModalProps {
  open: boolean;
  taskId?: string; // presente = edição
  onClose: () => void;
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';

export default function TaskFormModal({ open, taskId, onClose }: TaskFormModalProps) {
  const { state, dispatch } = useApp();
  const editing = taskId ? state.tasks.find((t) => t.id === taskId) : undefined;

  const [titulo, setTitulo] = useState(editing?.titulo ?? '');
  const [descricao, setDescricao] = useState(editing?.descricao ?? '');
  const [responsavelId, setResponsavelId] = useState(editing?.responsavelId ?? COLABORADORES[0].id);
  const [prioridade, setPrioridade] = useState<Priority>(editing?.prioridade ?? 'media');
  const [prazo, setPrazo] = useState(editing?.prazo ?? '');
  const [categoria, setCategoria] = useState(editing?.categoria ?? '');
  const [tags, setTags] = useState(editing?.tags?.join(', ') ?? '');

  const isEdit = Boolean(editing);
  const valid = titulo.trim().length > 0 && responsavelId.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    if (isEdit && editing) {
      dispatch({
        type: 'UPDATE_TASK',
        taskId: editing.id,
        changes: {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          responsavelId,
          prioridade,
          prazo: prazo || null,
          categoria: categoria.trim() || undefined,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        },
      });
    } else {
      dispatch({
        type: 'CREATE_TASK',
        task: createTask(
          state.tasks,
          {
            titulo: titulo.trim(),
            descricao: descricao.trim(),
            responsavelId,
            criadorId: state.currentUserId,
            prioridade,
            prazo: prazo || null,
            categoria: categoria.trim() || undefined,
            tags: tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
          },
          NOME_POR_ID[state.currentUserId] ?? state.currentUserId
        ),
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
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEdit ? 'Salvar alterações' : 'Criar tarefa'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="task-titulo" className="mb-1 block text-sm font-medium text-slate-700">Título *</label>
          <input id="task-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputCls} placeholder="Ex.: Corrigir bug de checkout" />
        </div>
        <div>
          <label htmlFor="task-descricao" className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
          <textarea
            id="task-descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={4}
            className={inputCls}
            placeholder="Detalhes da atividade..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-responsavel" className="mb-1 block text-sm font-medium text-slate-700">Responsável *</label>
            <select id="task-responsavel" value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)} className={inputCls}>
              {COLABORADORES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-prioridade" className="mb-1 block text-sm font-medium text-slate-700">Prioridade</label>
            <select id="task-prioridade" value={prioridade} onChange={(e) => setPrioridade(e.target.value as Priority)} className={inputCls}>
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="task-prazo" className="mb-1 block text-sm font-medium text-slate-700">Prazo</label>
          <input id="task-prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-categoria" className="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
            <input id="task-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputCls} placeholder="Ex.: Desenvolvimento" />
          </div>
          <div>
            <label htmlFor="task-tags" className="mb-1 block text-sm font-medium text-slate-700">Tags (separadas por vírgula)</label>
            <input id="task-tags" value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="Ex.: bug, urgente" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
