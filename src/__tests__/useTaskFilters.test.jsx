import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useTaskFilters } from '../hooks/useTaskFilters'

/* ─── Mock store ─── */
const MOCK_TASKS = [
  { id: 't1', title: 'Implementar login', description: 'Fluxo de autenticação', status: 'todo', priority: 'high', projectId: 'p1', dueDate: '2026-09-01T10:00:00Z', createdAt: '2026-08-01T10:00:00Z', tags: ['auth'], favorite: false },
  { id: 't2', title: 'Criar dashboard', description: 'Painel de métricas', status: 'in_progress', priority: 'medium', projectId: 'p1', dueDate: '2026-09-10T10:00:00Z', createdAt: '2026-08-02T10:00:00Z', tags: ['frontend'], favorite: true },
  { id: 't3', title: 'Testes de integração', description: 'Cobertura de fluxos', status: 'done', priority: 'low', projectId: 'p2', dueDate: '2026-08-20T10:00:00Z', createdAt: '2026-08-03T10:00:00Z', tags: ['qa'], favorite: false },
  { id: 't4', title: 'Corrigir bug no pagamento', description: 'Erro no checkout', status: 'todo', priority: 'urgent', projectId: 'p2', dueDate: '2026-08-25T10:00:00Z', createdAt: '2026-08-04T10:00:00Z', tags: ['bug'], favorite: false },
  { id: 't5', title: 'Documentar API', description: 'Endpoints REST', status: 'cancelled', priority: 'medium', projectId: null, dueDate: null, createdAt: '2026-08-05T10:00:00Z', tags: [], favorite: true }
]

const MOCK_STATE = {
  tasks: MOCK_TASKS,
  projects: [{ id: 'p1', name: 'Projeto Alpha' }, { id: 'p2', name: 'Projeto Beta' }],
  notes: {}
}

let mockState = { ...MOCK_STATE }

vi.mock('../store/store', () => ({
  useStore: () => ({ state: mockState })
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
    mockState = { ...MOCK_STATE }
    localStorage.clear()
  })

  /* ─── Base visibility ─── */
  describe('base visibility', () => {
    it('shows all tasks (single user)', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      expect(result.current.filtered.length).toBe(5)
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

    it('filters by project', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.toggleFilter('project', 'p1'))
      expect(result.current.filtered.length).toBe(2)
      expect(result.current.filtered.every((t) => t.projectId === 'p1')).toBe(true)
    })

    it('filters tasks without project', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.toggleFilter('project', 'none'))
      expect(result.current.filtered.length).toBe(1)
      expect(result.current.filtered[0].projectId).toBeNull()
    })

    it('combines multiple filters', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => {
        result.current.toggleFilter('status', 'todo')
        result.current.toggleFilter('priority', 'urgent')
      })
      expect(result.current.filtered.length).toBe(1)
      expect(result.current.filtered[0].id).toBe('t4')
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

    it('sorts by due date ascending with undated last', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.setSortKey('dueDate'))
      const dates = result.current.filtered.map((t) => t.dueDate)
      expect(dates[dates.length - 1]).toBeNull()
      const dated = dates.slice(0, -1)
      expect([...dated].sort()).toEqual(dated)
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

  /* ─── URL param deep-link ─── */
  describe('project URL param', () => {
    it('applies project filter from ?project= param', () => {
      const { result } = renderHook(
        () => useTaskFilters('list'),
        { wrapper: ({ children }) => <MemoryRouter initialEntries={['/?project=p2']}>{children}</MemoryRouter> }
      )
      expect(result.current.filters.project).toContain('p2')
      expect(result.current.filtered.every((t) => t.projectId === 'p2')).toBe(true)
    })
  })

  /* ─── Tag filter dimension ─── */
  describe('tag filters', () => {
    it('filters by a single tag', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.toggleFilter('tags', 'bug'))
      expect(result.current.filtered.length).toBe(1)
      expect(result.current.filtered[0].id).toBe('t4')
    })

    it('matches tasks having any of the selected tags (OR)', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => {
        result.current.toggleFilter('tags', 'bug')
        result.current.toggleFilter('tags', 'qa')
      })
      expect(result.current.filtered.length).toBe(2)
      expect(result.current.filtered.map((t) => t.id).sort()).toEqual(['t3', 't4'])
    })

    it('shows tag chips with # prefix', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.toggleFilter('tags', 'bug'))
      const chip = result.current.activeFilters.find((f) => f.dim === 'tags')
      expect(chip.label).toBe('#bug')
    })

    it('applies tag filter from ?tag= param', () => {
      const { result } = renderHook(
        () => useTaskFilters('list'),
        { wrapper: ({ children }) => <MemoryRouter initialEntries={['/?tag=frontend']}>{children}</MemoryRouter> }
      )
      expect(result.current.filters.tags).toContain('frontend')
      expect(result.current.filtered.length).toBe(1)
      expect(result.current.filtered[0].id).toBe('t2')
    })

    it('supports multiple comma-separated tags in ?tag= param', () => {
      const { result } = renderHook(
        () => useTaskFilters('list'),
        { wrapper: ({ children }) => <MemoryRouter initialEntries={['/?tag=auth, qa']}>{children}</MemoryRouter> }
      )
      expect(result.current.filters.tags.sort()).toEqual(['auth', 'qa'])
      expect(result.current.filtered.map((t) => t.id).sort()).toEqual(['t1', 't3'])
    })

    it('saved filters persist the tags dimension', () => {
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      act(() => result.current.toggleFilter('tags', 'bug'))
      act(() => result.current.saveCurrentFilters('Bugs'))
      act(() => result.current.clearFilters())
      expect(result.current.filtered.length).toBe(5)
      act(() => result.current.applySavedFilter(result.current.savedFilters[0]))
      expect(result.current.filters.tags).toEqual(['bug'])
      expect(result.current.filtered.length).toBe(1)
    })

    it('normalizes old saved filters without tags dimension', () => {
      localStorage.setItem(
        'taskflow-task-filters',
        JSON.stringify({ query: '', filters: { status: ['todo'], priority: [], project: [] }, favoritesOnly: false, sortKey: 'dueDate', page: 1 })
      )
      const { result } = renderHook(() => useTaskFilters('list'), { wrapper })
      expect(Array.isArray(result.current.filters.tags)).toBe(true)
      expect(() => result.current.toggleFilter('tags', 'bug')).not.toThrow()
    })
  })
})
