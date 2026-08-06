// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from './FilterBar';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

function FilterProbe() {
  const { state } = useApp();
  return (
    <output data-testid="probe">
      {JSON.stringify({ paradas: state.filters.paradas, comRetrabalho: state.filters.comRetrabalho })}
    </output>
  );
}

beforeEach(() => localStorage.clear());

describe('FilterBar', () => {
  it('exibe os controles de filtro e ordenação', () => {
    renderWithApp(<FilterBar />);
    expect(screen.getByRole('button', { name: /Status/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Categoria/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Ordenar por' })).toBeInTheDocument();
  });

  it('não mostra "Limpar" sem filtros ativos', () => {
    renderWithApp(<FilterBar />);
    expect(screen.queryAllByRole('button', { name: 'Limpar' })).toHaveLength(0);
  });

  it('mostra "Limpar" e contador após filtrar por categoria', async () => {
    const user = userEvent.setup();
    renderWithApp(<FilterBar />);

    await user.click(screen.getByRole('button', { name: /Categoria/ }));
    await user.click(screen.getByRole('button', { name: 'Marketing' }));

    expect(screen.getAllByRole('button', { name: 'Limpar' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Categoria/ })).toHaveTextContent('1');
  });

  it('lista as categorias derivadas das tarefas do seed', async () => {
    const user = userEvent.setup();
    renderWithApp(<FilterBar />);

    await user.click(screen.getByRole('button', { name: /Categoria/ }));

    expect(screen.getByRole('button', { name: 'Marketing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desenvolvimento' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Treinamento' })).toBeInTheDocument();
  });

  it('oferece "Ordem original" e modos de ordenação no seletor', () => {
    renderWithApp(<FilterBar />);
    const sort = screen.getByRole('combobox', { name: 'Ordenar por' });
    expect(screen.getByRole('option', { name: 'Ordem original' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Título' })).toBeInTheDocument();
    expect(sort).toHaveValue('');
  });

  it('exibe o seletor de movimentação e aplica o filtro de paradas', async () => {
    const user = userEvent.setup();
    renderWithApp(<><FilterBar /><FilterProbe /></>);

    const mov = screen.getByRole('combobox', { name: 'Movimentação' });
    expect(mov).toBeInTheDocument();

    await user.selectOptions(mov, '7');

    const probe = JSON.parse(screen.getByTestId('probe').textContent!);
    expect(probe.paradas).toBe(7);
  });

  it('voltar o seletor de movimentação para "Todas" limpa o filtro de paradas', async () => {
    const user = userEvent.setup();
    renderWithApp(<><FilterBar /><FilterProbe /></>);

    const mov = screen.getByRole('combobox', { name: 'Movimentação' });
    await user.selectOptions(mov, '14');
    await user.selectOptions(mov, '');

    const probe = JSON.parse(screen.getByTestId('probe').textContent!);
    expect(probe.paradas).toBeNull();
  });
});
