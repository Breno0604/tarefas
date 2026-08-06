// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renderiza o rótulo Cancelada para CANCELADA', () => {
    render(<StatusBadge status="CANCELADA" />);
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
  });

  it('renderiza os rótulos dos demais status', () => {
    render(<StatusBadge status="NOVA" />);
    render(<StatusBadge status="DEVOLVIDA" />);
    expect(screen.getByText('Nova')).toBeInTheDocument();
    expect(screen.getByText('Devolvida')).toBeInTheDocument();
  });
});
