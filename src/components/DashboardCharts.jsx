import React, { Suspense } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'

function useChartTheme() {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  return {
    tooltip: {
      borderRadius: 12,
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      fontSize: 12,
      fontFamily: 'Inter, sans-serif',
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#e2e8f0' : '#1e293b'
    },
    grid: isDark ? '#334155' : '#e2e8f0',
    tick: isDark ? '#94a3b8' : '#64748b',
    cursor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)'
  }
}

function ChartFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
    </div>
  )
}

export function StatusPieChart({ data }) {
  const theme = useChartTheme()
  return (
    <Suspense fallback={<ChartFallback />}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((s) => (
              <Cell key={s.name} fill={s.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={theme.tooltip} />
        </PieChart>
      </ResponsiveContainer>
    </Suspense>
  )
}

export function PriorityBarChart({ data }) {
  const theme = useChartTheme()
  return (
    <Suspense fallback={<ChartFallback />}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.grid} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme.tick }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: theme.tick }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={theme.tooltip} cursor={{ fill: theme.cursor }} />
          <Bar dataKey="value" name="Tarefas" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {data.map((p) => (
              <Cell key={p.name} fill={p.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Suspense>
  )
}

export function WorkloadBarChart({ data }) {
  const theme = useChartTheme()
  return (
    <Suspense fallback={<ChartFallback />}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.grid} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme.tick }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: theme.tick }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={theme.tooltip} cursor={{ fill: theme.cursor }} />
          <Bar dataKey="ativas" name="Ativas" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} maxBarSize={40} />
          <Bar dataKey="concluídas" name="Concluídas" stackId="a" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </Suspense>
  )
}

