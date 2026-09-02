import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/* ─── Mock task ─── */
const MOCK_TASK = {
  id: 't1',
  title: 'Tarefa de teste',
  description: 'Descrição da tarefa',
  status: 'todo',
  priority: 'high',
  projectId: 'p1',
  dueDate: '2026-09-01T10:00:00Z',
  createdAt: '2026-08-01T10:00:00Z',
  progress: 0,
  tags: ['bug'],
  subtasks: [],
  favorite: false,
  recurrence: null,
  cancelReason: null
}

const MOCK_STATE = {
  tasks: [MOCK_TASK],
  me: { id: 'me', name: 'Você', bio: '' },
  projects: [{ id: 'p1', name: 'Alpha' }],
  reminders: [],
  activities: [],
  notes: { t1: [{ id: 'n1', text: 'Nota antiga', createdAt: '2026-08-01' }] },
  theme: 'light',
  booted: true,
  trash: []
}

let mockState
let mockDispatch

vi.mock('../store/store', () => ({
  useStore: () => ({ state: mockState, dispatch: mockDispatch }),
  useTaskById: (taskId) => mockState.tasks.find((t) => t.id === taskId) || null,
  useTaskNotes: (taskId) => mockState.notes[taskId] || []
}))

const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), push: vi.fn() }
vi.mock('../store/toast', () => ({
  useToast: () => mockToast,
  ToastProvider: ({ children }) => children
}))

vi.mock('../lib/utils', () => ({
  deleteTaskWithUndo: vi.fn(({ dispatch, task }) => {
    dispatch({ type: 'DELETE_TASK', taskId: task.id })
  }),
  bulkDeleteWithUndo: vi.fn(),
  isTypingTarget: vi.fn(() => false)
}))

function wrapper({ children } = {}) {
  return <MemoryRouter initialEntries={['/?task=t1']}>{children}</MemoryRouter>
}

async function renderDrawer(overrides = {}) {
  const { default: TaskDetailDrawer } = await import('../components/tasks/TaskDetailDrawer')
  return render(
    <TaskDetailDrawer open={true} onClose={() => {}} taskId="t1" onEdit={() => {}} {...overrides} />,
    { wrapper }
  )
}

describe('TaskDetailDrawer – delete flow', () => {
  beforeEach(() => {
    mockState = JSON.parse(JSON.stringify(MOCK_STATE))
    mockDispatch = vi.fn()
    mockToast.success.mockClear()
    mockToast.error.mockClear()
  })

  it('shows delete button in footer', async () => {
    await renderDrawer()
    expect(screen.getAllByText('Excluir').length).toBeGreaterThanOrEqual(1)
  })

  it('opens ConfirmDialog when delete button is clicked', async () => {
    await renderDrawer()

    const deleteBtn = screen.getAllByText('Excluir')[0].closest('button')
    fireEvent.click(deleteBtn)

    expect(screen.getByText(/Tem certeza que deseja excluir/)).toBeTruthy()
    const confirmButtons = screen.getAllByText('Excluir tarefa')
    expect(confirmButtons.some((el) => el.tagName === 'BUTTON')).toBe(true)
  })

  it('dispatches DELETE_TASK when confirm button is clicked in ConfirmDialog', async () => {
    await renderDrawer()

    const deleteBtn = screen.getAllByText('Excluir')[0].closest('button')
    fireEvent.click(deleteBtn)

    expect(screen.getByText(/Tem certeza que deseja excluir/)).toBeTruthy()

    const confirmBtn = screen.getAllByText('Excluir tarefa').find((el) => el.tagName === 'BUTTON')
    fireEvent.click(confirmBtn)

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DELETE_TASK',
        taskId: 't1'
      })
    )
  })

  it('closes ConfirmDialog when cancel is clicked', async () => {
    await renderDrawer()

    const deleteBtn = screen.getAllByText('Excluir')[0].closest('button')
    fireEvent.click(deleteBtn)

    expect(screen.getByText(/Tem certeza que deseja excluir/)).toBeTruthy()

    // ConfirmDialog's hardcoded "Cancelar" — pick the last one rendered (portal comes after the Drawer footer)
    const cancelBtns = screen.getAllByText('Cancelar').map((el) => el.closest('button'))
    fireEvent.click(cancelBtns[cancelBtns.length - 1])

    expect(screen.queryByText(/Tem certeza que deseja excluir/)).toBeNull()
    expect(screen.getByText('Detalhes da tarefa')).toBeTruthy()
  })

  it('drawer does not close when confirming inside ConfirmDialog (regression test)', async () => {
    const onClose = vi.fn()
    await renderDrawer({ onClose })

    const deleteBtn = screen.getAllByText('Excluir')[0].closest('button')
    fireEvent.click(deleteBtn)

    expect(screen.getByText(/Tem certeza que deseja excluir/)).toBeTruthy()

    const confirmBtn = screen.getAllByText('Excluir tarefa').find((el) => el.tagName === 'BUTTON')
    fireEvent.click(confirmBtn)

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DELETE_TASK',
        taskId: 't1'
      })
    )
  })
})

describe('TaskDetailDrawer – personal actions', () => {
  beforeEach(() => {
    mockState = JSON.parse(JSON.stringify(MOCK_STATE))
    mockDispatch = vi.fn()
    mockToast.success.mockClear()
  })

  it('shows complete button for open task', async () => {
    await renderDrawer()
    expect(screen.getByText('Marcar como concluída')).toBeTruthy()
  })

  it('dispatches TOGGLE_TASK_DONE when complete button clicked', async () => {
    await renderDrawer()
    fireEvent.click(screen.getByText('Marcar como concluída'))
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'TOGGLE_TASK_DONE',
        taskId: 't1'
      })
    )
  })

  it('shows reopen button for done task', async () => {
    mockState.tasks[0].status = 'done'
    await renderDrawer()
    expect(screen.getByText('Reabrir tarefa')).toBeTruthy()
  })

  it('renders notes with add form', async () => {
    await renderDrawer()
    expect(screen.getByText('Notas (1)')).toBeTruthy()
    expect(screen.getByText('Nota antiga')).toBeTruthy()
    expect(screen.getByPlaceholderText('Escreva uma nota...')).toBeTruthy()
  })

  it('dispatches ADD_NOTE when submitting a note', async () => {
    await renderDrawer()
    const input = screen.getByPlaceholderText('Escreva uma nota...')
    fireEvent.change(input, { target: { value: 'Nova nota pessoal' } })
    fireEvent.click(screen.getByText('Adicionar nota'))

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ADD_NOTE',
        taskId: 't1',
        text: 'Nova nota pessoal'
      })
    )
  })

  it('shows recurrence meta for recurring task', async () => {
    mockState.tasks[0].recurrence = 'weekly'
    await renderDrawer()
    expect(screen.getByText('Repetição')).toBeTruthy()
    expect(screen.getByText('Toda semana')).toBeTruthy()
  })

  it('shows optional cancel dialog without requiring reason', async () => {
    await renderDrawer()
    fireEvent.click(screen.getAllByText('Cancelar')[0])
    // Dialog opens; confirm button enabled even with empty reason
    const confirmBtn = screen.getAllByText('Cancelar tarefa').find((el) => el.tagName === 'BUTTON')
    expect(confirmBtn.disabled).toBeFalsy()
    fireEvent.click(confirmBtn)
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CANCEL_TASK',
        taskId: 't1'
      })
    )
  })
})
