let uid = 100
const nextId = () => `t${uid++}`
let nid = 100
const nextNotifId = () => `n${nid++}`

const iso = (offsetDays, hour = 10) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(hour, Math.floor(Math.random() * 50), 0, 0)
  return d.toISOString()
}

export const CURRENT_USER_ID = 'u1'

export const CURRENT_PROFILE_ID = 'pr1'

export const USERS = [
  { id: 'u1', name: 'Ana Souza', role: 'Gerente de Projetos', email: 'ana.souza@taskflow.dev', color: '#6366f1', online: true, active: true, profileIds: ['pr1', 'pr2'], bio: 'Gestão de projetos e priorização do roadmap. Apaixonada por organizar times de alta performance.' },
  { id: 'u2', name: 'Bruno Lima', role: 'Desenvolvedor Frontend', email: 'bruno.lima@taskflow.dev', color: '#0ea5e9', online: true, active: true, profileIds: ['pr3'], bio: '' },
  { id: 'u3', name: 'Carla Mendes', role: 'Desenvolvedora Backend', email: 'carla.mendes@taskflow.dev', color: '#8b5cf6', online: false, active: true, profileIds: ['pr3'], bio: '' },
  { id: 'u4', name: 'Diego Rocha', role: 'Designer UX/UI', email: 'diego.rocha@taskflow.dev', color: '#ec4899', online: true, active: true, profileIds: ['pr3'] },
  { id: 'u5', name: 'Elisa Cardoso', role: 'Analista de QA', email: 'elisa.cardoso@taskflow.dev', color: '#10b981', online: false, active: true, profileIds: ['pr3', 'pr5'] },
  { id: 'u6', name: 'Felipe Alves', role: 'Desenvolvedor Fullstack', email: 'felipe.alves@taskflow.dev', color: '#f59e0b', online: true, active: true, profileIds: ['pr3'] },
  { id: 'u7', name: 'Gabriela Nunes', role: 'Product Owner', email: 'gabriela.nunes@taskflow.dev', color: '#f43f5e', online: false, active: true, profileIds: ['pr3'] },
  { id: 'u8', name: 'Hugo Martins', role: 'DevOps Engineer', email: 'hugo.martins@taskflow.dev', color: '#14b8a6', online: true, active: true, profileIds: ['pr3'] }
]

export const PROJECTS = [
  { id: 'p1', name: 'Website Institucional', description: 'Reestruturação completa do site institucional com nova identidade visual e performance otimizada.', color: '#6366f1', members: ['u1', 'u2', 'u4', 'u7', 'u8'], due: iso(30) },
  { id: 'p2', name: 'Aplicativo Mobile', description: 'App mobile para acompanhamento de metas com autenticação, notificações e versão beta.', color: '#0ea5e9', members: ['u2', 'u3', 'u4', 'u5', 'u6'], due: iso(45) },
  { id: 'p3', name: 'Plataforma de Pagamentos', description: 'Módulo de checkout e gestão de transações com foco em segurança e conformidade.', color: '#8b5cf6', members: ['u1', 'u3', 'u5', 'u7'], due: iso(60) },
  { id: 'p4', name: 'Redesign do Dashboard', description: 'Redesenho da interface de métricas com novo design system e foco em acessibilidade.', color: '#ec4899', members: ['u1', 'u2', 'u4', 'u5'], due: iso(21) },
  { id: 'p5', name: 'Integração CRM Externo', description: 'Integração bidirecional com CRM de terceiros para sincronização de contatos e eventos.', color: '#f59e0b', members: ['u2', 'u5', 'u6', 'u8'], due: iso(40) },
  { id: 'p6', name: 'Migração de Infraestrutura', description: 'Migração para infraestrutura gerenciada com CI/CD automatizado e observabilidade.', color: '#14b8a6', members: ['u1', 'u6', 'u8'], due: iso(75) }
]

export const CATEGORIES = [
  { id: 'c1', name: 'Desenvolvimento', color: '#6366f1' },
  { id: 'c2', name: 'Design', color: '#ec4899' },
  { id: 'c3', name: 'Planejamento', color: '#f59e0b' },
  { id: 'c4', name: 'Correção de bugs', color: '#ef4444' },
  { id: 'c5', name: 'Documentação', color: '#14b8a6' },
  { id: 'c6', name: 'Análise', color: '#8b5cf6' },
  { id: 'c7', name: 'Marketing', color: '#f43f5e' },
  { id: 'c8', name: 'Suporte', color: '#10b981' }
]

