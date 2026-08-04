// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import Modal from './Modal';

describe('Modal — tecla Escape com modais empilhados', () => {
  it('Escape fecha o modal quando é o único aberto', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Único" onClose={onClose}>
        conteúdo
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape fecha apenas o modal do topo em modais empilhados', () => {
    const onCloseDetail = vi.fn();
    const onCloseConfirm = vi.fn();
    render(
      <>
        <Modal open title="Detalhes" onClose={onCloseDetail}>
          base
        </Modal>
        <Modal open title="Confirmar" onClose={onCloseConfirm}>
          topo
        </Modal>
      </>
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onCloseConfirm).toHaveBeenCalledTimes(1);
    expect(onCloseDetail).not.toHaveBeenCalled();
  });

  it('após fechar o topo, o próximo Escape fecha o modal abaixo', () => {
    const onCloseDetail = vi.fn();
    function Stack() {
      const [confirm, setConfirm] = useState(true);
      return (
        <>
          <Modal open title="Detalhes" onClose={onCloseDetail}>
            base
          </Modal>
          {confirm && (
            <Modal open title="Confirmar" onClose={() => setConfirm(false)}>
              topo
            </Modal>
          )}
        </>
      );
    }
    render(<Stack />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Confirmar' })).not.toBeInTheDocument();
    expect(onCloseDetail).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseDetail).toHaveBeenCalledTimes(1);
  });
});
