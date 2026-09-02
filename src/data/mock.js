// Dados iniciais do TaskFlow Pessoal — um único usuário, cenários individuais.
let uid = 100
const nextId = () => `t${uid++}`
let nid = 100
const nextReminderId = () => `r${nid++}`

const iso = (offsetDays, hour = 10) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(hour, 30, 0, 0)
  return d.toISOString()
}

export const ME = {
  id: 'me',
  name: 'Você',
  bio: ''
}

export const PROJECTS = [
  {
    id: 'p1',
    name: 'Reforma do apartamento',
    description: 'Pequena reforma: pintura da sala, troca de luminárias e organização da cozinha.',
    color: '#6366f1',
    due: iso(45)
  },
  {
    id: 'p2',
    name: 'Site pessoal',
    description: 'Criar meu portfólio online com projetos, blog e página de contato.',
    color: '#0ea5e9',
    due: iso(60)
  },
  {
    id: 'p3',
    name: 'Finanças 2026',
    description: 'Organizar orçamento mensal, cortar gastos e construir reserva de emergência.',
    color: '#8b5cf6',
    due: null
  },
  {
    id: 'p4',
    name: 'Aprender inglês',
    description: 'Meta de alcançar nível intermediário com estudo diário e conversação semanal.',
    color: '#10b981',
    due: iso(120)
  }
]

const T = (id, data) => ({
  id,
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  projectId: null,
  dueDate: null,
  createdAt: iso(-7 - Math.floor(Math.random() * 15)),
  estimatedHours: 1,
  progress: 0,
  tags: [],
  subtasks: [],
  favorite: false,
  recurrence: null,
  cancelReason: null,
  ...data
})

export const TASKS = [
  T(nextId(), {
    title: 'Pintar a sala',
    description: 'Escolher a cor (entre verde-sálvia e off-white), comprar tinta e rolos.',
    status: 'in_progress',
    priority: 'high',
    projectId: 'p1',
    dueDate: iso(6),
    estimatedHours: 8,
    progress: 40,
    favorite: true,
    tags: ['reforma'],
    subtasks: [
      { id: 's1', title: 'Mascar rodapés e tomadas', done: true },
      { id: 's2', title: 'Aplicar primeira demão', done: true },
      { id: 's3', title: 'Aplicar segunda demão', done: false }
    ]
  }),
  T(nextId(), {
    title: 'Trocar luminárias da cozinha',
    description: 'Comprar duas luminárias LED e instalar sobre a bancada.',
    status: 'todo',
    priority: 'medium',
    projectId: 'p1',
    dueDate: iso(14),
    estimatedHours: 2,
    tags: ['reforma']
  }),
  T(nextId(), {
    title: 'Pagar conta de luz',
    description: 'Vence todo dia 10.',
    status: 'todo',
    priority: 'urgent',
    projectId: 'p3',
    dueDate: iso(-1),
    estimatedHours: 0.2,
    recurrence: 'monthly',
    tags: ['contas']
  }),
  T(nextId(), {
    title: 'Academia',
    description: 'Treino de 40 minutos.',
    status: 'todo',
    priority: 'medium',
    dueDate: iso(0),
    estimatedHours: 1,
    recurrence: 'daily',
    tags: ['hábito']
  }),
  T(nextId(), {
    title: 'Estudar inglês — lição do dia',
    description: 'Completar uma unidade do app + revisar vocabulário.',
    status: 'todo',
    priority: 'medium',
    projectId: 'p4',
    dueDate: iso(0),
    estimatedHours: 0.5,
    recurrence: 'daily',
    favorite: true,
    tags: ['inglês']
  }),
  T(nextId(), {
    title: 'Conversação semanal de inglês',
    description: 'Aula online de 30 minutos na escola de idiomas.',
    status: 'in_progress',
    priority: 'high',
    projectId: 'p4',
    dueDate: iso(2),
    estimatedHours: 0.5,
    recurrence: 'weekly',
    progress: 50,
    tags: ['inglês']
  }),
  T(nextId(), {
    title: 'Escolher domínio e hospedagem do site',
    description: 'Comparar preços e registrar o domínio com meu nome.',
    status: 'done',
    priority: 'high',
    projectId: 'p2',
    dueDate: iso(-4),
    estimatedHours: 1,
    progress: 100,
    tags: ['site']
  }),
  T(nextId(), {
    title: 'Montar a home do portfólio',
    description: 'Seções: sobre, projetos e contato. Design simples e limpo.',
    status: 'in_progress',
    priority: 'high',
    projectId: 'p2',
    dueDate: iso(8),
    estimatedHours: 12,
    progress: 30,
    favorite: true,
    tags: ['site'],
    subtasks: [
      { id: 's4', title: 'Rascunhar layout no papel', done: true },
      { id: 's5', title: 'Escrever textos das seções', done: false },
      { id: 's6', title: 'Publicar versão inicial', done: false }
    ]
  }),
  T(nextId(), {
    title: 'Renegociar assinatura de streaming',
    description: 'Ligar para o suporte e pedir desconto ou cancelar.',
    status: 'todo',
    priority: 'low',
    projectId: 'p3',
    dueDate: iso(5),
    estimatedHours: 0.5,
    tags: ['gastos']
  }),
  T(nextId(), {
    title: 'Transferir R$ 300 para a reserva',
    description: 'Depósito mensal na reserva de emergência.',
    status: 'done',
    priority: 'high',
    projectId: 'p3',
    dueDate: iso(-2),
    estimatedHours: 0.2,
    progress: 100,
    recurrence: 'monthly',
    tags: ['reserva']
  }),
  T(nextId(), {
    title: 'Revisar orçamento do mês',
    description: 'Conferir extrato, categorizar gastos e ajustar metas.',
    status: 'todo',
    priority: 'medium',
    projectId: 'p3',
    dueDate: iso(9),
    estimatedHours: 1,
    recurrence: 'monthly',
    tags: ['orçamento']
  }),
  T(nextId(), {
    title: 'Consulta de rotina no dentista',
    description: 'Agendar limpeza anual.',
    status: 'todo',
    priority: 'low',
    dueDate: iso(20),
    estimatedHours: 1,
    tags: ['saúde']
  }),
  T(nextId(), {
    title: 'Organizar armário da cozinha',
    description: 'Separar potes sem tampa e itens quebrados para doação/descarte.',
    status: 'todo',
    priority: 'low',
    projectId: 'p1',
    dueDate: iso(-3),
    estimatedHours: 2,
    tags: ['organização']
  }),
  T(nextId(), {
    title: 'Comprar presente de aniversário da Marina',
    description: 'Ela quer um livro de receitas. Pesquisar em sebo ou livraria.',
    status: 'todo',
    priority: 'high',
    dueDate: iso(1),
    estimatedHours: 1,
    tags: ['presente']
  }),
  T(nextId(), {
    title: 'Atualizar currículo e LinkedIn',
    description: 'Adicionar projeto recente e revisar o resumo profissional.',
    status: 'in_progress',
    priority: 'medium',
    dueDate: iso(11),
    estimatedHours: 3,
    progress: 60,
    tags: ['carreira']
  }),
  T(nextId(), {
    title: 'Planejar viagem de férias',
    description: 'Definir destino, datas e estimativa de custos.',
    status: 'todo',
    priority: 'medium',
    dueDate: iso(28),
    estimatedHours: 4,
    tags: ['viagem'],
    subtasks: [
      { id: 's7', title: 'Listar 3 destinos possíveis', done: false },
      { id: 's8', title: 'Pesquisar passagens', done: false },
      { id: 's9', title: 'Fechar hospedagem', done: false }
    ]
  }),
  T(nextId(), {
    title: 'Levar roupa para conserto',
    description: 'Calça jeans com barra solta.',
    status: 'in_progress',
    priority: 'low',
    dueDate: iso(-1),
    estimatedHours: 0.5,
    progress: 20,
    tags: []
  }),
  T(nextId(), {
    title: 'Assistir curso de finanças pessoais',
    description: 'Curso comprado no ano passado; concluir módulos restantes.',
    status: 'cancelled',
    priority: 'low',
    cancelReason: 'Prefiro focar no inglês neste semestre.',
    estimatedHours: 6,
    tags: []
  })
]