const T = (id, data) => ({
  id,
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  assigneeId: null,
  projectId: null,
  categoryId: 'c1',
  dueDate: null,
  createdAt: iso(-8 - Math.floor(Math.random() * 20)),
  estimatedHours: 8,
  progress: 0,
  tags: [],
  subtasks: [],
  favorite: false,
  cancelReason: null,
  canceledBy: null,
  ...data
})

export const TASKS = [
  T(nextId(), {
    title: 'Estruturar sitemap do novo site',
    description: 'Organizar a hierarquia de páginas considerando SEO e a jornada do usuário.',
    status: 'todo',
    priority: 'high',
    assigneeId: 'u7',
    projectId: 'p1',
    categoryId: 'c3',
    dueDate: iso(-2),
    estimatedHours: 6,
    tags: ['seo', 'estrutura'],
    subtasks: [
      { id: 's1', title: 'Levantar páginas atuais', done: true },
      { id: 's2', title: 'Definir arquitetura de informação', done: false }
    ]
  }),
  T(nextId(), {
    title: 'Desenvolver componentes da home',
    description: 'Construir os componentes principais da página inicial usando o design system.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'u2',
    projectId: 'p1',
    categoryId: 'c1',
    dueDate: iso(5),
    estimatedHours: 24,
    progress: 60,
    favorite: true,
    tags: ['frontend', 'react'],
    subtasks: [
      { id: 's3', title: 'Hero section', done: true },
      { id: 's4', title: 'Seção de produtos', done: true },
      { id: 's5', title: 'Depoimentos', done: false }
    ]
  }),
  T(nextId(), {
    title: 'Revisar identidade visual',
    description: 'Validar paleta de cores e tipografia aplicadas nas novas telas.',
    status: 'review',
    priority: 'medium',
    assigneeId: 'u4',
    projectId: 'p1',
    categoryId: 'c2',
    dueDate: iso(3),
    estimatedHours: 8,
    progress: 90,
    tags: ['design']
  }),
  T(nextId(), {
    title: 'Otimizar performance do site',
    description: 'Melhorar Core Web Vitals e reduzir o tempo de carregamento inicial.',
    status: 'todo',
    priority: 'low',
    assigneeId: 'u2',
    projectId: 'p1',
    categoryId: 'c1',
    dueDate: iso(12),
    estimatedHours: 16,
    tags: ['performance']
  }),
  T(nextId(), {
    title: 'Escrever conteúdo das páginas',
    description: 'Produzir textos finais para as páginas institucionais e de produto.',
    status: 'done',
    priority: 'medium',
    assigneeId: 'u7',
    projectId: 'p1',
    categoryId: 'c7',
    dueDate: iso(-4),
    estimatedHours: 12,
    progress: 100,
    tags: ['conteúdo']
  }),
  T(nextId(), {
    title: 'Configurar Analytics e SEO',
    description: 'Instalar ferramentas de medição e aplicar meta tags otimizadas.',
    status: 'in_progress',
    priority: 'medium',
    assigneeId: 'u8',
    projectId: 'p1',
    categoryId: 'c5',
    dueDate: iso(9),
    estimatedHours: 6,
    progress: 40,
    tags: ['analytics']
  }),
  T(nextId(), {
    title: 'Definir fluxo de onboarding',
    description: 'Desenhar a sequência de boas-vindas para novos usuários do app.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'u4',
    projectId: 'p2',
    categoryId: 'c2',
    dueDate: iso(8),
    estimatedHours: 10,
    tags: ['ux'],
    subtasks: [
      { id: 's6', title: 'Mapear jornada', done: true },
      { id: 's7', title: 'Protótipo das telas', done: false }
    ]
  }),
  T(nextId(), {
    title: 'Implementar autenticação no app',
    description: 'Fluxo de login com biometria e login social.',
    status: 'in_progress',
    priority: 'urgent',
    assigneeId: 'u6',
    projectId: 'p2',
    categoryId: 'c1',
    dueDate: iso(6),
    estimatedHours: 32,
    progress: 55,
    favorite: true,
    tags: ['segurança', 'mobile']
  }),
  T(nextId(), {
    title: 'Corrigir crash na tela de login',
    description: 'Falha intermitente ao abrir a tela de login em dispositivos Android 13.',
    status: 'blocked',
    priority: 'urgent',
    assigneeId: 'u3',
    projectId: 'p2',
    categoryId: 'c4',
    dueDate: iso(-1),
    estimatedHours: 8,
    progress: 30,
    tags: ['bug', 'android']
  }),
  T(nextId(), {
    title: 'Publicar primeira versão beta',
    description: 'Preparar build para distribuição interna via TestFlight e Play Console.',
    status: 'todo',
    priority: 'high',
    assigneeId: 'u6',
    projectId: 'p2',
    categoryId: 'c1',
    dueDate: iso(15),
    estimatedHours: 12,
    tags: ['release']
  }),
  T(nextId(), {
    title: 'Criar protótipo de alta fidelidade',
    description: 'Prototipar todas as telas do app com interações completas.',
    status: 'done',
    priority: 'medium',
    assigneeId: 'u4',
    projectId: 'p2',
    categoryId: 'c2',
    dueDate: iso(-3),
    estimatedHours: 20,
    progress: 100,
    tags: ['protótipo']
  }),
  T(nextId(), {
    title: 'Integrar push notifications',
    description: 'Configurar envio de notificações locais e remotas com Firebase.',
    status: 'review',
    priority: 'medium',
    assigneeId: 'u6',
    projectId: 'p2',
    categoryId: 'c1',
    dueDate: iso(4),
    estimatedHours: 14,
    progress: 85,
    tags: ['notificações']
  }),
  T(nextId(), {
    title: 'Implementar checkout via Pix',
    description: 'Criar o fluxo de pagamento instantâneo com validação de QR code.',
    status: 'in_progress',
    priority: 'urgent',
    assigneeId: 'u3',
    projectId: 'p3',
    categoryId: 'c1',
    dueDate: iso(10),
    estimatedHours: 40,
    progress: 45,
    favorite: true,
    tags: ['pagamentos', 'pix']
  }),
  T(nextId(), {
    title: 'Testar fluxo de estorno',
    description: 'Cobrir cenários de cancelamento e reembolso de transações.',
    status: 'review',
    priority: 'high',
    assigneeId: 'u5',
    projectId: 'p3',
    categoryId: 'c6',
    dueDate: iso(2),
    estimatedHours: 12,
    progress: 80,
    tags: ['qa']
  }),
  T(nextId(), {
    title: 'Documentar API de pagamentos',
    description: 'Escrever documentação de referência para integradores externos.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'u3',
    projectId: 'p3',
    categoryId: 'c5',
    dueDate: iso(18),
    estimatedHours: 16,
    tags: ['docs']
  }),
  T(nextId(), {
    title: 'Analisar risco de fraude',
    description: 'Revisar regras de antifraude e thresholds de transação.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'u5',
    projectId: 'p3',
    categoryId: 'c6',
    dueDate: iso(7),
    estimatedHours: 10,
    progress: 35,
    tags: ['risco']
  }),
  T(nextId(), {
    title: 'Revisar compliance LGPD',
    description: 'Auditar tratamentos de dados pessoais e atualizar registros.',
    status: 'todo',
    priority: 'high',
    assigneeId: 'u1',
    projectId: 'p3',
    categoryId: 'c6',
    dueDate: iso(20),
    estimatedHours: 18,
    tags: ['lgpd']
  }),
  T(nextId(), {
    title: 'Resolver divergência no relatório de transações',
    description: 'Valores do extrato diferem dos registros do banco em menos de 1%.',
    status: 'blocked',
    priority: 'high',
    assigneeId: 'u3',
    projectId: 'p3',
    categoryId: 'c4',
    dueDate: iso(-2),
    estimatedHours: 6,
    progress: 20,
    tags: ['bug', 'relatório']
  }),
  T(nextId(), {
    title: 'Levantar requisitos com stakeholders',
    description: 'Workshops para coletar necessidades do novo dashboard.',
    status: 'done',
    priority: 'medium',
    assigneeId: 'u1',
    projectId: 'p4',
    categoryId: 'c3',
    dueDate: iso(-5),
    estimatedHours: 8,
    progress: 100,
    tags: ['workshop']
  }),
  T(nextId(), {
    title: 'Criar design system de componentes',
    description: 'Biblioteca de componentes com tokens de design e temas claro/escuro.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'u4',
    projectId: 'p4',
    categoryId: 'c2',
    dueDate: iso(9),
    estimatedHours: 40,
    progress: 50,
    favorite: true,
    tags: ['design-system'],
    subtasks: [
      { id: 's8', title: 'Tokens e cores', done: true },
      { id: 's9', title: 'Botões e inputs', done: true },
      { id: 's10', title: 'Gráficos', done: false }
    ]
  }),
  T(nextId(), {
    title: 'Desenvolver novo layout de métricas',
    description: 'Implementar a nova grade de cards de indicadores.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'u2',
    projectId: 'p4',
    categoryId: 'c1',
    dueDate: iso(11),
    estimatedHours: 20,
    tags: ['frontend']
  }),
  T(nextId(), {
    title: 'Validar protótipo com usuários',
    description: 'Sessões de teste com clientes para validar a usabilidade.',
    status: 'todo',
    priority: 'low',
    assigneeId: 'u5',
    projectId: 'p4',
    categoryId: 'c6',
    dueDate: iso(14),
    estimatedHours: 12,
    tags: ['pesquisa']
  }),
  T(nextId(), {
    title: 'Ajustar paleta de cores de acessibilidade',
    description: 'Garantir contraste AA em todos os estados dos componentes.',
    status: 'review',
    priority: 'medium',
    assigneeId: 'u4',
    projectId: 'p4',
    categoryId: 'c2',
    dueDate: iso(1),
    estimatedHours: 6,
    progress: 88,
    tags: ['acessibilidade']
  }),
  T(nextId(), {
    title: 'Mapear endpoints da API externa',
    description: 'Catalogar endpoints disponíveis e seus contratos de dados.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'u2',
    projectId: 'p5',
    categoryId: 'c6',
    dueDate: iso(6),
    estimatedHours: 10,
    progress: 40,
    tags: ['api']
  }),
  T(nextId(), {
    title: 'Implementar sincronização de contatos',
    description: 'Sincronização bidirecional de contatos a cada 15 minutos.',
    status: 'todo',
    priority: 'high',
    assigneeId: 'u6',
    projectId: 'p5',
    categoryId: 'c1',
    dueDate: iso(16),
    estimatedHours: 30,
    tags: ['integração']
  }),
  T(nextId(), {
    title: 'Configurar webhooks de eventos',
    description: 'Receber eventos de criação e atualização de leads via webhook.',
    status: 'review',
    priority: 'medium',
    assigneeId: 'u8',
    projectId: 'p5',
    categoryId: 'c1',
    dueDate: iso(4),
    estimatedHours: 12,
    progress: 82,
    tags: ['webhooks']
  }),
  T(nextId(), {
    title: 'Escrever testes de integração',
    description: 'Cobertura automatizada para os principais fluxos de sincronização.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'u5',
    projectId: 'p5',
    categoryId: 'c1',
    dueDate: iso(13),
    estimatedHours: 24,
    tags: ['qa', 'testes']
  }),
  T(nextId(), {
    title: 'Elaborar plano de rollback',
    description: 'Documentar procedimentos para reversão segura da integração.',
    status: 'done',
    priority: 'low',
    assigneeId: 'u8',
    projectId: 'p5',
    categoryId: 'c5',
    dueDate: iso(-2),
    estimatedHours: 4,
    progress: 100,
    tags: ['docs']
  }),
  T(nextId(), {
    title: 'Migrar banco para cluster gerenciado',
    description: 'Movimentar workloads para banco gerenciado com failover automático.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'u8',
    projectId: 'p6',
    categoryId: 'c1',
    dueDate: iso(22),
    estimatedHours: 48,
    progress: 30,
    tags: ['infra', 'banco']
  }),
  T(nextId(), {
    title: 'Configurar observabilidade e alertas',
    description: 'Métricas, logs centralizados e alertas para os principais serviços.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'u8',
    projectId: 'p6',
    categoryId: 'c5',
    dueDate: iso(25),
    estimatedHours: 16,
    tags: ['monitoring']
  }),
  T(nextId(), {
    title: 'Automatizar deploy com CI/CD',
    description: 'Pipelines de build, testes e deploy em ambientes por ambiente.',
    status: 'in_progress',
    priority: 'medium',
    assigneeId: 'u6',
    projectId: 'p6',
    categoryId: 'c1',
    dueDate: iso(19),
    estimatedHours: 24,
    progress: 65,
    tags: ['ci-cd']
  }),
  T(nextId(), {
    title: 'Plano de recuperação de desastres',
    description: 'Definir RPO/RTO e testes regulares de restauração.',
    status: 'todo',
    priority: 'low',
    assigneeId: 'u1',
    projectId: 'p6',
    categoryId: 'c3',
    dueDate: iso(30),
    estimatedHours: 14,
    tags: ['dr']
  }),
  T(nextId(), {
    title: 'Preparar relatório mensal da equipe',
    description: 'Consolidar indicadores de desempenho e entregas do mês.',
    status: 'in_progress',
    priority: 'medium',
    assigneeId: 'u1',
    projectId: null,
    categoryId: 'c3',
    dueDate: iso(5),
    estimatedHours: 6,
    progress: 25,
    tags: ['relatório']
  }),
  T(nextId(), {
    title: 'Responder dúvidas do suporte sobre o app',
    description: 'Triagem de chamados abertos na última semana sobre o app mobile.',
    status: 'todo',
    priority: 'low',
    assigneeId: 'u5',
    projectId: null,
    categoryId: 'c8',
    dueDate: iso(0),
    estimatedHours: 4,
    tags: ['suporte']
  }),
  T(nextId(), {
    title: 'Atualizar política de privacidade',
    description: 'Revisar texto conforme novas exigências de lei e prática da empresa.',
    status: 'done',
    priority: 'medium',
    assigneeId: 'u7',
    projectId: null,
    categoryId: 'c5',
    dueDate: iso(-4),
    estimatedHours: 5,
    progress: 100,
    tags: ['legal']
  }),
  T(nextId(), {
    title: 'Investigar erro de timeout no servidor',
    description: 'Latência acima do esperado em picos de uso no serviço principal.',
    status: 'blocked',
    priority: 'urgent',
    assigneeId: 'u8',
    projectId: 'p6',
    categoryId: 'c4',
    dueDate: iso(-1),
    estimatedHours: 10,
    progress: 40,
    favorite: true,
    tags: ['bug', 'infra']
  }),
  T(nextId(), {
    title: 'Definir roadmap do próximo trimestre',
    description: 'Priorizar iniciativas e estimar capacidade da equipe.',
    status: 'todo',
    priority: 'medium',
    assigneeId: null,
    projectId: 'p3',
    categoryId: 'c3',
    dueDate: iso(24),
    estimatedHours: 8,
    tags: ['planejamento']
  }),
  T(nextId(), {
    title: 'Brainstorm de novas funcionalidades',
    description: 'Sessão aberta para gerar ideias de melhorias para o dashboard.',
    status: 'todo',
    priority: 'low',
    assigneeId: null,
    projectId: 'p4',
    categoryId: 'c3',
    dueDate: null,
    estimatedHours: 4,
    tags: ['ideação']
  })
]

