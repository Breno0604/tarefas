// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useApp } from '../../context/AppContext';
import { renderWithApp } from '../../test/renderWithApp';
import CancelModal from './CancelModal';

function Probe({ id }: { id: string }) {
  const { state } = useApp();
  return <output data-testid="probe">{state.tasks.find((t) => t.id === id)?.status}</output>;
}

beforeEach(() => localStorage.clear());

describe('CancelModal', () => {
  it('desabilita confirmar sem observação (obrigatória)', () => {
    renderWithApp(<CancelModal taskId="TA-005" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Confirmar cancelamento' })).toBeDisabled();
  });

  it('cancela a tarefa com observação e dispara CHANGE_STATUS para CANCELADA', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <CancelModal taskId="TA-005" onClose={() => {}} />
        <Probe id="TA-005" />
      </>
    );

    await user.type(screen.getByLabelText(/Motivo do cancelamento/), 'Tarefa perdeu o sentido.');
    await user.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));

    expect(screen.getByTestId('probe').textContent).toBe('CANCELADA');
  });
});
