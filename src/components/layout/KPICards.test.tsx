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
      <output data-testid="probe">
        {JSON.stringify({
          section: state.section,
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

  it('renderiza barra de cabeçalho com botão de recolher', () => {
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    expect(screen.getByText('Indicadores')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recolher indicadores' })).toBeInTheDocument();
  });

  it('recolhe e expande os cards de indicadores', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    const total = screen.getByRole('button', { name: /Total de tarefas/ });
    expect(total).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Recolher indicadores' }));

    expect(screen.queryByRole('button', { name: /Total de tarefas/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expandir indicadores' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expandir indicadores' }));

    expect(screen.getByRole('button', { name: /Total de tarefas/ })).toBeInTheDocument();
  });

  it('persiste o estado recolhido no localStorage', async () => {
    const user = userEvent.setup();
    renderWithApp(<KPICards indicators={indicators} />);

    await user.click(screen.getByRole('button', { name: 'Recolher indicadores' }));

    expect(localStorage.getItem('kpiCollapsed')).toBe('1');
  });

  it('inicia recolhido quando o localStorage tem o estado salvo', () => {
    localStorage.setItem('kpiCollapsed', '1');
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    expect(screen.queryByRole('button', { name: /Total de tarefas/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expandir indicadores' })).toBeInTheDocument();
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

  it('KPI de status limpa filtros ativos (busca) antes de aplicar o status', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: 'buscar relatório' }));
    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.search).toBe('relatório');
    });

    await user.click(screen.getByRole('button', { name: /Novas/ }));

    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.search).toBe('');
      expect(probe.status).toEqual(['NOVA']);
      expect(probe.prazo).toBe('todas');
    });
  });
});
