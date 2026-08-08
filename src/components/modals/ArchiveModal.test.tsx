// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArchiveModal from './ArchiveModal';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

function TaskProbe({ id }: { id: string }) {
  const { state } = useApp();
  const t = state.tasks.find((task) => task.id === id);
  return <output data-testid="task-probe">{`${t?.status ?? ''}|${t?.historico.length ?? 0}`}</output>;
}

beforeEach(() => localStorage.clear());

describe('ArchiveModal', () => {
  it('mantém o botão desabilitado enquanto não houver motivo', () => {
    renderWithApp(<ArchiveModal taskId="TA-001" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Confirmar arquivação' })).toBeDisabled();
  });

  it('arquiva a tarefa com motivo e registra a entrada no histórico', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithApp(
      <>
        <ArchiveModal taskId="TA-001" onClose={onClose} />
        <TaskProbe id="TA-001" />
      </>
    );

    await user.type(screen.getByLabelText(/Motivo da arquivação/), 'Tarefa perdeu o sentido');
    await user.click(screen.getByRole('button', { name: 'Confirmar arquivação' }));

    expect(screen.getByTestId('task-probe').textContent).toBe('ARQUIVADA|1');
    expect(onClose).toHaveBeenCalled();
  });

  it('"Voltar" fecha o modal sem arquivar', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithApp(
      <>
        <ArchiveModal taskId="TA-001" onClose={onClose} />
        <TaskProbe id="TA-001" />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(screen.getByTestId('task-probe').textContent).toBe('CAIXA_ENTRADA|0');
    expect(onClose).toHaveBeenCalled();
  });
});
