import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useTaskFilters } from '../hooks/useTaskFilters'

/* ─── Mock store ─── */
const MOCK_TASKS = [
  { id: 't1', title: 'Implementar login', description: 'Fluxo de autenticação', status: 'in_progress', priority: 'high', assigneeId: 'u1', projectId: 'p1', categoryId: 'c1', dueDate: '2026-09-01T10:00:00Z', createdAt: '2026-08-01T10:00:00Z', tags: ['auth'], favorite: false },
  { id: 't2', title: 'Criar dashboard', description: 'Painel de métricas', status: 'todo', priority: 'medium', assigneeId: 'u2', projectId: 'p1', categoryId: 'c2', dueDate: '2026-09-10T10:00:00Z', createdAt: '2026-08-02T10:00:00Z', tags: ['frontend'], favorite: true },
  { id: 't3', title: 'Testes de integração', description: 'Cobertura de fluxos', status: 'done', priority: 'low', assigneeId: 'u1', projectId: 'p2', categoryId: 'c1', dueDate: '2026-08-20T10:00:00Z', createdAt: '2026-08-03T10:00:00Z', tags: ['qa'], favorite: false },
  { id: 't4', title: 'Corrigir bug no pagamento', description: 'Erro no checkout', status: 'blocked', priority: 'urgent', assigneeId: null, projectId: 'p2', categoryId: 'c3', dueDate: '2026-08-25T10:00:00Z', createdAt: '2026-08-04T10:00:00Z', tags: ['bug'], favorite: false },
  { id: 't5', title: 'Documentar API', description: 'Endpoints REST', status: 'todo', priority: 'medium', assigneeId: 'u2', projectId: null, categoryId: 'c1', dueDate: null, createdAt: '2026-08-05T10:00:00Z', tags: [], favorite: true },
]

const MOCK_USERS = [
  { id: 'u1', name: 'Ana Souza', color: '#6366f1' },
  { id: 'u2', name: 'Bruno Lima', color: '#0ea5e9' },
]

const MOCK_STATE = {
  tasks: MOCK_TASKS,
  users: MOCK_USERS,
  projects: [{ id: 'p1', name: 'Projeto Alpha' }, { id: 'p2', name: 'Projeto Beta' }],
  categories: [{ id: 'c1', name: 'Dev' }, { id: 'c2', name: 'Design' }, { id: 'c3', name: 'Bug' }],
}

let mockState = { ...MOCK_STATE, currentUserId: 'u1' }
let mockIsManager = true

vi.mock('../store/store', () => ({
  useStore: () => ({ state: mockState }),
  useIsManager: () => mockIsManager,
}))

function wrapper({ children, initialEntries = ['/'] } = {}) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  )
}

