import React from 'react'
import {
  FilterX,
  CircleDot,
  Flag,
  FolderKanban,
  Tags,
  Hash
} from 'lucide-react'
import Dropdown from '../ui/Dropdown'
import Button from '../ui/Button'
import { STATUS, PRIORITY } from '../../lib/constants'

function FilterDropdown({ label, icon: Icon, activeCount, items, onClear, ariaLabel }: any) {
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

export default function TasksToolbar({ f }: any) {
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
        onClear={() => setFilters((f: any) => ({ ...f, status: [] }))}
        items={[
          ...Object.values(STATUS).map((s: any) => ({
            label: s.label,
            active: filters.status.includes(s.key),
            keepOpen: true,
            onClick: () => toggleFilter('status', s.key)
          })),
          { type: 'divider' },
          {
            label: 'Arquivada',
            active: filters.status.includes('archived'),
            keepOpen: true,
            onClick: () => toggleFilter('status', 'archived')
          }
        ]}
      />
      <FilterDropdown
        label="Prioridade"
        icon={Flag}
        activeCount={filters.priority.length}
        onClear={() => setFilters((f: any) => ({ ...f, priority: [] }))}
        items={Object.values(PRIORITY).map((p: any) => ({
          label: p.label,
          active: filters.priority.includes(p.key),
          keepOpen: true,
          onClick: () => toggleFilter('priority', p.key)
        }))}
      />
      <FilterDropdown
        label="Projeto"
        icon={FolderKanban}
        activeCount={filters.project.length}
        onClear={() => setFilters((f: any) => ({ ...f, project: [] }))}
        items={[
          ...f.projects.map((p: any) => ({
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
      {(f.tags || []).length > 0 && (
        <FilterDropdown
          label="Tag"
          icon={Hash}
          activeCount={(filters.tags || []).length}
          onClear={() => setFilters((f: any) => ({ ...f, tags: [] }))}
          items={f.tags.map((tag: any) => ({
            label: `#${tag}`,
            active: (filters.tags || []).includes(tag),
            keepOpen: true,
            onClick: () => toggleFilter('tags', tag)
          }))}
        />
      )}

      {(activeFilterCount > 0 || query) && (
        <Button variant="ghost" size="md" icon={FilterX} onClick={clearFilters}>
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
