import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store/store'
import { STATUS, PRIORITY, KANBAN_COLUMNS, PRIORITY_ORDER } from '../lib/constants'

const PAGE_SIZE = 10
const SAVED_FILTERS_KEY = 'taskflow-saved-filters'
const TASK_FILTERS_KEY = 'taskflow-task-filters'

export const DEFAULT_FILTERS = {
  status: [],
  priority: [],
  project: [],
  category: [],
  tags: []
}

/** Garante que filtros salvos antigos tenham todas as dimensões. */
function normalizeFilters(filters) {
  return { ...DEFAULT_FILTERS, ...(filters || {}) }
}

const parseSortKey = (key) => {
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

function compareTasks(base, dir, a, b) {
  let cmp = 0
  switch (base) {
    case 'dueDate': {
      if (!a.dueDate && !b.dueDate) cmp = 0
      else if (!a.dueDate) cmp = 1
      else if (!b.dueDate) cmp = -1
      else cmp = new Date(a.dueDate) - new Date(b.dueDate)
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
      cmp = new Date(a.createdAt) - new Date(b.createdAt)
      break
    default:
      break
  }
  return dir === 'desc' ? -cmp : cmp
}

export function useTaskFilters(view) {
  const { state } = useStore()
  const [searchParams] = useSearchParams()
  const projectParam = searchParams.get('project')
  const categoryParam = searchParams.get('category')
  const tagParam = searchParams.get('tag')
  const statusParam = searchParams.get('status')
  const favoritesParam = searchParams.get('favorites')

  const [savedState] = useState(() => {
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

  useEffect(() => {
    if (!projectParam) return
    setFilters((f) => {
      if (f.project.includes(projectParam)) return f
      return { ...f, project: [...f.project, projectParam] }
    })
    setPage(1)
  }, [projectParam])

  useEffect(() => {
    if (!categoryParam) return
    setFilters((f) => {
      if (f.category.includes(categoryParam)) return f
      return { ...f, category: [categoryParam] }
    })
    setPage(1)
  }, [categoryParam])

  useEffect(() => {
    if (!tagParam) return
    const tags = tagParam.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    if (tags.length === 0) return
    setFilters((f) => {
      if (tags.every((t) => f.tags.includes(t))) return f
      return { ...f, tags }
    })
    setPage(1)
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
  }, [statusParam])

  useEffect(() => {
    if (!favoritesParam) return
    setFavoritesOnly(true)
    setPage(1)
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

  const toggleFilter = (dim, key) => {
    setFilters((prev) => {
      const f = normalizeFilters(prev)
      const arr = f[dim] || []
      const next = arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key]
      return { ...f, [dim]: next }
    })
  }

  const clearFilters = () => {
    setFilters(normalizeFilters(null))
    setQuery('')
    setFavoritesOnly(false)
  }

  const activeFilterCount =
    Object.values(filters).reduce((acc, arr) => acc + arr.length, 0) +
    (favoritesOnly ? 1 : 0)

  const filtered = useMemo(() => {
    let list = state.tasks
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(q)) ||
          (state.notes[t.id] || []).some((n) => (n.text || '').toLowerCase().includes(q))
      )
    }
    if (filters.status.length) list = list.filter((t) => filters.status.includes(t.status))
    if (filters.priority.length) list = list.filter((t) => filters.priority.includes(t.priority))
    if (filters.project.length)
      list = list.filter((t) => filters.project.includes(t.projectId || 'none'))
    if (filters.category.length) list = list.filter((t) => filters.category.includes(t.categoryId))
    if (filters.tags.length)
      list = list.filter((t) => filters.tags.some((tag) => (t.tags || []).includes(tag)))
    if (favoritesOnly) list = list.filter((t) => t.favorite)

    const sorted = [...list]
    const { base, dir } = parseSortKey(sortKey)
    const sortDir = dir || SORT_DEFAULT_DIR[base] || 'asc'
    sorted.sort((a, b) => compareTasks(base, sortDir, a, b))
    return sorted
  }, [state.tasks, query, filters, sortKey, favoritesOnly])

  const pageTasks = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const activeFilters = [
    ...(favoritesOnly ? [{ dim: 'fav', key: 'fav', label: 'Favoritas' }] : []),
    ...filters.status.map((k) => ({ dim: 'status', key: k, label: STATUS[k].label })),
    ...filters.priority.map((k) => ({ dim: 'priority', key: k, label: PRIORITY[k].label })),
    ...filters.project.map((k) => ({
      dim: 'project',
      key: k,
      label: k === 'none' ? 'Sem projeto' : state.projects.find((p) => p.id === k)?.name
    })),
    ...filters.category.map((k) => ({
      dim: 'category',
      key: k,
      label: state.categories.find((c) => c.id === k)?.name
    })),
    ...(filters.tags || []).map((k) => ({
      dim: 'tags',
      key: k,
      label: `#${k}`
    }))
  ]

  const saveCurrentFilters = (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const preset = {
      id: `sf-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      query,
      filters,
      favoritesOnly
    }
    setSavedFilters((list) => [...list, preset])
  }

  const applySavedFilter = (preset) => {
    setQuery(preset.query || '')
    setFilters(normalizeFilters(preset.filters))
    setFavoritesOnly(Boolean(preset.favoritesOnly))
    setPage(1)
  }

  const removeSavedFilter = (id) => {
    setSavedFilters((list) => list.filter((f) => f.id !== id))
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
