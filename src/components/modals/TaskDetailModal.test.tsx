// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import TaskDetailModal from './TaskDetailModal';
import { renderWithApp } from '../../test/renderWithApp';

beforeEach(() => localStorage.clear());

describe('TaskDetailModal', () => {
  it('exibe Editar, Duplicar e Excluir para qualquer tarefa', () => {
    renderWithApp(<TaskDetailModal taskId="TA-001" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
  });

  it('CAIXA_ENTRADA exibe ações Planejar e Cancelar', () => {
    renderWithApp(<TaskDetailModal taskId="TA-001" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Planejar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('EM_ANDAMENTO exibe Concluir e Cancelar, sem Planejar', () => {
    renderWithApp(<TaskDetailModal taskId="TA-005" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Planejar' })).not.toBeInTheDocument();
  });

  it('CONCLUIDA exibe Retomar e não exibe Cancelar', () => {
    renderWithApp(<TaskDetailModal taskId="TA-007" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Retomar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('exibe categoria e tags da tarefa', () => {
    renderWithApp(<TaskDetailModal taskId="TA-003" onClose={() => {}} />);
    // TA-003 do seed: categoria Desenvolvimento, tags bug e crítico
    expect(screen.getByText('Desenvolvimento')).toBeInTheDocument();
    expect(screen.getByText('#bug')).toBeInTheDocument();
  });

  it('mostra a data de criação no formato pt-BR', () => {
    renderWithApp(<TaskDetailModal taskId="TA-003" onClose={() => {}} />);
    // TA-003 criada em 2026-08-04
    expect(screen.getByText('Criada em')).toBeInTheDocument();
    expect(screen.getByText('04/08/2026')).toBeInTheDocument();
  });
});
