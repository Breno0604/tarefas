// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { useEffect, useRef, type ReactNode } from 'react';
import TaskDetailModal from './TaskDetailModal';
import { useApp } from '../../context/AppContext';
import { renderWithApp } from '../../test/renderWithApp';

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

beforeEach(() => localStorage.clear());

describe('TaskDetailModal', () => {
  it('gestor em CONCLUIDA vê Aprovar e Devolver', () => {
    renderWithApp(<TaskDetailModal taskId="TA-003" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Aprovar e finalizar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Devolver' })).toBeInTheDocument();
  });

  it('colaborador em CONCLUIDA vê Reabrir, não Aprovar', () => {
    const Harness = switchUser('maria');
    renderWithApp(
      <Harness>
        <TaskDetailModal taskId="TA-003" onClose={() => {}} />
      </Harness>
    );
    expect(screen.getByRole('button', { name: 'Reabrir tarefa' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprovar e finalizar' })).not.toBeInTheDocument();
  });

  it('exibe categoria e tags da tarefa', () => {
    renderWithApp(<TaskDetailModal taskId="TA-003" onClose={() => {}} />);
    // TA-003 do seed: categoria Marketing, tag email
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('#email')).toBeInTheDocument();
  });

  it('mostra a data de criação no formato pt-BR', () => {
    renderWithApp(<TaskDetailModal taskId="TA-003" onClose={() => {}} />);
    // TA-003 criada em 2026-07-29
    expect(screen.getByText('Criada em')).toBeInTheDocument();
    expect(screen.getByText('29/07/2026')).toBeInTheDocument();
  });
});

describe('TaskDetailModal — permissões', () => {
  it('colaborador não vê ações de ciclo de tarefa de outro usuário', () => {
    // TA-003 (CONCLUIDA) é de maria; joao não é responsável nem tem permissão
    const Harness = switchUser('joao');
    renderWithApp(
      <Harness>
        <TaskDetailModal taskId="TA-003" onClose={() => {}} />
      </Harness>
    );
    expect(screen.queryByRole('button', { name: 'Reabrir tarefa' })).not.toBeInTheDocument();
  });

  it('colaborador responsável vê as ações de ciclo da própria tarefa', () => {
    const Harness = switchUser('maria');
    renderWithApp(
      <Harness>
        <TaskDetailModal taskId="TA-003" onClose={() => {}} />
      </Harness>
    );
    expect(screen.getByRole('button', { name: 'Reabrir tarefa' })).toBeInTheDocument();
  });

  it('colaborador não vê ações de gestão (editar, excluir, etc.)', () => {
    const Harness = switchUser('joao');
    renderWithApp(
      <Harness>
        <TaskDetailModal taskId="TA-003" onClose={() => {}} />
      </Harness>
    );
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
  });
});
