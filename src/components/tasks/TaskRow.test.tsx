// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useRef, type ReactNode } from 'react';
import TaskRow from './TaskRow';
import { useApp } from '../../context/AppContext';
import { renderWithApp } from '../../test/renderWithApp';
import type { Task } from '../../types';

const NOVA: Task = {
  id: 'TA-001',
  titulo: 'Login',
  descricao: '',
  responsavelId: 'joao',
  criadorId: 'carlos',
  prioridade: 'media',
  prazo: null,
  status: 'NOVA',
  criadaEm: '2026-08-01T08:00:00',
  historico: [],
};

const CONCLUIDA: Task = { ...NOVA, id: 'TA-002', status: 'CONCLUIDA' };

function switchUser(userId: string) {
  function Harness({ children }: { children: ReactNode }) {
    const { dispatch } = useApp();
    const dispatched = useRef(false);
    useEffect(() => {
      if (!dispatched.current) {
        dispatched.current = true;
        dispatch({ type: 'SET_CURRENT_USER', userId });
      }
    }, [dispatch, userId]);
    return <>{children}</>;
  }
  return Harness;
}

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

describe('TaskRow — ações por papel', () => {
  it('gestor vê Editar, Duplicar e Excluir', () => {
    renderRow(NOVA);
    expect(screen.getByTitle('Editar')).toBeInTheDocument();
    expect(screen.getByTitle('Duplicar')).toBeInTheDocument();
    expect(screen.getByTitle('Excluir')).toBeInTheDocument();
    expect(screen.getByTitle('Alterar responsável')).toBeInTheDocument();
  });

  it('colaborador não vê ações de gestor, mas vê ações do ciclo', () => {
    const Harness = switchUser('joao');
    renderWithApp(
      <table>
        <tbody>
          <Harness>
            <TaskRow task={NOVA} onConfirmComplete={() => {}} onDeleteRequest={() => {}} />
          </Harness>
        </tbody>
      </table>
    );
    expect(screen.queryByTitle('Editar')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Excluir')).not.toBeInTheDocument();
    expect(screen.getByTitle('Receber')).toBeInTheDocument();
  });

  it('colaborador em CONCLUIDA pode reabrir (e gestor não)', () => {
    const Harness = switchUser('joao');
    renderWithApp(
      <table>
        <tbody>
          <Harness>
            <TaskRow task={CONCLUIDA} onConfirmComplete={() => {}} onDeleteRequest={() => {}} />
          </Harness>
        </tbody>
      </table>
    );
    expect(screen.getByTitle('Reabrir')).toBeInTheDocument();
    expect(screen.queryByTitle('Iniciar')).not.toBeInTheDocument();
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
    renderRow(NOVA, { onDeleteRequest: onDelete });
    await user.click(screen.getByTitle('Excluir'));
    expect(onDelete).toHaveBeenCalledWith(NOVA);
  });
});
