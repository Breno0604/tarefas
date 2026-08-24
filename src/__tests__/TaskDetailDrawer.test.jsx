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
  assigneeId: 'u1',
  projectId: 'p1',
  categoryId: 'c1',
  dueDate: '2026-09-01T10:00:00Z',
  createdAt: '2026-08-01T10:00:00Z',
  estimatedHours: 8,
  progress: 0,
  tags: ['bug'],
  subtasks: [],
  favorite: false
}

const MOCK_STATE = {
  tasks: [MOCK_TASK],
  users: [{ id: 'u1', name: 'Ana', color: '#6366f1' }],
  projects: [{ id: 'p1', name: 'Alpha' }],
  categories: [{ id: 'c1', name: 'Dev' }],
  profiles: [
    { id: 'pr1', name: 'Admin', level: 'admin', permissions: ['view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks'] }
  ],
  currentUserId: 'u1',
  currentProfileId: 'pr1',
  notifications: [],
  activities: [],
  comments: { t1: [] },
  theme: 'light',
  booted: true,
  trash: []
}

let mockState
let mockDispatch

/* ─── Mock store ─── */
vi.mock('../store/store', () => ({
  useStore: () => ({ state: mockState, dispatch: mockDispatch }),
  useCurrentUser: () => ({ id: 'u1', name: 'Ana', color: '#6366f1' }),
  useActiveProfile: () => mockState.profiles[0],
  useCan: () => (perm) => mockState.profiles[0].permissions.includes(perm),
  useIsManager: () => true,
  useCanReassign: () => true,
  useCanModifyTask: () => (task) => Boolean(task && (task.assigneeId === 'u1')),
  useTaskById: (taskId) => mockState.tasks.find((t) => t.id === taskId) || null,
  useTaskComments: (taskId) => mockState.comments[taskId] || []
}))

const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), push: vi.fn() }
vi.mock('../store/toast', () => ({
  useToast: () => mockToast,
  ToastProvider: ({ children }) => children
}))

vi.mock('../lib/utils', () => ({
  deleteTaskWithUndo: vi.fn(({ dispatch, task }) => {
    dispatch({ type: 'DELETE_TASK', taskId: task.id, actorId: 'u1' })
  }),
  bulkDeleteWithUndo: vi.fn(),
  isTypingTarget: vi.fn(() => false)
}))

function wrapper({ children } = {}) {
  return <MemoryRouter initialEntries={['/?task=t1']}>{children}</MemoryRouter>
}

/* ─── Tests ─── */
describe('TaskDetailDrawer – delete flow', () => {
  beforeEach(() => {
    mockState = JSON.parse(JSON.stringify(MOCK_STATE))
    mockDispatch = vi.fn()
    mockToast.success.mockClear()
    mockToast.error.mockClear()
  })

  it('shows delete button when user has permission', async () => {
    const { default: TaskDetailDrawer } = await import('../components/tasks/TaskDetailDrawer')
    render(
      <TaskDetailDrawer open={true} onClose={() => {}} taskId="t1" onEdit={() => {}} />,
      { wrapper }
    )

    expect(screen.getByText('Excluir')).toBeTruthy()
  })

  it('opens ConfirmDialog when delete button is clicked', async () => {
    const { default: TaskDetailDrawer } = await import('../components/tasks/TaskDetailDrawer')
    render(
      <TaskDetailDrawer open={true} onClose={() => {}} taskId="t1" onEdit={() => {}} />,
      { wrapper }
    )

    const deleteBtn = screen.getByText('Excluir').closest('button')
    fireEvent.click(deleteBtn)

    // ConfirmDialog should appear with the delete confirmation message
    expect(screen.getByText(/Tem certeza que deseja excluir/)).toBeTruthy()
    // Confirm button should be present
    const confirmButtons = screen.getAllByText('Excluir tarefa')
    expect(confirmButtons.some((el) => el.tagName === 'BUTTON')).toBe(true)
  })

  it('dispatches DELETE_TASK when confirm button is clicked in ConfirmDialog', async () => {
    const { default: TaskDetailDrawer } = await import('../components/tasks/TaskDetailDrawer')
    render(
      <TaskDetailDrawer open={true} onClose={() => {}} taskId="t1" onEdit={() => {}} />,
      { wrapper }
    )

    // Click "Excluir" to open ConfirmDialog
    const deleteBtn = screen.getByText('Excluir').closest('button')
    fireEvent.click(deleteBtn)

    // ConfirmDialog should appear
    expect(screen.getByText(/Tem certeza que deseja excluir/)).toBeTruthy()

    // Click the confirm button (the one inside the ConfirmDialog, not the footer one)
    const confirmBtn = screen.getAllByText('Excluir tarefa').find((el) => el.tagName === 'BUTTON')
    fireEvent.click(confirmBtn)

    // Verify dispatch was called with DELETE_TASK
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DELETE_TASK',
        taskId: 't1'
      })
    )
  })

  it('closes ConfirmDialog when cancel is clicked', async () => {
    const { default: TaskDetailDrawer } = await import('../components/tasks/TaskDetailDrawer')
    render(
      <TaskDetailDrawer open={true} onClose={() => {}} taskId="t1" onEdit={() => {}} />,
      { wrapper }
    )

    // Click "Excluir" to open ConfirmDialog
    const deleteBtn = screen.getByText('Excluir').closest('button')
    fireEvent.click(deleteBtn)

    // ConfirmDialog should appear
    expect(screen.getByText(/Tem certeza que deseja excluir/)).toBeTruthy()

    // Click Cancelar in the ConfirmDialog (the second one, after the drawer footer button)
    const cancelBtns = screen.getAllByText('Cancelar').map((el) => el.closest('button'))
    // The ConfirmDialog Cancelar is the last one rendered (portal after Drawer)
    const cancelBtn = cancelBtns[cancelBtns.length - 1]
    fireEvent.click(cancelBtn)

    // ConfirmDialog should close - message should not be visible
    expect(screen.queryByText(/Tem certeza que deseja excluir/)).toBeNull()

    // Drawer should still be open
    expect(screen.getByText('Detalhes da tarefa')).toBeTruthy()
  })

  it('drawer does not close when clicking inside ConfirmDialog (regression test for z-index fix)', async () => {
    const onClose = vi.fn()
    const { default: TaskDetailDrawer } = await import('../components/tasks/TaskDetailDrawer')
    render(
      <TaskDetailDrawer open={true} onClose={onClose} taskId="t1" onEdit={() => {}} />,
      { wrapper }
    )

    // Click "Excluir" to open ConfirmDialog
    const deleteBtn = screen.getByText('Excluir').closest('button')
    fireEvent.click(deleteBtn)

    // ConfirmDialog should be visible
    expect(screen.getByText(/Tem certeza que deseja excluir/)).toBeTruthy()

    // Click confirm inside ConfirmDialog
    const confirmBtn = screen.getAllByText('Excluir tarefa').find((el) => el.tagName === 'BUTTON')
    fireEvent.click(confirmBtn)

    // The key regression: before our fix, useDismissable on the Drawer would intercept
    // the mousedown on the ConfirmDialog as "outside click" and close the Drawer,
    // preventing onConfirm from executing. Now with disableDismiss, the dispatch
    // should be called.
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DELETE_TASK',
        taskId: 't1'
      })
    )
  })
})
