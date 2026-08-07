// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import CycleStepper from './CycleStepper';

describe('CycleStepper', () => {
  it('mostra o badge Cancelada para tarefa cancelada', () => {
    render(<CycleStepper status="CANCELADA" />);
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
  });

  it('não exibe etapa Cancelada no ciclo de uma tarefa normal', () => {
    render(<CycleStepper status="CONCLUIDA" />);
    expect(screen.queryByText('Cancelada')).not.toBeInTheDocument();
  });

  it('marca todos os passos como não concluídos para uma tarefa cancelada', () => {
    render(<CycleStepper status="CANCELADA" />);
    expect(screen.getByTitle('Ciclo: CANCELADA')).toBeInTheDocument();
  });
});
