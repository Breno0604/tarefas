// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SuspendModal from './SuspendModal';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

function TaskProbe({ id }: { id: string }) {
  const { state } = useApp();
  const t = state.tasks.find((task) => task.id === id);
  return <output data-testid="task-probe">{`${t?.status ?? ''}|${t?.retornoEm ?? ''}`}</output>;
}

beforeEach(() => localStorage.clear());

describe('SuspendModal', () => {
  it('suspende a tarefa sem data de retorno por padrão', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithApp(
      <>
        <SuspendModal taskId="TA-005" onClose={onClose} />
        <TaskProbe id="TA-005" />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Suspender tarefa' }));

    expect(screen.getByTestId('task-probe').textContent).toBe('SUSPENSA|');
    expect(onClose).toHaveBeenCalled();
  });

  it('exige data de retorno quando "com data" é selecionado', async () => {
    const user = userEvent.setup();
    renderWithApp(<SuspendModal taskId="TA-005" onClose={() => {}} />);

    await user.click(screen.getByLabelText(/Com data definida para retorno/));

    expect(screen.getByRole('button', { name: 'Suspender tarefa' })).toBeDisabled();
  });

  it('suspende com data de retorno definida', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <SuspendModal taskId="TA-005" onClose={() => {}} />
        <TaskProbe id="TA-005" />
      </>
    );

    await user.click(screen.getByLabelText(/Com data definida para retorno/));
    fireEvent.change(screen.getByLabelText(/Data de retorno/), {
      target: { value: '2026-08-20' },
    });
    await user.click(screen.getByRole('button', { name: 'Suspender tarefa' }));

    expect(screen.getByTestId('task-probe').textContent).toBe('SUSPENSA|2026-08-20');
  });
});
