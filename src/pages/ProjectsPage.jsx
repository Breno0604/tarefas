import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, CalendarClock, ListTodo, FolderKanban, TrendingUp, AlertTriangle, XCircle } from 'lucide-react'
import { useStore } from '../store/store'
import { useToast } from '../store/toast'
import { AvatarStack } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Drawer from '../components/ui/Drawer'
import ProgressBar from '../components/ui/ProgressBar'
import EmptyState from '../components/ui/EmptyState'
import { Input } from '../components/ui/Inputs'
import { formatDay, isOverdue } from '../lib/format'

const COLORS = ['#6366f1', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#f43f5e', '#10b981']

function ProjectCard({ project, stats, usersById, onOpen }) {
  const health = stats.overdue > 0 ? 'Atrasado' : stats.pct < 40 && stats.dueSoon ? 'Em risco' : 'No prazo'
  const healthStyle =
    health === 'Atrasado'
      ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
      : health === 'Em risco'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
  const healthIcon = health === 'Atrasado' ? XCircle : health === 'Em risco' ? AlertTriangle : TrendingUp
  const Icon = healthIcon
  return (
    <button
      onClick={onOpen}
      className="card-base group flex flex-col p-5 text-left transition hover:-translate-y-0.5 hover:shadow-popover"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${project.color}1f` }}>
          <FolderKanban size={20} style={{ color: project.color }} />
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${healthStyle}`}>
          <Icon size={12} />
          {health}
        </span>
      </div>

      <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
        {project.name}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {project.description}
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Progresso</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">{stats.pct}%</span>
        </div>
        <ProgressBar value={stats.pct} color={project.color} className="mt-1.5" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <ListTodo size={13} /> {stats.total}
          </span>
          <span className="flex items-center gap-1">
            <CalendarClock size={13} /> {project.due ? formatDay(project.due) : '—'}
          </span>
        </div>
        <AvatarStack users={project.members.map((id) => usersById[id]).filter(Boolean)} max={3} size="sm" />
      </div>
    </button>
  )
}

export default function ProjectsPage() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0], due: '' })

  const projParam = searchParams.get('proj')

  useEffect(() => {
    if (projParam && state.projects.some((p) => p.id === projParam)) {
      setSelectedId(projParam)
    }
  }, [projParam, state.projects])

  const usersById = useMemo(() => {
    const m = {}
    state.users.forEach((u) => (m[u.id] = u))
    return m
  }, [state.users])

  const stats = useMemo(() => {
    const m = {}
    state.projects.forEach((p) => {
      const tasks = state.tasks.filter((t) => t.projectId === p.id)
      const done = tasks.filter((t) => t.status === 'done').length
      const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length
      const dueSoon = p.due && new Date(p.due).getTime() - Date.now() < 7 * 86400000
      m[p.id] = {
        total: tasks.length,
        done,
        overdue,
        dueSoon,
        pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0
      }
    })
    return m
  }, [state.projects, state.tasks])

  const selectedProject = selectedId ? state.projects.find((p) => p.id === selectedId) : null
  const selectedTasks = selectedId
    ? state.tasks.filter((t) => t.projectId === selectedId)
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {state.projects.length} projetos ativos
        </p>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Novo projeto
        </Button>
      </div>

      {state.projects.length === 0 ? (
        <div className="card-base">
          <EmptyState icon={FolderKanban} title="Nenhum projeto" description="Crie seu primeiro projeto para organizar as tarefas." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {state.projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              stats={stats[p.id]}
              onOpen={() => setSelectedId(p.id)}
              usersById={usersById}
            />
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Novo projeto"
        description="Crie um projeto para agrupar tarefas relacionadas."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!form.name.trim()) {
                  toast.error('Informe o nome do projeto')
                  return
                }
                dispatch({
                  type: 'CREATE_PROJECT',
                  name: form.name.trim(),
                  description: form.description.trim(),
                  color: form.color,
                  due: form.due || null
                })
                toast.success(`Projeto "${form.name.trim()}" criado`)
                setCreateOpen(false)
                setForm({ name: '', description: '', color: COLORS[0], due: '' })
              }}
            >
              Criar projeto
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nome do projeto" placeholder="Ex.: Aplicativo de Delivery" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Descrição" placeholder="Resumo do objetivo do projeto" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Cor</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`h-7 w-7 rounded-full transition ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="label-base">Prazo</label>
              <Input type="date" value={form.due} onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>

      <Drawer
        open={Boolean(selectedProject)}
        onClose={() => setSelectedId(null)}
        title={selectedProject?.name}
        subtitle={selectedProject?.description}
        width="max-w-xl"
        footer={
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedId(null)
              navigate(`/tarefas?project=${selectedProject.id}`)
            }}
          >
            Ver tarefas deste projeto
          </Button>
        }
      >
        {selectedProject && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${selectedProject.color}1f` }}>
                <FolderKanban size={22} style={{ color: selectedProject.color }} />
              </span>
              <div className="grid flex-1 grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{stats[selectedProject.id].total}</p>
                  <p className="text-[11px] font-semibold text-slate-400">Tarefas</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                  <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{stats[selectedProject.id].done}</p>
                  <p className="text-[11px] font-semibold text-slate-400">Concluídas</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                  <p className="text-lg font-extrabold text-red-600 dark:text-red-400">{stats[selectedProject.id].overdue}</p>
                  <p className="text-[11px] font-semibold text-slate-400">Atrasadas</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Progresso</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{stats[selectedProject.id].pct}%</span>
              </div>
              <ProgressBar value={stats[selectedProject.id].pct} color={selectedProject.color} className="mt-2" />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Membros ({selectedProject.members.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedProject.members.map((id) => {
                  const u = usersById[id]
                  return (
                    <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      <span className="h-5 w-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: u?.color }}>
                        {u?.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      {u?.name}
                    </span>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Tarefas ({selectedTasks.length})
              </p>
              {selectedTasks.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
                  Nenhuma tarefa neste projeto ainda.
                </p>
              ) : (
                <ul className="space-y-1">
                  {selectedTasks.map((t) => (
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
        )}
      </Drawer>
    </div>
  )
}