export const COMMENTS = {
  t101: [
    { id: 'cm1', userId: 'u2', text: 'Finalizei a hero section, falta apenas ajustar as animações.', createdAt: iso(-2, 15) },
    { id: 'cm2', userId: 'u4', text: 'Perfeito! Confere o espaçamento do CTA quando der.', createdAt: iso(-1, 9) },
    { id: 'cm3', userId: 'u7', text: 'Vou validar com o time de marketing hoje à tarde.', createdAt: iso(-1, 14) }
  ],
  t108: [
    { id: 'cm4', userId: 'u3', text: 'O erro ocorre apenas com o SDK da versão 2.3.', createdAt: iso(-2, 11) },
    { id: 'cm5', userId: 'u8', text: 'Consegui reproduzir localmente, vou mandar os logs.', createdAt: iso(-1, 16) }
  ],
  t119: [
    { id: 'cm6', userId: 'u4', text: 'Os tokens de cor já estão prontos, seguindo o guia novo.', createdAt: iso(-3, 10) },
    { id: 'cm7', userId: 'u1', text: 'Excelente, vamos usar o tema claro como padrão por enquanto.', createdAt: iso(-2, 8) },
    { id: 'cm8', userId: 'u2', text: 'O dark mode precisa do ajuste no contraste dos gráficos.', createdAt: iso(-1, 12) }
  ],
  t124: [
    { id: 'cm9', userId: 'u6', text: 'Estou travado no refresh token, alguém já passou por isso?', createdAt: iso(-2, 13) },
    { id: 'cm10', userId: 'u8', text: 'Vê se o timestamp está com timezone correto no header.', createdAt: iso(-1, 9) }
  ],
  t135: [
    { id: 'cm11', userId: 'u8', text: 'O timeout aparece principalmente em rotas de busca.', createdAt: iso(-1, 17) },
    { id: 'cm12', userId: 'u6', text: 'Vou aumentar o pool de conexões no release de hoje.', createdAt: iso(-1, 19) }
  ],
  t113: [
    { id: 'cm13', userId: 'u5', text: 'Fluxo de estorno coberto para cartão e Pix.', createdAt: iso(-1, 11) },
    { id: 'cm14', userId: 'u3', text: 'O Pix precisa de espera de confirmação antes do estorno.', createdAt: iso(-1, 13) }
  ]
}

