import React from 'react'
import {
  FilterX,
  CircleDot,
  Flag,
  UserRound,
  FolderKanban,
  Tags
} from 'lucide-react'
import Dropdown from '../ui/Dropdown'
import Button from '../ui/Button'
import { useIsManager } from '../../store/store'
import { STATUS, PRIORITY } from '../../lib/constants'

function FilterDropdown({ label, icon: Icon, activeCount, items, onClear, ariaLabel }) {
  return (
    <Dropdown
      align="right"
      trigger={
        <button
          aria-label={ariaLabel || `Filtrar por ${label}`}
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

export default function TasksToolbar({ f, openSaveFilter }) {
  const isManager = useIsManager()
  const {
    filters,
    setFilters,
    toggleFilter,
    clearFilters,
    activeFilterCount,
    query
  } = f

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterDropdown
        label="Status"
        icon={CircleDot}
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
        icon={Flag}
        activeCount={filters.priority.length}
        onClear={() => setFilters((f) => ({ ...f, priority: [] }))}
        items={Object.values(PRIORITY).map((p) => ({
          label: p.label,
          active: filters.priority.includes(p.key),
          keepOpen: true,
          onClick: () => toggleFilter('priority', p.key)
        }))}
      />
      {isManager && (
        <FilterDropdown
          label="Responsável"
          icon={UserRound}
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
      )}
      <FilterDropdown
        label="Projeto"
        icon={FolderKanban}
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
        icon={Tags}
        activeCount={filters.category.length}
        onClear={() => setFilters((f) => ({ ...f, category: [] }))}
        items={f.categories.map((c) => ({
          label: c.name,
          active: filters.category.includes(c.id),
          keepOpen: true,
          onClick: () => toggleFilter('category', c.id)
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
