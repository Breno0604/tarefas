// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useApp } from '../../context/AppContext';
import { renderWithApp } from '../../test/renderWithApp';
import ReassignModal from './ReassignModal';

function Probe({ id }: { id: string }) {
  const { state } = useApp();
  return <output data-testid="probe">{state.tasks.find((t) => t.id === id)?.responsavelId}</output>;
}

beforeEach(() => localStorage.clear());

describe('ReassignModal', () => {
  it('desabilita o botão de salvar sem observação (obrigatória)', () => {
    renderWithApp(<ReassignModal taskId="TA-005" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });

  it('reatribui apenas com observação preenchida, passando-a ao REASSIGN', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <ReassignModal taskId="TA-005" onClose={() => {}} />
        <Probe id="TA-005" />
      </>
    );

    const botao = screen.getByRole('button', { name: 'Salvar' });
    await user.selectOptions(screen.getByLabelText(/Novo responsável/), 'ana');
    expect(botao).toBeDisabled();

    await user.type(screen.getByLabelText(/Motivo/), 'Prioridade de atendimento.');
    expect(botao).toBeEnabled();

    await user.click(botao);
    expect(screen.getByTestId('probe').textContent).toBe('ana');
  });
});
