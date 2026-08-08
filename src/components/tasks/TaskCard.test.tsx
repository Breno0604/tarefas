// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskCard from './TaskCard';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';
import type { Task } from '../../types';

const EM_ANDAMENTO: Task = {
  id: 'TA-005',
  titulo: 'Migração de servidor de produção',
  descricao: '',
  prioridade: 'media',
  prazo: null,
  status: 'EM_ANDAMENTO',
  criadaEm: '2026-08-01T10:00:00',
  historico: [],
};

/** Card lido do store: acompanha alterações de estado (status/favorito). */
function CardFromStore({ id }: { id: string }) {
  const { state } = useApp();
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return null;
  return <TaskCard task={task} onConfirmComplete={() => {}} />;
}

function StatusProbe({ id }: { id: string }) {
  const { state } = useApp();
  return <output data-testid="status-probe">{state.tasks.find((t) => t.id === id)?.status ?? ''}</output>;
}

beforeEach(() => localStorage.clear());

describe('TaskCard', () => {
  it('alterna o favorito ao clicar na estrela', async () => {
    const user = userEvent.setup();
    renderWithApp(<CardFromStore id="TA-001" />);

    await user.click(screen.getByTitle('Favoritar'));
    expect(screen.getByTitle('Remover dos favoritos')).toBeInTheDocument();
  });

  it('CAIXA_ENTRADA oferece "Planejar" e move a tarefa para A_FAZER', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <CardFromStore id="TA-001" />
        <StatusProbe id="TA-001" />
      </>
    );

    await user.click(screen.getByTitle('Planejar'));

    expect(screen.getByTestId('status-probe').textContent).toBe('A_FAZER');
  });

  it('EM_ANDAMENTO oferece "Concluir" e dispara a confirmação de conclusão', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderWithApp(<TaskCard task={EM_ANDAMENTO} onConfirmComplete={onConfirm} />);

    await user.click(screen.getByTitle('Concluir'));

    expect(onConfirm).toHaveBeenCalledWith(EM_ANDAMENTO);
  });
});
