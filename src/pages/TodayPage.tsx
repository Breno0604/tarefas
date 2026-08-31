import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Circle,
  Plus,
  Repeat,
  Sunrise,
  StickyNote,
  Inbox
} from 'lucide-react'
import { useStore } from '../store/store'
import { useToast } from '../store/toast'
import { PRIORITY, RECURRENCE } from '../lib/constants'
import { formatDay, isOverdue, startOfDay, endOfDay, localDateToKey, todayKey } from '../lib/format'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

function TaskRow({ task, project, onToggle, onOpen }: { task: any; project: any; onToggle: (id: string) => void; onOpen: (...args: any[]) => void }) {
  const overdue = isOverdue(task.dueDate, task.status)
  const dueLabel = overdue
    ? `Atrasada · ${formatDay(task.dueDate)}`
    : formatDay(task.dueDate)
  return (
    <li>
      <div
        onClick={onOpen}
        className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-popover dark:border-slate-800"
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle(task)
          }}
          className={`shrink-0 transition ${overdue ? 'text-red-400 hover:text-emerald-500' : 'text-slate-300 hover:text-emerald-500 dark:text-slate-600'}`}
          aria-label={`Marcar "${task.title}" como concluída`}
        >
          <Circle size={18} className="group-hover:hidden" />
          <CheckCircle2 size={18} className="hidden text-emerald-500 group-hover:block" />
        </button>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: (PRIORITY as any)[task.priority]?.hex || '#94a3b8' }} />
            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {task.title}
            </span>
            {task.recurrence && task.recurrence !== 'none' && (
              <span
                className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-brand-500 dark:text-brand-300"
                title={`Repete ${(RECURRENCE as any)[task.recurrence]?.label?.toLowerCase() || ''}`}
              >
                <Repeat size={11} />
              </span>
            )}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            {project && (
              <>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                <span className="truncate">{project.name}</span>
              </>
            )}
            {task.dueDate && (
              <span className={overdue ? 'font-semibold text-red-500' : ''}>
                {dueLabel}
              </span>
            )}
          </span>
        </span>

        {(task.subtasks || []).length > 0 && (
          <span className="hidden shrink-0 items-center gap-1 text-[11px] font-medium text-slate-400 sm:flex dark:text-slate-500">
            <CheckCircle2 size={11} />
            {task.subtasks.filter((s: any) => s.done).length}/{task.subtasks.length}
          </span>
        )}
      </div>
    </li>
  )
}

