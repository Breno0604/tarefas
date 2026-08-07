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
  const { state, dispatch } = useApp();
  return (
    <>
      <button onClick={() => dispatch({ type: 'SET_FILTERS', filters: { search: 'relatório' } })}>
        buscar relatório
      </button>
      <button onClick={() => dispatch({ type: 'TOGGLE_KPI_COLLAPSED' })}>alternar indicadores</button>
      <output data-testid="probe">
        {JSON.stringify({
          status: state.filters.status,
          prazo: state.filters.prazo,
          search: state.filters.search,
        })}
      </output>
    </>
  );
}

const indicators = computeIndicators(TAREFAS, new Date(2026, 7, 3));

describe('KPICards', () => {
  it('renders the 8 KPI cards with seed-derived values', () => {
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    expect(screen.getByRole('button', { name: /Total de tarefas/ })).toHaveTextContent(String(indicators.total));
    expect(screen.getByRole('button', { name: /Caixa de entrada/ })).toHaveTextContent(String(indicators.caixaEntrada));
    expect(screen.getByRole('button', { name: /A fazer/ })).toHaveTextContent(String(indicators.aFazer));
    expect(screen.getByRole('button', { name: /Em andamento/ })).toHaveTextContent(String(indicators.emAndamento));
    expect(screen.getByRole('button', { name: /Suspensas/ })).toHaveTextContent(String(indicators.suspensas));
    expect(screen.getByRole('button', { name: /Concluídas/ })).toHaveTextContent(String(indicators.concluidas));
    expect(screen.getByRole('button', { name: /Arquivadas/ })).toHaveTextContent(String(indicators.arquivadas));
    expect(screen.getByRole('button', { name: /Atrasadas/ })).toHaveTextContent(String(indicators.atrasadas));
  });

  it('recolhe e expande os cards de indicadores via estado global', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    const total = screen.getByRole('button', { name: /Total de tarefas/ });
    expect(total).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'alternar indicadores' }));

    expect(screen.queryByRole('button', { name: /Total de tarefas/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'alternar indicadores' }));

    expect(screen.getByRole('button', { name: /Total de tarefas/ })).toBeInTheDocument();
  });

  it('persiste o estado recolhido no localStorage', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: 'alternar indicadores' }));

    expect(localStorage.getItem('kpiCollapsed')).toBe('1');
  });

  it('clicking Caixa de entrada filters status CAIXA_ENTRADA', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: /Caixa de entrada/ }));

    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.status).toEqual(['CAIXA_ENTRADA']);
    });
  });

  it('clicking Atrasadas applies prazo vencidas', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: /Atrasadas/ }));

    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.prazo).toBe('vencidas');
    });
  });

  it('KPI de status limpa filtros ativos (busca) antes de aplicar o status', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: 'buscar relatório' }));
    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.search).toBe('relatório');
    });

    await user.click(screen.getByRole('button', { name: /A fazer/ }));

    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.search).toBe('');
      expect(probe.status).toEqual(['A_FAZER']);
      expect(probe.prazo).toBe('todas');
    });
  });
});
