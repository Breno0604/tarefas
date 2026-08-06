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

  it('colaborador responsável em CONCLUIDA pode reabrir', () => {
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

  it('gestor em CONCLUIDA também vê Reabrir', () => {
    renderRow(CONCLUIDA);
    expect(screen.getByTitle('Reabrir')).toBeInTheDocument();
  });

  it('gestor em FINALIZADA vê Reabrir aprovação', () => {
    renderRow({ ...NOVA, id: 'TA-010', status: 'FINALIZADA' });
    expect(screen.getByTitle('Reabrir aprovação')).toBeInTheDocument();
  });

  it('gestor não vê Alterar responsável em FINALIZADA', () => {
    renderRow({ ...NOVA, id: 'TA-010', status: 'FINALIZADA' });
    expect(screen.queryByTitle('Alterar responsável')).not.toBeInTheDocument();
  });

  it('gestor não vê Alterar responsável em CANCELADA', () => {
    renderRow({ ...NOVA, id: 'TA-011', status: 'CANCELADA' });
    expect(screen.queryByTitle('Alterar responsável')).not.toBeInTheDocument();
  });

  it('gestor em NOVA vê Cancelar', () => {
    renderRow(NOVA);
    expect(screen.getByTitle('Cancelar')).toBeInTheDocument();
  });

  it('gestor em CONCLUIDA não vê Cancelar', () => {
    renderRow(CONCLUIDA);
    expect(screen.queryByTitle('Cancelar')).not.toBeInTheDocument();
  });

  it('colaborador não vê Cancelar', () => {
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
    expect(screen.queryByTitle('Cancelar')).not.toBeInTheDocument();
  });

  it('colaborador em FINALIZADA não vê Reabrir aprovação', () => {
    const Harness = switchUser('joao');
    renderWithApp(
      <table>
        <tbody>
          <Harness>
            <TaskRow task={{ ...NOVA, id: 'TA-010', status: 'FINALIZADA' }} onConfirmComplete={() => {}} onDeleteRequest={() => {}} />
          </Harness>
        </tbody>
      </table>
    );
    expect(screen.queryByTitle('Reabrir aprovação')).not.toBeInTheDocument();
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

describe('TaskRow — indicadores de fluxo', () => {
  it('mostra badge de retrabalho para tarefa devolvida no histórico', () => {
    const devolvida: Task = {
      ...NOVA,
      id: 'TA-100',
      status: 'CONCLUIDA',
      historico: [
        {
          id: 'h1',
          dataHora: '2026-08-01T10:00:00',
          usuario: 'Carlos Mendes',
          statusAnterior: 'CONCLUIDA',
          novoStatus: 'DEVOLVIDA',
          tipo: 'status',
        },
      ],
    };
    renderRow(devolvida);
    expect(screen.getByText('retornou 1 vez')).toBeInTheDocument();
  });

  it('não mostra badge de retrabalho quando nunca houve devolução', () => {
    renderRow(NOVA);
    expect(screen.queryByText(/retornou/)).not.toBeInTheDocument();
  });

  it('indica "aguardando gestor" para tarefa CONCLUIDA', () => {
    renderRow({ ...CONCLUIDA, concluidaEm: new Date().toISOString() });
    expect(screen.getByText('aguardando gestor')).toBeInTheDocument();
  });

  it('indica "vez do colaborador" em status de execução', () => {
    renderRow(NOVA);
    expect(screen.getByText('vez do colaborador')).toBeInTheDocument();
  });

  it('não indica próximo passo para FINALIZADA', () => {
    renderRow({ ...NOVA, id: 'TA-010', status: 'FINALIZADA' });
    expect(screen.queryByText('vez do colaborador')).not.toBeInTheDocument();
    expect(screen.queryByText(/aguardando gestor/)).not.toBeInTheDocument();
  });
});

describe('TaskRow — permissões', () => {
  it('colaborador não vê ações do ciclo de tarefa de outro usuário', () => {
    const Harness = switchUser('maria');
    renderWithApp(
      <table>
        <tbody>
          <Harness>
            <TaskRow task={NOVA} onConfirmComplete={() => {}} onDeleteRequest={() => {}} />
          </Harness>
        </tbody>
      </table>
    );
    expect(screen.queryByTitle('Receber')).not.toBeInTheDocument();
  });

  it('colaborador sem gerenciar_tarefas não vê ações de gestão', () => {
    const Harness = switchUser('maria');
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
  });
});
