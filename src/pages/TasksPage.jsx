import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  SlidersHorizontal,
  LayoutList,
  Columns3,
  Table2,
  CalendarDays,
  ChevronDown,
  Filter,
  Search,
  X,
  Star,
  Bookmark,
  Plus
} from 'lucide-react'
import { useStore, validateTaskPayload } from '../store/store'
import { useToast } from '../store/toast'
import { useTaskFilters, PAGE_SIZE } from '../hooks/useTaskFilters'
import { useDebounce } from '../hooks/useDebounce'
import { isTypingTarget, deleteTaskWithUndo, bulkDeleteWithUndo } from '../lib/utils'
import Dropdown from '../components/ui/Dropdown'
import Button from '../components/ui/Button'
import Tooltip from '../components/ui/Tooltip'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Pagination from '../components/ui/Pagination'
import TaskListItem from '../components/tasks/TaskListItem'
const TaskTableView = React.lazy(() => import('../components/tasks/TaskTableView'))
const KanbanView = React.lazy(() => import('../components/tasks/KanbanView'))
const CalendarView = React.lazy(() => import('../components/tasks/CalendarView'))
import TaskFormModal from '../components/tasks/TaskFormModal'
import TaskDetailDrawer from '../components/tasks/TaskDetailDrawer'
import TasksToolbar from '../components/tasks/TasksToolbar'
import ActiveFiltersBar from '../components/tasks/ActiveFiltersBar'
import BulkTasksBar from '../components/tasks/BulkTasksBar'
import TasksDialogs from '../components/tasks/TasksDialogs'
import { CardSkeleton } from '../components/ui/Skeleton'

