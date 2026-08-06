// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useApp } from '../../context/AppContext';
import { renderWithApp } from '../../test/renderWithApp';
import TaskFormModal from './TaskFormModal';

function Probe({ id }: { id: string }) {
  const { state } = useApp();
  const task = state.tasks.find((t) => t.id === id);
  return (
    <output data-testid="probe">
      {task?.responsavelId}|{task?.titulo}
    </output>
  );
}

beforeEach(() => localStorage.clear());

describe('TaskFormModal — edição', () => {
  it('não exibe o seletor de responsável em modo edição', () => {
    renderWithApp(<TaskFormModal open taskId="TA-005" onClose={() => {}} />);
    expect(screen.queryByLabelText(/Responsável \*/)).not.toBeInTheDocument();
  });

  it('mantém o responsável atual ao editar (não reatribui via UPDATE_TASK)', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <TaskFormModal open taskId="TA-005" onClose={() => {}} />
        <Probe id="TA-005" />
      </>
    );

    const titulo = screen.getByLabelText(/Título \*/);
    await user.clear(titulo);
    await user.type(titulo, 'Corrigir bug de checkout v2');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(screen.getByTestId('probe').textContent).toBe('joao|Corrigir bug de checkout v2');
  });
});

describe('TaskFormModal — criação', () => {
  it('exibe o seletor de responsável em modo criação', () => {
    renderWithApp(<TaskFormModal open onClose={() => {}} />);
    expect(screen.getByLabelText(/Responsável \*/)).toBeInTheDocument();
  });
});
