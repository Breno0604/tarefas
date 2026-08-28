import React, { Suspense, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ListTodo, CheckCircle2, AlertTriangle, CalendarClock, ArrowRight, Plus, Star } from 'lucide-react'
import * as DashboardCharts from '../components/DashboardCharts'
import { useStore } from '../store/store'
import { formatDay, isOverdue } from '../lib/format'
import { StatusBadge } from '../components/ui/Badge'
import ActivityFeed from '../components/ActivityFeed'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import useDashboardMetrics from '../hooks/useDashboardMetrics'

function StatCard({ icon: Icon, iconClass, label, value, sub, trend, trendUp, onClick }) {
  return (
    <button onClick={onClick} className="card-base flex w-full items-start gap-2.5 p-3 sm:p-4 text-left transition hover:-translate-y-0.5 hover:shadow-popover min-w-0 overflow-hidden">
      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${iconClass}`}>
        <Icon size={18} className="sm:hidden" />
        <Icon size={20} className="hidden sm:block" />
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 sm:text-[11px]">
          {label}
        </p>
        <p className="mt-0.5 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">{value}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-xs">{sub}</p>
        {trend && (
          <p className={`mt-0.5 text-[11px] font-semibold sm:mt-1 sm:text-xs ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend}
          </p>
        )}
      </div>
    </button>
  )
}

function navigateWithClearFilters(navigate, path) {
  sessionStorage.setItem('taskflow:clear-filters', '1')
  navigate(path)
}

function Dashboard() {
  const { state } = useStore()
  const navigate = useNavigate()
  const tasks = state.tasks

  const {
    metrics,
    statusData,
    priorityData,
    projectData,
    upcoming,
    activityByDay,
    openTasks,
    today,
    favoriteTasks
  } = useDashboardMetrics()

  const recentActivities = useMemo(() => state.activities.slice(0, 7), [state.activities])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={ListTodo}
          iconClass="bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
          label="Tarefas ativas"
          value={metrics.activeCount}
          sub={`de ${metrics.total} no total`}
          onClick={() => navigateWithClearFilters(navigate, '/tarefas')}
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
          onClick={() => navigateWithClearFilters(navigate, '/tarefas')}
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
            <Button variant="secondary" size="sm" icon={ArrowRight} onClick={() => navigateWithClearFilters(navigate, '/tarefas?status=todo,in_progress')}>
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
              <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigateWithClearFilters(navigate, '/tarefas?status=todo,in_progress')}>
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
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {t.title}
                          </span>
                          <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                            {project && (
                              <>
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                                <span className="truncate">{project.name}</span>
                              </>
                            )}
                            {t.dueDate && (
                              <span className={`shrink-0 ${isOverdue(t.dueDate, t.status) ? 'font-semibold text-red-500' : ''}`}>
                                {isOverdue(t.dueDate, t.status) ? `Atrasada · ${formatDay(t.dueDate)}` : formatDay(t.dueDate)}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="shrink-0">
                          <StatusBadge status={t.status} size="sm" />
                        </span>
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
              <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigateWithClearFilters(navigate, '/tarefas?favorites=1')}>
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
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                                <span className="truncate">{project.name}</span>
                              </>
                            )}
                            {t.dueDate && <span className="shrink-0">{formatDay(t.dueDate)}</span>}
                          </span>
                        </span>
                        <span className="shrink-0">
                          <StatusBadge status={t.status} size="sm" />
                        </span>
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
              onClick={() => navigateWithClearFilters(navigate, '/tarefas?view=calendar')}
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

export default React.memo(Dashboard)
