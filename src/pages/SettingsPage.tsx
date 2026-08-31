import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { User, SlidersHorizontal, Palette, Bell, Database, Save, RotateCcw, Sun, Moon, Keyboard, Download, Upload, LogOut } from 'lucide-react'
import { useStore, useMe } from '../store/store'
import { useToast } from '../store/toast'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Input, Switch, Textarea } from '../components/ui/Inputs'

const TABS = [
  { key: 'profile', label: 'Perfil', icon: User },
  { key: 'preferences', label: 'Preferências', icon: SlidersHorizontal },
  { key: 'appearance', label: 'Aparência', icon: Palette },
  { key: 'shortcuts', label: 'Atalhos', icon: Keyboard },
  { key: 'reminders', label: 'Lembretes', icon: Bell },
  { key: 'general', label: 'Dados', icon: Database }
]

const VALID_TABS = TABS.map((t: any) => t.key)

export default function SettingsPage() {
  const { state, dispatch } = useStore()
  const me = useMe()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [tab, setTab] = useState(tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'profile')
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) setTab(tabParam)
  }, [tabParam])

  const [profile, setProfile] = useState({
    name: me?.name || '',
    bio: me?.bio || ''
  })

  const prefs = state.prefs || {
    soundAlerts: false,
    compactMode: false
  }

  const notifPrefs = state.notifPrefs || {
    dueDates: true
  }

  const [appearanceState, setAppearanceState] = useState(
    state.appearance || {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      firstDay: localStorage.getItem('taskflow-first-day') || 'sunday'
    }
  )

  const saveProfile = () => {
    dispatch({
      type: 'UPDATE_ME',
      patch: { name: profile.name.trim() || 'Você', bio: profile.bio }
    })
    toast.success('Perfil atualizado com sucesso')
  }

  const saveAppearance = () => {
    dispatch({ type: 'UPDATE_APPEARANCE', appearance: appearanceState })
    localStorage.setItem('taskflow-first-day', appearanceState.firstDay)
    toast.success('Configurações salvas')
  }

  const exportData = () => {
    try {
      const data = JSON.stringify({ ...state, __exportedAt: new Date().toISOString() }, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Backup exportado')
    } catch {
      toast.error('Não foi possível exportar os dados')
    }
  }

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const importData = (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev: any) => {
      try {
        const data = JSON.parse(ev.target.result)
        // Validate structure
        if (!data || typeof data !== 'object') throw new Error('Formato inválido')
        if (!Array.isArray(data.tasks)) throw new Error('Arquivo não contém tarefas')
        if (!Array.isArray(data.projects)) throw new Error('Arquivo não contém projetos')
        if (!data.me || typeof data.me !== 'object') throw new Error('Arquivo não contém dados de perfil')
        if (data.notes !== undefined && (typeof data.notes !== 'object' || Array.isArray(data.notes))) {
          throw new Error('Notas inválidas no arquivo')
        }
        // Replace the whole state at once, preserving ids, notes, progress,
        // activities, reminders, trash and references between entities.
        dispatch({ type: 'IMPORT_DATA', data })
        toast.success(`Backup importado: ${data.tasks.length} tarefas, ${data.projects.length} projetos`)
      } catch (err) {
        toast.error(`Erro ao importar: ${(err as any).message || 'Formato inválido'}`)
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const SectionCard = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
    <div className="card-base p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {children}
    </div>
  )

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="card-base mb-4 flex items-center gap-3 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {(profile.name || 'V').trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{me?.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">Uso pessoal</p>
          </div>
        </div>
        <nav className="card-base space-y-0.5 p-2">
          {TABS.map((t: any) => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key)
                  setSearchParams({ tab: t.key }, { replace: true })
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="space-y-5">
        {tab === 'profile' && (
          <SectionCard title="Seu perfil" description="Apenas o seu nome e uma descrição pessoal — este é um app de uso individual.">
            <div className="space-y-4">
              <Input
                label="Como quer ser chamado(a)"
                value={profile.name}
                onChange={(e: any) => setProfile((p: any) => ({ ...p, name: e.target.value }))}
              />
              <Textarea label="Sobre você (opcional)" value={profile.bio} onChange={(e: any) => setProfile((p: any) => ({ ...p, bio: e.target.value }))} />
              <div className="flex justify-end">
                <Button icon={Save} onClick={saveProfile}>Salvar alterações</Button>
              </div>
            </div>
          </SectionCard>
        )}

        {tab === 'preferences' && (
          <SectionCard title="Preferências" description="Personalize como o sistema se comporta para você.">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="py-3.5">
                <Switch
                  label="Sons de notificação"
                  description="Reproduz um som ao receber novos lembretes."
                  checked={prefs.soundAlerts}
                  onChange={(v: boolean) => dispatch({ type: 'UPDATE_PREFS', prefs: { soundAlerts: v } })}
                />
              </div>
              <div className="py-3.5">
                <Switch
                  label="Modo compacto"
                  description="Reduz espaçamentos e densifica as listas de tarefas."
                  checked={prefs.compactMode}
                  onChange={(v: boolean) => dispatch({ type: 'UPDATE_PREFS', prefs: { compactMode: v } })}
                />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">As alterações são salvas automaticamente.</p>
          </SectionCard>
        )}

        {tab === 'appearance' && (
          <>
            <SectionCard title="Tema" description="Escolha entre os modos claro e escuro.">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => dispatch({ type: 'SET_THEME', theme: 'light' })}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${state.theme === 'light' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Sun size={18} /></span>
                  <span>
                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">Claro</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Padrão e mais legível</span>
                  </span>
                </button>
                <button
                  onClick={() => dispatch({ type: 'SET_THEME', theme: 'dark' })}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${state.theme === 'dark' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-slate-800 dark:text-brand-300"><Moon size={18} /></span>
                  <span>
                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">Escuro</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Ideal para ambientes com pouca luz</span>
                  </span>
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Início da semana" description="Defina qual dia marca o início da semana no calendário.">
              <div className="space-y-4">
                <div className="max-w-xs">
                  <select className="input-base" value={state.appearance.firstDay || "sunday"} onChange={(e) => {
                    const val = e.target.value
                    setAppearanceState((prev: any) => ({ ...prev, firstDay: val as 'sunday' | 'monday' }))
                    dispatch({ type: 'UPDATE_APPEARANCE', appearance: { firstDay: val as 'sunday' | 'monday' } })
                    localStorage.setItem('taskflow-first-day', val)
                  }}>
                    <option value="sunday">Domingo</option>
                    <option value="monday">Segunda-feira</option>
                  </select>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Salvo automaticamente.</p>
              </div>
            </SectionCard>
          </>
        )}

        {tab === 'reminders' && (
          <SectionCard title="Lembretes" description="Escolha quais prazos geram lembretes para você.">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="py-3.5">
                <Switch
                  label="Vencimentos próximos"
                  description="Avisar quando uma tarefa vencer nos próximos 3 dias."
                  checked={notifPrefs.dueDates}
                  onChange={(v: boolean) => dispatch({ type: 'UPDATE_NOTIF_PREFS', notifPrefs: { dueDates: v } })}
                />
              </div>
              <div className="py-3.5">
                <Switch
                  label="Tarefas atrasadas"
                  description="Sempre avisa quando uma tarefa passa do prazo (recomendado)."
                  checked={true}
                  disabled
                  onChange={() => {}}
                />
              </div>
            </div>
          </SectionCard>
        )}

        {tab === 'shortcuts' && (
          <SectionCard title="Atalhos de teclado" description="Navegue e gerencie tarefas mais rápido.">
            <ul className="space-y-2.5">
              {[
                ['Ctrl + K', 'Abrir a paleta de comandos'],
                ['N', 'Nova tarefa'],
                ['D', 'Alternar tema claro/escuro'],
                ['/', 'Buscar tarefas'],
                ['1 – 4', 'Alternar visão (Lista, Kanban, Tabela, Calendário)'],
                ['?', 'Mostrar estes atalhos'],
                ['T', 'Abrir Lixeira'],
                ['Esc', 'Fechar janelas abertas']
              ].map(([keys, label]) => (
                <li key={keys} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
                  <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {tab === 'general' && (
          <>
            <SectionCard title="Backup dos dados" description="Seus dados ficam apenas neste navegador — exporte um backup em JSON quando quiser.">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Exportar backup</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Baixa um arquivo JSON com todas as suas tarefas, projetos e notas.</p>
                </div>
                <Button variant="secondary" icon={Download} onClick={exportData}>Exportar</Button>
              </div>
              <div className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                Estado atual: <span className="font-semibold text-slate-600 dark:text-slate-300">{state.tasks.length} tarefas</span> ·{' '}
                <span className="font-semibold text-slate-600 dark:text-slate-300">{state.projects.length} projetos</span> ·{' '}
                <span className="font-semibold text-slate-600 dark:text-slate-300">{state.notes ? Object.keys(state.notes).length : 0} tarefas com notas</span> ·{' '}
                <span className="font-semibold text-slate-600 dark:text-slate-300">{state.activities.length} atividades</span>
              </div>
            </SectionCard>

            <SectionCard title="Importar backup" description="Restaure dados a partir de um arquivo JSON exportado anteriormente.">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Importar arquivo</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Substitui todos os dados atuais pelos dados do arquivo.</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
                <Button variant="secondary" icon={Upload} onClick={() => (fileInputRef as any).current?.click()}>Importar</Button>
              </div>
            </SectionCard>

            <SectionCard title="Restaurar dados de exemplo" description="Volta tudo ao estado inicial com as tarefas de exemplo.">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Restaurar agora</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Substitui todas as suas tarefas e projetos atuais pelos dados de exemplo.</p>
                </div>
                <Button variant="danger" icon={RotateCcw} onClick={() => setConfirmReset(true)}>Restaurar</Button>
              </div>
            </SectionCard>

            <SectionCard title="Sair / Trocar conta" description="Desconecta deste dispositivo e volta para a tela de pareamento.">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Sair da conta</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Seus dados continuam no Convex. Use o mesmo código para entrar novamente.</p>
                </div>
                <Button variant="danger" icon={LogOut} onClick={() => {
                  localStorage.removeItem('taskflow-anonymous-user-id')
                  window.location.reload()
                }}>Sair</Button>
              </div>
            </SectionCard>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          try {
            dispatch({ type: 'RESET' })
            toast.success('Dados restaurados')
          } catch (e) { console.error('Reset failed:', e) }
        }}
        title="Restaurar dados"
        message="Todos os seus dados atuais serão substituídos pelos dados iniciais. Deseja continuar?"
        confirmLabel="Restaurar"
        confirmVariant="primary"
      />
    </div>
  )
}
