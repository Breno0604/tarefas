import React from 'react'
import {
  ListFilter,
  ArrowDownWideNarrow,
  FilterX
} from 'lucide-react'
import Dropdown from '../ui/Dropdown'
import Button from '../ui/Button'
import { STATUS, PRIORITY, SORT_OPTIONS } from '../../lib/constants'

function FilterDropdown({ label, icon: Icon, activeCount, items, onClear }) {
  return (
    <Dropdown
      align="right"
      trigger={
        <button
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition ${
            activeCount > 0
              ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
          }`}
        >
          {Icon && <Icon size={14} />}
          {label}
          {activeCount > 0 && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white dark:bg-brand-400 dark:text-slate-900">
              {activeCount}
            </span>
          )}
        </button>
      }
      items={[
        ...items,
        { type: 'divider' },
        { label: 'Limpar filtro', icon: FilterX, onClick: onClear }
      ]}
    />
  )
}

const toggleButtonCls = (active) =>
  `inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition ${
    active
      ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300'
      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
  }`

export default function TasksToolbar({ f, searchRef, openSaveFilter }) {
  const {
    filters,
    setFilters,
    toggleFilter,
    clearFilters,
    activeFilterCount,
    sortKey,
    setSortKey,
    query
  } = f

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterDropdown
        label="Status"
        icon={ListFilter}
        activeCount={filters.status.length}
        onClear={() => setFilters((f) => ({ ...f, status: [] }))}
        items={Object.values(STATUS).map((s) => ({
          label: s.label,
          active: filters.status.includes(s.key),
          keepOpen: true,
          onClick: () => toggleFilter('status', s.key)
        }))}
      />
      <FilterDropdown
        label="Prioridade"
        icon={ListFilter}
        activeCount={filters.priority.length}
        onClear={() => setFilters((f) => ({ ...f, priority: [] }))}
        items={Object.values(PRIORITY).map((p) => ({
          label: p.label,
          active: filters.priority.includes(p.key),
          keepOpen: true,
          onClick: () => toggleFilter('priority', p.key)
        }))}
      />
      <FilterDropdown
        label="Responsável"
        icon={ListFilter}
        activeCount={filters.assignee.length}
        onClear={() => setFilters((f) => ({ ...f, assignee: [] }))}
        items={[
          ...f.users.map((u) => ({
            label: u.name,
            active: filters.assignee.includes(u.id),
            keepOpen: true,
            onClick: () => toggleFilter('assignee', u.id)
          })),
          {
            label: 'Não atribuída',
            active: filters.assignee.includes('none'),
            keepOpen: true,
            onClick: () => toggleFilter('assignee', 'none')
          }
        ]}
      />
      <FilterDropdown
        label="Projeto"
        icon={ListFilter}
        activeCount={filters.project.length}
        onClear={() => setFilters((f) => ({ ...f, project: [] }))}
        items={[
          ...f.projects.map((p) => ({
            label: p.name,
            active: filters.project.includes(p.id),
            keepOpen: true,
            onClick: () => toggleFilter('project', p.id)
          })),
          {
            label: 'Sem projeto',
            active: filters.project.includes('none'),
            keepOpen: true,
            onClick: () => toggleFilter('project', 'none')
          }
        ]}
      />
      <FilterDropdown
        label="Categoria"
        icon={ListFilter}
        activeCount={filters.category.length}
        onClear={() => setFilters((f) => ({ ...f, category: [] }))}
        items={f.categories.map((c) => ({
          label: c.name,
          active: filters.category.includes(c.id),
          keepOpen: true,
          onClick: () => toggleFilter('category', c.id)
        }))}
      />

      <Dropdown
        align="right"
        trigger={
          <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600">
            <ArrowDownWideNarrow size={14} />
            Ordenar
          </button>
        }
        items={SORT_OPTIONS.map((o) => ({
          label: o.label,
          active: sortKey === o.key,
          onClick: () => setSortKey(o.key)
        }))}
      />

      {(activeFilterCount > 0 || query) && (
        <Button variant="ghost" size="md" icon={FilterX} onClick={clearFilters}>
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
