export const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#f43f5e', '#14b8a6', '#3b82f6', '#84cc16']

export const STATUS = {
  todo: {
    key: 'todo',
    label: 'A fazer',
    hex: '#94a3b8',
    badge:
      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400'
  },
  in_progress: {
    key: 'in_progress',
    label: 'Em andamento',
    hex: '#3b82f6',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500'
  },
  review: {
    key: 'review',
    label: 'Em revisão',
    hex: '#f59e0b',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500'
  },
  blocked: {
    key: 'blocked',
    label: 'Bloqueado',
    hex: '#ef4444',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    dot: 'bg-red-500',
    bar: 'bg-red-500'
  },
  paused: {
    key: 'paused',
    label: 'Pausada',
    hex: '#f97316',
    badge:
      'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    dot: 'bg-orange-500',
    bar: 'bg-orange-500'
  },
  done: {
    key: 'done',
    label: 'Concluído',
    hex: '#10b981',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500'
  },
  cancelled: {
    key: 'cancelled',
    label: 'Cancelada',
    hex: '#94a3b8',
    badge:
      'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400'
  }
}

export const KANBAN_COLUMNS = ['todo', 'in_progress', 'review', 'blocked', 'paused', 'done', 'cancelled']

export const PRIORITY = {
  low: { key: 'low', label: 'Baixa', hex: '#64748b', rank: 0 },
  medium: { key: 'medium', label: 'Média', hex: '#3b82f6', rank: 1 },
  high: { key: 'high', label: 'Alta', hex: '#f97316', rank: 2 },
  urgent: { key: 'urgent', label: 'Urgente', hex: '#ef4444', rank: 3 }
}

export const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low']

export const SORT_OPTIONS = [
  { key: 'dueDate', label: 'Vencimento (próximos primeiro)' },
  { key: 'dueDate_desc', label: 'Vencimento (últimos primeiro)' },
  { key: 'priority', label: 'Prioridade' },
  { key: 'createdAt', label: 'Criação (recentes primeiro)' },
  { key: 'title', label: 'Título (A–Z)' }
]

export const VIEWS = [
  { key: 'list', label: 'Lista' },
  { key: 'kanban', label: 'Kanban' },
  { key: 'table', label: 'Tabela' },
  { key: 'calendar', label: 'Calendário' }
]

export const ROLE_BADGE = {
  'Gerente de Projetos': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  'Desenvolvedor Frontend': 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'Desenvolvedora Backend': 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'Desenvolvedor Fullstack': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'Desenvolvedora Fullstack': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'Designer UX/UI': 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  'Analista de QA': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'Product Owner': 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'DevOps Engineer': 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300'
}

export const ACCESS_LEVELS = {
  admin: {
    key: 'admin',
    label: 'Administrador',
    rank: 3,
    hex: '#f43f5e',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
  },
  manager: {
    key: 'manager',
    label: 'Gerente',
    rank: 2,
    hex: '#f59e0b',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
  },
  member: {
    key: 'member',
    label: 'Membro',
    rank: 1,
    hex: '#6366f1',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
  },
  viewer: {
    key: 'viewer',
    label: 'Somente leitura',
    rank: 0,
    hex: '#94a3b8',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  }
}

export const ACCESS_LEVEL_ORDER = ['admin', 'manager', 'member', 'viewer']

export const ACCESS_TYPES = {
  view_tasks: {
    key: 'view_tasks',
    label: 'Visualizar tarefas',
    description: 'Ver tarefas, kanban, calendário e atividades'
  },
  create_tasks: {
    key: 'create_tasks',
    label: 'Criar tarefas',
    description: 'Criar novas tarefas'
  },
  edit_tasks: {
    key: 'edit_tasks',
    label: 'Editar tarefas',
    description: 'Alterar dados de tarefas existentes'
  },
  delete_tasks: {
    key: 'delete_tasks',
    label: 'Excluir tarefas',
    description: 'Excluir tarefas (com opção de desfazer)'
  },
  assign_tasks: {
    key: 'assign_tasks',
    label: 'Atribuir tarefas',
    description: 'Atribuir e reatribuir responsáveis'
  },
  manage_projects: {
    key: 'manage_projects',
    label: 'Gerenciar projetos',
    description: 'Criar e editar projetos e categorias'
  },
  manage_team: {
    key: 'manage_team',
    label: 'Gerenciar equipe',
    description: 'Convidar e visualizar membros'
  },
  manage_profiles: {
    key: 'manage_profiles',
    label: 'Gerenciar perfis de acesso',
    description: 'Criar, editar e excluir perfis de acesso'
  },
  view_settings: {
    key: 'view_settings',
    label: 'Acessar configurações',
    description: 'Ver e alterar configurações do sistema'
  }
}

export const ALL_ACCESS_TYPES = Object.keys(ACCESS_TYPES)
