import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/* ─── Mock data ─── */
const MOCK_TRASHED_TASK = {
  id: 't1',
  title: 'Tarefa excluída',
  description: 'Descrição',
  status: 'todo',
  priority: 'high',
  projectId: 'p1',
  dueDate: '2026-09-01T10:00:00Z',
  createdAt: '2026-08-01T10:00:00Z',
  progress: 0,
  tags: ['test'],
  subtasks: [],
  favorite: false,
  recurrence: null,
  cancelReason: null
}

const MOCK_NOTES = [{ id: 'n1', text: 'Nota antiga', createdAt: '2026-08-01' }]

const MOCK_STATE_EMPTY_TRASH = {
  tasks: [],
  me: { id: 'me', name: 'Você', bio: '' },
  projects: [{ id: 'p1', name: 'Alpha', color: '#6366f1' }],
  reminders: [],
  activities: [],
  notes: {},
  theme: 'light',
  booted: true,
  trash: []
}

const MOCK_STATE_WITH_TRASH = {
  ...MOCK_STATE_EMPTY_TRASH,
  trash: [{ task: MOCK_TRASHED_TASK, notes: MOCK_NOTES }]
}

let mockState
let mockDispatch

vi.mock('../store/store', () => ({
  useStore: () => ({ state: mockState, dispatch: mockDispatch })
}))

const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), push: vi.fn() }
vi.mock('../store/toast', () => ({
  useToast: () => mockToast,
  ToastProvider: ({ children }) => children
}))

function wrapper({ children } = {}) {
  return <MemoryRouter>{children}</MemoryRouter>
}

async function renderTrashPage() {
  const { default: TrashPage } = await import('../pages/TrashPage')
  return render(<TrashPage />, { wrapper })
}

describe('TrashPage', () => {
  beforeEach(() => {
    mockState = JSON.parse(JSON.stringify(MOCK_STATE_EMPTY_TRASH))
    mockDispatch = vi.fn()
    mockToast.success.mockClear()
    mockToast.info.mockClear()
  })

  describe('empty trash', () => {
    it('shows empty state when trash is empty', async () => {
      await renderTrashPage()
      expect(screen.getByText('Lixeira vazia')).toBeTruthy()
      expect(screen.getByText(/Nenhuma tarefa foi excluída/)).toBeTruthy()
    })

    it('shows count as zero', async () => {
      await renderTrashPage()
      expect(screen.getByText('0 tarefa(s) excluída(s)')).toBeTruthy()
    })

    it('does not show restore all or clear buttons when empty', async () => {
      await renderTrashPage()
      expect(screen.queryByText('Restaurar todas')).toBeNull()
      expect(screen.queryByText('Limpar')).toBeNull()
    })
  })

  describe('with trashed tasks', () => {
    beforeEach(() => {
      mockState = JSON.parse(JSON.stringify(MOCK_STATE_WITH_TRASH))
    })

    it('shows the trashed task title', async () => {
      await renderTrashPage()
      expect(screen.getByText('Tarefa excluída')).toBeTruthy()
    })

    it('shows correct count', async () => {
      await renderTrashPage()
      expect(screen.getByText('1 tarefa(s) excluída(s)')).toBeTruthy()
    })

    it('shows restore button for each task', async () => {
      await renderTrashPage()
      expect(screen.getAllByText('Restaurar').length).toBeGreaterThanOrEqual(1)
    })

    it('shows project name when task has project', async () => {
      await renderTrashPage()
      expect(screen.getByText('Alpha')).toBeTruthy()
    })

    it('shows note count', async () => {
      await renderTrashPage()
      expect(screen.getByText('1 nota(s)')).toBeTruthy()
    })

    it('dispatches RESTORE_TASK when restore button clicked', async () => {
      await renderTrashPage()
      const restoreBtn = screen.getAllByText('Restaurar')[0].closest('button')
      fireEvent.click(restoreBtn)
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'RESTORE_TASK', taskId: 't1' })
      )
      expect(mockToast.success).toHaveBeenCalled()
    })

    it('shows restore all button', async () => {
      await renderTrashPage()
      expect(screen.getByText('Restaurar todas')).toBeTruthy()
    })

    it('dispatches RESTORE_TASK for all when restore all clicked', async () => {
      await renderTrashPage()
      fireEvent.click(screen.getByText('Restaurar todas'))
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'RESTORE_TASK', taskIds: ['t1'] })
      )
      expect(mockToast.success).toHaveBeenCalled()
    })

    it('shows info about lixeira behavior', async () => {
      await renderTrashPage()
      expect(screen.getByText('Sobre a lixeira')).toBeTruthy()
    })
  })

  describe('with multiple trashed tasks', () => {
    beforeEach(() => {
      mockState = JSON.parse(JSON.stringify(MOCK_STATE_WITH_TRASH))
      mockState.trash.push({
        task: { ...MOCK_TRASHED_TASK, id: 't2', title: 'Segunda tarefa' },
        notes: []
      })
    })

    it('shows correct count for multiple tasks', async () => {
      await renderTrashPage()
      expect(screen.getByText('2 tarefa(s) excluída(s)')).toBeTruthy()
    })

    it('shows restore buttons for all tasks', async () => {
      await renderTrashPage()
      expect(screen.getByText('Tarefa excluída')).toBeTruthy()
      expect(screen.getByText('Segunda tarefa')).toBeTruthy()
    })
  })
})
