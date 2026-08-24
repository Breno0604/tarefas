import React, { Suspense, lazy, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ListTodo, CheckCircle2, AlertTriangle, Timer, ArrowRight, Plus, Star, CalendarClock } from 'lucide-react'
const DashboardCharts = lazy(() => import('../components/DashboardCharts'))
import { useStore, useIsManager } from '../store/store'
import { STATUS, PRIORITY } from '../lib/constants'
import { formatDay, isOverdue, startOfDay, endOfDay } from '../lib/format'
import { StatusBadge, Avatar } from '../components/ui/Badge'
import ActivityFeed from '../components/ActivityFeed'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

function StatCard({ icon: Icon, iconClass, label, value, sub, trend, trendUp }) {
  return (
    <div className="card-base flex items-start gap-4 p-5">
      <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
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
  const meId = state.currentUserId
  const isManager = useIsManager()

  const scopedTasks = useMemo(() => {
    if (isManager) return state.tasks
    // Non-managers only see tasks assigned to them (same rule as useTaskFilters)
    return state.tasks.filter((t) => t.assigneeId === meId)
  }, [state.tasks, meId, isManager])

  const metrics = useMemo(() => {
    const total = scopedTasks.length
    const active = scopedTasks.filter((t) => t.status !== 'done' && t.status !== 'blocked')
    const done = scopedTasks.filter((t) => t.status === 'done')
    const blocked = scopedTasks.filter((t) => t.status === 'blocked')
    const overdue = scopedTasks.filter((t) => isOverdue(t.dueDate, t.status))
    const completion = total ? Math.round((done.length / total) * 100) : 0
    const totalHours = scopedTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0)
    const myTasks = scopedTasks.filter((t) => t.assigneeId === meId)
    const myOpen = myTasks.filter((t) => t.status !== 'done')
    return {
      total,
      activeCount: active.length,
      doneCount: done.length,
      blockedCount: blocked.length,
      overdueCount: overdue.length,
      completion,
      totalHours,
      myOpenCount: myOpen.length,
      myOverdue: myTasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
      unassignedCount: scopedTasks.filter(
        (t) => !t.assigneeId && t.status !== 'done' && t.status !== 'cancelled'
      ).length
    }
  }, [scopedTasks, meId])

  const statusData = useMemo(
    () =>
      Object.values(STATUS).map((s) => ({
        name: s.label,
        value: scopedTasks.filter((t) => t.status === s.key).length,
        color: s.hex
      })),
    [scopedTasks]
  )

  const priorityData = useMemo(
    () =>
      Object.values(PRIORITY).map((p) => ({
        name: p.label,
        value: scopedTasks.filter((t) => t.priority === p.key).length,
        color: p.hex
      })),
    [scopedTasks]
  )

  const workloadData = useMemo(
    () =>
      state.users
        .filter((u) => u.active !== false)
        .map((u) => ({
          name: u.name.split(' ')[0],
          ativas: scopedTasks.filter((t) => t.assigneeId === u.id && t.status !== 'done').length,
          concluídas: scopedTasks.filter((t) => t.assigneeId === u.id && t.status === 'done').length,
          color: u.color
        }))
        .sort((a, b) => b.ativas - a.ativas),
    [state.users, scopedTasks]
  )

  const upcoming = useMemo(
    () =>
      scopedTasks
        .filter((t) => t.dueDate && t.status !== 'done')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5),
    [scopedTasks]
  )

  const recentActivities = useMemo(() => state.activities.slice(0, 7), [state.activities])

  const myOpenTasks = useMemo(
    () =>
      scopedTasks
        .filter((t) => t.assigneeId === meId && t.status !== 'done')
        .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
        .slice(0, 4),
    [scopedTasks, meId]
  )

  const today = useMemo(() => {
    const start = startOfDay().getTime()
    const end = endOfDay().getTime()
    const dueToday = scopedTasks.filter((t) => {
      if (!t.dueDate) return false
      const ts = new Date(t.dueDate).getTime()
      return ts >= start && ts <= end
    })
    const dueTodayOpen = dueToday.filter((t) => t.status !== 'done')
    const overdueOpen = scopedTasks.filter((t) => isOverdue(t.dueDate, t.status))
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
  }, [scopedTasks])

  const favoriteTasks = useMemo(
    () => scopedTasks.filter((t) => t.favorite).slice(0, 4),
    [scopedTasks]
  )

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
          sub={`${metrics.blockedCount} bloqueadas`}
          trend={metrics.overdueCount > 0 ? 'Atenção necessária' : undefined}
          trendUp={metrics.overdueCount === 0}
        />
        <StatCard
          icon={Timer}
          iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
          label="Minhas pendências"
          value={metrics.myOpenCount}
          sub={`${metrics.myOverdue} atrasadas para você`}
        />
      </div>

      {isManager && metrics.unassignedCount > 0 && (() => {
        const unassigned = scopedTasks.filter(
          (t) => !t.assigneeId && t.status !== 'done' && t.status !== 'cancelled'
        )
        return (
          <div className="card-base p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                  {metrics.unassignedCount} tarefa(s) sem responsável
                </p>
                <p className="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/80">
                  Atribua um responsável para que entrem no fluxo da equipe.
                </p>
                <ul className="mt-3 space-y-1.5">
                  {unassigned.slice(0, 5).map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => navigate(`/tarefas?task=${t.id}`)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-amber-50 dark:hover:bg-amber-500/10"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                        <span className="flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                          {t.title}
                        </span>
                        <StatusBadge status={t.status} size="sm" />
                      </button>
                    </li>
                  ))}
                </ul>
                {unassigned.length > 5 && (
                  <button
                    onClick={() => navigate('/tarefas?view=kanban')}
                    className="mt-2 text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
                  >
                    Ver todas ({unassigned.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

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
              description="Você está em dia com suas tarefas de hoje."
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
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 text-left transition hover:border-slate-200 hover:shadow-sm dark:border-slate-800 dark:hover:border-slate-700"
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
                            {overdue ? 'Atrasada · ' : 'Vence hoje · '}
                            {formatDay(t.dueDate)}
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
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Tarefas por prioridade</h3>
              <div className="h-56">
                <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" /></div>}>
                  <DashboardCharts.PriorityBarChart data={priorityData} />
                </Suspense>
              </div>
            </div>
          </div>

          <div className="card-base p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Carga de trabalho por membro</h3>
              <Link to="/equipe" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Ver equipe →
              </Link>
            </div>
            <div className="mt-4 h-60">
              <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" /></div>}>
                <DashboardCharts.WorkloadBarChart data={workloadData} />
              </Suspense>
            </div>
          </div>

          <div className="card-base p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Minhas tarefas em aberto</h3>
              <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/tarefas')}>
                Ver todas
              </Button>
            </div>
            {myOpenTasks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Você está em dia!"
                description="Nenhuma tarefa pendente atribuída a você."
                compact
              />
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {myOpenTasks.map((t) => {
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
                                {isOverdue(t.dueDate, t.status) ? 'Atrasada · ' : ''}
                                {formatDay(t.dueDate)}
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
              <EmptyState icon={CalendarEmptyIcon} title="Nada por vencer" compact />
            ) : (
              <ul className="mt-3 space-y-2">
                {upcoming.map((t) => {
                  const assignee = state.users.find((u) => u.id === t.assigneeId)
                  const overdue = isOverdue(t.dueDate, t.status)
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => navigate(`/tarefas?task=${t.id}`)}
                        className="flex w-full items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 text-left transition hover:border-slate-200 hover:shadow-sm dark:border-slate-800 dark:hover:border-slate-700"
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
                        <Avatar user={assignee} size="sm" />
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

function CalendarEmptyIcon(props) {
  return <CalendarClock {...props} />
}
