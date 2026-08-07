// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renderiza os rótulos dos status GTD', () => {
    render(<StatusBadge status="CAIXA_ENTRADA" />);
    render(<StatusBadge status="A_FAZER" />);
    render(<StatusBadge status="EM_ANDAMENTO" />);
    render(<StatusBadge status="CONCLUIDA" />);
    render(<StatusBadge status="SUSPENSA" />);
    render(<StatusBadge status="ARQUIVADA" />);
    expect(screen.getByText('Caixa de entrada')).toBeInTheDocument();
    expect(screen.getByText('A fazer')).toBeInTheDocument();
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    expect(screen.getByText('Concluída')).toBeInTheDocument();
    expect(screen.getByText('Suspensa')).toBeInTheDocument();
    expect(screen.getByText('Arquivada')).toBeInTheDocument();
  });
});
