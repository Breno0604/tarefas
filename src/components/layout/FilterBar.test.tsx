// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from './FilterBar';
import { renderWithApp } from '../../test/renderWithApp';

beforeEach(() => localStorage.clear());

describe('FilterBar', () => {
  it('exibe os controles de filtro e ordenação', () => {
    renderWithApp(<FilterBar />);
    expect(screen.getByRole('button', { name: /Status/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prioridade/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Categoria/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Ordenar por' })).toBeInTheDocument();
  });

  it('não mostra o filtro de responsável nem o de movimentação', () => {
    renderWithApp(<FilterBar />);
    expect(screen.queryByRole('button', { name: /Responsável/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Movimentação' })).not.toBeInTheDocument();
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

  it('oferece "Ordem original" e modos de ordenação no seletor', () => {
    renderWithApp(<FilterBar />);
    const sort = screen.getByRole('combobox', { name: 'Ordenar por' });
    expect(screen.getByRole('option', { name: 'Ordem original' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Título' })).toBeInTheDocument();
    expect(sort).toHaveValue('');
  });

  it('oferece filtro por projeto derivado das tarefas do seed', () => {
    renderWithApp(<FilterBar />);
    const projeto = screen.getByRole('combobox', { name: 'Projeto' });
    expect(projeto).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Todos os projetos/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Sem projeto/ })).toBeInTheDocument();
    // TA-003 do seed pertence ao projeto "Lançamento 2.0"
    expect(screen.getByRole('option', { name: /Lançamento 2\.0/ })).toBeInTheDocument();
  });
});
