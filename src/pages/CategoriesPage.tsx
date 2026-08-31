import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Tags, ListTodo } from 'lucide-react'
import { useStore } from '../store/store'
import { useToast } from '../store/toast'
import { STATUS } from '../lib/constants'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Drawer from '../components/ui/Drawer'
import EmptyState from '../components/ui/EmptyState'
import { Input } from '../components/ui/Inputs'
import { formatDay, isOverdue } from '../lib/format'

const COLORS = ['#6366f1', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#f43f5e', '#10b981', '#64748b']

function CategoriesPage() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({ name: '', color: COLORS[0] })

  const stats = useMemo(() => {
    const m: Record<string, any> = {}
    state.categories.forEach((c: any) => {
      const tasks = state.tasks.filter((t: any) => t.categoryId === c.id)
      const byStatus: Record<string, number> = {}
      for (const k of Object.keys(STATUS)) { byStatus[k] = tasks.filter((t: any) => t.status === k).length }
      (m as any)[c.id] = { total: tasks.length, byStatus, pct: tasks.length ? Math.round(((byStatus as any).done / tasks.length) * 100) : 0 }
    })
    return m
  }, [state.categories, state.tasks])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {state.categories.length} categorias · organize e filtre suas tarefas
        </p>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Nova categoria
        </Button>
      </div>

      {state.categories.length === 0 ? (
        <div className="card-base">
          <EmptyState icon={Tags} title="Nenhuma categoria" description="Crie categorias para organizar melhor as suas tarefas." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {state.categories.map((c: any) => {
            const s = (stats as any)[c.id]
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="card-base group p-5 text-left transition hover:-translate-y-0.5 hover:shadow-popover"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${c.color}1f` }}>
                    <Tags size={20} style={{ color: c.color }} />
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <ListTodo size={12} /> {s.total}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                  {c.name}
                </h3>
                <div className="mt-4 space-y-1.5">
                  {Object.values(STATUS).map((st: any) =>
                    s.byStatus[st.key] > 0 ? (
                      <div key={st.key} className="flex items-center gap-2 text-xs">
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        <span className="flex-1 text-slate-500 dark:text-slate-400">{st.label}</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{s.byStatus[st.key]}</span>
                      </div>
                    ) : null
                  )}
                  {s.total === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">Sem tarefas nesta categoria</p>
                  )}
                </div>
                <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] font-semibold text-brand-600 opacity-0 transition group-hover:opacity-100 dark:border-slate-800 dark:text-brand-400">
                  Ver tarefas →
                </p>
              </button>
            )
          })}
        </div>
      )}

      <Drawer
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={state.categories.find((c: any) => c.id === selectedId)?.name}
        subtitle={`${stats[(selectedId || "") as string]?.total || 0} tarefas nesta categoria`}
        width="max-w-xl"
        footer={
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedId(null)
              navigate(`/tarefas?category=${selectedId}`)
            }}
          >
            Ver tarefas desta categoria
          </Button>
        }
      >
        {selectedId && (() => {
          const cat = state.categories.find((c: any) => c.id === selectedId)
          const catTasks = state.tasks
            .filter((t: any) => t.categoryId === selectedId)
            .sort((a, b) => {
              if (!a.dueDate) return 1
              if (!b.dueDate) return -1
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            })
          return (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${cat?.color}1f` }}>
                  <Tags size={22} style={{ color: cat?.color }} />
                </span>
                <div className="grid flex-1 grid-cols-3 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                    <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{stats[selectedId]?.total || 0}</p>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Tarefas</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                    <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{stats[selectedId]?.byStatus?.done || 0}</p>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Concluídas</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                    <p className="text-lg font-extrabold text-red-600 dark:text-red-400">{catTasks.filter((t: any) => isOverdue(t.dueDate, t.status)).length}</p>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Atrasadas</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Tarefas ({catTasks.length})
                </p>
                {catTasks.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
                    Nenhuma tarefa nesta categoria ainda.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {catTasks.map((t: any) => (
                      <li key={t.id}>
                        <button
                          onClick={() => {
                            setSelectedId(null)
                            navigate(`/tarefas?task=${t.id}`)
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: isOverdue(t.dueDate, t.status) ? '#ef4444' : '#94a3b8' }} />
                          <span className="flex-1 truncate font-medium text-slate-700 dark:text-slate-200">{t.title}</span>
                          <span className="text-xs font-semibold text-slate-400">{t.status === 'done' ? '✓' : t.dueDate ? formatDay(t.dueDate) : ''}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })()}
      </Drawer>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nova categoria"
        description="Crie uma categoria para agrupar tarefas parecidas."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!form.name.trim()) {
                  toast.error('Informe o nome da categoria')
                  return
                }
                dispatch({ type: 'CREATE_CATEGORY', name: form.name.trim(), color: form.color })
                toast.success(`Categoria "${form.name.trim()}" criada`)
                setCreateOpen(false)
                setForm({ name: '', color: COLORS[0] })
              }}
            >
              Criar categoria
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nome" placeholder="Ex.: Casa, Estudos, Finanças" value={form.name} onChange={(e: any) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
          <div>
            <label className="label-base">Cor</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {COLORS.map((c: string) => (
                <button
                  key={c}
                  onClick={() => setForm((f: any) => ({ ...f, color: c }))}
                  className={`h-7 w-7 rounded-full transition ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default React.memo(CategoriesPage)
