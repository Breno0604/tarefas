// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskRow from './TaskRow';
import { useApp } from '../../context/AppContext';
import { renderWithApp } from '../../test/renderWithApp';
import type { Task } from '../../types';

const CAIXA_ENTRADA: Task = {
  id: 'TA-001',
  titulo: 'Login',
  descricao: '',
  prioridade: 'media',
  prazo: null,
  status: 'CAIXA_ENTRADA',
  criadaEm: '2026-08-01T08:00:00',
  historico: [],
};

const EM_ANDAMENTO: Task = { ...CAIXA_ENTRADA, id: 'TA-002', status: 'EM_ANDAMENTO' };
const CONCLUIDA: Task = { ...CAIXA_ENTRADA, id: 'TA-003', status: 'CONCLUIDA' };

/** Renderiza a linha conectada ao store (o favorito é lido de state.tasks). */
function RowFromStore({ id }: { id: string }) {
  const { state } = useApp();
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return null;
  return (
    <table>
      <tbody>
        <TaskRow task={task} onConfirmComplete={() => {}} onDeleteRequest={() => {}} />
      </tbody>
    </table>
  );
}

function renderRow(task: Task, props: Partial<Parameters<typeof TaskRow>[0]> = {}) {
  return renderWithApp(
    <table>
      <tbody>
        <TaskRow
          task={task}
          onConfirmComplete={() => {}}
          onDeleteRequest={() => {}}
          {...props}
        />
      </tbody>
    </table>
  );
}

beforeEach(() => localStorage.clear());

describe('TaskRow — ações', () => {
  it('sempre exibe Editar, Duplicar e Excluir', () => {
    renderRow(CAIXA_ENTRADA);
    expect(screen.getByTitle('Editar')).toBeInTheDocument();
    expect(screen.getByTitle('Duplicar')).toBeInTheDocument();
    expect(screen.getByTitle('Excluir')).toBeInTheDocument();
  });

  it('exibe ações do ciclo por status', () => {
    renderRow(CAIXA_ENTRADA);
    expect(screen.getByTitle('Planejar')).toBeInTheDocument();
    expect(screen.getByTitle('Arquivar')).toBeInTheDocument();

    renderRow(EM_ANDAMENTO);
    expect(screen.getByTitle('Concluir')).toBeInTheDocument();
    expect(screen.getByTitle('Suspender')).toBeInTheDocument();

    renderRow(CONCLUIDA);
    expect(screen.getByTitle('Retomar')).toBeInTheDocument();
  });

  it('CONCLUIDA não exibe Arquivar nem Suspender', () => {
    renderRow(CONCLUIDA);
    expect(screen.queryByTitle('Arquivar')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Suspender')).not.toBeInTheDocument();
  });

  it('favoritar alterna o estado visual da estrela', async () => {
    const user = userEvent.setup();
    renderWithApp(<RowFromStore id="TA-001" />);
    await user.click(screen.getByTitle('Favoritar'));
    expect(screen.getByTitle('Remover dos favoritos')).toBeInTheDocument();
    await user.click(screen.getByTitle('Remover dos favoritos'));
    expect(screen.getByTitle('Favoritar')).toBeInTheDocument();
  });

  it('excluir dispara onDeleteRequest', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderRow(CAIXA_ENTRADA, { onDeleteRequest: onDelete });
    await user.click(screen.getByTitle('Excluir'));
    expect(onDelete).toHaveBeenCalledWith(CAIXA_ENTRADA);
  });
});
