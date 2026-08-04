// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { useEffect, useRef, type ReactNode } from 'react';
import Topbar from './Topbar';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

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

describe('Topbar — Nova Tarefa por permissão', () => {
  it('gestor vê o botão Nova Tarefa', () => {
    renderWithApp(
      <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
    );
    expect(screen.getByRole('button', { name: /Nova Tarefa/ })).toBeInTheDocument();
  });

  it('colaborador sem criar_tarefas não vê o botão Nova Tarefa', () => {
    const Harness = switchUser('joao');
    renderWithApp(
      <Harness>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
      </Harness>
    );
    expect(screen.queryByRole('button', { name: /Nova Tarefa/ })).not.toBeInTheDocument();
  });
});
