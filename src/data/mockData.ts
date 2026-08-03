import type { Colaborador, HistoryEntry, Task } from '../types';

export const GESTOR_ID = 'carlos';

export const GESTOR: Colaborador = {
  id: 'carlos',
  nome: 'Carlos Mendes',
  cargo: 'Gestor de Projetos',
  email: 'carlos@empresa.com',
  cor: '#4f46e5',
};

export const COLABORADORES: Colaborador[] = [
  { id: 'joao', nome: 'João Silva', cargo: 'Desenvolvedor', email: 'joao@empresa.com', cor: '#0ea5e9' },
  { id: 'maria', nome: 'Maria Souza', cargo: 'Analista de Marketing', email: 'maria@empresa.com', cor: '#f59e0b' },
  { id: 'pedro', nome: 'Pedro Oliveira', cargo: 'Designer', email: 'pedro@empresa.com', cor: '#8b5cf6' },
  { id: 'ana', nome: 'Ana Costa', cargo: 'Suporte', email: 'ana@empresa.com', cor: '#10b981' },
  { id: 'lucas', nome: 'Lucas Pereira', cargo: 'Desenvolvedor', email: 'lucas@empresa.com', cor: '#f43f5e' },
];

export const ALL_USERS: Colaborador[] = [GESTOR, ...COLABORADORES];

export function findUser(id: string): Colaborador | undefined {
  return ALL_USERS.find((u) => u.id === id);
}

export const NOME_POR_ID: Record<string, string> = Object.fromEntries(
  ALL_USERS.map((u) => [u.id, u.nome])
);

const h = (
  id: string,
  dataHora: string,
  usuario: string,
  statusAnterior: HistoryEntry['statusAnterior'],
  novoStatus: HistoryEntry['novoStatus'],
  tipo: HistoryEntry['tipo'] = 'status',
  observacao?: string
): HistoryEntry => ({ id, dataHora, usuario, statusAnterior, novoStatus, tipo, observacao });

