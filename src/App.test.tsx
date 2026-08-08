// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

beforeEach(() => localStorage.clear());

describe('App — atalho de teclado de ajuda', () => {
  it('a tecla "?" abre o modal de atalhos e Esc o fecha', () => {
    render(<App />);

    fireEvent.keyDown(window, { key: '?' });

    expect(screen.getByRole('dialog', { name: 'Atalhos de teclado' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Atalhos de teclado' })).not.toBeInTheDocument();
  });

  it('abre o modal de atalhos pelo botão do topo', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Atalhos de teclado' }));

    expect(screen.getByRole('dialog', { name: 'Atalhos de teclado' })).toBeInTheDocument();
  });

  it('a tecla F alterna o filtro de favoritas', () => {
    render(<App />);

    fireEvent.keyDown(window, { key: 'f' });

    expect(screen.getByRole('button', { name: 'Remover favoritas' })).toBeInTheDocument();
  });

  it('a tecla T alterna o tema claro/escuro', () => {
    render(<App />);

    fireEvent.keyDown(window, { key: 't' });

    expect(screen.getByRole('button', { name: 'Ativar tema claro' })).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('Ctrl+F foca o campo de busca', () => {
    render(<App />);

    fireEvent.keyDown(window, { key: 'f', ctrlKey: true });

    expect(screen.getByRole('textbox')).toHaveFocus();
  });
});
