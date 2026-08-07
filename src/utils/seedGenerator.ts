import type { HistoryEntry, Priority, Task, TaskStatus } from '../types';

/**
 * Gera tarefas fictícias determinísticas simulando uso diário nos últimos 30 dias
 * (06/07/2026 → 05/08/2026). Complementa o seed base (TA-001..TA-008), que é mantido
 * verbatim no mockData. Cobre todos os status GTD e prioridades, com favoritos e cancelamentos.
 */

const SEED_NUMBER = 20260806;

const START = new Date(2026, 6, 6);
const END = new Date(2026, 7, 5);

const WORKING_DAYS: Date[] = (() => {
  const days: Date[] = [];
  const d = new Date(START);
  while (d <= END) {
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
})();

const PRIORITY_PLAN: Priority[] = ['baixa', 'media', 'alta', 'critica', 'media', 'alta'];

const STATUS_COUNTS: Record<TaskStatus, number> = {
  CAIXA_ENTRADA: 10,
  A_FAZER: 10,
  EM_ANDAMENTO: 12,
  CONCLUIDA: 12,
  CANCELADA: 6,
};

interface CategoriaPool {
  titulos: string[];
  descricoes: string[];
  tags: string[];
}

const POOLS: Record<string, CategoriaPool> = {
  Desenvolvimento: {
    titulos: [
      'Corrigir erro de validação no cadastro',
      'Implementar endpoint de notificações',
      'Atualizar dependências de segurança',
      'Refatorar serviço de autenticação',
      'Criar testes de integração para a API',
      'Otimizar carregamento do feed',
      'Corrigir layout quebrado no mobile',
      'Adicionar paginação na listagem',
    ],
    descricoes: [
      'Validar cenários de borda e garantir mensagens de erro claras.',
      'Seguir o contrato da API e cobrir com testes.',
      'Revisar changelog e rodar a suíte completa.',
      'Manter compatibilidade com o fluxo atual.',
      'Cobrir os principais casos de uso e regressões.',
      'Reduzir o tempo de resposta percebido.',
      'Testar em resoluções pequenas e grandes.',
      'Ajustar o componente e a ordenação existente.',
    ],
    tags: ['api', 'testes', 'frontend', 'backend', 'bug'],
  },
  Marketing: {
    titulos: [
      'Produzir conteúdo para redes sociais',
      'Planejar campanha de inverno',
      'Analisar métricas da última campanha',
      'Atualizar site institucional',
      'Criar peças para divulgação',
      'Revisar e-mail de lançamento',
    ],
    descricoes: [
      'Alinhar tom com a identidade da marca.',
      'Definir segmentação e calendário de posts.',
      'Compilar relatório com aprendizados.',
      'Publicar novos textos de produto.',
      'Preparar versões para os canais de mídia.',
      'Ajustar copy e testar envio.',
    ],
    tags: ['conteúdo', 'campanha', 'redes', 'email'],
  },
  Suporte: {
    titulos: [
      'Atender chamados pendentes',
      'Atualizar manual de suporte',
      'Investigar erro reportado por cliente',
      'Criar FAQ de integração',
      'Treinar novo analista de suporte',
    ],
    descricoes: [
      'Priorizar por impacto e responder no prazo.',
      'Refletir os novos fluxos do produto.',
      'Reproduzir o cenário e documentar a causa.',
      'Reunir as dúvidas mais frequentes.',
      'Acompanhar os primeiros atendimentos.',
    ],
    tags: ['chamado', 'faq', 'manual'],
  },
  Design: {
    titulos: [
      'Redesenhar tela de login',
      'Criar protótipo do novo dashboard',
      'Revisar identidade visual do app',
      'Ajustar espaçamentos do checkout',
      'Criar ícones da nova versão',
    ],
    descricoes: [
      'Aplicar o novo guia de estilos.',
      'Validar com o time antes do desenvolvimento.',
      'Alinhar cores e tipografia.',
      'Melhorar hierarquia visual.',
      'Exportar em todos os tamanhos.',
    ],
    tags: ['ui', 'ux', 'protótipo'],
  },
  Infraestrutura: {
    titulos: [
      'Provisionar servidor de staging',
      'Configurar monitoramento de logs',
      'Rotacionar certificados SSL',
      'Migrar banco de desenvolvimento',
      'Revisar política de backups',
    ],
    descricoes: [
      'Documentar credenciais no cofre.',
      'Definir alertas e dashboard.',
      'Programar renovação automática.',
      'Validar dados após a migração.',
      'Testar restauração em ambiente de teste.',
    ],
    tags: ['infra', 'ssl', 'backup', 'logs'],
  },
  Documentação: {
    titulos: [
      'Escrever documentação da nova API',
      'Atualizar guia de instalação',
      'Revisar docs de arquitetura',
      'Criar tutorial de configuração',
    ],
    descricoes: [
      'Cobrir autenticação e exemplos de uso.',
      'Incluir os novos requisitos do sistema.',
      'Corrigir diagramas desatualizados.',
      'Passo a passo com capturas de tela.',
    ],
    tags: ['docs', 'api'],
  },
  Treinamento: {
    titulos: [
      'Preparar treinamento de onboarding',
      'Criar material do workshop',
      'Gravar vídeo de demonstração',
      'Agendar sessão de treinamento',
    ],
    descricoes: [
      'Estruturar em módulos e exercícios.',
      'Disponibilizar no drive do time.',
      'Legendar e publicar no portal.',
      'Confirmar presença dos participantes.',
    ],
    tags: ['onboarding', 'workshop'],
  },
  Vendas: {
    titulos: [
      'Atualizar proposta comercial',
      'Revisar contrato de renovação',
      'Preparar relatório de vendas do mês',
      'Qualificar leads do funil',
    ],
    descricoes: [
      'Ajustar valores e condições de pagamento.',
      'Conferir cláusulas com o jurídico.',
      'Consolidar dados de todos os vendedores.',
      'Classificar por intenção de compra.',
    ],
    tags: ['proposta', 'contrato', 'leads'],
  },
  Financeiro: {
    titulos: [
      'Conciliar notas fiscais de julho',
      'Atualizar planilha de despesas',
      'Revisar orçamento do trimestre',
      'Preparar pagamentos de fornecedores',
    ],
    descricoes: [
      'Conferir divergências com o sistema.',
      'Lançar os comprovantes recebidos.',
      'Comparar realizado com o planejado.',
      'Agendar transferências dentro do prazo.',
    ],
    tags: ['nfs', 'despesas', 'orçamento'],
  },
};

const CATEGORIAS = Object.keys(POOLS);

/** PRNG determinístico (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function addBusinessDays(d: Date, n: number): Date {
  const out = new Date(d);
  let added = 0;
  while (added < n) {
    out.setDate(out.getDate() + 1);
    if (out.getDay() !== 0 && out.getDay() !== 6) added++;
  }
  return out;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function padId(n: number): string {
  return String(n).padStart(3, '0');
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function horaUtil(rng: () => number, inicio = 8, fim = 17): number {
  return randInt(rng, inicio, fim);
}

function busy(d: Date, rng: () => number): Date {
  d.setHours(horaUtil(rng), randInt(rng, 0, 59), 0, 0);
  return d;
}

function entry(
  id: string,
  dataHora: string,
  statusAnterior: TaskStatus | null,
  novoStatus: TaskStatus | null,
  tipo: HistoryEntry['tipo'],
  observacao?: string
): HistoryEntry {
  return { id, dataHora, statusAnterior, novoStatus, tipo, observacao };
}

const OBS_CANCELAMENTO = [
  'Prioridade deslocada para outra frente.',
  'Escopo absorvido por outra tarefa.',
  'Solicitação não se aplica mais.',
  'Duplicado de iniciativa já entregue.',
];

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface Passo {
  status: TaskStatus;
  observacao?: string;
}

interface Plano {
  status: TaskStatus;
  passos: Passo[];
}

function planoDaTarefa(status: TaskStatus, rng: () => number): Plano {
  const passos: Passo[] = [];
  const trans = (novo: TaskStatus, obs?: string): Passo => ({ status: novo, observacao: obs });
  switch (status) {
    case 'CAIXA_ENTRADA':
      return { status, passos };
    case 'A_FAZER':
      return { status, passos: [trans('A_FAZER')] };
    case 'EM_ANDAMENTO':
      return { status, passos: [trans('A_FAZER'), trans('EM_ANDAMENTO')] };
    case 'CONCLUIDA':
      return {
        status,
        passos: [trans('A_FAZER'), trans('EM_ANDAMENTO'), trans('CONCLUIDA')],
      };
    case 'CANCELADA': {
      const fonte = pick(rng, ['CAIXA_ENTRADA', 'A_FAZER', 'EM_ANDAMENTO'] as const);
      if (fonte === 'CAIXA_ENTRADA')
        return { status, passos: [trans('CANCELADA', pick(rng, OBS_CANCELAMENTO))] };
      if (fonte === 'A_FAZER')
        return {
          status,
          passos: [trans('A_FAZER'), trans('CANCELADA', pick(rng, OBS_CANCELAMENTO))],
        };
      return {
        status,
        passos: [
          trans('A_FAZER'),
          trans('EM_ANDAMENTO'),
          trans('CANCELADA', pick(rng, OBS_CANCELAMENTO)),
        ],
      };
    }
  }
}

function idxCriacao(status: TaskStatus, rng: () => number): number {
  const max = WORKING_DAYS.length;
  switch (status) {
    case 'CAIXA_ENTRADA':
      return randInt(rng, Math.max(0, max - 5), max - 1);
    case 'A_FAZER':
      return randInt(rng, Math.max(0, max - 10), max - 1);
    case 'CONCLUIDA':
    case 'CANCELADA':
      return randInt(rng, Math.max(0, max - 20), max - 1);
    case 'EM_ANDAMENTO':
    default:
      return randInt(rng, 0, max - 1);
  }
}

/** Monta o histórico cronológico a partir do plano e do momento de criação. */
function montarHistorico(
  plano: Plano,
  criadaEm: Date,
  rng: () => number,
  index: number
): HistoryEntry[] {
  const historico: HistoryEntry[] = [
    entry(`${index}-0`, iso(criadaEm), null, 'CAIXA_ENTRADA', 'status', 'Tarefa criada.'),
  ];
  let atual = criadaEm;
  plano.passos.forEach((passo, i) => {
    atual = addBusinessDays(atual, randInt(rng, 1, 3));
    atual = busy(atual, rng);
    const anterior = i === 0 ? 'CAIXA_ENTRADA' : plano.passos[i - 1].status;
    historico.push(
      entry(`${index}-${i + 1}`, iso(atual), anterior, passo.status, 'status', passo.observacao)
    );
  });
  return historico;
}

export function generateSeedTasks(): Task[] {
  const rng = mulberry32(SEED_NUMBER);

  const statuses: TaskStatus[] = [];
  for (const [status, qtd] of Object.entries(STATUS_COUNTS) as [TaskStatus, number][]) {
    for (let i = 0; i < qtd; i++) statuses.push(status);
  }
  shuffle(rng, statuses);

  let idNum = 9;
  return statuses.map((status, index) => {
    const prioridade = pick(rng, PRIORITY_PLAN);
    const criada = new Date(WORKING_DAYS[idxCriacao(status, rng)]);
    criada.setHours(horaUtil(rng, 8, 11), randInt(rng, 0, 59), 0, 0);

    const plano = planoDaTarefa(status, rng);
    const historico = montarHistorico(plano, criada, rng, index);

    const categoria = rng() < 0.75 ? pick(rng, CATEGORIAS) : undefined;
    const pool = categoria ? POOLS[categoria] : undefined;
    const titulo = pool ? pick(rng, pool.titulos) : pick(rng, POOLS.Desenvolvimento.titulos);
    const descricao = pool ? pick(rng, pool.descricoes) : pick(rng, POOLS.Desenvolvimento.descricoes);
    const tags =
      pool && rng() < 0.6
        ? shuffle(rng, [...pool.tags]).slice(0, randInt(rng, 1, Math.min(3, pool.tags.length)))
        : undefined;

    const semPrazo = rng() < 0.12;
    const prazo = semPrazo
      ? null
      : iso((() => {
          const p = addBusinessDays(new Date(criada), randInt(rng, 5, 25));
          p.setHours(0, 0, 0, 0);
          return p;
        })()).slice(0, 10);

    const atualizadaEm = historico[historico.length - 1].dataHora;
    const concluidaEm =
      status === 'CONCLUIDA'
        ? [...historico].reverse().find((h) => h.novoStatus === 'CONCLUIDA')?.dataHora
        : undefined;

    const task: Task = {
      id: `TA-${padId(idNum)}`,
      titulo,
      descricao,
      prioridade,
      prazo,
      status,
      ...(rng() < 0.1 ? { favorita: true } : {}),
      ...(categoria ? { categoria } : {}),
      ...(tags && tags.length > 0 ? { tags } : {}),
      criadaEm: iso(criada),
      ...(atualizadaEm && atualizadaEm !== iso(criada) ? { atualizadaEm } : {}),
      ...(concluidaEm ? { concluidaEm } : {}),
      historico,
    };
    idNum++;
    return task;
  });
}

export const SEED_EXTRA_COUNT = Object.values(STATUS_COUNTS).reduce((a, b) => a + b, 0);
