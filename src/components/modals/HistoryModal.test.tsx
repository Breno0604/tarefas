// @vitest-environment jsdom
import { useEffect } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import HistoryModal from './HistoryModal';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

/** Dispara uma edição única (gera entrada [info] no histórico) antes de abrir o modal. */
function EditaPrazo() {
  const { dispatch } = useApp();
  useEffect(() => {
    dispatch({ type: 'UPDATE_TASK', taskId: 'TA-004', changes: { prazo: '2026-08-11' } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

beforeEach(() => localStorage.clear());

describe('HistoryModal', () => {
  it('mostra o estado vazio quando a tarefa não tem histórico', () => {
    renderWithApp(<HistoryModal taskId="TA-001" onClose={() => {}} />);
    expect(screen.getByText('Nenhum registro de histórico ainda.')).toBeInTheDocument();
  });

  it('renderiza as transições de status da tarefa (origem → destino)', () => {
    renderWithApp(<HistoryModal taskId="TA-005" onClose={() => {}} />);
    // TA-005: CAIXA_ENTRADA → A_FAZER → EM_ANDAMENTO
    expect(screen.getAllByText('A fazer')).toHaveLength(2);
    expect(screen.getByText('Caixa de entrada')).toBeInTheDocument();
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
  });

  it('exibe entradas informativas com a observação da edição', () => {
    renderWithApp(
      <>
        <EditaPrazo />
        <HistoryModal taskId="TA-004" onClose={() => {}} />
      </>
    );
    expect(screen.getByText(/Prazo alterado de 2026-08-10 para 2026-08-11/)).toBeInTheDocument();
  });
});
