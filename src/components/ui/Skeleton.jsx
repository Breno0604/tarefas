import React from 'react'

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`} />
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card-base space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}
