import React, { useMemo, useState, useEffect } from 'react'
import { UserPlus, Mail, CheckCircle2, Clock3, AlertTriangle, Layers, UserMinus } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/store'
import { useToast } from '../store/toast'
import { Avatar, AvatarStack } from '../components/ui/Badge'
import { ROLE_BADGE } from '../lib/constants'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Drawer from '../components/ui/Drawer'
import ProgressBar from '../components/ui/ProgressBar'
import Tooltip from '../components/ui/Tooltip'
import { isOverdue } from '../lib/format'

function MemberCard({ user, stats, onOpen }) {
  const load = Math.min(100, Math.round((stats.open * 10 + stats.hours) * 1.2))
  const level = load > 80 ? 'Alta' : load > 50 ? 'Média' : 'Equilibrada'
  const levelColor = load > 80 ? 'text-red-600' : load > 50 ? 'text-amber-600' : 'text-emerald-600'
  return (
    <button
      onClick={onOpen}
      className="card-base group p-5 text-left transition hover:-translate-y-0.5 hover:shadow-popover"
    >
      <div className="flex items-start justify-between">
        <Avatar user={user} size="lg" showStatus />
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ROLE_BADGE[user.role] || ROLE_BADGE['Desenvolvedor Frontend']}`}>
          {user.role}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
        {user.name}
      </h3>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <Mail size={12} /> {user.email}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-slate-50 px-2 py-2 text-center dark:bg-slate-800/60">
          <p className="flex items-center justify-center gap-1 text-sm font-extrabold text-slate-800 dark:text-slate-100">
            <Clock3 size={13} className="text-sky-500" />
            {stats.open}
          </p>
          <p className="text-[10px] font-semibold text-slate-400">Abertas</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-2 text-center dark:bg-slate-800/60">
          <p className="flex items-center justify-center gap-1 text-sm font-extrabold text-slate-800 dark:text-slate-100">
            <CheckCircle2 size={13} className="text-emerald-500" />
            {stats.done}
          </p>
          <p className="text-[10px] font-semibold text-slate-400">Concluídas</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-2 text-center dark:bg-slate-800/60">
          <p className="flex items-center justify-center gap-1 text-sm font-extrabold text-red-600 dark:text-red-400">
            <AlertTriangle size={13} />
            {stats.overdue}
          </p>
          <p className="text-[10px] font-semibold text-slate-400">Atrasadas</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Carga de trabalho</span>
          <span className={`font-bold ${levelColor}`}>{level}</span>
        </div>
        <ProgressBar value={load} className="mt-1.5" />
        <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          {stats.hours}h estimadas em aberto
        </p>
      </div>
    </button>
  )
}

export default function TeamPage() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [invite, setInvite] = useState({ name: '', email: '', role: 'Desenvolvedor Frontend' })
  const [reassignTo, setReassignTo] = useState('')

  const activeUsers = state.users.filter((u) => u.active !== false)

  const userParam = searchParams.get('user')

  useEffect(() => {
    if (userParam && state.users.some((u) => u.id === userParam)) {
      setSelected(userParam)
    }
  }, [userParam, state.users])

  const stats = useMemo(() => {
    const map = {}
    state.users.forEach((u) => {
      const userTasks = state.tasks.filter((t) => t.assigneeId === u.id)
      map[u.id] = {
        open: userTasks.filter((t) => t.status !== 'done').length,
        done: userTasks.filter((t) => t.status === 'done').length,
        overdue: userTasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
        hours: userTasks
          .filter((t) => t.status !== 'done')
          .reduce((acc, t) => acc + (t.estimatedHours || 0), 0)
      }
    })
    return map
  }, [state.users, state.tasks])

  const selectedMember = selected ? state.users.find((u) => u.id === selected) : null
  const selectedTasks = selected
    ? state.tasks
        .filter((t) => t.assigneeId === selected)
        .sort((a, b) => {
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate) - new Date(b.dueDate)
        })
    : []

  const teamLoad = useMemo(() => {
    const open = state.tasks.filter((t) => t.status !== 'done').length
    const done = state.tasks.filter((t) => t.status === 'done').length
    return { open, done, total: state.tasks.length }
  }, [state.tasks])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {activeUsers.length} membros · {teamLoad.open} tarefas em aberto ·{' '}
            {Math.round((teamLoad.done / Math.max(1, teamLoad.total)) * 100)}% concluído
          </p>
        </div>
        <Button icon={UserPlus} onClick={() => setInviteOpen(true)}>
          Convidar membro
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {activeUsers.map((u) => (
          <MemberCard key={u.id} user={u} stats={stats[u.id]} onOpen={() => setSelected(u.id)} />
        ))}
      </div>

      <div className="card-base flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <Layers size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Distribuição da equipe</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Veja como as tarefas estão distribuídas entre os membros
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AvatarStack users={state.users} max={8} />
          <Tooltip content="Ver carga no dashboard">
            <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
              Ver dashboard
            </Button>
          </Tooltip>
        </div>
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Convidar novo membro"
        description="O novo membro será adicionado à equipe (dados fictícios — sem envio de e-mail)."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const name = invite.name.trim()
                if (!name) {
                  toast.error('Informe o nome do novo membro.')
                  return
                }
                dispatch({ type: 'ADD_USER', name, email: invite.email.trim(), role: invite.role })
                toast.success(`${name} adicionado(a) à equipe`)
                setInviteOpen(false)
                setInvite({ name: '', email: '', role: 'Desenvolvedor Frontend' })
              }}
            >
              Adicionar membro
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-base">Nome</label>
            <input
              className="input-base"
              placeholder="Nome completo"
              value={invite.name}
              onChange={(e) => setInvite((v) => ({ ...v, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-base">E-mail</label>
            <input
              className="input-base"
              type="email"
              placeholder="nome@empresa.com"
              value={invite.email}
              onChange={(e) => setInvite((v) => ({ ...v, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-base">Cargo</label>
            <select
              className="input-base"
              value={invite.role}
              onChange={(e) => setInvite((v) => ({ ...v, role: e.target.value }))}
            >
              {['Gerente de Projetos', 'Desenvolvedor Frontend', 'Desenvolvedora Backend', 'Desenvolvedor Fullstack', 'Designer UX/UI', 'Analista de QA', 'Product Owner', 'DevOps Engineer'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Drawer
        open={Boolean(selectedMember)}
        onClose={() => setSelected(null)}
        title={selectedMember?.name}
        subtitle={`${selectedMember?.role} · ${selectedMember?.email}`}
        width="max-w-xl"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Fechar
          </Button>
        }
      >
        {selectedMember && (
          <div>
            <div className="flex items-center gap-4">
              <Avatar user={selectedMember} size="lg" showStatus />
              <div className="grid flex-1 grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{stats[selectedMember.id].open}</p>
                  <p className="text-[11px] font-semibold text-slate-400">Tarefas abertas</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{stats[selectedMember.id].done}</p>
                  <p className="text-[11px] font-semibold text-slate-400">Concluídas</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                  <p className="text-lg font-extrabold text-red-600 dark:text-red-400">{stats[selectedMember.id].overdue}</p>
                  <p className="text-[11px] font-semibold text-slate-400">Atrasadas</p>
                </div>
              </div>
            </div>

            <h4 className="mt-6 mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Tarefas de {selectedMember.name.split(' ')[0]} ({selectedTasks.length})
            </h4>
            <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
              {selectedTasks.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">Nenhuma tarefa atribuída.</p>
              ) : (
                selectedTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelected(null)
                      navigate(`/tarefas?task=${t.id}`)
                    }}
                    className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left transition last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: isOverdue(t.dueDate, t.status) ? '#ef4444' : '#94a3b8' }} />
                    <span className="flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">{t.title}</span>
                    <span className="text-xs text-slate-400">{t.status === 'done' ? 'Concluída' : t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
                  </button>
                ))
              )}
            </div>

            <div className="mt-6 rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-500/25 dark:bg-red-500/5">
              <h4 className="mb-1 flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-300">
                <UserMinus size={16} />
                Inativar membro
              </h4>
              <p className="mb-3 text-xs text-red-600/80 dark:text-red-400/80">
                Remove {selectedMember.name.split(' ')[0]} da equipe. As tarefas abertas atribuídas a{' '}
                {selectedMember.name.split(' ')[0]} serão transferidas para o responsável escolhido
                abaixo (ou removidas, se "Nenhum").
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  className="input-base flex-1"
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                >
                  <option value="">Nenhum (remover tarefas abertas)</option>
                  {activeUsers
                    .filter((u) => u.id !== selectedMember.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
                <Button
                  variant="danger"
                  icon={UserMinus}
                  onClick={() => {
                    dispatch({
                      type: 'DEACTIVATE_USER',
                      userId: selectedMember.id,
                      reassignTo: reassignTo || null
                    })
                    toast.success(
                      `${selectedMember.name.split(' ')[0]} inativado(a). Tarefas ${
                        reassignTo
                          ? `transferidas para ${activeUsers.find((u) => u.id === reassignTo)?.name}`
                          : 'removidas'
                      }.`
                    )
                    setSelected(null)
                    setReassignTo('')
                  }}
                >
                  Inativar membro
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
