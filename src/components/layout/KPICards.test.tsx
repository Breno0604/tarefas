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
          section: state.section,
          status: state.filters.status,
          prazo: state.filters.prazo,
          search: state.filters.search,
          paradas: state.filters.paradas,
          comRetrabalho: state.filters.comRetrabalho,
        })}
      </output>
    </>
  );
}

const indicators = computeIndicators(TAREFAS, new Date(2026, 7, 3));

describe('KPICards', () => {
  it('renders the 12 KPI cards with correct seed-derived values', () => {
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    expect(screen.getByRole('button', { name: /Total de tarefas/ })).toHaveTextContent('70');
    expect(screen.getByRole('button', { name: /Novas/ })).toHaveTextContent('8');
    expect(screen.getByRole('button', { name: /Recebidas/ })).toHaveTextContent('8');
    expect(screen.getByRole('button', { name: /Em execução/ })).toHaveTextContent('13');
    expect(screen.getByRole('button', { name: /Aguardando aprovação/ })).toHaveTextContent('11');
    expect(screen.getByRole('button', { name: /Concluídas/ })).toHaveTextContent('29');
    expect(screen.getByRole('button', { name: /Devolvidas/ })).toHaveTextContent('7');
    expect(screen.getByRole('button', { name: /Devoluções/ })).toHaveTextContent('14');
    expect(screen.getByRole('button', { name: /Finalizadas/ })).toHaveTextContent('18');
    expect(screen.getByRole('button', { name: /Canceladas/ })).toHaveTextContent('5');
    expect(screen.getByRole('button', { name: /Atrasadas/ })).toHaveTextContent('5');
    expect(screen.getByRole('button', { name: /Paradas/ })).toHaveTextContent('8');
  });

  it('renderiza os cards sem o título de cabeçalho', () => {
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    expect(screen.queryByText('Indicadores')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Recolher indicadores' })).not.toBeInTheDocument();
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

  it('inicia recolhido quando o localStorage tem o estado salvo', () => {
    localStorage.setItem('kpiCollapsed', '1');
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    expect(screen.queryByRole('button', { name: /Total de tarefas/ })).not.toBeInTheDocument();
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

  it('clicking Aguardando aprovação filters status CONCLUIDA', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: /Aguardando aprovação/ }));

    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.section).toBe('tarefas');
      expect(probe.status).toEqual(['CONCLUIDA']);
    });
  });

  it('clicking Devoluções applies comRetrabalho', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: /Devoluções/ }));

    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.section).toBe('tarefas');
      expect(probe.comRetrabalho).toBe(true);
    });
  });

  it('clicking Paradas applies paradas 7', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: /Paradas/ }));

    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.section).toBe('tarefas');
      expect(probe.paradas).toBe(7);
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
