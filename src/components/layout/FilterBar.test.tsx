// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from './FilterBar';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

function FiltersProbe() {
  const { state } = useApp();
  return <output data-testid="filters-probe">{JSON.stringify(state.filters)}</output>;
}

beforeEach(() => localStorage.clear());

describe('FilterBar', () => {
  it('exibe os controles de filtro sem o seletor de ordenação', () => {
    renderWithApp(<FilterBar />);
    expect(screen.getByRole('button', { name: /Status/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prioridade/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Categoria/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tags/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Prazo' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Ordenar por' })).not.toBeInTheDocument();
  });

  it('não mostra o filtro de responsável nem o de movimentação', () => {
    renderWithApp(<FilterBar />);
    expect(screen.queryByRole('button', { name: /Responsável/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Movimentação' })).not.toBeInTheDocument();
  });

  it('não mostra o filtro de projeto', () => {
    renderWithApp(<FilterBar />);
    expect(screen.queryByRole('combobox', { name: 'Projeto' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Todos os projetos/ })).not.toBeInTheDocument();
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

    expect(screen.getByRole('button', { name: 'Desenvolvimento' })).toBeInTheDocument();
  });

  it('oferece a opção "Sem categoria" no filtro de Categoria', async () => {
    const user = userEvent.setup();
    renderWithApp(<FilterBar />);

    await user.click(screen.getByRole('button', { name: /Categoria/ }));

    expect(screen.getByRole('button', { name: 'Sem categoria' })).toBeInTheDocument();
  });

  it('filtrar por "Sem categoria" atualiza filters.categorias', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <FilterBar />
        <FiltersProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: /Categoria/ }));
    await user.click(screen.getByRole('button', { name: 'Sem categoria' }));

    expect(JSON.parse(screen.getByTestId('filters-probe').textContent!).categorias).toEqual([
      '__sem_categoria__',
    ]);
  });

  it('lista as tags derivadas das tarefas do seed', async () => {
    const user = userEvent.setup();
    renderWithApp(<FilterBar />);

    await user.click(screen.getByRole('button', { name: /Tags/ }));

    // TA-003 do seed possui a tag "bug"
    expect(screen.getByRole('button', { name: 'bug' })).toBeInTheDocument();
  });

  it('filtrar por tag atualiza filters.tags', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <FilterBar />
        <FiltersProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: /Tags/ }));
    await user.click(screen.getByRole('button', { name: 'bug' }));

    expect(JSON.parse(screen.getByTestId('filters-probe').textContent!).tags).toEqual(['bug']);
  });

  it('oferece "Limpar" no seletor de prazo', () => {
    renderWithApp(<FilterBar />);
    const prazo = screen.getByRole('combobox', { name: 'Prazo' });
    expect(within(prazo).getByRole('option', { name: 'Limpar' })).toBeInTheDocument();
    expect(prazo).toHaveValue('todas');
  });

  it('cada filtro MultiSelect oferece a opção "Limpar" no dropdown', async () => {
    const user = userEvent.setup();
    renderWithApp(<FilterBar />);

    await user.click(screen.getByRole('button', { name: /Status/ }));
    expect(screen.getAllByRole('button', { name: 'Limpar' }).length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getByRole('button', { name: /Prioridade/ }));
    expect(screen.getAllByRole('button', { name: 'Limpar' }).length).toBeGreaterThanOrEqual(1);
  });

  it('"Limpar" fecha o menu do filtro imediatamente', async () => {
    const user = userEvent.setup();
    renderWithApp(<FilterBar />);

    await user.click(screen.getByRole('button', { name: /Status/ }));
    await user.click(screen.getByRole('button', { name: 'A fazer' }));
    expect(screen.getByRole('button', { name: 'A fazer' })).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Limpar' })[0]);

    expect(screen.queryByRole('button', { name: 'A fazer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Status/ })).not.toHaveTextContent('1');
  });

  it('"Limpar" individual de um filtro limpa somente aquele filtro', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <FilterBar />
        <FiltersProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: /Status/ }));
    await user.click(screen.getByRole('button', { name: 'A fazer' }));
    await user.click(screen.getByRole('button', { name: /Prioridade/ }));
    await user.click(screen.getByRole('button', { name: 'Alta' }));

    const ler = () => JSON.parse(screen.getByTestId('filters-probe').textContent!);
    expect(ler().status).toEqual(['A_FAZER']);
    expect(ler().prioridade).toEqual(['alta']);

    await user.click(screen.getByRole('button', { name: /Status/ }));
    await user.click(screen.getAllByRole('button', { name: 'Limpar' })[0]);

    expect(ler().status).toEqual([]);
    expect(ler().prioridade).toEqual(['alta']);
  });

  it('"Limpar" do seletor de prazo restaura o padrão sem mexer nos demais filtros', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <FilterBar />
        <FiltersProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: /Status/ }));
    await user.click(screen.getByRole('button', { name: 'A fazer' }));

    const prazo = screen.getByRole('combobox', { name: 'Prazo' });
    await user.selectOptions(prazo, 'vencidas');
    expect(JSON.parse(screen.getByTestId('filters-probe').textContent!).prazo).toBe('vencidas');

    await user.selectOptions(prazo, '__limpar__');
    const ler = () => JSON.parse(screen.getByTestId('filters-probe').textContent!);
    expect(ler().prazo).toBe('todas');
    expect(ler().status).toEqual(['A_FAZER']);
  });
});
