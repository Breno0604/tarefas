// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KPICards from './KPICards';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';
import { computeIndicators } from '../../utils/tasks';
import { TAREFAS } from '../../data/mockData';

beforeEach(() => localStorage.clear());

function Probe() {
  const { state } = useApp();
  return (
    <output data-testid="probe">
      {JSON.stringify({ section: state.section, status: state.filters.status, prazo: state.filters.prazo })}
    </output>
  );
}

const indicators = computeIndicators(TAREFAS, new Date(2026, 7, 3));

describe('KPICards', () => {
  it('renders the 8 KPI cards with correct seed-derived values', () => {
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    expect(screen.getByRole('button', { name: /Total de tarefas/ })).toHaveTextContent('16');
    expect(screen.getByRole('button', { name: /Novas/ })).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: /Recebidas/ })).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: /Em execução/ })).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: /Concluídas/ })).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: /Devolvidas/ })).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: /Finalizadas/ })).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: /Atrasadas/ })).toHaveTextContent('3');
  });

  it('renders the overall completion progress bar with 25%', () => {
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    expect(screen.getByText('Conclusão geral')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('clicking Novas dispatches SET_SECTION tarefas + SET_FILTERS status NOVA', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: /Novas/ }));

    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.section).toBe('tarefas');
      expect(probe.status).toEqual(['NOVA']);
    });
  });

  it('clicking Atrasadas applies prazo vencidas', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: /Atrasadas/ }));

    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.section).toBe('tarefas');
      expect(probe.prazo).toBe('vencidas');
    });
  });

  it('clicking Total de tarefas resets filters', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: /Novas/ }));
    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.status).toEqual(['NOVA']);
    });

    await user.click(screen.getByRole('button', { name: /Total de tarefas/ }));

    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.section).toBe('tarefas');
      expect(probe.status).toEqual([]);
      expect(probe.prazo).toBe('todas');
    });
  });
});
