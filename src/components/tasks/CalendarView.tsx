import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { monthName, weekdayShort, startOfDay, localDateToKey, dateKeyToLocalDate } from '../../lib/format'
import { PRIORITY } from '../../lib/constants'
import { useStore } from '../../store/store'

const WEEKDAYS_SUNDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAYS_MONDAY = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export default function CalendarView({ tasks, onOpenTask, onNewTask }: any) {
  const { state } = useStore()
  const today = startOfDay(new Date())
  const firstDay = state.appearance?.firstDay === 'monday' ? 1 : 0
  const [monthOffset, setMonthOffset] = useState(0)

  const monthDate = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset]
  )

  const grid = useMemo(() => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstDow = new Date(year, month, 1).getDay()
    const offset = (firstDow - firstDay + 7) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < offset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d))
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [monthDate, firstDay])

  const daysList = useMemo(() => grid.filter(Boolean), [grid])

  const tasksByDay = useMemo(() => {
    const map: Record<string, any[]> = {}
    tasks.forEach((t: any) => {
      if (!t.dueDate) return
      // Use local date key to avoid timezone shifts
      const key = localDateToKey(t.dueDate)
      if (!key) return
      if (!(map as any)[key]) (map as any)[key] = []
      map[key].push(t)
    })
    return map
  }, [tasks])

  const weekdays = firstDay === 1 ? WEEKDAYS_MONDAY : WEEKDAYS_SUNDAY
  const isToday = (d: any) => d && d.toDateString() === today.toDateString()
  const isCurrentMonth = (d: any) => d && d.getMonth() === monthDate.getMonth()

  const TaskChip = ({ t }: any) => (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onOpenTask(t.id)
      }}
      className="flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium text-slate-700 transition hover:bg-white hover:shadow-sm dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: (PRIORITY as any)[t.priority]?.hex || '#94a3b8' }}
      />
      <span className="truncate">{t.title}</span>
      {state.notes[t.id]?.length > 0 && (
        <span className="shrink-0 text-slate-300 dark:text-slate-600">●</span>
      )}
    </button>
  )

  return (
    <div className="card-base overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 sm:px-4 py-2.5 sm:py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset((m: any) => m - 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMonthOffset((m: any) => m + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
          <h3 className="ml-1 text-sm font-bold capitalize text-slate-800 dark:text-slate-100">
            {monthName(monthDate.getMonth())} {monthDate.getFullYear()}
          </h3>
        </div>
        {monthOffset !== 0 && (
          <button
            onClick={() => setMonthOffset(0)}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
          >
            Hoje
          </button>
        )}
      </div>

      <div className="hidden sm:block">
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
          {weekdays.map((w: any) => (
            <div
              key={w}
              className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
            >
              {w}
            </div>
          ))}
        </div>

        <div key={monthOffset} className="grid grid-cols-7 animate-fade-in">
          {grid.map((d, i) => {
            const key = d ? d.toDateString() : `empty-${i}`
            const dayKey = d ? localDateToKey(d) : null
            const dayTasks = dayKey ? (tasksByDay as any)[dayKey] || [] : []
            const inMonth = isCurrentMonth(d)
            return (
              <div
                key={key}
                onClick={() => d && onNewTask({ dueDate: localDateToKey(d) })}
                className={`min-h-[104px] border-b border-r border-slate-100 p-1.5 transition dark:border-slate-800/70 ${
                  d && inMonth ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : ''
                } ${d ? 'cursor-pointer' : ''} ${!inMonth ? 'bg-slate-50/60 dark:bg-slate-900/40' : ''}`}
              >
                {d && (
                  <>
                    <div className="flex items-center justify-between px-1">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          isToday(d)
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      {dayTasks.length > 0 && (
                        <Plus size={12} className="text-slate-300 hover:text-brand-500" />
                      )}
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayTasks.slice(0, 3).map((t: any) => (
                        <TaskChip key={t.id} t={t} />
                      ))}
                      {dayTasks.length > 3 && (
                        <p className="px-1.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                          +{dayTasks.length - 3} mais
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="divide-y divide-slate-100 sm:hidden dark:divide-slate-800">
        {daysList.map((d: any) => {
          const dayTasks = tasksByDay[d.toDateString()] || []
          const dayKey = localDateToKey(d)
          return (
            <div key={dayKey} className="px-3 sm:px-4 py-2.5 sm:py-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isToday(d) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {d.getDate()}
                </span>
                <span className="text-xs font-semibold capitalize text-slate-400 dark:text-slate-500">
                  {weekdays[(d.getDay() - firstDay + 7) % 7]}
                </span>
                {!isCurrentMonth(d) && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-600">fora do mês</span>
                )}
              </div>
              <div className="mt-2 space-y-1 pl-9">
                {dayTasks.length === 0 ? (
                  <button
                    onClick={() => onNewTask({ dueDate: localDateToKey(d) })}
                    className="w-full rounded-lg px-2 py-1 text-left text-xs text-slate-300 transition hover:bg-slate-50 hover:text-brand-600 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-brand-300"
                  >
                    + Adicionar tarefa
                  </button>
                ) : (
                  dayTasks.map((t: any) => <TaskChip key={t.id} t={t} />)
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
