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
        prazo: state.filters.prazo,
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
  it('renderiza apenas a navegação para Tarefas quando aberto', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));

    expect(screen.getByRole('button', { name: 'Tarefas' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Visão Geral' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Colaboradores' })).not.toBeInTheDocument();
  });

  it('não exibe seletor de usuário nem lista de colaboradores', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /João/ })).not.toBeInTheDocument();
  });

  it('clicar em Atrasadas aplica filtro vencidas', async () => {
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