function Section({ icon: Icon, iconClass, title, count, accent, children, empty }: any) {
  return (
    <section className="card-base p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2.5 text-sm font-bold text-slate-800 dark:text-slate-100">
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>
            <Icon size={15} />
          </span>
          {title}
        </h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${accent || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
          {count}
        </span>
      </div>
      <div className="mt-3">
        {count === 0 ? (
          empty
        ) : (
          <ul className="space-y-2">{children}</ul>
        )}
      </div>
    </section>
  )
}

function TodayPage() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const toast = useToast()
  const [quickAdd, setQuickAdd] = useState('')

  const sections = useMemo(() => {
    const open = state.tasks.filter((t: any) => t.status === 'todo' || t.status === 'in_progress')
    const today = todayKey()

    // Calculate the key for 7 days from now using local date math
    const todayDate = new Date(today + 'T12:00:00')
    const in7DaysDate = new Date(todayDate)
    in7DaysDate.setDate(in7DaysDate.getDate() + 7)
    const in7Days = localDateToKey(in7DaysDate)

    const overdue = open
      .filter((t: any) => isOverdue(t.dueDate, t.status))
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    const dueToday = open
      .filter((t: any) => {
        if (!t.dueDate) return false
        return localDateToKey(t.dueDate) === today
      })
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    const upcoming = open
      .filter((t: any) => {
        if (!t.dueDate) return false
        const key = localDateToKey(t.dueDate)
        return key > today && key <= in7Days
      })
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    const undated = open.filter((t: any) => !t.dueDate)

    return { overdue, today: dueToday, upcoming, undated }
  }, [state.tasks])

  const total = sections.overdue.length + sections.today.length + sections.upcoming.length + sections.undated.length

  const toggleDone = (task: any) => {
    dispatch({ type: 'TOGGLE_TASK_DONE', taskId: task.id })
    toast.success(
      task.recurrence && task.recurrence !== 'none'
        ? 'Concluída — próxima ocorrência criada'
        : 'Tarefa concluída'
    )
  }

  const openTask = (id: string) => navigate(`/tarefas?task=${id}`)

  const submitQuickAdd = (e: any) => {
    e.preventDefault()
    const title = quickAdd.trim()
    if (!title) {
      toast.error('Digite um título para a tarefa.')
      return
    }
    dispatch({
      type: 'CREATE_TASK',
      task: {
        title,
        status: 'todo',
        dueDate: todayKey(),
        priority: 'medium'
      }
    })
    setQuickAdd('')
    toast.success('Tarefa adicionada para hoje')
  }

  const projectOf = (t: any) => state.projects.find((p: any) => p.id === t.projectId)
  const rowProps = (t: any) => ({
    key: t.id,
    task: t,
    project: projectOf(t),
    onToggle: toggleDone,
    onOpen: () => openTask(t.id)
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Cabeçalho */}
      <div className="card-base flex flex-wrap items-center gap-4 p-4 sm:p-5">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
          <Sunrise size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg dark:text-white">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
            {total === 0
              ? 'Nada pendente. Aproveite o dia!'
              : `${sections.overdue.length} atrasada(s) · ${sections.today.length} hoje · ${sections.upcoming.length} nos próximos dias`}
          </p>
        </div>
        {total > 0 && (
          <Button variant="secondary" size="sm" onClick={() => navigate('/tarefas')} className="hidden sm:inline-flex">
            Ver todas as tarefas
          </Button>
        )}
      </div>

      {/* Quick add */}
      <form onSubmit={submitQuickAdd} className="card-base flex items-center gap-2 p-2 pl-4">
        <Plus size={16} className="shrink-0 text-slate-400" />
        <input
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          placeholder="Adicionar tarefa para hoje e Enter..."
          aria-label="Adicionar tarefa para hoje"
          className="h-9 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
        />
        {quickAdd.trim() && (
          <Button type="submit" size="sm">Adicionar</Button>
        )}
      </form>

      {/* Atrasadas */}
      <Section
        icon={AlertTriangle}
        iconClass="bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300"
        title="Atrasadas"
        count={sections.overdue.length}
        accent="bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
        empty={<EmptyState icon={CheckCircle2} title="Nenhuma atrasada" description="Você está em dia com o passado." compact />}
      >
        {sections.overdue.map((t: any) => <TaskRow {...rowProps(t)} />)}
      </Section>

      {/* Hoje */}
      <Section
        icon={CalendarClock}
        iconClass="bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
        title="Hoje"
        count={sections.today.length}
        accent="bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
        empty={<EmptyState icon={Sunrise} title="Nada vence hoje" description="Use o campo acima para capturar algo do dia." compact />}
      >
        {sections.today.map((t: any) => <TaskRow {...rowProps(t)} />)}
      </Section>

      {/* Próximos 7 dias */}
      <Section
        icon={StickyNote}
        iconClass="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
        title="Próximos 7 dias"
        count={sections.upcoming.length}
        accent="bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
        empty={<EmptyState icon={CalendarClock} title="Nada nos próximos dias" compact />}
      >
        {sections.upcoming.map((t: any) => <TaskRow {...rowProps(t)} />)}
      </Section>

      {/* Sem data */}
      {sections.undated.length > 0 && (
        <Section
          icon={Inbox}
          iconClass="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
          title="Sem data"
          count={sections.undated.length}
          empty={null}
        >
          {sections.undated.slice(0, 10).map((t: any) => <TaskRow {...rowProps(t)} />)}
        </Section>
      )}
    </div>
  )
}

export default React.memo(TodayPage)