export const ACTIVITIES = [
  { id: 'a1', type: 'status', actorId: 'u6', taskId: 't111', text: 'mudou o status de Integrar push notifications para Em revisão', createdAt: iso(0, 8) },
  { id: 'a2', type: 'assign', actorId: 'u1', taskId: 't112', text: 'atribuiu Implementar checkout via Pix a Carla Mendes', createdAt: iso(0, 7) },
  { id: 'a3', type: 'comment', actorId: 'u2', taskId: 't101', text: 'comentou em Desenvolver componentes da home', createdAt: iso(0, 6) },
  { id: 'a4', type: 'create', actorId: 'u7', taskId: 't134', text: 'criou a tarefa Atualizar política de privacidade', createdAt: iso(-1, 16) },
  { id: 'a5', type: 'assign', actorId: 'u1', taskId: 't113', text: 'atribuiu Testar fluxo de estorno a Elisa Cardoso', createdAt: iso(-1, 14) },
  { id: 'a6', type: 'status', actorId: 'u2', taskId: 't107', text: 'moveu Implementar autenticação no app para Em andamento', createdAt: iso(-1, 11) },
  { id: 'a7', type: 'priority', actorId: 'u1', taskId: 't108', text: 'aumentou a prioridade de Corrigir crash na tela de login para Urgente', createdAt: iso(-2, 9) },
  { id: 'a8', type: 'comment', actorId: 'u4', taskId: 't119', text: 'comentou em Criar design system de componentes', createdAt: iso(-2, 10) },
  { id: 'a9', type: 'create', actorId: 'u1', taskId: 't135', text: 'criou a tarefa Investigar erro de timeout no servidor', createdAt: iso(-2, 8) },
  { id: 'a10', type: 'assign', actorId: 'u1', taskId: 't125', text: 'atribuiu Configurar webhooks de eventos a Hugo Martins', createdAt: iso(-3, 15) },
  { id: 'a11', type: 'status', actorId: 'u4', taskId: 't110', text: 'concluiu Criar protótipo de alta fidelidade', createdAt: iso(-3, 9) },
  { id: 'a12', type: 'comment', actorId: 'u3', taskId: 't108', text: 'comentou em Corrigir crash na tela de login', createdAt: iso(-4, 12) },
  { id: 'a13', type: 'create', actorId: 'u8', taskId: 't127', text: 'criou a tarefa Elaborar plano de rollback', createdAt: iso(-5, 10) },
  { id: 'a14', type: 'priority', actorId: 'u1', taskId: 't103', text: 'reduziu a prioridade de Otimizar performance do site para Baixa', createdAt: iso(-6, 13) }
]

