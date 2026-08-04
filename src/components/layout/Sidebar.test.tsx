// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

beforeEach(() => {
  localStorage.clear();
});

function Probe() {
  const { state } = useApp();
  return (
    <output data-testid="probe">
      {JSON.stringify({
        section: state.section,
        prazo: state.filters.prazo,
        modal: state.modal.type,
        user: state.currentUserId,
        sidebarOpen: state.sidebarOpen,
      })}
    </output>
  );
}

function ToggleButton() {
  const { dispatch } = useApp();
  return (
    <button onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })} title="Toggle sidebar">
      Toggle
    </button>
  );
}

describe('Sidebar', () => {
  it('renderiza os 3 itens de navegação quando aberto', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));

    expect(screen.getByRole('button', { name: 'Visão Geral' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tarefas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Colaboradores' })).toBeInTheDocument();
  });

  it('renderiza os atalhos Atrasadas, Finalizadas e Devolvidas', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));

    expect(screen.getByRole('button', { name: 'Atrasadas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizadas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Devolvidas' })).toBeInTheDocument();
  });

  it('clicar em Atrasadas navega para tarefas e aplica filtro vencidas', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));
    await user.click(screen.getByRole('button', { name: 'Atrasadas' }));

    await waitFor(() => {
      const probe = screen.getByTestId('probe');
      expect(probe.textContent).toContain('"section":"tarefas"');
      expect(probe.textContent).toContain('"prazo":"vencidas"');
    });
  });

  it('fechando a sidebar atualiza sidebarOpen para false', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));
    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toContain('"sidebarOpen":true');
    });

    await user.click(screen.getByTitle('Fechar menu'));
    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toContain('"sidebarOpen":false');
    });
  });

  it('user switcher lista ALL_USERS e muda currentUserId', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));

    const select = screen.getByRole('combobox');
    expect(screen.getByRole('option', { name: /Carlos Mendes/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /João Silva/ })).toBeInTheDocument();
    await user.selectOptions(select, 'joao');

    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toContain('"user":"joao"');
    });
  });

  it('clicar em um colaborador abre o modal do colaborador', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));
    await user.click(screen.getByRole('button', { name: /João/ }));

    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toContain('"modal":"colaborador"');
    });
  });

  it('clicar no backdrop fecha a sidebar', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));
    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toContain('"sidebarOpen":true');
    });

    const backdrop = document.querySelector('.fixed.inset-0.z-40');
    expect(backdrop).toBeInTheDocument();
    backdrop!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toContain('"sidebarOpen":false');
    });
  });
});
