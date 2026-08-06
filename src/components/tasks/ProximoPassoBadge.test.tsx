// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProximoPassoBadge from './ProximoPassoBadge';
import type { Task } from '../../types';

const NOW = new Date('2026-08-03T12:00:00');

const base: Task = {
  id: 'TA-001',
  titulo: 'Login',
  descricao: '',
  responsavelId: 'joao',
  criadorId: 'carlos',
  prioridade: 'media',
  prazo: null,
  status: 'CONCLUIDA',
  criadaEm: '2026-08-01T08:00:00',
  historico: [],
};

describe('ProximoPassoBadge', () => {
  it('mostra "aguardando gestor há X dias" para CONCLUIDA com espera', () => {
    render(<ProximoPassoBadge task={{ ...base, concluidaEm: '2026-08-01T10:00:00' }} now={NOW} />);
    expect(screen.getByText('aguardando gestor há 2 dias')).toBeInTheDocument();
  });

  it('mostra apenas "aguardando gestor" para CONCLUIDA entregue hoje', () => {
    render(<ProximoPassoBadge task={{ ...base, concluidaEm: '2026-08-03T09:00:00' }} now={NOW} />);
    expect(screen.getByText('aguardando gestor')).toBeInTheDocument();
  });

  it('mostra "vez do colaborador" nos status de execução', () => {
    for (const status of ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'DEVOLVIDA'] as const) {
      const { unmount } = render(<ProximoPassoBadge task={{ ...base, status }} now={NOW} />);
      expect(screen.getByText('vez do colaborador')).toBeInTheDocument();
      unmount();
    }
  });

  it('não renderiza para FINALIZADA e CANCELADA', () => {
    for (const status of ['FINALIZADA', 'CANCELADA'] as const) {
      const { container } = render(<ProximoPassoBadge task={{ ...base, status }} now={NOW} />);
      expect(container.firstChild).toBeNull();
    }
  });
});
