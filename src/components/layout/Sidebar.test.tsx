// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

const matchMediaMock = vi.fn();

beforeEach(() => {
  localStorage.clear();
  window.matchMedia = matchMediaMock.mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
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
      })}
    </output>
  );
}

describe('Sidebar', () => {
  it('renders the 3 nav items', () => {
    renderWithApp(<Sidebar />);
    expect(screen.getByRole('button', { name: 'Visão Geral' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tarefas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Colaboradores' })).toBeInTheDocument();
  });

  it('renders the atalhos Atrasadas, Finalizadas and Devolvidas', () => {
    renderWithApp(<Sidebar />);
    expect(screen.getByRole('button', { name: 'Atrasadas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizadas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Devolvidas' })).toBeInTheDocument();
  });

  it('clicking Atrasadas navigates to tarefas section and applies vencidas filter', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <Probe />
      </>
    );
    await user.click(screen.getByRole('button', { name: 'Atrasadas' }));
    await waitFor(() => {
      const probe = screen.getByTestId('probe');
      expect(probe.textContent).toContain('"section":"tarefas"');
      expect(probe.textContent).toContain('"prazo":"vencidas"');
    });
  });

  it('user switcher lists ALL_USERS and changes currentUserId when changed', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <Probe />
      </>
    );
    const select = screen.getByRole('combobox');
    expect(screen.getByRole('option', { name: /Carlos Mendes/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /João Silva/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Maria Souza/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Pedro Oliveira/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Ana Costa/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Lucas Pereira/ })).toBeInTheDocument();
    await user.selectOptions(select, 'joao');
    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toContain('"user":"joao"');
    });
  });

  it('toggle button switches width class between w-64 and w-16', async () => {
    const user = userEvent.setup();
    renderWithApp(<Sidebar />);
    const aside = document.querySelector('aside');
    expect(aside).toHaveClass('w-64');
    await user.click(screen.getByTitle('Recolher'));
    await waitFor(() => {
      expect(aside).toHaveClass('w-16');
    });
    await user.click(screen.getByTitle('Expandir'));
    await waitFor(() => {
      expect(aside).toHaveClass('w-64');
    });
  });

  it('clicking a colaborador button opens the colaborador modal', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <Probe />
      </>
    );
    await user.click(screen.getByRole('button', { name: /João/ }));
    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toContain('"modal":"colaborador"');
    });
  });
});
