// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { useEffect, useRef, type ReactNode } from 'react';
import TaskRow from './TaskRow';
import { useApp } from '../../context/AppContext';
import { renderWithApp } from '../../test/renderWithApp';
import type { Task } from '../../types';

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

describe('TaskRow — alterar_status_outros', () => {
  it('colaborador com alterar_status_outros vê ações do ciclo de tarefa de outro', () => {
    const Harness = switchUser('lucas');
    renderWithApp(
      <table>
        <tbody>
          <Harness>
            <TaskRow task={NOVA} onConfirmComplete={() => {}} onDeleteRequest={() => {}} />
          </Harness>
        </tbody>
      </table>
    );
    expect(screen.getByTitle('Receber')).toBeInTheDocument();
    expect(screen.queryByTitle('Editar')).not.toBeInTheDocument();
  });
});
