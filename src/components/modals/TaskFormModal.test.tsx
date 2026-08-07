// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useApp } from '../../context/AppContext';
import { renderWithApp } from '../../test/renderWithApp';
import TaskFormModal from './TaskFormModal';

function Probe({ id }: { id: string }) {
  const { state } = useApp();
  const task = state.tasks.find((t) => t.id === id);
  return <output data-testid="probe">{task?.titulo}</output>;
}

function LastProbe() {
  const { state } = useApp();
  const task = state.tasks[state.tasks.length - 1];
  return <output data-testid="probe-last">{task ? `${task.titulo}|${task.status}` : ''}</output>;
}

beforeEach(() => localStorage.clear());

describe('TaskFormModal', () => {
  it('não exibe o seletor de responsável (nem em criação, nem em edição)', () => {
    renderWithApp(<TaskFormModal open onClose={() => {}} />);
    expect(screen.queryByLabelText(/Responsável \*/)).not.toBeInTheDocument();

    renderWithApp(<TaskFormModal open taskId="TA-005" onClose={() => {}} />);
    expect(screen.queryByLabelText(/Responsável \*/)).not.toBeInTheDocument();
  });

  it('edita o título de uma tarefa existente via UPDATE_TASK', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <TaskFormModal open taskId="TA-005" onClose={() => {}} />
        <Probe id="TA-005" />
      </>
    );

    const titulo = screen.getByLabelText(/Título \*/);
    await user.clear(titulo);
    await user.type(titulo, 'Migração v2');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(screen.getByTestId('probe').textContent).toBe('Migração v2');
  });

  it('cria uma tarefa CAIXA_ENTRADA', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <TaskFormModal open onClose={() => {}} />
        <LastProbe />
      </>
    );

    await user.type(screen.getByLabelText(/Título \*/), 'Nova tarefa pessoal');
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() => {
      expect(screen.getByTestId('probe-last').textContent).toBe('Nova tarefa pessoal|CAIXA_ENTRADA');
    });
  });
});
