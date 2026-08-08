import Modal from '../modal/Modal';

const ATALHOS: { tecla: string; descricao: string }[] = [
  { tecla: 'N', descricao: 'Nova tarefa' },
  { tecla: '/', descricao: 'Focar o campo de busca' },
  { tecla: 'Ctrl+F', descricao: 'Focar o campo de busca' },
  { tecla: 'V', descricao: 'Alternar entre Lista e Quadro' },
  { tecla: 'F', descricao: 'Alternar "Apenas favoritas"' },
  { tecla: 'T', descricao: 'Alternar tema claro/escuro' },
  { tecla: 'G', descricao: 'Recolher/expandir indicadores' },
  { tecla: '?', descricao: 'Abrir este guia de atalhos' },
  { tecla: 'Ctrl+Z', descricao: 'Desfazer a última alteração' },
  { tecla: 'Esc', descricao: 'Fechar modais e limpar a busca' },
];

export default function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open title="Atalhos de teclado" onClose={onClose}>
      <ul className="space-y-2">
        {ATALHOS.map((a) => (
          <li
            key={a.tecla}
            className="flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
          >
            <span>{a.descricao}</span>
            <kbd className="shrink-0 rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-xs font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              {a.tecla}
            </kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
