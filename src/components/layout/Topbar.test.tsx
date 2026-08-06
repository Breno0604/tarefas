// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useRef, useState, type ReactNode } from 'react';
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

function setSection(section: 'visaoGeral' | 'tarefas' | 'colaboradores') {
  function Harness({ children }: { children: ReactNode }) {
    const { dispatch } = useApp();
    const dispatched = useRef(false);
    useEffect(() => {
      if (!dispatched.current) {
        dispatched.current = true;
        dispatch({ type: 'SET_SECTION', section });
      }
    }, [dispatch, section]);
    return <>{children}</>;
  }
  return Harness;
}

function StateProbe() {
  const { state } = useApp();
  return (
    <output data-testid="probe">
      {JSON.stringify({
        view: state.view,
        kpiCollapsed: state.kpiCollapsed,
        filtersOpen: state.filtersOpen,
        favoritas: state.filters.favoritas,
      })}
    </output>
  );
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

describe('Topbar — campo de busca', () => {
  function SearchHarness({ initial = '' }: { initial?: string }) {
    const [value, setValue] = useState(initial);
    return <Topbar title="Tarefas" search={value} onSearch={setValue} onNewTask={() => {}} />;
  }

  it('não exibe o ícone de limpar quando a busca está vazia', () => {
    renderWithApp(<SearchHarness />);
    expect(screen.queryByRole('button', { name: 'Limpar busca' })).not.toBeInTheDocument();
  });

  it('exibe o ícone de limpar quando a busca tem conteúdo', () => {
    renderWithApp(<SearchHarness initial="login" />);
    expect(screen.getByRole('button', { name: 'Limpar busca' })).toBeInTheDocument();
  });

  it('limpa a busca ao clicar no ícone e esconde o botão', async () => {
    const user = userEvent.setup();
    renderWithApp(<SearchHarness initial="relatório" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('relatório');
    expect(screen.getByRole('button', { name: 'Limpar busca' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar busca' }));

    expect(input).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Limpar busca' })).not.toBeInTheDocument();
  });
});

describe('Topbar — controles do topo', () => {
  it('exibe indicadores, filtros, favoritas e alternância de visualização na seção Tarefas', () => {
    renderWithApp(<Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />);
    expect(screen.getByRole('button', { name: 'Recolher indicadores' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocultar filtros' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apenas favoritas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver como Quadro' })).toBeInTheDocument();
  });

  it('não exibe os controles da seção Tarefas em outras seções', () => {
    const Harness = setSection('visaoGeral');
    renderWithApp(
      <Harness>
        <Topbar title="Visão Geral" search="" onSearch={() => {}} onNewTask={() => {}} />
      </Harness>
    );
    expect(screen.queryByRole('button', { name: 'Recolher indicadores' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ocultar filtros' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apenas favoritas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver como Quadro' })).not.toBeInTheDocument();
  });

  it('alterna a visibilidade dos indicadores', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Recolher indicadores' }));
    expect(screen.getByRole('button', { name: 'Expandir indicadores' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).kpiCollapsed).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Expandir indicadores' }));
    expect(screen.getByRole('button', { name: 'Recolher indicadores' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).kpiCollapsed).toBe(false);
  });

  it('alterna a visibilidade dos filtros', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Ocultar filtros' }));
    expect(screen.getByRole('button', { name: 'Mostrar filtros' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).filtersOpen).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Mostrar filtros' }));
    expect(screen.getByRole('button', { name: 'Ocultar filtros' })).toBeInTheDocument();
  });

  it('alterna o filtro de favoritas', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Apenas favoritas' }));
    expect(screen.getByRole('button', { name: 'Remover favoritas' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).favoritas).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Remover favoritas' }));
    expect(screen.getByRole('button', { name: 'Apenas favoritas' })).toBeInTheDocument();
  });

  it('alterna entre Lista e Quadro', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    expect(screen.getByRole('button', { name: 'Ver como Quadro' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver como Quadro' }));
    expect(screen.getByRole('button', { name: 'Ver como Lista' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).view).toBe('quadro');

    await user.click(screen.getByRole('button', { name: 'Ver como Lista' }));
    expect(screen.getByRole('button', { name: 'Ver como Quadro' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).view).toBe('lista');
  });
});
