import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, History, X } from 'lucide-react'
import { useStore } from '../store/store'
import ActivityFeed from '../components/ActivityFeed'
import Dropdown from '../components/ui/Dropdown'
import EmptyState from '../components/ui/EmptyState'
import { Input } from '../components/ui/Inputs'
import { formatDay } from '../lib/format'

const TYPE_LABELS = {
  create: 'Criação',
  assign: 'Atribuição',
  status: 'Status',
  priority: 'Prioridade',
  comment: 'Comentário',
  due: 'Vencimento',
  project: 'Projeto',
  category: 'Categoria',
  title: 'Título',
  delete: 'Exclusão',
  profile: 'Perfil',
  restore: 'Restauração',
  team: 'Equipe',
  approve: 'Aprovação',
  return: 'Devolução',
  cancel: 'Cancelamento'
}

export default function ActivitiesPage() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [actorId, setActorId] = useState('')

  const filtered = useMemo(() => {
    let list = state.activities
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((a) => a.text.toLowerCase().includes(q))
    if (type) list = list.filter((a) => a.type === type)
    if (actorId) list = list.filter((a) => a.actorId === actorId)
    return list
  }, [state.activities, query, type, actorId])

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach((a) => {
      const key = a.createdAt.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(a)
    })
    return Object.entries(map)
  }, [filtered])

  const clearFilters = () => {
    setQuery('')
    setType('')
    setActorId('')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar no histórico..."
            className="input-base pl-9 pr-8"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600" aria-label="Limpar busca">
              <X size={14} />
            </button>
          )}
        </div>
        <Dropdown
          align="right"
          trigger={
            <button className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition ${type ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>
              {type ? TYPE_LABELS[type] : 'Tipo'}
            </button>
          }
          items={[
            ...Object.entries(TYPE_LABELS).map(([k, label]) => ({
              label,
              active: type === k,
              onClick: () => setType(type === k ? '' : k)
            })),
            { type: 'divider' },
            { label: 'Todos os tipos', active: !type, onClick: () => setType('') }
          ]}
        />
        <Dropdown
          align="right"
          trigger={
            <button className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition ${actorId ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>
              {actorId ? state.users.find((u) => u.id === actorId)?.name : 'Membro'}
            </button>
          }
          items={[
            ...state.users.map((u) => ({
              label: u.name,
              active: actorId === u.id,
              onClick: () => setActorId(actorId === u.id ? '' : u.id)
            })),
            { type: 'divider' },
            { label: 'Todos os membros', active: !actorId, onClick: () => setActorId('') }
          ]}
        />
        {(query || type || actorId) && (
          <button onClick={clearFilters} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card-base">
          <EmptyState icon={History} title="Nenhuma atividade encontrada" description="Ajuste os filtros ou aguarde novas ações da equipe." />
        </div>
      ) : (
        <div className="card-base p-5">
          {grouped.map(([day, items]) => (
            <div key={day} className="mb-4 last:mb-0">
              <div className="mb-2 flex items-center gap-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {formatDay(day)}
                </p>
                <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
              </div>
              <ActivityFeed items={items} compact />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {filtered.length} registro(s) exibidos
        </p>
      </div>
    </div>
  )
}
