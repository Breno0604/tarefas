import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store/store'
import { STATUS, PRIORITY, KANBAN_COLUMNS, PRIORITY_ORDER } from '../lib/constants'


interface TaskFilters {
  status: string[]
  priority: string[]
  project: string[]
  tags: string[]
}

interface SavedFilterPreset {
  id: string
  name: string
  query: string
  filters: TaskFilters
  favoritesOnly: boolean
}

const PAGE_SIZE = 10
const SAVED_FILTERS_KEY = 'taskflow-saved-filters'
const TASK_FILTERS_KEY = 'taskflow-task-filters'

export const DEFAULT_FILTERS = {
  status: [],
  priority: [],
  project: [],
  tags: []
}

/** Garante que filtros salvos antigos tenham todas as dimensões. */
function normalizeFilters(filters: TaskFilters | null): TaskFilters {
  return { ...DEFAULT_FILTERS, ...(filters || {}) }
}

const parseSortKey = (key: string): { base: string; dir: string | null } => {
  const m = /^(.+?)(_(asc|desc))?$/.exec(key || '')
  return { base: m?.[1] || '', dir: m?.[3] || null }
}

const SORT_DEFAULT_DIR = {
  dueDate: 'asc',
  title: 'asc',
  status: 'asc',
  priority: 'desc',
  createdAt: 'desc'
}

function compareTasks(base: string, dir: string | null, a: any, b: any): number {
  let cmp = 0
  switch (base) {
    case 'dueDate': {
      if (!a.dueDate && !b.dueDate) cmp = 0
      else if (!a.dueDate) cmp = 1
      else if (!b.dueDate) cmp = -1
      else cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      break
    }
    case 'title':
      cmp = a.title.localeCompare(b.title, 'pt-BR')
      break
    case 'status':
      cmp = KANBAN_COLUMNS.indexOf(a.status) - KANBAN_COLUMNS.indexOf(b.status)
      break
    case 'priority':
      cmp = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
      break
    case 'createdAt':
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      break
    default:
      break
  }
  return dir === 'desc' ? -cmp : cmp
}

