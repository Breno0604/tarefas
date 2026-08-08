// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

function Bomb(): ReactNode {
  throw new Error('falha simulada');
}

describe('ErrorBoundary', () => {
  it('mostra mensagem legível quando um filho lança erro', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Algo deu errado/)).toBeInTheDocument();
    expect(screen.getByText(/falha simulada/)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('renderiza os filhos quando não há erro', () => {
    render(
      <ErrorBoundary>
        <div>ok</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
