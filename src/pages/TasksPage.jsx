import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus,
  SlidersHorizontal,
  LayoutList,
  Columns3,
  Table2,
  CalendarDays
} from 'lucide-react'
import { useStore, useCan } from '../store/store'
import { useToast } from '../store/toast'
import { STATUS } from '../lib/constants'
import { useTaskFilters, PAGE_SIZE } from '../hooks/useTaskFilters'
import { SegmentedControl } from '../components/ui/Tabs'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Pagination from '../components/ui/Pagination'
import TaskListItem from '../components/tasks/TaskListItem'
import TaskTableView from '../components/tasks/TaskTableView'
import KanbanView from '../components/tasks/KanbanView'
import CalendarView from '../components/tasks/CalendarView'
import TaskFormModal from '../components/tasks/TaskFormModal'
import TaskDetailDrawer from '../components/tasks/TaskDetailDrawer'
import TasksToolbar from '../components/tasks/TasksToolbar'
import ActiveFiltersBar from '../components/tasks/ActiveFiltersBar'
import BulkTasksBar from '../components/tasks/BulkTasksBar'
import TasksDialogs from '../components/tasks/TasksDialogs'
import { CardSkeleton } from '../components/ui/Skeleton'

export default function TasksPage() {
  const { state, dispatch } = useStore()
  const can = useCan()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchRef = useRef(null)

  const drawerTaskId = searchParams.get('task')
  const viewParam = searchParams.get('view')
  const [view, setView] = useState('list')

  const f = useTaskFilters(view)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formDefaults, setFormDefaults] = useState({})
  const [bulkDelete, setBulkDelete] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [saveFilterOpen, setSaveFilterOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!viewParam || !['list', 'kanban', 'table', 'calendar'].includes(viewParam)) return
    setView(viewParam)
  }, [viewParam])

  useEffect(() => {
    const isTyping = (e) => {
      const el = e.target
      return (
        el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
      )
    }
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e)) return
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
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const openTask = (id) => setSearchParams({ task: id })
  const closeTask = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('task')
    setSearchParams(next)
  }

  const openCreate = (defaults = {}) => {
    if (!can('create_tasks')) {
      toast.error('Seu perfil não tem permissão para criar tarefas.')
      return
    }
    setEditing(null)
    setFormDefaults(defaults)
    setFormOpen(true)
  }
  const openEdit = (task) => {
    if (!can('edit_tasks')) {
      toast.error('Seu perfil não tem permissão para editar tarefas.')
      return
    }
    setEditing(task)
    setFormDefaults({})
    setFormOpen(true)
  }

  const changeTask = (patch, taskId) => {
    if (!can('edit_tasks')) {
      toast.error('Seu perfil não tem permissão para editar tarefas.')
      return
    }
    dispatch({ type: 'UPDATE_TASK', taskId, patch, actorId: state.currentUserId })
    toast.success('Tarefa atualizada')
  }
  const deleteTask = (task) => {
    if (!can('delete_tasks')) {
      toast.error('Seu perfil não tem permissão para excluir tarefas.')
      return
    }
    dispatch({ type: 'DELETE_TASK', taskId: task.id, actorId: state.currentUserId })
    toast.push(`"${task.title}" excluída`, 'success', {
      duration: 6000,
      action: {
        label: 'Desfazer',
        onClick: () =>
          dispatch({ type: 'RESTORE_TASK', taskId: task.id, actorId: state.currentUserId })
      }
    })
  }
  const toggleFavorite = (task) => {
    dispatch({ type: 'TOGGLE_FAVORITE', taskId: task.id })
    toast.success(task.favorite ? 'Removida dos favoritos' : 'Adicionada aos favoritos')
  }
  const duplicateTask = (task) => {
    if (!can('create_tasks')) {
      toast.error('Seu perfil não tem permissão para duplicar tarefas.')
      return
    }
    dispatch({ type: 'DUPLICATE_TASK', taskId: task.id, actorId: state.currentUserId })
    toast.success('Tarefa duplicada')
  }
  const approveTask = (task) => {
    dispatch({ type: 'APPROVE_TASK', taskId: task.id, actorId: state.currentUserId })
    toast.success('Tarefa aprovada e concluída')
  }
  const requestCancel = (task) => {
    setCancelTarget(task)
    setCancelReason('')
  }
  const confirmCancel = () => {
    if (!cancelTarget) return
    dispatch({
      type: 'CANCEL_TASK',
      taskId: cancelTarget.id,
      reason: cancelReason,
      actorId: state.currentUserId
    })
    toast.success('Tarefa cancelada')
    setCancelTarget(null)
    setCancelReason('')
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
    if (af.dim === 'mine') f.setMyTasks(false)
    else if (af.dim === 'fav') f.setFavoritesOnly(false)
    else f.toggleFilter(af.dim, af.key)
  }

  const bulkApply = (status) => {
    if (!can('edit_tasks')) {
      toast.error('Seu perfil não tem permissão para editar tarefas.')
      return
    }
    f.selected.forEach((id) =>
      dispatch({ type: 'UPDATE_TASK', taskId: id, patch: { status }, actorId: state.currentUserId })
    )
    toast.success(`${f.selected.size} tarefa(s) movida(s) para ${status}`)
    f.setSelected(new Set())
  }
  const bulkDeleteAll = () => {
    if (!can('delete_tasks')) {
      toast.error('Seu perfil não tem permissão para excluir tarefas.')
      return
    }
    const ids = Array.from(f.selected)
    ids.forEach((id) =>
      dispatch({ type: 'DELETE_TASK', taskId: id, actorId: state.currentUserId })
    )
    toast.push(`${ids.length} tarefa(s) excluída(s)`, 'success', {
      duration: 6000,
      action: {
        label: 'Desfazer',
        onClick: () =>
          dispatch({ type: 'RESTORE_TASK', taskIds: ids, actorId: state.currentUserId })
      }
    })
    f.setSelected(new Set())
    setBulkDelete(false)
  }

  const showPagination = view === 'list' || view === 'table'

  const toolbarData = {
    ...f,
    users: state.users,
    projects: state.projects,
    categories: state.categories
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            { key: 'list', label: 'Lista', icon: LayoutList },
            { key: 'kanban', label: 'Kanban', icon: Columns3 },
            { key: 'table', label: 'Tabela', icon: Table2 },
            { key: 'calendar', label: 'Calendário', icon: CalendarDays }
          ]}
        />
        {can('create_tasks') && (
          <Button icon={Plus} onClick={() => openCreate()}>
            Nova tarefa
          </Button>
        )}
      </div>

      <TasksToolbar f={toolbarData} searchRef={searchRef} openSaveFilter={() => {
        setSaveName('')
        setSaveFilterOpen(true)
      }} />

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
                : 'Comece criando uma nova tarefa para sua equipe.'
            }
            action={
              <Button variant="secondary" onClick={f.clearFilters}>
                Limpar filtros
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <BulkTasksBar
            selected={f.selected}
            canEdit={can('edit_tasks')}
            canDelete={can('delete_tasks')}
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
                    assignee={state.users.find((u) => u.id === task.assigneeId)}
                    project={state.projects.find((p) => p.id === task.projectId)}
                    commentCount={(state.comments[task.id] || []).length}
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
                    onApprove={approveTask}
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
            <>
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
                onApproveTask={approveTask}
                onCancelTask={requestCancel}
              />
              <Pagination
                page={f.page}
                pageCount={f.pageCount}
                total={f.filtered.length}
                pageSize={PAGE_SIZE}
                onChange={f.setPage}
              />
            </>
          )}

          {view === 'kanban' && (
            <KanbanView
              tasks={f.filtered}
              onOpenTask={openTask}
              onEditTask={(task, defaults) => (task ? openEdit(task) : openCreate(defaults))}
              onChange={changeTask}
              onDeleteTask={deleteTask}
              onToggleFavorite={toggleFavorite}
              onDuplicateTask={duplicateTask}
              onApproveTask={approveTask}
              onCancelTask={requestCancel}
            />
          )}

          {view === 'calendar' && (
            <CalendarView tasks={f.filtered} onOpenTask={openTask} onNewTask={openCreate} />
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
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
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