describe('useTaskFilters', () => {
  beforeEach(() => {
    mockState = { ...MOCK_STATE, currentUserId: 'u1' }
    mockIsManager = true
    localStorage.clear()
  })

  /* ─── Visibility by role ─── */
  describe('role-based visibility', () => {
    it('manager sees all tasks', () => {
      mockIsManager = true
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      expect(result.current.filtered.length).toBe(5)
    })

    it('non-manager sees only own tasks', () => {
      mockIsManager = false
      mockState = { ...MOCK_STATE, currentUserId: 'u1' }
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      expect(result.current.filtered.length).toBe(2)
      expect(result.current.filtered.every((t) => t.assigneeId === 'u1')).toBe(true)
    })
  })

  /* ─── Search ─── */
  describe('search query', () => {
    it('filters by title', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.setQuery('login'))
      expect(result.current.filtered.length).toBe(1)
      expect(result.current.filtered[0].id).toBe('t1')
    })

    it('filters by description', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.setQuery('métricas'))
      expect(result.current.filtered.length).toBe(1)
      expect(result.current.filtered[0].id).toBe('t2')
    })

    it('filters by tag', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.setQuery('bug'))
      expect(result.current.filtered.length).toBe(1)
      expect(result.current.filtered[0].id).toBe('t4')
    })

    it('is case-insensitive', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.setQuery('DASHBOARD'))
      expect(result.current.filtered.length).toBe(1)
    })
  })

  /* ─── Filters ─── */
  describe('dimension filters', () => {
    it('filters by status', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.toggleFilter('status', 'todo'))
      expect(result.current.filtered.length).toBe(2)
      expect(result.current.filtered.every((t) => t.status === 'todo')).toBe(true)
    })

    it('filters by priority', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.toggleFilter('priority', 'urgent'))
      expect(result.current.filtered.length).toBe(1)
      expect(result.current.filtered[0].priority).toBe('urgent')
    })

    it('filters by assignee', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.toggleFilter('assignee', 'u2'))
      expect(result.current.filtered.every((t) => t.assigneeId === 'u2')).toBe(true)
    })

    it('filters unassigned tasks', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.toggleFilter('assignee', 'none'))
      expect(result.current.filtered.length).toBe(1)
      expect(result.current.filtered[0].assigneeId).toBeNull()
    })

    it('combines multiple filters', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => {
        result.current.toggleFilter('status', 'todo')
        result.current.toggleFilter('priority', 'medium')
      })
      expect(result.current.filtered.length).toBe(2)
    })
  })

  /* ─── Favorites ─── */
  describe('favorites', () => {
    it('filters favorites only', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.setFavoritesOnly(true))
      expect(result.current.filtered.length).toBe(2)
      expect(result.current.filtered.every((t) => t.favorite)).toBe(true)
    })

    it('counts favorites in activeFilterCount', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.setFavoritesOnly(true))
      expect(result.current.activeFilterCount).toBe(1)
    })
  })

  /* ─── Sorting ─── */
  describe('sorting', () => {
    it('sorts by title ascending', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.setSortKey('title'))
      const titles = result.current.filtered.map((t) => t.title)
      const sorted = [...titles].sort((a, b) => a.localeCompare(b, 'pt-BR'))
      expect(titles).toEqual(sorted)
    })

    it('sorts by priority descending by default (low first)', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.setSortKey('priority'))
      const priorities = result.current.filtered.map((t) => t.priority)
      expect(priorities[0]).toBe('low')
    })
  })

  /* ─── Pagination ─── */
  describe('pagination', () => {
    it('paginates results (PAGE_SIZE = 10)', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      expect(result.current.filtered.length).toBe(5)
      expect(result.current.pageCount).toBe(1)
    })

    it('resets page on filter change', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.setPage(5))
      act(() => result.current.toggleFilter('status', 'todo'))
      expect(result.current.page).toBe(1)
    })
  })

  /* ─── Clear filters ─── */
  describe('clearFilters', () => {
    it('clears all active filters and search', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => {
        result.current.setQuery('login')
        result.current.toggleFilter('status', 'todo')
        result.current.setFavoritesOnly(true)
      })
      expect(result.current.activeFilterCount).toBeGreaterThan(0)
      act(() => result.current.clearFilters())
      expect(result.current.activeFilterCount).toBe(0)
      expect(result.current.query).toBe('')
      expect(result.current.filtered.length).toBe(5)
    })
  })

  /* ─── Saved filters ─── */
  describe('saved filters', () => {
    it('save, apply, and remove saved filters', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })

      act(() => {
        result.current.toggleFilter('status', 'todo')
        result.current.setQuery('dashboard')
      })
      act(() => result.current.saveCurrentFilters('Meu filtro'))
      expect(result.current.savedFilters.length).toBe(1)

      act(() => result.current.clearFilters())
      expect(result.current.query).toBe('')
      expect(result.current.filters.status).toEqual([])

      act(() => result.current.applySavedFilter(result.current.savedFilters[0]))
      expect(result.current.query).toBe('dashboard')
      expect(result.current.filters.status).toContain('todo')

      act(() => result.current.removeSavedFilter(result.current.savedFilters[0].id))
      expect(result.current.savedFilters.length).toBe(0)
    })
  })

  /* ─── activeFilters chips ─── */
  describe('activeFilters', () => {
    it('generates correct filter chips', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => {
        result.current.toggleFilter('status', 'todo')
        result.current.toggleFilter('priority', 'high')
      })
      expect(result.current.activeFilters.length).toBe(2)
      expect(result.current.activeFilters.map((f) => f.dim)).toEqual(['status', 'priority'])
    })
  })
})
