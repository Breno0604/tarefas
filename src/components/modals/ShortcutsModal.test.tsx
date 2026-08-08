// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShortcutsModal from './ShortcutsModal';

describe('ShortcutsModal', () => {
  it('exibe a lista de atalhos de teclado', () => {
    render(<ShortcutsModal onClose={() => {}} />);

    expect(screen.getByRole('dialog', { name: 'Atalhos de teclado' })).toBeInTheDocument();
    expect(screen.getByText('Nova tarefa')).toBeInTheDocument();
    expect(screen.getAllByText('Focar o campo de busca')).toHaveLength(2); // "/" e Ctrl+F
    expect(screen.getByText('Alternar entre Lista e Quadro')).toBeInTheDocument();
    expect(screen.getByText('Alternar "Apenas favoritas"')).toBeInTheDocument();
    expect(screen.getByText('Alternar tema claro/escuro')).toBeInTheDocument();
    expect(screen.getByText('Recolher/expandir indicadores')).toBeInTheDocument();
    expect(screen.getByText('Desfazer a última alteração')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+F')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+Z')).toBeInTheDocument();
  });

  it('fecha ao clicar no botão de fechar', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ShortcutsModal onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