export function useTaskFilters(view: string) {
  const { state } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const projectParam = searchParams.get('project')
  const tagParam = searchParams.get('tag')
  const statusParam = searchParams.get('status')
  const favoritesParam = searchParams.get('favorites')

  const [savedState] = useState<Record<string, any>>(() => {
    // If a external navigation signals to clear filters, skip saved state
    if (sessionStorage.getItem('taskflow:clear-filters')) {
      sessionStorage.removeItem('taskflow:clear-filters')
      localStorage.removeItem(TASK_FILTERS_KEY)
      return {}
    }
    try {
      return JSON.parse(localStorage.getItem(TASK_FILTERS_KEY) || '{}')
    } catch {
      return {}
    }
  })
  const [query, setQuery] = useState(savedState.query || '')
  const [filters, setFilters] = useState(normalizeFilters(savedState.filters))
  const [favoritesOnly, setFavoritesOnly] = useState(savedState.favoritesOnly || false)
  const [savedFilters, setSavedFilters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_FILTERS_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [sortKey, setSortKey] = useState(savedState.sortKey || 'dueDate')
  const [selected, setSelected] = useState(new Set())
  const [page, setPage] = useState(savedState.page || 1)

  // Deep-link params that were just applied; the URL cleanup effect must not
  // remove them in the same commit they were applied (avoids a mount race).
  const appliedParamsRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!projectParam) return
    setFilters((f) => {
      if (f.project.includes(projectParam)) return f
      return { ...f, project: [projectParam] }
    })
    setPage(1)
    appliedParamsRef.current.project = projectParam
  }, [projectParam])

  useEffect(() => {
    if (!tagParam) return
    const tags = tagParam.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    if (tags.length === 0) return
    setFilters((f) => {
      if (tags.every((t) => f.tags.includes(t))) return f
      return { ...f, tags }
    })
    setPage(1)
    appliedParamsRef.current.tag = tagParam
  }, [tagParam])

  useEffect(() => {
    if (!statusParam) return
    const statuses = statusParam.split(',').map((s) => s.trim()).filter(Boolean)
    if (statuses.length === 0) return
    setFilters((f) => {
      if (statuses.every((s) => f.status.includes(s))) return f
      return { ...f, status: statuses }
    })
    setPage(1)
    appliedParamsRef.current.status = statusParam
  }, [statusParam])

  useEffect(() => {
    if (!favoritesParam) return
    setFavoritesOnly(true)
    setPage(1)
    appliedParamsRef.current.favorites = favoritesParam
  }, [favoritesParam])

  useEffect(() => {
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(savedFilters))
  }, [savedFilters])

  useEffect(() => {
    try {
      localStorage.setItem(TASK_FILTERS_KEY, JSON.stringify({ query, filters, favoritesOnly, sortKey, page }))
    } catch {
      // ignore
    }
  }, [query, filters, favoritesOnly, sortKey, page])

  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [query, filters, view, favoritesOnly])

  /**
   * Remove deep-link URL params (project/category/tag/status/favorites) that no
   * longer match the active filters, so stale params don't re-apply on reload.
   */
  useEffect(() => {
    const applied = appliedParamsRef.current
    const next = new URLSearchParams(searchParams)
    let changed = false
    const drop = (name: string, stillActive: () => boolean) => {
      if (!next.has(name)) return
      const justApplied = applied[name]
      if (justApplied !== undefined && next.get(name) === justApplied) {
        delete applied[name]
        return
      }
      if (!stillActive()) {
        next.delete(name)
        changed = true
      }
    }
    drop('project', () => filters.project.includes(next.get('project') || ''))
    drop('tag', () =>
      (next.get('tag') || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .every((t) => (filters.tags || []).includes(t))
    )
    drop('status', () =>
      (next.get('status') || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
        .every((s: string) => filters.status.includes(s))
    )
    drop('favorites', () => favoritesOnly)
    if (changed) setSearchParams(next, { replace: true })
  }, [filters, favoritesOnly, searchParams, setSearchParams])

  const toggleFilter = (dim: string, key: string) => {
    setFilters((prev) => {
      const f = normalizeFilters(prev)
      const arr = (f as any)[dim] || []
      return { ...f, [dim]: arr.includes(key) ? arr.filter((k: string) => k !== key) : [...arr, key] }
    })
  }

  const clearFilters = () => {
    setFilters(normalizeFilters(null))
    setQuery('')
    setFavoritesOnly(false)
  }

  const activeFilterCount =
    Object.values(filters).reduce((acc: number, arr: string[]) => acc + arr.length, 0) +
    (favoritesOnly ? 1 : 0)

  const filtered = useMemo(() => {
    let list = state.tasks.filter((t) => !t.archived)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.tags || []).some((tag: string) => tag.toLowerCase().includes(q)) ||
          (state.notes[t.id] || []).some((n) => (n.text || '').toLowerCase().includes(q))
      )
    }
    if (filters.status.length) list = list.filter((t) => filters.status.includes(t.status))
    if (filters.priority.length) list = list.filter((t) => filters.priority.includes(t.priority))
    if (filters.project.length)
      list = list.filter((t) => filters.project.includes(t.projectId || 'none'))
    if (filters.tags.length)
      list = list.filter((t) => filters.tags.some((tag: string) => (t.tags || []).includes(tag)))
    if (favoritesOnly) list = list.filter((t) => t.favorite)

    const sorted = [...list]
    const { base, dir } = parseSortKey(sortKey)
    const sortDir = dir || (SORT_DEFAULT_DIR as Record<string, string>)[base] || 'asc'
    sorted.sort((a, b) => compareTasks(base, sortDir, a, b))
    return sorted
  }, [state.tasks, query, filters, sortKey, favoritesOnly])

  const pageTasks = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  // Keep page within bounds when results shrink (e.g. after deletions)
  useEffect(() => {
    setPage((p: number) => (pageCount >= 1 ? Math.min(p, pageCount) : p))
  }, [pageCount])

  const activeFilters: { dim: string; key: string; label: string | undefined }[] = [
    ...(favoritesOnly ? [{ dim: 'fav', key: 'fav', label: 'Favoritas' }] : []),
    ...filters.status.map((k: string) => ({ dim: 'status', key: k, label: (STATUS as any)[k].label })),
    ...filters.priority.map((k: string) => ({ dim: 'priority', key: k, label: (PRIORITY as any)[k].label })),
    ...filters.project.map((k: string) => ({
      dim: 'project',
      key: k,
      label: k === 'none' ? 'Sem projeto' : state.projects.find((p: any) => p.id === k)?.name
    })),
    ...(filters.tags || []).map((k: string) => ({
      dim: 'tags',
      key: k,
      label: `#${k}`
    }))
  ]

  const saveCurrentFilters = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const preset = {
      id: `sf-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      query,
      filters,
      favoritesOnly
    }
    setSavedFilters((list: SavedFilterPreset[]) => [...list, preset])
  }

  const applySavedFilter = (preset: SavedFilterPreset) => {
    setQuery(preset.query || '')
    setFilters(normalizeFilters(preset.filters))
    setFavoritesOnly(Boolean(preset.favoritesOnly))
    setPage(1)
  }

  const removeSavedFilter = (id: string) => {
    setSavedFilters((list: SavedFilterPreset[]) => list.filter((f: SavedFilterPreset) => f.id !== id))
  }

  return {
    query,
    setQuery,
    filters,
    setFilters,
    toggleFilter,
    clearFilters,
    activeFilterCount,
    favoritesOnly,
    setFavoritesOnly,
    sortKey,
    setSortKey,
    selected,
    setSelected,
    page,
    setPage,
    pageCount,
    pageTasks,
    filtered,
    activeFilters,
    savedFilters,
    saveCurrentFilters,
    applySavedFilter,
    removeSavedFilter
  }
}

export { PAGE_SIZE }