export const NOTES = {
  [TASKS[0].id]: [
    { id: 'n1', text: 'Primeira demão ficou ótima. Comprar mais um rolo antes da segunda.', createdAt: iso(-1, 19) },
    { id: 'n2', text: 'Cor escolhida: verde-sálvia.', createdAt: iso(-3, 18) }
  ],
  [TASKS[7].id]: [
    { id: 'n3', text: 'Textos da seção "sobre" prontos; falta o de projetos.', createdAt: iso(0, 9) }
  ],
  [TASKS[14].id]: [
    { id: 'n4', text: 'Pedir indicação para revisar o texto antes de publicar.', createdAt: iso(-1, 21) }
  ]
}

export const ACTIVITIES = [
  { id: 'a1', type: 'create', taskId: TASKS[13].id, text: 'Você criou a tarefa "Comprar presente de aniversário da Marina"', createdAt: iso(0, 8) },
  { id: 'a2', type: 'status', taskId: TASKS[4].id, text: 'Você moveu "Estudar inglês — lição do dia" para A fazer', createdAt: iso(0, 7) },
  { id: 'a3', type: 'note', taskId: TASKS[7].id, text: 'Você anotou algo em "Montar a home do portfólio"', createdAt: iso(-1, 20) },
  { id: 'a4', type: 'status', taskId: TASKS[9].id, text: 'Você concluiu "Transferir R$ 300 para a reserva"', createdAt: iso(-2, 10) },
  { id: 'a5', type: 'priority', taskId: TASKS[2].id, text: 'Você aumentou a prioridade de "Pagar conta de luz" para Urgente', createdAt: iso(-2, 9) },
  { id: 'a6', type: 'create', taskId: TASKS[8].id, text: 'Você criou a tarefa "Renegociar assinatura de streaming"', createdAt: iso(-3, 15) },
  { id: 'a7', type: 'status', taskId: TASKS[6].id, text: 'Você concluiu "Escolher domínio e hospedagem do site"', createdAt: iso(-4, 17) },
  { id: 'a8', type: 'cancel', taskId: TASKS[17].id, text: 'Você cancelou "Assistir curso de finanças pessoais"', createdAt: iso(-5, 12) }
]

export const REMINDERS = [
  { id: nextReminderId(), type: 'due', title: 'Tarefa atrasada', body: '"Pagar conta de luz" está atrasada.', taskId: TASKS[2].id, read: false, createdAt: iso(0, 8) },
  { id: nextReminderId(), type: 'due', title: 'Tarefa atrasada', body: '"Organizar armário da cozinha" está atrasada.', taskId: TASKS[12].id, read: false, createdAt: iso(0, 8) },
  { id: nextReminderId(), type: 'due', title: 'Vencimento próximo', body: '"Comprar presente de aniversário da Marina" vence amanhã.', taskId: TASKS[13].id, read: false, createdAt: iso(-1, 9) }
]

export const MOCK_STATE = {
  me: ME,
  projects: PROJECTS,
  tasks: TASKS,
  notes: NOTES,
  activities: ACTIVITIES,
  reminders: REMINDERS
}