export const TAREFAS: Task[] = [
  // ── FINALIZADAS ─────────────────────────────────────────────
  {
    id: 'TA-001',
    titulo: 'Implementar módulo de login',
    descricao:
      'Criar fluxo de autenticação com validação de e-mail, recuperação de senha e sessão persistente.',
    responsavelId: 'joao',
    criadorId: 'carlos',
    prioridade: 'alta',
    prazo: '2026-07-28',
    status: 'FINALIZADA',
    criadaEm: '2026-08-03T07:45:00',
    historico: [
      h('h1', '2026-08-03T08:30:00', 'João Silva', 'NOVA', 'RECEBIDA'),
      h('h2', '2026-08-03T09:15:00', 'João Silva', 'RECEBIDA', 'EM_EXECUCAO'),
      h('h3', '2026-08-03T15:40:00', 'João Silva', 'EM_EXECUCAO', 'CONCLUIDA'),
      h('h4', '2026-08-03T16:10:00', 'Carlos Mendes', 'CONCLUIDA', 'DEVOLVIDA', 'status', 'Faltam ajustes na validação de e-mail.'),
      h('h5', '2026-08-04T10:20:00', 'João Silva', 'DEVOLVIDA', 'EM_EXECUCAO'),
      h('h6', '2026-08-04T14:30:00', 'João Silva', 'EM_EXECUCAO', 'CONCLUIDA'),
      h('h7', '2026-08-04T15:00:00', 'Carlos Mendes', 'CONCLUIDA', 'FINALIZADA', 'status', 'Aprovado em homologação.'),
    ],
  },
  {
    id: 'TA-006',
    titulo: 'Relatório mensal de vendas',
    descricao: 'Consolidar dados de vendas de julho e gerar relatório executivo em PDF.',
    responsavelId: 'ana',
    criadorId: 'carlos',
    prioridade: 'media',
    prazo: '2026-07-31',
    status: 'FINALIZADA',
    criadaEm: '2026-07-28T10:00:00',
    historico: [
      h('h8', '2026-07-28T14:00:00', 'Ana Costa', 'NOVA', 'RECEBIDA'),
      h('h9', '2026-07-29T09:00:00', 'Ana Costa', 'RECEBIDA', 'EM_EXECUCAO'),
      h('h10', '2026-07-30T17:30:00', 'Ana Costa', 'EM_EXECUCAO', 'CONCLUIDA'),
      h('h11', '2026-07-31T09:20:00', 'Carlos Mendes', 'CONCLUIDA', 'FINALIZADA'),
    ],
  },
  {
    id: 'TA-011',
    titulo: 'Otimizar consultas SQL lentas',
    descricao: 'Revisar índices e reescrever queries do painel de relatórios que excedem 3s.',
    responsavelId: 'lucas',
    criadorId: 'carlos',
    prioridade: 'alta',
    prazo: '2026-08-01',
    status: 'FINALIZADA',
    criadaEm: '2026-07-27T11:00:00',
    historico: [
      h('h12', '2026-07-27T13:00:00', 'Lucas Pereira', 'NOVA', 'RECEBIDA'),
      h('h13', '2026-07-28T08:30:00', 'Lucas Pereira', 'RECEBIDA', 'EM_EXECUCAO'),
      h('h14', '2026-07-31T16:00:00', 'Lucas Pereira', 'EM_EXECUCAO', 'CONCLUIDA'),
      h('h15', '2026-08-01T10:00:00', 'Carlos Mendes', 'CONCLUIDA', 'FINALIZADA'),
    ],
  },
  {
    id: 'TA-013',
    titulo: 'Análise de concorrência',
    descricao: 'Levantamento de funcionalidades e preços dos 5 principais concorrentes.',
    responsavelId: 'maria',
    criadorId: 'carlos',
    prioridade: 'media',
    prazo: '2026-07-30',
    status: 'FINALIZADA',
    criadaEm: '2026-07-25T09:00:00',
    historico: [
      h('h16', '2026-07-25T15:00:00', 'Maria Souza', 'NOVA', 'RECEBIDA'),
      h('h17', '2026-07-28T09:00:00', 'Maria Souza', 'RECEBIDA', 'EM_EXECUCAO'),
      h('h18', '2026-07-30T12:00:00', 'Maria Souza', 'EM_EXECUCAO', 'CONCLUIDA'),
      h('h19', '2026-07-30T15:00:00', 'Carlos Mendes', 'CONCLUIDA', 'FINALIZADA'),
    ],
  },

  // ── EM EXECUÇÃO (2 atrasadas) ───────────────────────────────
  {
    id: 'TA-008',
    titulo: 'Migração de servidor de produção',
    descricao: 'Migrar aplicação e banco para o novo servidor com janela de manutenção de 2h.',
    responsavelId: 'lucas',
    criadorId: 'carlos',
    prioridade: 'alta',
    prazo: '2026-07-30',
    status: 'EM_EXECUCAO',
    criadaEm: '2026-07-24T10:00:00',
    historico: [
      h('h20', '2026-07-24T11:00:00', 'Lucas Pereira', 'NOVA', 'RECEBIDA'),
      h('h21', '2026-07-25T09:30:00', 'Lucas Pereira', 'RECEBIDA', 'EM_EXECUCAO'),
    ],
  },
  {
    id: 'TA-016',
    titulo: 'Correções de segurança no app',
    descricao: 'Aplicar correções de vulnerabilidades apontadas no pentest antes do release.',
    responsavelId: 'joao',
    criadorId: 'carlos',
    prioridade: 'critica',
    prazo: '2026-08-05',
    status: 'EM_EXECUCAO',
    criadaEm: '2026-07-30T09:00:00',
    historico: [
      h('h22', '2026-07-30T10:00:00', 'João Silva', 'NOVA', 'RECEBIDA'),
      h('h23', '2026-08-01T08:00:00', 'João Silva', 'RECEBIDA', 'EM_EXECUCAO'),
    ],
  },
  {
    id: 'TA-002',
    titulo: 'Revisar layout do dashboard',
    descricao: 'Ajustar hierarquia visual, espaçamentos e estados vazios do novo dashboard.',
    responsavelId: 'pedro',
    criadorId: 'carlos',
    prioridade: 'media',
    prazo: '2026-08-06',
    status: 'EM_EXECUCAO',
    criadaEm: '2026-08-01T13:00:00',
    historico: [
      h('h24', '2026-08-01T14:00:00', 'Pedro Oliveira', 'NOVA', 'RECEBIDA'),
      h('h25', '2026-08-02T09:00:00', 'Pedro Oliveira', 'RECEBIDA', 'EM_EXECUCAO'),
    ],
  },

  // ── CONCLUÍDAS (aguardando aprovação) ───────────────────────
  {
    id: 'TA-003',
    titulo: 'Criar campanha de e-mail',
    descricao: 'Estruturar e-mail marketing de lançamento com segmentação por perfil de cliente.',
    responsavelId: 'maria',
    criadorId: 'carlos',
    prioridade: 'alta',
    prazo: '2026-08-02',
    status: 'CONCLUIDA',
    criadaEm: '2026-07-29T09:00:00',
    historico: [
      h('h26', '2026-07-29T10:00:00', 'Maria Souza', 'NOVA', 'RECEBIDA'),
      h('h27', '2026-07-30T09:00:00', 'Maria Souza', 'RECEBIDA', 'EM_EXECUCAO'),
      h('h28', '2026-08-02T16:30:00', 'Maria Souza', 'EM_EXECUCAO', 'CONCLUIDA', 'status', 'Aguardando revisão do conteúdo.'),
    ],
  },
  {
    id: 'TA-009',
    titulo: 'Landing page do novo produto',
    descricao: 'Criar página de destino com seções de benefícios, prova social e formulário de contato.',
    responsavelId: 'pedro',
    criadorId: 'carlos',
    prioridade: 'media',
    prazo: '2026-08-04',
    status: 'CONCLUIDA',
    criadaEm: '2026-07-28T09:00:00',
    historico: [
      h('h29', '2026-07-28T10:00:00', 'Pedro Oliveira', 'NOVA', 'RECEBIDA'),
      h('h30', '2026-07-29T09:00:00', 'Pedro Oliveira', 'RECEBIDA', 'EM_EXECUCAO'),
      h('h31', '2026-08-03T11:00:00', 'Pedro Oliveira', 'EM_EXECUCAO', 'CONCLUIDA'),
    ],
  },
  {
    id: 'TA-015',
    titulo: 'Base de conhecimento de suporte',
    descricao: 'Escrever artigos das 10 dúvidas mais frequentes e publicar no portal.',
    responsavelId: 'ana',
    criadorId: 'carlos',
    prioridade: 'baixa',
    prazo: '2026-08-07',
    status: 'CONCLUIDA',
    criadaEm: '2026-07-26T09:00:00',
    historico: [
      h('h32', '2026-07-26T11:00:00', 'Ana Costa', 'NOVA', 'RECEBIDA'),
      h('h33', '2026-07-27T09:00:00', 'Ana Costa', 'RECEBIDA', 'EM_EXECUCAO'),
      h('h34', '2026-08-03T10:00:00', 'Ana Costa', 'EM_EXECUCAO', 'CONCLUIDA'),
    ],
  },

  // ── DEVOLVIDAS (1 atrasada) ─────────────────────────────────
  {
    id: 'TA-007',
    titulo: 'Pesquisa de satisfação do cliente',
    descricao: 'Elaborar questionário NPS, distribuir para a base e compilar resultados.',
    responsavelId: 'maria',
    criadorId: 'carlos',
    prioridade: 'baixa',
    prazo: '2026-07-31',
    status: 'DEVOLVIDA',
    criadaEm: '2026-07-22T09:00:00',
    historico: [
      h('h35', '2026-07-22T10:00:00', 'Maria Souza', 'NOVA', 'RECEBIDA'),
      h('h36', '2026-07-23T09:00:00', 'Maria Souza', 'RECEBIDA', 'EM_EXECUCAO'),
      h('h37', '2026-07-30T15:00:00', 'Maria Souza', 'EM_EXECUCAO', 'CONCLUIDA'),
      h('h38', '2026-07-31T09:00:00', 'Carlos Mendes', 'CONCLUIDA', 'DEVOLVIDA', 'status', 'Incluir gráfico comparativo com trimestre anterior.'),
    ],
  },
  {
    id: 'TA-014',
    titulo: 'Novo fluxo de onboarding',
    descricao: 'Desenhar fluxo de boas-vindas do app com dicas contextuais nas 3 primeiras sessões.',
    responsavelId: 'pedro',
    criadorId: 'carlos',
    prioridade: 'alta',
    prazo: '2026-08-08',
    status: 'DEVOLVIDA',
    criadaEm: '2026-07-24T09:00:00',
    historico: [
      h('h39', '2026-07-24T10:00:00', 'Pedro Oliveira', 'NOVA', 'RECEBIDA'),
      h('h40', '2026-07-27T09:00:00', 'Pedro Oliveira', 'RECEBIDA', 'EM_EXECUCAO'),
      h('h41', '2026-08-02T14:00:00', 'Pedro Oliveira', 'EM_EXECUCAO', 'CONCLUIDA'),
      h('h42', '2026-08-03T09:30:00', 'Carlos Mendes', 'CONCLUIDA', 'DEVOLVIDA', 'status', 'Reduzir para 3 dicas e adicionar skip.'),
    ],
  },

  // ── RECEBIDAS ───────────────────────────────────────────────
  {
    id: 'TA-004',
    titulo: 'Atualizar documentação da API',
    descricao: 'Atualizar endpoints novos e exemplos de resposta na documentação pública.',
    responsavelId: 'lucas',
    criadorId: 'carlos',
    prioridade: 'baixa',
    prazo: '2026-08-10',
    status: 'RECEBIDA',
    criadaEm: '2026-08-02T09:00:00',
    historico: [h('h43', '2026-08-02T15:00:00', 'Lucas Pereira', 'NOVA', 'RECEBIDA')],
  },
  {
    id: 'TA-012',
    titulo: 'Integração com gateway de pagamento',
    descricao: 'Conectar API do gateway, tratar webhooks e mapear códigos de erro.',
    responsavelId: 'joao',
    criadorId: 'carlos',
    prioridade: 'critica',
    prazo: '2026-08-12',
    status: 'RECEBIDA',
    criadaEm: '2026-08-02T11:00:00',
    historico: [h('h44', '2026-08-02T16:00:00', 'João Silva', 'NOVA', 'RECEBIDA')],
  },

  // ── NOVAS ───────────────────────────────────────────────────
  {
    id: 'TA-005',
    titulo: 'Corrigir bug de checkout',
    descricao: 'Erro 500 ao aplicar cupom com valor superior ao total do carrinho.',
    responsavelId: 'joao',
    criadorId: 'carlos',
    prioridade: 'critica',
    prazo: '2026-08-04',
    status: 'NOVA',
    criadaEm: '2026-08-03T08:00:00',
    historico: [],
  },
  {
    id: 'TA-010',
    titulo: 'Treinamento da equipe de suporte',
    descricao: 'Preparar e ministrar treinamento sobre os novos fluxos do painel administrativo.',
    responsavelId: 'ana',
    criadorId: 'carlos',
    prioridade: 'baixa',
    prazo: '2026-08-15',
    status: 'NOVA',
    criadaEm: '2026-08-03T09:00:00',
    historico: [],
  },
];
