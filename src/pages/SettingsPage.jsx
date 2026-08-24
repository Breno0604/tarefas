import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { User, SlidersHorizontal, Palette, Bell, Database, Save, RotateCcw, Sun, Moon, Keyboard } from 'lucide-react'
import { useStore, useCurrentUser } from '../store/store'
import { useToast } from '../store/toast'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Avatar } from '../components/ui/Badge'
import { Input, Switch, Textarea } from '../components/ui/Inputs'

const TABS = [
  { key: 'profile', label: 'Perfil', icon: User },
  { key: 'preferences', label: 'Preferências', icon: SlidersHorizontal },
  { key: 'appearance', label: 'Aparência', icon: Palette },
  { key: 'shortcuts', label: 'Atalhos', icon: Keyboard },
  { key: 'notifications', label: 'Notificações', icon: Bell },
  { key: 'general', label: 'Geral', icon: Database }
]

const VALID_TABS = TABS.map((t) => t.key)

export default function SettingsPage() {
  const { state, dispatch } = useStore()
  const me = useCurrentUser()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [tab, setTab] = useState(tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'profile')
  const [confirmReset, setConfirmReset] = useState(false)

  const [profile, setProfile] = useState({
    name: me?.name || '',
    email: me?.email || '',
    role: me?.role || '',
    bio: me?.bio || 'Gestão de projetos e priorização do roadmap. Apaixonada por organizar times de alta performance.'
  })

  const prefs = state.prefs || {
    emailWeekly: true,
    emailMentions: true,
    soundAlerts: false,
    compactMode: false,
    autoAssign: true
  }

  const notifPrefs = state.notifPrefs || {
    assignments: true,
    mentions: true,
    dueDates: true,
    statusChanges: true,
    comments: true,
    digests: false
  }

  const appearance = state.appearance || {
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    firstDay: 'sunday'
  }

  const saveProfile = () => {
    dispatch({
      type: 'UPDATE_CURRENT_USER',
      patch: { name: profile.name, email: profile.email, role: profile.role, bio: profile.bio }
    })
    toast.success('Perfil atualizado com sucesso')
  }

  const saveAppearance = () => {
    dispatch({ type: 'UPDATE_APPEARANCE', appearance })
    localStorage.setItem('taskflow-first-day', appearance.firstDay)
    toast.success('Configurações salvas')
  }

  const SectionCard = ({ title, description, children }) => (
    <div className="card-base p-5">
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
          <Avatar user={me} size="lg" showStatus />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{me?.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{me?.role}</p>
          </div>
        </div>
        <nav className="card-base space-y-0.5 p-2">
          {TABS.map((t) => {
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
          <>
            <SectionCard title="Informações do perfil" description="Essas informações aparecem para a sua equipe.">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Nome completo" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                  <Input label="Cargo" value={profile.role} onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))} />
                </div>
                <Input label="E-mail profissional" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
                <Textarea label="Sobre você" value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} />
                <div className="flex justify-end">
                  <Button icon={Save} onClick={saveProfile}>Salvar alterações</Button>
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {tab === 'preferences' && (
          <SectionCard title="Preferências de trabalho" description="Personalize como o sistema se comporta para você.">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="py-3.5">
                <Switch
                  label="Receber resumo semanal por e-mail"
                  description="Um resumo das tarefas e prazos toda segunda-feira."
                  checked={prefs.emailWeekly}
                  onChange={(v) => dispatch({ type: 'UPDATE_PREFS', prefs: { emailWeekly: v } })}
                />
              </div>
              <div className="py-3.5">
                <Switch
                  label="Atribuir tarefas automaticamente"
                  description="Ao criar uma tarefa sem responsável, sugerir o membro com menor carga."
                  checked={prefs.autoAssign}
                  onChange={(v) => dispatch({ type: 'UPDATE_PREFS', prefs: { autoAssign: v } })}
                />
              </div>
              <div className="py-3.5">
                <Switch
                  label="Sons de notificação"
                  description="Reproduzir um som ao receber novas notificações."
                  checked={prefs.soundAlerts}
                  onChange={(v) => dispatch({ type: 'UPDATE_PREFS', prefs: { soundAlerts: v } })}
                />
              </div>
              <div className="py-3.5">
                <Switch
                  label="Modo compacto"
                  description="Reduz espaçamentos e densifica as listas de tarefas."
                  checked={prefs.compactMode}
                  onChange={(v) => {
                    dispatch({ type: 'UPDATE_PREFS', prefs: { compactMode: v } })
                    toast.info(v ? 'Modo compacto ativado (protótipo)' : 'Modo compacto desativado')
                  }}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => toast.success('Preferências salvas')}>Salvar</Button>
            </div>
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

            <SectionCard title="Idioma e região" description="Configurações locais de exibição.">
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                Protótipo: idioma e fuso são apenas visuais. O início da semana é aplicado no calendário.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label-base">Idioma</label>
                    <select className="input-base" value={appearance.language} onChange={(e) => setAppearance((a) => ({ ...a, language: e.target.value }))}>
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-base">Fuso horário</label>
                    <select className="input-base" value={appearance.timezone} onChange={(e) => setAppearance((a) => ({ ...a, timezone: e.target.value }))}>
                      <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/Lisbon">Europe/Lisbon</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-base">Início da semana</label>
                    <select className="input-base" value={appearance.firstDay} onChange={(e) => setAppearance((a) => ({ ...a, firstDay: e.target.value }))}>
                      <option value="sunday">Domingo</option>
                      <option value="monday">Segunda-feira</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={saveAppearance}>Salvar</Button>
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {tab === 'notifications' && (
          <SectionCard title="Notificações" description="Escolha quais eventos geram notificações para você.">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { key: 'assignments', label: 'Atribuições de tarefas', desc: 'Quando uma tarefa for atribuída a você.' },
                { key: 'mentions', label: 'Menções', desc: 'Quando você for mencionado em comentários.' },
                { key: 'dueDates', label: 'Vencimentos e atrasos', desc: 'Avisos de prazos próximos ou vencidos.' },
                { key: 'statusChanges', label: 'Alterações de status', desc: 'Quando uma tarefa sua muda de status.' },
                { key: 'comments', label: 'Comentários', desc: 'Novos comentários em tarefas suas.' },
                { key: 'digests', label: 'Resumo diário', desc: 'Consolidado das atividades ao fim do dia.' }
              ].map((item) => (
                <div key={item.key} className="py-3.5">
                  <Switch
                    label={item.label}
                    description={item.desc}
                    checked={notifPrefs[item.key]}
                    onChange={(v) => dispatch({ type: 'UPDATE_NOTIF_PREFS', notifPrefs: { [item.key]: v } })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => toast.success('Preferências de notificação salvas')}>Salvar</Button>
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
            <SectionCard title="Dados de demonstração" description="Este é um protótipo com dados fictícios mantidos apenas em memória.">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Restaurar dados de demonstração</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Reinicia todas as tarefas, usuários e atividades para o estado inicial.</p>
                </div>
                <Button variant="danger" icon={RotateCcw} onClick={() => setConfirmReset(true)}>Restaurar</Button>
              </div>
              <div className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                Estado atual: <span className="font-semibold text-slate-600 dark:text-slate-300">{state.tasks.length} tarefas</span> ·{' '}
                <span className="font-semibold text-slate-600 dark:text-slate-300">{state.users.length} membros</span> ·{' '}
                <span className="font-semibold text-slate-600 dark:text-slate-300">{state.projects.length} projetos</span> ·{' '}
                <span className="font-semibold text-slate-600 dark:text-slate-300">{state.activities.length} atividades</span>
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
            toast.success('Dados de demonstração restaurados')
          } catch (e) { console.error('Reset failed:', e) }
        }}
        title="Restaurar dados"
        message="Todos os dados atuais serão substituídos pelos dados fictícios iniciais. Deseja continuar?"
        confirmLabel="Restaurar"
        confirmVariant="primary"
      />
    </div>
  )
}
