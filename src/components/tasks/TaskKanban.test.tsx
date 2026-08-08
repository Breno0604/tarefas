// @vitest-environment jsdom
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import TaskKanban from './TaskKanban'
import { renderWithApp } from '../../test/renderWithApp'
import { useApp } from '../../context/AppContext'
import { TAREFAS } from '../../data/mockData'
import type { TaskStatus } from '../../types'

function Probe({ id }: { id: string }) {
  const { state } = useApp()
  return <output data-testid="probe">{state.tasks.find((t) => t.id === id)?.status}</output>
}

function ModalProbe() {
  const { state } = useApp()
  return <output data-testid="modal-probe">{state.modal.type}</output>
}

function SetStatusFilter({ status }: { status: TaskStatus[] }) {
  const { dispatch } = useApp()
  useEffect(() => {
    dispatch({ type: 'SET_FILTERS', filters: { status } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function renderKanban(props: Partial<Parameters<typeof TaskKanban>[0]> = {}) {
  return renderWithApp(
    <TaskKanban
      tasks={TAREFAS}
      totalCount={TAREFAS.length}
      onConfirmComplete={() => {}}
      {...props}
    />
  )
}

beforeEach(() => localStorage.clear())

describe('TaskKanban', () => {
  it('renderiza as seis colunas com seus rótulos de StatusBadge', () => {
    renderKanban()
    expect(screen.getByText('Caixa de entrada')).toBeInTheDocument()
    expect(screen.getByText('A fazer')).toBeInTheDocument()
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
    expect(screen.getByText('Suspensa')).toBeInTheDocument()
    expect(screen.getByText('Concluída')).toBeInTheDocument()
    expect(screen.getByText('Arquivada')).toBeInTheDocument()
  })

  it('renderiza cards de tarefa com títulos', () => {
    renderKanban()
    expect(screen.getByText('Corrigir bug de checkout')).toBeInTheDocument()
  })

  it('exibe somente as colunas dos status selecionados', () => {
    renderWithApp(
      <>
        <SetStatusFilter status={['A_FAZER', 'EM_ANDAMENTO']} />
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
      </>
    )

    expect(screen.getByText('A fazer')).toBeInTheDocument()
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
    expect(screen.queryByText('Caixa de entrada')).not.toBeInTheDocument()
    expect(screen.queryByText('Suspensa')).not.toBeInTheDocument()
    expect(screen.queryByText('Concluída')).not.toBeInTheDocument()
    expect(screen.queryByText('Arquivada')).not.toBeInTheDocument()
  })

  it('exibe todos os status quando nenhum está selecionado', () => {
    renderKanban()
    expect(screen.getByText('Caixa de entrada')).toBeInTheDocument()
    expect(screen.getByText('A fazer')).toBeInTheDocument()
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
    expect(screen.getByText('Suspensa')).toBeInTheDocument()
    expect(screen.getByText('Concluída')).toBeInTheDocument()
    expect(screen.getByText('Arquivada')).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há tarefas e totalCount é zero', () => {
    renderKanban({ tasks: [], totalCount: 0 })
    expect(screen.getByText('Nenhuma tarefa criada ainda')).toBeInTheDocument()
  })

  it('mostra estado vazio de filtro quando não há tarefas e totalCount é maior que zero', () => {
    renderKanban({ tasks: [], totalCount: 5 })
    expect(screen.getByText('Nenhuma tarefa encontrada')).toBeInTheDocument()
  })

  it('drop válido (CAIXA_ENTRADA → A_FAZER) dispara CHANGE_STATUS', async () => {
    const taskId = 'TA-001'
    renderWithApp(
      <>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
      </>
    )

    const card = screen.getByText('Ler e-mails pendentes').closest('div[draggable]')!
    const column = screen.getAllByText('A fazer')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('A_FAZER'))
  })

  it('drop inválido (CAIXA_ENTRADA → CONCLUIDA) não altera o status', async () => {
    const taskId = 'TA-001'
    renderWithApp(
      <>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
      </>
    )

    const card = screen.getByText('Ler e-mails pendentes').closest('div[draggable]')!
    const column = screen.getAllByText('Concluída')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('CAIXA_ENTRADA'))
  })

  it('drop para ARQUIVADA abre o modal de arquivamento (sem mudar o status ainda)', async () => {
    const taskId = 'TA-001'
    renderWithApp(
      <>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
        <ModalProbe />
      </>
    )

    const card = screen.getByText('Ler e-mails pendentes').closest('div[draggable]')!
    const column = screen.getAllByText('Arquivada')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toBe('CAIXA_ENTRADA')
      expect(screen.getByTestId('modal-probe').textContent).toBe('archive')
    })
  })

  it('drop para SUSPENSA abre o modal de suspensão (sem mudar o status ainda)', async () => {
    const taskId = 'TA-005' // EM_ANDAMENTO → SUSPENSA é transição válida
    renderWithApp(
      <>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
        <ModalProbe />
      </>
    )

    const card = screen.getByText('Migração de servidor de produção').closest('div[draggable]')!
    const column = screen.getAllByText('Suspensa')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toBe('EM_ANDAMENTO')
      expect(screen.getByTestId('modal-probe').textContent).toBe('suspend')
    })
  })
})
