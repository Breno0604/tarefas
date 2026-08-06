// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { useEffect, useRef, type ReactNode } from 'react'
import TaskKanban from './TaskKanban'
import { renderWithApp } from '../../test/renderWithApp'
import { useApp } from '../../context/AppContext'
import { TAREFAS } from '../../data/mockData'

function Probe({ id }: { id: string }) {
  const { state } = useApp()
  return <output data-testid="probe">{state.tasks.find((t) => t.id === id)?.status}</output>
}

function switchUser(userId: string) {
  function Harness({ children }: { children: ReactNode }) {
    const { dispatch } = useApp()
    const dispatched = useRef(false)
    useEffect(() => {
      if (!dispatched.current) {
        dispatched.current = true
        dispatch({ type: 'SET_CURRENT_USER', userId })
      }
    }, [dispatch, userId])
    return <>{children}</>
  }
  return Harness
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
  it('renderiza as sete colunas com seus rótulos de StatusBadge', () => {
    renderKanban()
    expect(screen.getByText('Nova')).toBeInTheDocument()
    expect(screen.getByText('Recebida')).toBeInTheDocument()
    expect(screen.getByText('Em execução')).toBeInTheDocument()
    expect(screen.getByText('Concluída')).toBeInTheDocument()
    expect(screen.getByText('Devolvida')).toBeInTheDocument()
    expect(screen.getByText('Finalizada')).toBeInTheDocument()
    expect(screen.getByText('Cancelada')).toBeInTheDocument()
  })

  it('renderiza cards de tarefa com títulos', () => {
    renderKanban()
    expect(screen.getByText('Corrigir bug de checkout')).toBeInTheDocument()
    expect(screen.getByText('Criar campanha de e-mail')).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há tarefas e totalCount é zero', () => {
    renderKanban({ tasks: [], totalCount: 0 })
    expect(screen.getByText('Nenhuma tarefa criada ainda')).toBeInTheDocument()
  })

  it('mostra estado vazio de filtro quando não há tarefas e totalCount é maior que zero', () => {
    renderKanban({ tasks: [], totalCount: 5 })
    expect(screen.getByText('Nenhuma tarefa encontrada')).toBeInTheDocument()
  })

  it('drop válido como gestor dispara CHANGE_STATUS', async () => {
    const taskId = 'TA-003'
    renderWithApp(
      <>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
      </>
    )

    const card = screen.getByText('Criar campanha de e-mail').closest('div[draggable]')!
    const column = screen.getAllByText('Finalizada')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('FINALIZADA'))
  })

  it('drop inválido como gestor não altera o status', async () => {
    const taskId = 'TA-005'
    renderWithApp(
      <>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
      </>
    )

    const card = screen.getByText('Corrigir bug de checkout').closest('div[draggable]')!
    const column = screen.getAllByText('Concluída')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('NOVA'))
  })

  it('drop válido como colaborador dispara CHANGE_STATUS', async () => {
    const taskId = 'TA-005'
    const Harness = switchUser('joao')
    renderWithApp(
      <Harness>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
      </Harness>
    )

    const card = screen.getByText('Corrigir bug de checkout').closest('div[draggable]')!
    const column = screen.getAllByText('Recebida')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('RECEBIDA'))
  })

  it('drop inválido como colaborador para FINALIZADA não altera o status', async () => {
    const taskId = 'TA-005'
    const Harness = switchUser('joao')
    renderWithApp(
      <Harness>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
      </Harness>
    )

    const card = screen.getByText('Corrigir bug de checkout').closest('div[draggable]')!
    const column = screen.getAllByText('Finalizada')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('NOVA'))
  })

  it('drop para CANCELADA não altera o status (cancelamento exige observação)', async () => {
    const taskId = 'TA-005'
    renderWithApp(
      <>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
      </>
    )

    const card = screen.getByText('Corrigir bug de checkout').closest('div[draggable]')!
    const column = screen.getAllByText('Cancelada')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('NOVA'))
  })

  it('drop para DEVOLVIDA não altera o status (devolução exige observação via ReturnModal)', async () => {
    const taskId = 'TA-003'
    renderWithApp(
      <>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
      </>
    )

    const card = screen.getByText('Criar campanha de e-mail').closest('div[draggable]')!
    const column = screen.getAllByText('Devolvida')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('CONCLUIDA'))
  })
})

describe('TaskKanban — permissões', () => {
  it('colaborador não arrasta nem vê ação de ciclo de tarefa de outro', () => {
    // TA-003 (Criar campanha de e-mail) é de maria; joao não tem permissão
    const Harness = switchUser('joao');
    renderWithApp(
      <Harness>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
      </Harness>
    );

    const card = screen.getByText('Criar campanha de e-mail').closest('div[draggable]');
    expect(card).toBeNull();
    expect(screen.queryByRole('button', { name: /Reabrir/ })).not.toBeInTheDocument();
  });

  it('colaborador arrasta a própria tarefa', () => {
    // TA-005 (Corrigir bug de checkout) é de joao
    const Harness = switchUser('joao');
    renderWithApp(
      <Harness>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
      </Harness>
    );

    const card = screen.getByText('Corrigir bug de checkout').closest('div[draggable]');
    expect(card).not.toBeNull();
  });
});
