import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore, useIsManager } from '../store/store'
import { STATUS, PRIORITY, KANBAN_COLUMNS, PRIORITY_ORDER } from '../lib/constants'

const PAGE_SIZE = 10
const SAVED_FILTERS_KEY = 'taskflow-saved-filters'

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
  const isManager = useIsManager()
  const [searchParams] = useSearchParams()
  const projectParam = searchParams.get('project')

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    assignee: [],
    project: [],
    category: []
  })
  const [myTasks, setMyTasks] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [savedFilters, setSavedFilters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_FILTERS_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [sortKey, setSortKey] = useState('dueDate')
  const [selected, setSelected] = useState(new Set())
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!projectParam) return
    setFilters((f) => {
      if (f.project.includes(projectParam)) return f
      return { ...f, project: [...f.project, projectParam] }
    })
    setPage(1)
  }, [projectParam])

  useEffect(() => {
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(savedFilters))
  }, [savedFilters])

  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [query, filters, view, myTasks, favoritesOnly])

  const toggleFilter = (dim, key) => {
    setFilters((f) => {
      const arr = f[dim]
      const next = arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key]
      return { ...f, [dim]: next }
    })
  }

  const clearFilters = () => {
    setFilters({ status: [], priority: [], assignee: [], project: [], category: [] })
    setQuery('')
    setMyTasks(false)
    setFavoritesOnly(false)
  }

  const activeFilterCount =
    Object.values(filters).reduce((acc, arr) => acc + arr.length, 0) +
    (myTasks ? 1 : 0) +
    (favoritesOnly ? 1 : 0)

  const visible = useMemo(() => {
    if (isManager) return state.tasks
    return state.tasks.filter((t) => t.assigneeId === state.currentUserId)
  }, [state.tasks, state.currentUserId, isManager])

  const filtered = useMemo(() => {
    let list = visible
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
      )
    }
    if (filters.status.length) list = list.filter((t) => filters.status.includes(t.status))
    if (filters.priority.length) list = list.filter((t) => filters.priority.includes(t.priority))
    if (filters.assignee.length)
      list = list.filter((t) => filters.assignee.includes(t.assigneeId || 'none'))
    if (filters.project.length)
      list = list.filter((t) => filters.project.includes(t.projectId || 'none'))
    if (filters.category.length) list = list.filter((t) => filters.category.includes(t.categoryId))
    if (myTasks) list = list.filter((t) => t.assigneeId === state.currentUserId)
    if (favoritesOnly) list = list.filter((t) => t.favorite)

    const sorted = [...list]
    const { base, dir } = parseSortKey(sortKey)
    const sortDir = dir || SORT_DEFAULT_DIR[base] || 'asc'
    sorted.sort((a, b) => compareTasks(base, sortDir, a, b))
    return sorted
  }, [visible, state.currentUserId, query, filters, sortKey, myTasks, favoritesOnly])

  const pageTasks = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const activeFilters = [
    ...(myTasks ? [{ dim: 'mine', key: 'mine', label: 'Atribuídas a mim' }] : []),
    ...(favoritesOnly ? [{ dim: 'fav', key: 'fav', label: 'Favoritas' }] : []),
    ...filters.status.map((k) => ({ dim: 'status', key: k, label: STATUS[k].label })),
    ...filters.priority.map((k) => ({ dim: 'priority', key: k, label: PRIORITY[k].label })),
    ...filters.assignee.map((k) => ({
      dim: 'assignee',
      key: k,
      label: k === 'none' ? 'Não atribuída' : state.users.find((u) => u.id === k)?.name
    })),
    ...filters.project.map((k) => ({
      dim: 'project',
      key: k,
      label: k === 'none' ? 'Sem projeto' : state.projects.find((p) => p.id === k)?.name
    })),
    ...filters.category.map((k) => ({
      dim: 'category',
      key: k,
      label: state.categories.find((c) => c.id === k)?.name
    }))
  ]

  const saveCurrentFilters = (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const preset = {
      id: `sf-${Date.now()}`,
      name: trimmed,
      query,
      filters,
      myTasks,
      favoritesOnly
    }
    setSavedFilters((list) => [...list, preset])
  }

  const applySavedFilter = (preset) => {
    setQuery(preset.query || '')
    setFilters(
      preset.filters || { status: [], priority: [], assignee: [], project: [], category: [] }
    )
    setMyTasks(Boolean(preset.myTasks))
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
    myTasks,
    setMyTasks,
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
