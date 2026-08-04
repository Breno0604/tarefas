// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useApp } from './AppContext';
import { renderWithApp } from '../test/renderWithApp';

function Mutator() {
  const { state, dispatch } = useApp();
  return (
    <>
      <button onClick={() => dispatch({ type: 'DELETE_TASK', taskId: 'TA-001' })}>excluir A</button>
      <button onClick={() => dispatch({ type: 'DELETE_TASK', taskId: 'TA-002' })}>excluir B</button>
      <output data-testid="probe">{JSON.stringify(state.tasks.map((t) => t.id))}</output>
    </>
  );
}

beforeEach(() => localStorage.clear());

describe('toast de desfazer por mutação', () => {
  it('mantém o Desfazer apenas no último toast, desfazendo a última mutação', async () => {
    const user = userEvent.setup();
    renderWithApp(<Mutator />);

    await user.click(screen.getByRole('button', { name: 'excluir A' }));
    await user.click(screen.getByRole('button', { name: 'excluir B' }));

    // apenas o toast da última mutação oferece Desfazer
    expect(screen.getAllByRole('button', { name: 'Desfazer' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Desfazer' }));

    await waitFor(() => {
      const ids = JSON.parse(screen.getByTestId('probe').textContent!) as string[];
      expect(ids).toContain('TA-002'); // B restaurada
      expect(ids).not.toContain('TA-001'); // A continua excluída
    });
  });
});