export const NOTIFICATIONS = [
  { id: nextNotifId(), type: 'assign', title: 'Nova tarefa atribuída', body: 'Testar fluxo de estorno foi atribuída a Elisa Cardoso.', targetUserId: 'u1', taskId: 't113', read: false, createdAt: iso(0, 9) },
  { id: nextNotifId(), type: 'mention', title: 'Você foi mencionado', body: 'Ana Souza mencionou você no comentário de Criar design system de componentes.', targetUserId: 'u1', taskId: 't119', read: false, createdAt: iso(-1, 12) },
  { id: nextNotifId(), type: 'due', title: 'Vencimento próximo', body: 'Revisar identidade visual vence em 3 dias.', targetUserId: 'u1', taskId: 't102', read: false, createdAt: iso(-1, 8) },
  { id: nextNotifId(), type: 'status', title: 'Status alterado', body: 'Hugo Martins moveu Configurar Analytics e SEO para Em andamento.', targetUserId: 'u1', taskId: 't105', read: true, createdAt: iso(-2, 10) },
  { id: nextNotifId(), type: 'comment', title: 'Novo comentário', body: 'Felipe Alves comentou em Implementar autenticação no app.', targetUserId: 'u1', taskId: 't107', read: true, createdAt: iso(-2, 13) },
  { id: nextNotifId(), type: 'due', title: 'Tarefa atrasada', body: 'Estruturar sitemap do novo site está atrasada há 2 dias.', targetUserId: 'u1', taskId: 't100', read: true, createdAt: iso(-2, 17) },
  { id: nextNotifId(), type: 'assign', title: 'Nova tarefa atribuída', body: 'Investigar erro de timeout no servidor foi atribuída a Hugo Martins.', targetUserId: 'u1', taskId: 't135', read: true, createdAt: iso(-3, 9) },
  { id: nextNotifId(), type: 'status', title: 'Tarefa concluída', body: 'Diego Rocha concluiu Criar protótipo de alta fidelidade.', targetUserId: 'u1', taskId: 't110', read: true, createdAt: iso(-3, 11) },
  { id: nextNotifId(), type: 'comment', title: 'Novo comentário', body: 'Elisa Cardoso comentou em Testar fluxo de estorno.', targetUserId: 'u1', taskId: 't113', read: true, createdAt: iso(-4, 9) }
]

