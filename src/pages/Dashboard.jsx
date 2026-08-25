import React, { Suspense, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ListTodo, CheckCircle2, AlertTriangle, CalendarClock, ArrowRight, Plus, Star } from 'lucide-react'
import * as DashboardCharts from '../components/DashboardCharts'
import { useStore } from '../store/store'
import { STATUS, PRIORITY } from '../lib/constants'
import { formatDay, isOverdue, startOfDay, endOfDay } from '../lib/format'
import { StatusBadge } from '../components/ui/Badge'
import ActivityFeed from '../components/ActivityFeed'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

function StatCard({ icon: Icon, iconClass, label, value, sub, trend, trendUp }) {
  return (
    <div className="card-base flex items-start gap-4 p-5 cursor-default">
      <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>
        {trend && (
          <p className={`mt-1 text-xs font-semibold ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { state } = useStore()
  const navigate = useNavigate()
  const tasks = state.tasks

  const metrics = useMemo(() => {
    const open = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress')
    const done = tasks.filter((t) => t.status === 'done')
    const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status))
    const start = startOfDay().getTime()
    const end = endOfDay().getTime()
    const dueToday = open.filter((t) => {
      if (!t.dueDate) return false
      const ts = new Date(t.dueDate).getTime()
      return ts >= start && ts <= end
    })
    return {
      total: tasks.length,
      activeCount: open.length,
      doneCount: done.length,
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      completion: tasks.length ? Math.round((done.length / tasks.length) * 100) : 0
    }
  }, [tasks])

  const statusData = useMemo(
    () =>
      Object.values(STATUS).map((s) => ({
        name: s.label,
        value: tasks.filter((t) => t.status === s.key).length,
        color: s.hex
      })),
    [tasks]
  )

  const priorityData = useMemo(
    () =>
      Object.values(PRIORITY)
        .map((p) => ({
          name: p.label,
          value: tasks.filter((t) => t.priority === p.key && t.status !== 'done' && t.status !== 'cancelled').length,
          color: p.hex
        })),
    [tasks]
  )

  const projectData = useMemo(
    () =>
      state.projects
        .map((p) => ({
          name: p.name.length > 14 ? `${p.name.slice(0, 13)}…` : p.name,
          ativas: tasks.filter((t) => t.projectId === p.id && (t.status === 'todo' || t.status === 'in_progress')).length,
          concluídas: tasks.filter((t) => t.projectId === p.id && t.status === 'done').length
        }))
        .sort((a, b) => b.ativas - a.ativas),
    [state.projects, tasks]
  )

  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => t.dueDate && (t.status === 'todo' || t.status === 'in_progress'))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5),
    [tasks]
  )

  const recentActivities = useMemo(() => state.activities.slice(0, 7), [state.activities])

  const activityByDay = useMemo(() => {
    const now = new Date()
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short' })
      const count = state.activities.filter((a) => a.createdAt.slice(0, 10) === key).length
      days.push({ name: label, value: count, color: count > 0 ? '#6366f1' : '#e2e8f0' })
    }
    return days
  }, [state.activities])

  const openTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === 'todo' || t.status === 'in_progress')
        .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
        .slice(0, 4),
    [tasks]
  )

  const today = useMemo(() => {
    const start = startOfDay().getTime()
    const end = endOfDay().getTime()
    const dueTodayOpen = tasks.filter((t) => {
      if (!t.dueDate) return false
      const ts = new Date(t.dueDate).getTime()
      return ts >= start && ts <= end && (t.status === 'todo' || t.status === 'in_progress')
    })
    const overdueOpen = tasks.filter((t) => isOverdue(t.dueDate, t.status))
    const agenda = [
      ...overdueOpen,
      ...dueTodayOpen.filter((t) => !isOverdue(t.dueDate, t.status))
    ]
      .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
      .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
    return {
      dueToday: dueTodayOpen.length,
      overdue: overdueOpen.length,
      agenda: agenda.slice(0, 6)
    }
  }, [tasks])

  const favoriteTasks = useMemo(() => tasks.filter((t) => t.favorite).slice(0, 4), [tasks])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ListTodo}
          iconClass="bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
          label="Tarefas ativas"
          value={metrics.activeCount}
          sub={`de ${metrics.total} no total`}
        />
        <StatCard
          icon={CheckCircle2}
          iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
          label="Concluídas"
          value={metrics.doneCount}
          sub={`Taxa de conclusão de ${metrics.completion}%`}
        />
        <StatCard
          icon={AlertTriangle}
          iconClass="bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300"
          label="Atrasadas"
          value={metrics.overdueCount}
          sub={metrics.overdueCount > 0 ? 'Vale a pena dar uma olhada' : 'Tudo em ordem'}
          trend={metrics.overdueCount > 0 ? 'Atenção necessária' : undefined}
          trendUp={metrics.overdueCount === 0}
        />
        <StatCard
          icon={CalendarClock}
          iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
          label="Vencendo hoje"
          value={metrics.dueTodayCount}
          sub="Agenda do dia"
        />
      </div>

      <div className="card-base p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
              <CalendarClock size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hoje</h3>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              {today.dueToday} vencendo hoje
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                today.overdue > 0
                  ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${today.overdue > 0 ? 'bg-red-500' : 'bg-slate-400'}`} />
              {today.overdue} atrasadas
            </span>
            <Button variant="secondary" size="sm" icon={ArrowRight} onClick={() => navigate('/tarefas')}>
              Ver tarefas
            </Button>
          </div>
        </div>

        {today.agenda.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={CheckCircle2}
              title="Nenhuma pendência para hoje"
              description="Você está em dia com suas tarefas."
              compact
            />
          </div>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {today.agenda.map((t) => {
              const project = state.projects.find((p) => p.id === t.projectId)
              const overdue = isOverdue(t.dueDate, t.status)
              return (
                <li key={t.id}>
                  <button
                    onClick={() => navigate(`/tarefas?task=${t.id}`)}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-popover dark:border-slate-800"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {t.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                        {project && (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                            <span className="truncate">{project.name}</span>
                          </>
                        )}
                        {t.dueDate && (
                          <span className={overdue ? 'font-semibold text-red-500' : ''}>
                            {overdue ? `Atrasada · ${formatDay(t.dueDate)}` : `Vence hoje · ${formatDay(t.dueDate)}`}
                          </span>
                        )}
                      </span>
                    </span>
                    <StatusBadge status={t.status} size="sm" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card-base p-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Tarefas por status</h3>
              <div className="h-56">
                <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" /></div>}>
                  <DashboardCharts.StatusPieChart data={statusData} />
                </Suspense>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {statusData.map((s) => (
                  <span key={s.name} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </div>

            <div className="card-base p-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Abertas por prioridade</h3>
              <div className="h-56">
                <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" /></div>}>
                  <DashboardCharts.PriorityBarChart data={priorityData} />
                </Suspense>
              </div>
            </div>
          </div>

          <div className="card-base p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Tarefas por projeto</h3>
              <Link to="/projetos" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Ver projetos →
              </Link>
            </div>
            <div className="mt-4 h-60">
              <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" /></div>}>
                <DashboardCharts.WorkloadBarChart data={projectData} />
              </Suspense>
            </div>
          </div>

          <div className="card-base p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Em aberto</h3>
              <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/tarefas')}>
                Ver todas
              </Button>
            </div>
            {openTasks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Você está em dia!"
                description="Nenhuma tarefa pendente."
                compact
              />
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {openTasks.map((t) => {
                  const project = state.projects.find((p) => p.id === t.projectId)
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => navigate(`/tarefas?task=${t.id}`)}
                        className="flex w-full items-center gap-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <span className="flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {t.title}
                          </span>
                          <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                            {project && (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                                {project.name}
                              </>
                            )}
                            {t.dueDate && (
                              <span className={isOverdue(t.dueDate, t.status) ? 'font-semibold text-red-500' : ''}>
                                {isOverdue(t.dueDate, t.status) ? `Atrasada · ${formatDay(t.dueDate)}` : formatDay(t.dueDate)}
                              </span>
                            )}
                          </span>
                        </span>
                        <StatusBadge status={t.status} size="sm" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="card-base p-5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <Star size={15} className="text-amber-400" fill="currentColor" />
                Favoritas
              </h3>
              <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/tarefas')}>
                Ver todas
              </Button>
            </div>
            {favoriteTasks.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  icon={Star}
                  title="Nenhuma favorita"
                  description="Toque na estrela de uma tarefa para vê-la aqui."
                  compact
                />
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {favoriteTasks.map((t) => {
                  const project = state.projects.find((p) => p.id === t.projectId)
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => navigate(`/tarefas?task=${t.id}`)}
                        className="flex w-full items-center gap-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <Star size={13} className="shrink-0 text-amber-400" fill="currentColor" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {t.title}
                          </span>
                          <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                            {project && (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                                <span className="truncate">{project.name}</span>
                              </>
                            )}
                            {t.dueDate && formatDay(t.dueDate)}
                          </span>
                        </span>
                        <StatusBadge status={t.status} size="sm" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-base p-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Próximos prazos</h3>
            {upcoming.length === 0 ? (
              <EmptyState icon={CalendarClock} title="Nada por vencer" compact />
            ) : (
              <ul className="mt-3 space-y-2">
                {upcoming.map((t) => {
                  const overdue = isOverdue(t.dueDate, t.status)
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => navigate(`/tarefas?task=${t.id}`)}
                        className="flex w-full items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-popover dark:border-slate-800"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                            {t.title}
                          </p>
                          <p className={`text-xs font-semibold ${overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {overdue ? 'Atrasada · ' : 'Vence '}
                            {formatDay(t.dueDate)}
                          </p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <button
              onClick={() => navigate('/tarefas?view=calendar')}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-2 text-xs font-semibold text-slate-500 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:hover:border-brand-500/50 dark:hover:text-brand-300"
            >
              <Plus size={13} /> Ver calendário de prazos
            </button>
          </div>

          <div className="card-base p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Atividade recente</h3>
              <Link to="/atividades" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Ver tudo →
              </Link>
            </div>
            <div className="mt-3">
              <ActivityFeed items={recentActivities} compact />
            </div>
          </div>

          <div className="card-base p-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Atividade da semana</h3>
            <div className="mt-3 h-32">
              <DashboardCharts.PriorityBarChart data={activityByDay} />
            </div>
          </div>

          <div className="card-base p-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Distribuição de status</h3>
            <div className="mt-4 space-y-3">
              {statusData.map((s) => {
                const pct = metrics.total ? Math.round((s.value / metrics.total) * 100) : 0
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{s.name}</span>
                      <span className="font-medium text-slate-400 dark:text-slate-500">{s.value} ({pct}%)</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