export default function TasksPage() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchRef = useRef(null)
  const lastDuplicatedIdRef = useRef(null)

  // Keep ref in sync with reducer's _lastDuplicatedId
  useEffect(() => {
    if (state._lastDuplicatedId) lastDuplicatedIdRef.current = state._lastDuplicatedId
  }, [state._lastDuplicatedId])

  const drawerTaskId = searchParams.get('task')
  const viewParam = searchParams.get('view')
  const [view, setView] = useState('list')

  const f = useTaskFilters(view)

  // Debounced search: local input value updates instantly, filters update after 300ms
  const [searchInput, setSearchInput] = useState(f.query)
  const debouncedSearch = useDebounce(searchInput, 300)
  useEffect(() => {
    f.setQuery(debouncedSearch)
  }, [debouncedSearch])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formDefaults, setFormDefaults] = useState({})
  const [bulkDelete, setBulkDelete] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [saveFilterOpen, setSaveFilterOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [loading, setLoading] = useState(true)
  const [filtersVisible, setFiltersVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!viewParam || !['list', 'kanban', 'table', 'calendar'].includes(viewParam)) return
    setView(viewParam)
  }, [viewParam])

  // Sync view back to URL (guard avoids infinite loop: only sets when different)
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (view && view !== 'list') {
      next.set('view', view)
    } else {
      next.delete('view')
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [view, searchParams, setSearchParams])

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e)) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === '1') {
        e.preventDefault()
        setView('list')
      } else if (e.key === '2') {
        e.preventDefault()
        setView('kanban')
      } else if (e.key === '3') {
        e.preventDefault()
        setView('table')
      } else if (e.key === '4') {
        e.preventDefault()
        setView('calendar')
      }
    }
    document.addEventListener('keydown', onKey)
    const onToggleFav = () => f.setFavoritesOnly((v) => !v)
    window.addEventListener('taskflow:toggle-favorites', onToggleFav)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('taskflow:toggle-favorites', onToggleFav)
    }
  }, [])

  const openTask = (id) => {
    const next = new URLSearchParams(searchParams)
    next.set('task', id)
    setSearchParams(next)
  }
  const closeTask = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('task')
    setSearchParams(next)
  }

  const openCreate = (defaults = {}) => {
    setEditing(null)
    setFormDefaults(defaults)
    setFormOpen(true)
  }
  const openEdit = (task) => {
    setEditing(task)
    setFormDefaults({})
    setFormOpen(true)
  }

  const changeTask = (patch, taskId) => {
    const task = state.tasks.find((t) => t.id === taskId)
    if (!task) {
      toast.error('Tarefa não encontrada.')
      return
    }
    const validationErrors = validateTaskPayload(patch)
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0])
      return
    }
    dispatch({ type: 'UPDATE_TASK', taskId, patch })
    toast.success('Tarefa atualizada')
  }
  const toggleDoneTask = (task) => {
    dispatch({ type: 'TOGGLE_TASK_DONE', taskId: task.id })
    toast.success(
      task.status === 'done'
        ? 'Tarefa reaberta'
        : task.recurrence && task.recurrence !== 'none'
          ? 'Concluída — próxima ocorrência criada'
          : 'Tarefa concluída'
    )
  }
  const deleteTask = (task) => {
    deleteTaskWithUndo({ dispatch, toast, task })
  }
  const toggleFavorite = (task) => {
    dispatch({ type: 'TOGGLE_FAVORITE', taskId: task.id })
    toast.success(task.favorite ? 'Removida dos favoritos' : 'Adicionada aos favoritos')
  }
  const duplicateTask = (task) => {
    dispatch({ type: 'DUPLICATE_TASK', taskId: task.id })
    toast.push(`"${task.title}" duplicada`, 'success', {
      action: {
        label: 'Desfazer',
        onClick: () => {
          const idToDelete = lastDuplicatedIdRef.current
          if (idToDelete) dispatch({ type: 'DELETE_TASK', taskId: idToDelete })
        }
      }
    })
  }
  const requestCancel = (task) => {
    setCancelTarget(task)
  }
  const confirmCancel = (reason) => {
    if (!cancelTarget) return
    dispatch({
      type: 'CANCEL_TASK',
      taskId: cancelTarget.id,
      reason: reason || null
    })
    toast.success('Tarefa cancelada')
    setCancelTarget(null)
  }

  const saveCurrentFilters = () => {
    const name = saveName.trim()
    if (!name) return
    f.saveCurrentFilters(name)
    setSaveName('')
    setSaveFilterOpen(false)
    toast.success(`Filtro "${name}" salvo`)
  }
  const applySavedFilter = (preset) => {
    f.applySavedFilter(preset)
    toast.info(`Filtro "${preset.name}" aplicado`)
  }
  const removeActiveFilter = (af) => {
    if (af.dim === 'fav') f.setFavoritesOnly(false)
    else f.toggleFilter(af.dim, af.key)
  }

  const bulkApply = (status) => {
    f.selected.forEach((id) =>
      dispatch({ type: 'UPDATE_TASK', taskId: id, patch: { status } })
    )
    toast.success(`${f.selected.size} tarefa(s) movida(s) para ${status}`)
    f.setSelected(new Set())
  }
  const bulkDeleteAll = () => {
    bulkDeleteWithUndo({ dispatch, toast, taskIds: Array.from(f.selected) })
    f.setSelected(new Set())
    setBulkDelete(false)
  }

  const showPagination = view === 'list' || view === 'table'

  const allTags = useMemo(() => {
    const set = new Set()
    state.tasks.forEach((t) => (t.tags || []).forEach((tag) => set.add(tag)))
    return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [state.tasks])

  const toolbarData = {
    ...f,
    projects: state.projects,
    categories: state.categories,
    tags: allTags
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Dropdown
          trigger={
            <button aria-label="Alterar visualização" className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:px-3 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600">
              {view === 'list' && <LayoutList size={16} />}
              {view === 'kanban' && <Columns3 size={16} />}
              {view === 'table' && <Table2 size={16} />}
              {view === 'calendar' && <CalendarDays size={16} />}
              <span className="hidden sm:inline">
                {view === 'list' && 'Lista'}
                {view === 'kanban' && 'Kanban'}
                {view === 'table' && 'Tabela'}
                {view === 'calendar' && 'Calendário'}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          }
          items={[
            { key: 'list', label: 'Lista', icon: LayoutList, active: view === 'list', onClick: () => setView('list') },
            { key: 'kanban', label: 'Kanban', icon: Columns3, active: view === 'kanban', onClick: () => setView('kanban') },
            { key: 'table', label: 'Tabela', icon: Table2, active: view === 'table', onClick: () => setView('table') },
            { key: 'calendar', label: 'Calendário', icon: CalendarDays, active: view === 'calendar', onClick: () => setView('calendar') }
          ]}
        />

        <Tooltip content={filtersVisible ? 'Ocultar filtros' : 'Mostrar filtros'}>
          <button
            onClick={() => setFiltersVisible((v) => !v)}
            className={`shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
              !filtersVisible && f.activeFilterCount > 0
                ? 'border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600'
            }`}
            aria-label={filtersVisible ? 'Ocultar filtros' : 'Mostrar filtros'}
          >
            <Filter size={16} />
          </button>
        </Tooltip>

        <div className="relative min-w-0 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Pesquisar..."
            className="input-base h-9 pl-9 pr-8 text-sm"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); f.setQuery('') }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
              aria-label="Limpar busca"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => f.setFavoritesOnly((v) => !v)}
          className={`shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
            f.favoritesOnly
              ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
          }`}
          aria-label="Favoritas"
        >
          <Star size={14} fill={f.favoritesOnly ? 'currentColor' : 'none'} />
        </button>

        <Dropdown
          align="right"
          trigger={
            <button className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600" aria-label="Filtros salvos">
              <Bookmark size={14} />
            </button>
          }
          items={[
            ...(f.savedFilters.length
              ? f.savedFilters.map((f2) => ({
                  label: f2.name,
                  icon: Bookmark,
                  onClick: () => f.applySavedFilter(f2)
                }))
              : [{ label: 'Nenhum filtro salvo', disabled: true }]),
            { type: 'divider' },
            {
              label: 'Salvar filtros atuais',
              icon: Plus,
              onClick: () => {
                setSaveName('')
                setSaveFilterOpen(true)
              }
            }
          ]}
        />
      </div>

      {filtersVisible && (
        <TasksToolbar f={toolbarData} />
      )}

      <ActiveFiltersBar activeFilters={f.activeFilters} onRemove={removeActiveFilter} />

      {loading ? (
        <div className={view === 'kanban' ? 'flex gap-4' : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : f.filtered.length === 0 ? (
        <div className="card-base">
          <EmptyState
            icon={SlidersHorizontal}
            title="Nenhuma tarefa encontrada"
            description={
              f.activeFilterCount > 0 || f.query
                ? 'Tente ajustar ou remover os filtros aplicados.'
                : 'Comece criando sua primeira tarefa pessoal.'
            }
            action={
              <Button variant="secondary" onClick={openCreate}>
                Nova tarefa
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <BulkTasksBar
            selected={f.selected}
            onApplyStatus={bulkApply}
            onRequestDelete={() => setBulkDelete(true)}
            onClear={() => f.setSelected(new Set())}
          />

          {view === 'list' && (
            <div className="card-base overflow-hidden">
              <ul>
                {f.pageTasks.map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    project={state.projects.find((p) => p.id === task.projectId)}
                    noteCount={(state.notes[task.id] || []).length}
                    selected={f.selected.has(task.id)}
                    onToggleSelect={() =>
                      f.setSelected((s) => {
                        const next = new Set(s)
                        next.has(task.id) ? next.delete(task.id) : next.add(task.id)
                        return next
                      })
                    }
                    onOpen={() => openTask(task.id)}
                    onEdit={() => openEdit(task)}
                    onDelete={() => deleteTask(task)}
                    onToggleFavorite={() => toggleFavorite(task)}
                    onDuplicate={() => duplicateTask(task)}
                    onToggleDone={toggleDoneTask}
                    onCancel={requestCancel}
                    onChange={changeTask}
                  />
                ))}
              </ul>
              <div className="border-t border-slate-100 px-4 dark:border-slate-800">
                <Pagination
                  page={f.page}
                  pageCount={f.pageCount}
                  total={f.filtered.length}
                  pageSize={PAGE_SIZE}
                  onChange={f.setPage}
                />
              </div>
            </div>
          )}

          {view === 'table' && (
            <React.Suspense fallback={<div className="card-base p-8 text-center text-sm text-slate-400">Carregando...</div>}>
              <TaskTableView
                tasks={f.pageTasks}
                selected={f.selected}
                onToggleAll={() =>
                  f.setSelected((s) =>
                    s.size === f.pageTasks.length ? new Set() : new Set(f.pageTasks.map((t) => t.id))
                  )
                }
                onToggleSelect={(id) =>
                  f.setSelected((s) => {
                    const next = new Set(s)
                    next.has(id) ? next.delete(id) : next.add(id)
                    return next
                  })
                }
                onSort={f.setSortKey}
                sortKey={f.sortKey}
                onOpenTask={openTask}
                onEditTask={openEdit}
                onChange={changeTask}
                onDeleteTask={deleteTask}
                onToggleFavorite={toggleFavorite}
                onDuplicateTask={duplicateTask}
                onToggleDone={toggleDoneTask}
                onCancelTask={requestCancel}
              />
              <Pagination
                page={f.page}
                pageCount={f.pageCount}
                total={f.filtered.length}
                pageSize={PAGE_SIZE}
                onChange={f.setPage}
              />
            </React.Suspense>
          )}

          {view === 'kanban' && (
            <React.Suspense fallback={<div className="card-base p-8 text-center text-sm text-slate-400">Carregando...</div>}>
            <KanbanView
              tasks={f.filtered}
              onOpenTask={openTask}
              onEditTask={(task, defaults) => (task ? openEdit(task) : openCreate(defaults))}
              onChange={changeTask}
              onDeleteTask={deleteTask}
              onToggleFavorite={toggleFavorite}
              onDuplicateTask={duplicateTask}
              onToggleDone={toggleDoneTask}
              onCancelTask={requestCancel}
            />
            </React.Suspense>
          )}

          {view === 'calendar' && (
            <React.Suspense fallback={<div className="card-base p-8 text-center text-sm text-slate-400">Carregando...</div>}>
            <CalendarView tasks={f.filtered} onOpenTask={openTask} onNewTask={openCreate} />
            </React.Suspense>
          )}
        </>
      )}

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        task={editing}
        defaults={formDefaults}
      />
      <TaskDetailDrawer
        open={Boolean(drawerTaskId)}
        onClose={closeTask}
        taskId={drawerTaskId}
        onEdit={(task) => openEdit(task)}
      />
      <ConfirmDialog
        open={bulkDelete}
        onClose={() => setBulkDelete(false)}
        onConfirm={bulkDeleteAll}
        title="Excluir tarefas"
        message={`Excluir ${f.selected.size} tarefa(s) selecionada(s)? Você poderá desfazer em seguida.`}
        confirmLabel="Excluir selecionadas"
      />

      <TasksDialogs
        cancelTarget={cancelTarget}
        onCloseCancel={() => setCancelTarget(null)}
        onConfirmCancel={confirmCancel}
        saveFilterOpen={saveFilterOpen}
        onCloseSave={() => setSaveFilterOpen(false)}
        saveName={saveName}
        setSaveName={setSaveName}
        onSaveFilter={saveCurrentFilters}
        savedFilters={f.savedFilters}
        onApplySavedFilter={applySavedFilter}
        onRemoveSavedFilter={f.removeSavedFilter}
      />
    </div>
  )
}