export const PROFILES = [
  {
    id: 'pr1',
    name: 'Administrador',
    description: 'Acesso total ao workspace: gerencia tarefas, projetos, equipe, perfis de acesso e configurações.',
    level: 'admin',
    permissions: [
      'view_tasks',
      'create_tasks',
      'edit_tasks',
      'delete_tasks',
      'assign_tasks',
      'manage_projects',
      'manage_team',
      'manage_profiles',
      'view_settings'
    ],
    createdBy: 'u1',
    color: '#f43f5e',
    createdAt: iso(-90)
  },
  {
    id: 'pr2',
    name: 'Gerente de Projetos',
    description: 'Planeja e acompanha projetos, cria e edita tarefas, atribui responsáveis e gerencia a equipe.',
    level: 'manager',
    permissions: [
      'view_tasks',
      'create_tasks',
      'edit_tasks',
      'delete_tasks',
      'assign_tasks',
      'manage_projects',
      'manage_team',
      'view_settings'
    ],
    createdBy: 'u1',
    color: '#f59e0b',
    createdAt: iso(-75)
  },
  {
    id: 'pr3',
    name: 'Membro da equipe',
    description: 'Executa tarefas no dia a dia: visualiza, cria, edita e atualiza o que lhe for atribuído.',
    level: 'member',
    permissions: ['view_tasks', 'create_tasks', 'edit_tasks', 'assign_tasks'],
    createdBy: 'u1',
    color: '#6366f1',
    createdAt: iso(-60)
  },
  {
    id: 'pr4',
    name: 'Convidado / Leitura',
    description: 'Acesso somente de visualização, sem permissão para criar, editar ou excluir qualquer item.',
    level: 'viewer',
    permissions: ['view_tasks'],
    createdBy: 'u7',
    color: '#94a3b8',
    createdAt: iso(-40)
  },
  {
    id: 'pr5',
    name: 'QA / Revisão',
    description: 'Foco em revisão e testes: visualiza e edita tarefas, mas não exclui nem gerencia projetos.',
    level: 'member',
    permissions: ['view_tasks', 'edit_tasks', 'assign_tasks'],
    createdBy: 'u5',
    color: '#10b981',
    createdAt: iso(-25)
  }
]

export const MOCK_STATE = {
  users: USERS,
  profiles: PROFILES,
  projects: PROJECTS,
  categories: CATEGORIES,
  tasks: TASKS,
  comments: COMMENTS,
  activities: ACTIVITIES,
  notifications: NOTIFICATIONS
}
