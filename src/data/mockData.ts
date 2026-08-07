import type { HistoryEntry, Task } from '../types';
import { generateSeedTasks } from '../utils/seedGenerator';

const h = (
  id: string,
  dataHora: string,
  statusAnterior: HistoryEntry['statusAnterior'],
  novoStatus: HistoryEntry['novoStatus'],
  tipo: HistoryEntry['tipo'] = 'status',
  observacao?: string
): HistoryEntry => ({ id, dataHora, statusAnterior, novoStatus, tipo, observacao });

export const TAREFAS: Task[] = [
  // ── CAIXA DE ENTRADA ───────────────────────────────────────
  {
    id: 'TA-001',
    titulo: 'Ler e-mails pendentes',
    descricao: 'Revisar a caixa de entrada e responder as mensagens urgentes.',
    prioridade: 'media',
    prazo: '2026-08-06',
    status: 'CAIXA_ENTRADA',
    categoria: 'Administrativo',
    criadaEm: '2026-08-05T08:00:00',
    historico: [],
  },
  {
    id: 'TA-002',
    titulo: 'Planejar escopo do próximo mês',
    descricao: 'Definir prioridades e metas de setembro.',
    prioridade: 'alta',
    prazo: '2026-08-15',
    status: 'CAIXA_ENTRADA',
    criadaEm: '2026-08-05T09:30:00',
    historico: [],
  },
  {
    id: 'TA-003',
    titulo: 'Corrigir bug de checkout',
    descricao: 'Erro 500 ao aplicar cupom com valor superior ao total do carrinho.',
    prioridade: 'critica',
    prazo: '2026-08-07',
    status: 'CAIXA_ENTRADA',
    categoria: 'Desenvolvimento',
    projeto: 'Lançamento 2.0',
    tags: ['bug', 'crítico'],
    criadaEm: '2026-08-04T08:00:00',
    historico: [],
  },

  // ── A FAZER ─────────────────────────────────────────────────
  {
    id: 'TA-004',
    titulo: 'Atualizar documentação da API',
    descricao: 'Atualizar endpoints novos e exemplos de resposta na documentação pública.',
    prioridade: 'baixa',
    prazo: '2026-08-10',
    status: 'A_FAZER',
    categoria: 'Documentação',
    tags: ['docs', 'api'],
    criadaEm: '2026-08-03T09:00:00',
    historico: [h('h1', '2026-08-03T10:00:00', 'CAIXA_ENTRADA', 'A_FAZER')],
  },

  // ── EM ANDAMENTO (1 atrasada) ───────────────────────────────
  {
    id: 'TA-005',
    titulo: 'Migração de servidor de produção',
    descricao: 'Migrar aplicação e banco para o novo servidor com janela de manutenção de 2h.',
    prioridade: 'alta',
    prazo: '2026-08-04',
    status: 'EM_ANDAMENTO',
    projeto: 'Infraestrutura',
    criadaEm: '2026-08-01T10:00:00',
    historico: [
      h('h2', '2026-08-01T11:00:00', 'CAIXA_ENTRADA', 'A_FAZER'),
      h('h3', '2026-08-02T09:30:00', 'A_FAZER', 'EM_ANDAMENTO'),
    ],
  },
  {
    id: 'TA-006',
    titulo: 'Revisar layout do dashboard',
    descricao: 'Ajustar hierarquia visual, espaçamentos e estados vazios do novo dashboard.',
    prioridade: 'media',
    prazo: '2026-08-08',
    status: 'EM_ANDAMENTO',
    categoria: 'Design',
    tags: ['ui', 'ux'],
    criadaEm: '2026-08-02T13:00:00',
    historico: [
      h('h4', '2026-08-02T14:00:00', 'CAIXA_ENTRADA', 'A_FAZER'),
      h('h5', '2026-08-03T09:00:00', 'A_FAZER', 'EM_ANDAMENTO'),
    ],
  },

  // ── CONCLUÍDAS ──────────────────────────────────────────────
  {
    id: 'TA-007',
    titulo: 'Implementar módulo de login',
    descricao: 'Criar fluxo de autenticação com validação de e-mail e sessão persistente.',
    prioridade: 'alta',
    prazo: '2026-08-03',
    status: 'CONCLUIDA',
    categoria: 'Desenvolvimento',
    projeto: 'Plataforma',
    tags: ['auth', 'segurança'],
    criadaEm: '2026-08-01T07:45:00',
    concluidaEm: '2026-08-03T15:40:00',
    historico: [
      h('h6', '2026-08-01T08:30:00', 'CAIXA_ENTRADA', 'A_FAZER'),
      h('h7', '2026-08-02T09:15:00', 'A_FAZER', 'EM_ANDAMENTO'),
      h('h8', '2026-08-03T15:40:00', 'EM_ANDAMENTO', 'CONCLUIDA'),
    ],
  },
  {
    id: 'TA-008',
    titulo: 'Relatório mensal de vendas',
    descricao: 'Consolidar dados de vendas de julho e gerar relatório executivo em PDF.',
    prioridade: 'media',
    prazo: '2026-08-01',
    status: 'CONCLUIDA',
    categoria: 'Financeiro',
    criadaEm: '2026-07-29T10:00:00',
    concluidaEm: '2026-08-01T17:30:00',
    historico: [
      h('h9', '2026-07-29T14:00:00', 'CAIXA_ENTRADA', 'A_FAZER'),
      h('h10', '2026-07-30T09:00:00', 'A_FAZER', 'EM_ANDAMENTO'),
      h('h11', '2026-08-01T17:30:00', 'EM_ANDAMENTO', 'CONCLUIDA'),
    ],
  },

  // ── GERADAS (últimos 30 dias, determinístico) ───────────────
  ...generateSeedTasks(),
];
