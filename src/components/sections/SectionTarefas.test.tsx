// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import SectionTarefas from './SectionTarefas';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

function ToggleFilters() {
  const { dispatch } = useApp();
  return (
    <button onClick={() => dispatch({ type: 'TOGGLE_FILTERS' })}>alternar filtros</button>
  );
}

beforeEach(() => localStorage.clear());

describe('SectionTarefas', () => {
  it('exibe os indicadores e a barra de filtros por padrão', () => {
    renderWithApp(<SectionTarefas />);
    expect(screen.getByRole('button', { name: /Total de tarefas/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Status/ })).toBeInTheDocument();
  }, 30000);

  it('oculta a barra de filtros quando filtersOpen é false', () => {
    renderWithApp(<><SectionTarefas /><ToggleFilters /></>);

    expect(screen.getByRole('button', { name: /Status/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'alternar filtros' }));

    expect(screen.queryByRole('button', { name: /Status/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Total de tarefas/ })).toBeInTheDocument();
  }, 30000);
});
