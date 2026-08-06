// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { useEffect, useRef, type ReactNode } from 'react';
import TaskDetailModal from './TaskDetailModal';
import { useApp } from '../../context/AppContext';
import { renderWithApp } from '../../test/renderWithApp';

vi.mock('../../data/mockData', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../data/mockData')>();
  return {
    ...original,
    findUser: (id: string) => {
      const u = original.findUser(id);
      if (!u) return undefined;
      if (id === 'lucas') return { ...u, permissoes: ['alterar_status_outros'] };
      return u;
    },
  };
});

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
  it('gestor em CONCLUIDA vê Aprovar, Devolver e Reabrir tarefa', () => {
    renderWithApp(<TaskDetailModal taskId="TA-003" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Aprovar e finalizar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Devolver' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reabrir tarefa' })).toBeInTheDocument();
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

  it('exibe badge de retrabalho para TA-001 (devolvida no histórico)', () => {
    renderWithApp(<TaskDetailModal taskId="TA-001" onClose={() => {}} />);
    expect(screen.getByText('retornou 1 vez')).toBeInTheDocument();
  });

  it('indica "aguardando gestor" para tarefa CONCLUIDA (TA-003)', () => {
    renderWithApp(<TaskDetailModal taskId="TA-003" onClose={() => {}} />);
    expect(screen.getByText(/aguardando gestor/)).toBeInTheDocument();
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

describe('TaskDetailModal — reversão de FINALIZADA', () => {
  it('gestor em FINALIZADA vê Reabrir aprovação', () => {
    renderWithApp(<TaskDetailModal taskId="TA-001" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Reabrir aprovação' })).toBeInTheDocument();
  });

  it('gestor em FINALIZADA não vê a ação de reatribuir (Responsável)', () => {
    renderWithApp(<TaskDetailModal taskId="TA-001" onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Responsável' })).not.toBeInTheDocument();
  });

  it('colaborador (mesmo responsável) em FINALIZADA não vê Reabrir aprovação', () => {
    // TA-001 é de joao (responsável), mas reversão de aprovação é exclusiva do gestor
    const Harness = switchUser('joao');
    renderWithApp(
      <Harness>
        <TaskDetailModal taskId="TA-001" onClose={() => {}} />
      </Harness>
    );
    expect(screen.queryByRole('button', { name: 'Reabrir aprovação' })).not.toBeInTheDocument();
  });
});

describe('TaskDetailModal — reabrir restrito ao responsável', () => {
  it('colaborador com alterar_status_outros não vê Reabrir de CONCLUIDA de outro', () => {
    // TA-003 (CONCLUIDA) é de maria; lucas tem alterar_status_outros mas não é responsável
    const Harness = switchUser('lucas');
    renderWithApp(
      <Harness>
        <TaskDetailModal taskId="TA-003" onClose={() => {}} />
      </Harness>
    );
    expect(screen.queryByRole('button', { name: 'Reabrir tarefa' })).not.toBeInTheDocument();
  });
});

describe('TaskDetailModal — cancelamento (CANCELADA)', () => {
  it('gestor em NOVA vê Cancelar', () => {
    renderWithApp(<TaskDetailModal taskId="TA-005" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('gestor em DEVOLVIDA vê Cancelar', () => {
    renderWithApp(<TaskDetailModal taskId="TA-007" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('gestor em CONCLUIDA não vê Cancelar', () => {
    renderWithApp(<TaskDetailModal taskId="TA-003" onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('gestor em FINALIZADA não vê Cancelar', () => {
    renderWithApp(<TaskDetailModal taskId="TA-001" onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('colaborador (mesmo responsável) não vê Cancelar', () => {
    // TA-005 é de joao (responsável), mas cancelamento é exclusivo do gestor
    const Harness = switchUser('joao');
    renderWithApp(
      <Harness>
        <TaskDetailModal taskId="TA-005" onClose={() => {}} />
      </Harness>
    );
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });
});
