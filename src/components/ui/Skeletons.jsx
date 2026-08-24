import React from 'react'

export function StatsCardSkeleton() {
  return (
    <div className="card-base flex items-start gap-4 p-5 animate-pulse">
      <span className="h-11 w-11 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-7 w-12 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="card-base p-5 animate-pulse">
      <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-4 h-56 rounded-lg bg-slate-100 dark:bg-slate-800" />
    </div>
  )
}

export function TaskListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
    </div>
  )
}

export function FilterBarSkeleton() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-9 w-24 rounded-lg bg-slate-200 dark:bg-slate-700" />
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <ChartSkeleton />
        </div>
        <div className="space-y-6">
          <div className="card-base p-5 space-y-3">
            <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
            {[1, 2, 3].map((i) => (
              <TaskListRowSkeleton key={i} />
            ))}
          </div>
          <div className="card-base p-5 space-y-3">
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            {[1, 2].map((i) => (
              <TaskListRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
