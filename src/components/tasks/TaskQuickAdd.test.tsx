// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskQuickAdd from './TaskQuickAdd';
import { useApp } from '../../context/AppContext';
import { renderWithApp } from '../../test/renderWithApp';

function ListFromStore() {
  const { state } = useApp();
  return (
    <ul>
      {state.tasks.map((t) => (
        <li key={t.id}>{t.titulo}</li>
      ))}
    </ul>
  );
}

function renderQuickAdd() {
  return renderWithApp(
    <>
      <TaskQuickAdd />
      <ListFromStore />
    </>
  );
}

beforeEach(() => localStorage.clear());

describe('TaskQuickAdd', () => {
  it('cria tarefa com Enter e limpa o campo', async () => {
    const user = userEvent.setup();
    renderQuickAdd();

    await user.type(screen.getByLabelText('Adicionar tarefa'), 'Tarefa via quick-add{Enter}');

    expect(screen.getByText('Tarefa via quick-add')).toBeInTheDocument();
    expect(screen.getByLabelText('Adicionar tarefa')).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('Tarefa criada');
  });

  it('ignora título vazio ou só espaços', async () => {
    const user = userEvent.setup();
    renderQuickAdd();

    const input = screen.getByLabelText('Adicionar tarefa');
    await user.type(input, '   {Enter}');

    // apenas as 16 tarefas do seed continuam visíveis
    expect(screen.getAllByRole('listitem')).toHaveLength(16);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('cria tarefa com texto aparado', async () => {
    const user = userEvent.setup();
    renderQuickAdd();

    await user.type(screen.getByLabelText('Adicionar tarefa'), '  Espaços ao redor  {Enter}');

    expect(screen.getByText('Espaços ao redor')).toBeInTheDocument();
  });
});
