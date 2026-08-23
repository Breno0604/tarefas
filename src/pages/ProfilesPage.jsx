import React, { useMemo, useState } from 'react'
import {
  Shield,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Zap,
  Lock,
  Crown,
  User,
  Layers
} from 'lucide-react'
import { useStore } from '../store/store'
import { useToast } from '../store/toast'
import { ACCESS_LEVELS, ACCESS_LEVEL_ORDER, ACCESS_TYPES } from '../lib/constants'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Avatar } from '../components/ui/Badge'
import { Input, Select, Switch, Textarea } from '../components/ui/Inputs'
import EmptyState from '../components/ui/EmptyState'
import { formatDate } from '../lib/format'

const LEVEL_DEFAULTS = {
  admin: Object.keys(ACCESS_TYPES),
  manager: [
    'view_tasks',
    'create_tasks',
    'edit_tasks',
    'delete_tasks',
    'assign_tasks',
    'manage_projects',
    'manage_team',
    'view_settings'
  ],
  member: ['view_tasks', 'create_tasks', 'edit_tasks', 'assign_tasks'],
  viewer: ['view_tasks']
}

const LEVEL_ICON = {
  admin: Crown,
  manager: Layers,
  member: User,
  viewer: Lock
}

export default function ProfilesPage() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const active = state.profiles.find((p) => p.id === state.currentProfileId)

  const [detailId, setDetailId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    level: 'member',
    permissions: LEVEL_DEFAULTS.member
  })

  const detail = detailId ? state.profiles.find((p) => p.id === detailId) : null
  const deleteTarget = confirmDelete
    ? state.profiles.find((p) => p.id === confirmDelete)
    : null

  const openCreate = () => {
    setForm({
      name: '',
      description: '',
      level: 'member',
      permissions: LEVEL_DEFAULTS.member
    })
    setCreateOpen(true)
  }

  const openEdit = (profile) => {
    setForm({
      name: profile.name,
      description: profile.description,
      level: profile.level,
      permissions: profile.permissions
    })
    setEditing(profile)
  }

  const togglePerm = (key) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key]
    }))
  }

  const setLevel = (level) => {
    setForm((f) => ({
      ...f,
      level,
      permissions: LEVEL_DEFAULTS[level] ? [...LEVEL_DEFAULTS[level]] : f.permissions
    }))
  }

  const applyDefaults = () => {
    setForm((f) => ({
      ...f,
      permissions: LEVEL_DEFAULTS[f.level] ? [...LEVEL_DEFAULTS[f.level]] : f.permissions
    }))
    toast.info(`Permissões padrão de "${ACCESS_LEVELS[form.level].label}" aplicadas`)
  }

  const saveProfile = () => {
    if (!form.name.trim()) {
      toast.error('Informe um nome para o perfil')
      return
    }
    if (editing) {
      dispatch({
        type: 'UPDATE_ACCESS_PROFILE',
        profileId: editing.id,
        patch: {
          name: form.name.trim(),
          description: form.description.trim(),
          level: form.level,
          permissions: form.permissions
        }
      })
      toast.success(`Perfil "${form.name.trim()}" atualizado`)
    } else {
      dispatch({
        type: 'CREATE_PROFILE',
        name: form.name.trim(),
        description: form.description.trim(),
        level: form.level,
        permissions: form.permissions
      })
      toast.success(`Perfil "${form.name.trim()}" criado`)
    }
    setEditing(null)
    setCreateOpen(false)
  }

  const activateProfile = (profile) => {
    dispatch({ type: 'SET_CURRENT_PROFILE', profileId: profile.id })
    toast.success(`Perfil ativo: ${profile.name}`)
  }

  const confirmDeleteProfile = () => {
    if (!deleteTarget) return
    if (active?.id === deleteTarget.id) {
      toast.error('O perfil ativo não pode ser excluído')
      setConfirmDelete(null)
      return
    }
    dispatch({ type: 'DELETE_PROFILE', profileId: deleteTarget.id })
    toast.success(`Perfil "${deleteTarget.name}" excluído`)
    setConfirmDelete(null)
    if (detailId === deleteTarget.id) setDetailId(null)
  }

  const summary = useMemo(() => {
    const total = state.profiles.length
    const byLevel = {}
    ACCESS_LEVEL_ORDER.forEach((lv) => {
      byLevel[lv] = state.profiles.filter((p) => p.level === lv).length
    })
    return { total, byLevel }
  }, [state.profiles])

  const PermissionList = ({ permissions, max = 5 }) => {
    const shown = permissions.slice(0, max)
    const rest = permissions.length - shown.length
    return (
      <div className="flex flex-wrap gap-1.5">
        {shown.map((p) => (
          <span
            key={p}
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            <ShieldCheck size={11} className="text-brand-500" />
            {ACCESS_TYPES[p]?.label}
          </span>
        ))}
        {rest > 0 && (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            +{rest}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {summary.total} perfis ·{' '}
            {ACCESS_LEVEL_ORDER.map(
              (lv, i) =>
                `${ACCESS_LEVELS[lv].label.toLowerCase()}: ${summary.byLevel[lv]}${
                  i < ACCESS_LEVEL_ORDER.length - 1 ? ' · ' : ''
                }`
            ).join('')}
          </p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          Novo perfil
        </Button>
      </div>

      {state.profiles.length === 0 ? (
        <div className="card-base">
          <EmptyState
            icon={Shield}
            title="Nenhum perfil de acesso"
            description="Crie perfis para controlar quais funcionalidades cada membro pode acessar."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {state.profiles.map((profile) => {
            const level = ACCESS_LEVELS[profile.level]
            const LevelIcon = LEVEL_ICON[profile.level]
            const creator = state.users.find((u) => u.id === profile.createdBy)
            const isActive = active?.id === profile.id
            return (
              <div
                key={profile.id}
                className={`card-base flex flex-col overflow-hidden transition ${
                  isActive ? 'ring-2 ring-brand-500' : 'hover:-translate-y-0.5 hover:shadow-popover'
                }`}
              >
                <div className="flex items-start justify-between p-5 pb-3">
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ backgroundColor: profile.color }}
                  >
                    <Shield size={20} />
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                        <Zap size={11} /> Ativo
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${level.badge}`}>
                      <LevelIcon size={11} />
                      {level.label}
                    </span>
                  </div>
                </div>

                <div className="px-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{profile.name}</h3>
                  <p className="mt-1 line-clamp-2 min-h-[32px] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {profile.description}
                  </p>
                </div>

                <div className="mt-3 px-5">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Acessos ({profile.permissions.length})
                  </p>
                  <PermissionList permissions={profile.permissions} />
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
                  <Avatar user={creator} size="xs" />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-slate-400 dark:text-slate-500">
                    Criado por {creator?.name} · {formatDate(profile.createdAt)}
                  </span>
                  <Button variant="ghost" icon={Pencil} size="sm" onClick={() => openEdit(profile)} aria-label="Editar perfil" />
                  <Button variant="ghost" icon={Trash2} size="sm" onClick={() => setConfirmDelete(profile.id)} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10" aria-label="Excluir perfil" />
                </div>

                <div className="flex items-center gap-2 px-5 pb-4">
                  {!isActive && (
                    <Button variant="secondary" size="sm" icon={Zap} className="flex-1" onClick={() => activateProfile(profile)}>
                      Usar perfil
                    </Button>
                  )}
                  <Button size="sm" variant={isActive ? 'primary' : 'outline'} className="flex-1" onClick={() => setDetailId(profile.id)}>
                    Ver permissões
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={createOpen || Boolean(editing)}
        onClose={() => {
          setCreateOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Editar perfil de acesso' : 'Novo perfil de acesso'}
        description="Defina o nome, nível e os tipos de acesso do perfil."
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCreateOpen(false)
                setEditing(null)
              }}
            >
              Cancelar
            </Button>
            <Button icon={ShieldCheck} onClick={saveProfile}>
              {editing ? 'Salvar alterações' : 'Criar perfil'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome do perfil"
            placeholder="Ex.: Analista Financeiro"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoFocus
          />
          <Textarea
            label="Descrição"
            placeholder="Descreva o propósito deste perfil de acesso..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Select
            label="Nível de acesso"
            value={form.level}
            onChange={(e) => setLevel(e.target.value)}
            options={ACCESS_LEVEL_ORDER.map((lv) => ({
              value: lv,
              label: ACCESS_LEVELS[lv].label
            }))}
            hint={
              form.level === 'admin'
                ? 'Administrador recebe acesso total a todas as permissões.'
                : `Sugerimos ${LEVEL_DEFAULTS[form.level].length} permissões padrão para este nível — ajuste abaixo.`
            }
          />
          <div>
            <label className="label-base">Tipos de acesso (permissões)</label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.values(ACCESS_TYPES).map((perm) => (
                <label
                  key={perm.key}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition ${
                    form.permissions.includes(perm.key)
                      ? 'border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/10'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600 focus:ring-brand-500"
                    checked={form.permissions.includes(perm.key)}
                    onChange={() => togglePerm(perm.key)}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {perm.label}
                    </span>
                    <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                      {perm.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title={detail?.name}
        description={detail ? `${ACCESS_LEVELS[detail.level].label} · criado por ${state.users.find((u) => u.id === detail.createdBy)?.name}` : ''}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              icon={Trash2}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              onClick={() => setConfirmDelete(detail.id)}
            >
              Excluir
            </Button>
            <span className="flex-1" />
            <Button variant="secondary" onClick={() => setDetailId(null)}>
              Fechar
            </Button>
            <Button
              icon={Zap}
              onClick={() => {
                activateProfile(detail)
                setDetailId(null)
              }}
            >
              Usar este perfil
            </Button>
          </>
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: detail.color }}
              >
                <Shield size={18} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{detail.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{detail.description}</p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${ACCESS_LEVELS[detail.level].badge}`}>
                {ACCESS_LEVELS[detail.level].label}
              </span>
            </div>

            <div>
              <label className="label-base">Nível de acesso</label>
              <Select
                value={detail.level}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_ACCESS_PROFILE',
                    profileId: detail.id,
                    patch: { level: e.target.value }
                  })
                }
                options={ACCESS_LEVEL_ORDER.map((lv) => ({
                  value: lv,
                  label: ACCESS_LEVELS[lv].label
                }))}
              />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Tipos de acesso — associe ou remova permissões
              </p>
              <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
                {Object.values(ACCESS_TYPES).map((perm) => {
                  const enabled = detail.permissions.includes(perm.key)
                  return (
                    <div key={perm.key} className="py-2.5">
                      <Switch
                        label={perm.label}
                        description={perm.description}
                        checked={enabled}
                        onChange={(v) =>
                          dispatch({
                            type: 'UPDATE_ACCESS_PROFILE',
                            profileId: detail.id,
                            patch: {
                              permissions: v
                                ? [...detail.permissions, perm.key]
                                : detail.permissions.filter((p) => p !== perm.key)
                            }
                          })
                        }
                      />
                    </div>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                {detail.permissions.length} de {Object.keys(ACCESS_TYPES).length} permissões associadas
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteProfile}
        title="Excluir perfil de acesso"
        message={
          deleteTarget
            ? `Tem certeza que deseja excluir o perfil "${deleteTarget.name}"?${
                active?.id === deleteTarget.id
                  ? ' Este é o perfil ativo e não pode ser excluído.'
                  : ''
              }`
            : ''
        }
        confirmLabel="Excluir perfil"
      />
    </div>
  )
}
