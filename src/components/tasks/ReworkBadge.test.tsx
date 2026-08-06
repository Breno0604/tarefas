// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReworkBadge from './ReworkBadge';

describe('ReworkBadge', () => {
  it('mostra "retornou 1 vez" no singular', () => {
    render(<ReworkBadge qtd={1} />);
    expect(screen.getByText('retornou 1 vez')).toBeInTheDocument();
  });

  it('mostra "retornou N vezes" no plural', () => {
    render(<ReworkBadge qtd={3} />);
    expect(screen.getByText('retornou 3 vezes')).toBeInTheDocument();
  });

  it('não renderiza quando não houve devolução', () => {
    const { container } = render(<ReworkBadge qtd={0} />);
    expect(container.firstChild).toBeNull();
  });
});
