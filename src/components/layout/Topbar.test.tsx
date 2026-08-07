// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import Topbar from './Topbar';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

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

describe('Topbar — Nova Tarefa', () => {
  it('sempre exibe o botão Nova Tarefa', () => {
    renderWithApp(<Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />);
    expect(screen.getByRole('button', { name: /Nova Tarefa/ })).toBeInTheDocument();
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
  it('exibe indicadores, filtros, favoritas e alternância de visualização', () => {
    renderWithApp(<Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />);
    expect(screen.getByRole('button', { name: 'Recolher indicadores' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocultar filtros' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apenas favoritas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver como Quadro' })).toBeInTheDocument();
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
  });
});
