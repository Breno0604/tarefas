// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import CycleStepper from './CycleStepper';

describe('CycleStepper', () => {
  it('mostra o badge Arquivada para tarefa arquivada', () => {
    render(<CycleStepper status="ARQUIVADA" />);
    expect(screen.getByText('Arquivada')).toBeInTheDocument();
  });

  it('mostra o badge Suspensa para tarefa suspensa', () => {
    render(<CycleStepper status="SUSPENSA" />);
    expect(screen.getByText('Suspensa')).toBeInTheDocument();
  });

  it('não exibe etapa Arquivada no ciclo de uma tarefa normal', () => {
    render(<CycleStepper status="CONCLUIDA" />);
    expect(screen.queryByText('Arquivada')).not.toBeInTheDocument();
  });

  it('marca todos os passos como não concluídos para uma tarefa arquivada', () => {
    render(<CycleStepper status="ARQUIVADA" />);
    expect(screen.getByTitle('Ciclo: ARQUIVADA')).toBeInTheDocument();
  });
});
