# App de Tarefas Pessoal (usuário único) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Revisão (06/08/2026):** corrigidas as referências cruzadas dos testes (Fase 7 → Fase 6, com a numeração certa das Tasks 33-41); comandos da Task 32 adaptados ao bash (sem `src/utils/perfis.ts`, que não existe no projeto); faixas de linha das Tasks 9, 21, 28 e 37 atualizadas; padrões do `rg` final da Task 41 ampliados (inclui `findUser` e as funções de `permissions.ts`); nota sobre asserções dependentes do seed na Task 34; import de `vi` e asserção de criação do TaskFormModal corrigidos (Tasks 38 e 40); metas de compilação ajustadas ao `tsconfig.json`, que inclui os testes — o build só passa na Task 41.

**Goal:** Converter o app multiusuário em um app pessoal de tarefas de usuário único, com fluxo GTD (Caixa de entrada → A fazer → Em andamento → Concluída + Cancelada), removendo toda a camada de usuários/perfis/permissões.

**Architecture:** O trabalho segue a especificação `docs/superpowers/specs/2026-08-06-app-pessoal-design.md`. Primeiro a camada de domínio (tipos, status, filtros, histórico, persistência, seed), depois o estado global (reducer/context), depois os componentes de UI (remoção da camada multiusuário e novo fluxo de status), por fim os testes. O `tsconfig.json` inclui `src` inteiro (`"include": ["src"]`), então o `tsc` também checa os arquivos de teste; por isso `npm run build` só passa de fato na Task 41 (após a Fase 6 reescrever os testes) e `npm test` só fica verde na Fase 6 (Tasks 33-41). Cada fase termina com um checkpoint de `npm run build` cujos erros remanescentes esperados (incluindo os testes antigos) estão descritos no passo de verificação da fase.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind, lucide-react, Vitest + Testing Library. Sem novas dependências.

**Notas de convenção (ler antes):**
- Verificação: `npm run build` nos checkpoints de fase (ver o passo de verificação de cada fase); `npm test` a partir da Fase 6 — os testes antigos quebram com a mudança de tipos e são reescritos nas Tasks 33-41.
- Status GTD: `CAIXA_ENTRADA → A_FAZER → EM_ANDAMENTO → CONCLUIDA`; `CANCELADA` a partir de qualquer status não-terminal; `CONCLUIDA → EM_ANDAMENTO` (retomar).
- Histórico **perde** o campo `usuario`. Ações do reducer **perdem** o campo `usuario`.
- `src/types.ts` é a fonte da verdade; o TypeScript (`npm run build`) acusa qualquer referência remanescente a `responsavelId`, `criadorId`, `currentUserId`, `Section`, `Role`, `Permission`, `Colaborador`, `NOME_POR_ID`, etc.

---

## Fase 1 — Domínio (tipos e utilitários)

### Task 1: Reescrever `src/types.ts`

**Files:**
- Rewrite: `src/types.ts`

- [x] **Step 1: Substituir o conteúdo de `src/types.ts`**

```ts
export type TaskStatus =
  | 'CAIXA_ENTRADA'
  | 'A_FAZER'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type Priority = 'baixa' | 'media' | 'alta' | 'critica';
export type TaskView = 'lista' | 'quadro';
export type PrazoFilter = 'todas' | 'hoje' | 'vencidas' | 'proximos7' | 'semPrazo';
export type TaskSort = 'criadaEm' | 'titulo' | 'prazo' | 'prioridade';

export interface HistoryEntry {
  id: string;
  dataHora: string; // ISO
  statusAnterior: TaskStatus | null;
  novoStatus: TaskStatus | null;
  tipo: 'status' | 'info';
  observacao?: string;
}

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: Priority;
  prazo: string | null; // ISO date (yyyy-mm-dd)
  status: TaskStatus;
  favorita?: boolean; // padrão: false
  categoria?: string; // string livre; undefined = sem categoria
  tags?: string[]; // strings livres; padrão: []
  criadaEm: string; // ISO datetime
  atualizadaEm?: string; // ISO datetime
  concluidaEm?: string; // ISO datetime (última vez que entrou em CONCLUIDA)
  historico: HistoryEntry[];
}

export interface Filters {
  search: string;
  status: TaskStatus[];
  prioridade: Priority[];
  prazo: PrazoFilter;
  favoritas: boolean;
  categorias: string[];
  sortBy: TaskSort | null; // null = ordem original (do seed)
}

export type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; taskId: string }
  | { type: 'detail'; taskId: string }
  | { type: 'cancel'; taskId: string }
  | { type: 'history'; taskId: string };
```

- [x] **Step 2: Verificar compilação de referências** — nada a rodar ainda (demais arquivos quebram); o build será validado ao final da Fase 1.

---

### Task 2: Reescrever `src/utils/status.ts`

**Files:**
- Rewrite: `src/utils/status.ts`
- Test: `src/utils/status.test.ts` (reescrito na Fase 6, Task 33)

- [x] **Step 1: Substituir o conteúdo de `src/utils/status.ts`**

```ts
import type { Priority, TaskStatus } from '../types';

export const STATUS_ORDER: TaskStatus[] = [
  'CAIXA_ENTRADA',
  'A_FAZER',
  'EM_ANDAMENTO',
  'CONCLUIDA',
  'CANCELADA',
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  CAIXA_ENTRADA: 'Caixa de entrada',
  A_FAZER: 'A fazer',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const PRIORITY_RANK: Record<Priority, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

export const TRANSITIONS: { from: TaskStatus; to: TaskStatus }[] = [
  { from: 'CAIXA_ENTRADA', to: 'A_FAZER' },
  { from: 'A_FAZER', to: 'EM_ANDAMENTO' },
  { from: 'EM_ANDAMENTO', to: 'CONCLUIDA' },
  { from: 'CAIXA_ENTRADA', to: 'CANCELADA' },
  { from: 'A_FAZER', to: 'CANCELADA' },
  { from: 'EM_ANDAMENTO', to: 'CANCELADA' },
  { from: 'CONCLUIDA', to: 'EM_ANDAMENTO' },
];

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.to === to);
}

export function transicoesDisponiveis(status: TaskStatus): TaskStatus[] {
  return TRANSITIONS.filter((t) => t.from === status).map((t) => t.to);
}
```

- [x] **Step 2: Nota** — `roleOf`, `podeReatribuir`, `proximoPasso` e a importação de `mockData` foram removidos; qualquer importação deles quebrará o `tsc` e será corrigida nas tasks seguintes.

---

### Task 3: Ajustar `src/utils/date.ts`

**Files:**
- Modify: `src/utils/date.ts:29-37`
- Test: `src/utils/date.test.ts:29-53` (ajustado na Fase 6, Task 37)

- [x] **Step 1: Atualizar `isOverdue` para os novos status**

```ts
export function isOverdue(
  prazo: string | null,
  status: TaskStatus,
  now: Date = new Date()
): boolean {
  if (!prazo || status === 'CONCLUIDA' || status === 'CANCELADA') return false;
  return parsePrazo(prazo) < startOfToday(now);
}
```

(Substitui as linhas 29-37; `FINALIZADA` e `DEVOLVIDA` não existem mais. `diasDesde`, `idadeRelativa`, `isDueToday`, `isWithinDays`, `formatDate`, `formatDateTime` permanecem inalterados.)

---

### Task 4: Ajustar `src/utils/history.ts`

**Files:**
- Rewrite: `src/utils/history.ts`

- [x] **Step 1: Substituir o conteúdo de `src/utils/history.ts`**

```ts
import type { HistoryEntry, TaskStatus } from '../types';

/** Cria uma entrada de histórico com id único e timestamp atual. Sem campo autor (app pessoal). */
export function newHistoryEntry(
  statusAnterior: TaskStatus | null,
  novoStatus: TaskStatus | null,
  tipo: HistoryEntry['tipo'],
  observacao?: string
): HistoryEntry {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dataHora: new Date().toISOString(),
    statusAnterior,
    novoStatus,
    tipo,
    observacao,
  };
}
```

---

### Task 5: Reescrever `src/utils/tasks.ts`

**Files:**
- Rewrite: `src/utils/tasks.ts`
- Test: `src/utils/tasks.test.ts` (reescrito na Fase 6, Task 34)

- [x] **Step 1: Substituir o conteúdo de `src/utils/tasks.ts`**

```ts
import type { Filters, Priority, Task, TaskSort, TaskStatus } from '../types';
import { isDueToday, isOverdue, isWithinDays } from './date';
import { PRIORITY_RANK } from './status';
import { newHistoryEntry } from './history';

export const EMPTY_FILTERS: Filters = {
  search: '',
  status: [],
  prioridade: [],
  prazo: 'todas',
  favoritas: false,
  categorias: [],
  sortBy: null,
};

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.status.length > 0 ||
    filters.prioridade.length > 0 ||
    filters.prazo !== 'todas' ||
    filters.favoritas ||
    filters.categorias.length > 0
  );
}

const SORTERS: Record<TaskSort, (a: Task, b: Task) => number> = {
  criadaEm: (a, b) => a.criadaEm.localeCompare(b.criadaEm),
  titulo: (a, b) => a.titulo.localeCompare(b.titulo),
  prazo: (a, b) => (a.prazo ?? '').localeCompare(b.prazo ?? ''),
  prioridade: (a, b) => PRIORITY_RANK[a.prioridade] - PRIORITY_RANK[b.prioridade],
};

export function filterTasks(
  tasks: Task[],
  filters: Filters,
  now: Date = new Date()
): Task[] {
  const q = filters.search.trim().toLowerCase();
  const out = tasks.filter((t) => {
    if (q) {
      const hay = `${t.id} ${t.titulo} ${t.descricao}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(t.status)) return false;
    if (filters.prioridade.length > 0 && !filters.prioridade.includes(t.prioridade))
      return false;
    if (filters.favoritas && !t.favorita) return false;
    if (
      filters.categorias.length > 0 &&
      (!t.categoria || !filters.categorias.includes(t.categoria))
    )
      return false;
    if (filters.prazo === 'hoje' && !isDueToday(t.prazo, now)) return false;
    if (filters.prazo === 'vencidas' && !isOverdue(t.prazo, t.status, now)) return false;
    if (filters.prazo === 'proximos7' && !isWithinDays(t.prazo, 7, now)) return false;
    if (filters.prazo === 'semPrazo' && t.prazo !== null) return false;
    return true;
  });
  if (filters.sortBy) return [...out].sort(SORTERS[filters.sortBy]);
  return out;
}

export interface Indicators {
  total: number;
  caixaEntrada: number;
  aFazer: number;
  emAndamento: number;
  concluidas: number;
  canceladas: number;
  atrasadas: number;
}

export function computeIndicators(tasks: Task[], now: Date = new Date()): Indicators {
  const counts: Record<TaskStatus, number> = {
    CAIXA_ENTRADA: 0,
    A_FAZER: 0,
    EM_ANDAMENTO: 0,
    CONCLUIDA: 0,
    CANCELADA: 0,
  };
  let atrasadas = 0;
  for (const t of tasks) {
    counts[t.status]++;
    if (isOverdue(t.prazo, t.status, now)) atrasadas++;
  }
  return {
    total: tasks.length,
    caixaEntrada: counts.CAIXA_ENTRADA,
    aFazer: counts.A_FAZER,
    emAndamento: counts.EM_ANDAMENTO,
    concluidas: counts.CONCLUIDA,
    canceladas: counts.CANCELADA,
    atrasadas,
  };
}

/** Gera o próximo id sequencial (TA-NNN) a partir das tarefas existentes. */
export function nextTaskId(tasks: Task[]): string {
  const maxNum = tasks.reduce((max, t) => {
    const n = Number(t.id.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  return `TA-${String(maxNum + 1).padStart(3, '0')}`;
}

export interface NewTaskInput {
  titulo: string;
  descricao: string;
  prioridade: Priority;
  prazo: string | null;
  categoria?: string;
  tags?: string[];
}

/**
 * Monta uma tarefa CAIXA_ENTRADA pronta para CREATE_TASK: id sequencial, timestamps
 * e entrada de histórico de criação. Usado pelo TaskFormModal.
 */
export function createTask(tasks: Task[], input: NewTaskInput): Task {
  const agora = new Date().toISOString();
  return {
    id: nextTaskId(tasks),
    titulo: input.titulo,
    descricao: input.descricao,
    prioridade: input.prioridade,
    prazo: input.prazo,
    status: 'CAIXA_ENTRADA',
    ...(input.categoria ? { categoria: input.categoria } : {}),
    ...(input.tags && input.tags.length > 0 ? { tags: input.tags } : {}),
    criadaEm: agora,
    historico: [newHistoryEntry(null, 'CAIXA_ENTRADA', 'status', 'Tarefa criada.')],
  };
}
```

- [x] **Step 2: Nota** — foram removidos: `PARADAS_MIN_DIAS`, filtros `responsavel`/`paradas`/`comRetrabalho`, ordenação de fila de aprovação, `contarDevolucoes`, `diasAguardandoAprovacao`, `diasSemMovimentacao`, `ColaboradorMetrics`, `colaboradorMetrics`, `colaboradorResumo`, e o parâmetro `nomePorId` de `filterTasks`.

---

### Task 6: Reescrever `src/context/types.ts`

**Files:**
- Rewrite: `src/context/types.ts`

- [x] **Step 1: Substituir o conteúdo de `src/context/types.ts`**

```ts
import type { Filters, ModalState, Task, TaskStatus, TaskView } from '../types';

export interface AppState {
  tasks: Task[];
  view: TaskView;
  sidebarOpen: boolean;
  filters: Filters;
  kpiCollapsed: boolean; // indicadores recolhidos (persistido em localStorage)
  filtersOpen: boolean; // barra de filtros visível
  modal: ModalState;
  past: Task[][]; // pilha de estados anteriores (undo), não persistida
}

export type AppAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_VIEW'; view: TaskView }
  | { type: 'TOGGLE_KPI_COLLAPSED' }
  | { type: 'TOGGLE_FILTERS' }
  | { type: 'SET_FILTERS'; filters: Partial<Filters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'OPEN_MODAL'; modal: ModalState }
  | { type: 'CLOSE_MODAL' }
  | { type: 'CREATE_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; taskId: string; changes: Partial<Task> }
  | { type: 'CHANGE_STATUS'; taskId: string; novoStatus: TaskStatus; observacao?: string }
  | { type: 'DUPLICATE_TASK'; taskId: string }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'TOGGLE_FAVORITE'; taskId: string }
  | { type: 'REORDER_TASKS'; taskId: string; toTaskId: string }
  | { type: 'UNDO' };
```

---

### Task 7: Reescrever `src/context/toastMessage.ts`

**Files:**
- Rewrite: `src/context/toastMessage.ts`

- [x] **Step 1: Substituir o conteúdo de `src/context/toastMessage.ts`**

```ts
import type { TaskStatus } from '../types';
import type { AppAction } from './types';

// Sem 'CAIXA_ENTRADA': CREATE_TASK tem toast próprio no switch de toastMessage.
const STATUS_TOAST: Partial<Record<TaskStatus, string>> = {
  A_FAZER: 'Tarefa movida para "A fazer"',
  EM_ANDAMENTO: 'Tarefa em andamento',
  CONCLUIDA: 'Tarefa concluída',
  CANCELADA: 'Tarefa cancelada',
};

/** Mensagem de toast por ação, ou null quando a ação não deve exibir toast. */
export function toastMessage(action: AppAction): string | null {
  switch (action.type) {
    case 'CREATE_TASK':
      return 'Tarefa criada';
    case 'UPDATE_TASK':
      return 'Tarefa atualizada';
    case 'DUPLICATE_TASK':
      return 'Tarefa duplicada';
    case 'DELETE_TASK':
      return 'Tarefa excluída';
    case 'CHANGE_STATUS':
      return STATUS_TOAST[action.novoStatus] ?? null;
    default:
      return null;
  }
}
```

---

### Task 8: Verificar fim da Fase 1

- [x] **Step 1: Verificar build de TypeScript**

Run: `npm run build`
Expected: ainda pode falhar por referências em `mockData.ts`, `seedGenerator.ts`, `appReducer.ts`, `AppContext.tsx`, `LocalStorageProvider.ts`, nos componentes **e nos arquivos de teste antigos** (`*.test.ts(x)`, que referenciam a API removida e só serão reescritos na Fase 6) — isso é esperado. Verifique apenas que os erros são **apenas de importações/funções removidas** (não de digitação) e prossiga.

---

## Fase 2 — Persistência e seed

### Task 9: Bump de versão em `src/services/providers/LocalStorageProvider.ts`

**Files:**
- Modify: `src/services/providers/LocalStorageProvider.ts`

- [x] **Step 1: Bump de versão do storage**

Altere as linhas 5-6:
```ts
export const STORAGE_KEY = 'tarefas.app.v2';
const VERSION = 2;
```

- [x] **Step 2: Remover validação de `responsavelId`/`criadorId` em `isTask`**

Na função `isTask` (linhas 31-53), remova as duas linhas:
```ts
    typeof t.responsavelId === 'string' &&
    typeof t.criadorId === 'string' &&
```

- [x] **Step 3: Remover validação de `usuario` em `isHistoryEntry`**

Na função `isHistoryEntry` (linhas 16-29), remova a linha:
```ts
    typeof h.usuario === 'string' &&
```

O resultado final de `isHistoryEntry` e `isTask` deve ser:

```ts
function isHistoryEntry(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const h = value as Record<string, unknown>;
  return (
    typeof h.id === 'string' &&
    typeof h.dataHora === 'string' &&
    (h.statusAnterior === null || TASK_STATUSES.includes(String(h.statusAnterior))) &&
    (h.novoStatus === null || TASK_STATUSES.includes(String(h.novoStatus))) &&
    (h.tipo === 'status' || h.tipo === 'info') &&
    (h.observacao === undefined || typeof h.observacao === 'string')
  );
}

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.titulo === 'string' &&
    typeof t.descricao === 'string' &&
    TASK_STATUSES.includes(String(t.status)) &&
    PRIORITIES.includes(String(t.prioridade)) &&
    (t.prazo === null || (typeof t.prazo === 'string' && /^\d{4}-\d{2}-\d{2}/.test(t.prazo))) &&
    (t.favorita === undefined || typeof t.favorita === 'boolean') &&
    (t.categoria === undefined || typeof t.categoria === 'string') &&
    (t.tags === undefined || (Array.isArray(t.tags) && t.tags.every((x) => typeof x === 'string'))) &&
    (t.atualizadaEm === undefined || typeof t.atualizadaEm === 'string') &&
    (t.concluidaEm === undefined || typeof t.concluidaEm === 'string') &&
    typeof t.criadaEm === 'string' &&
    Array.isArray(t.historico) &&
    t.historico.every(isHistoryEntry)
  );
}
```

- [x] **Step 4: Teste** (o `storage.test.ts` será reescrito na Fase 6, Task 36; por ora verifique apenas que compila.)

---

### Task 10: Reescrever `src/utils/seedGenerator.ts`

**Files:**
- Rewrite: `src/utils/seedGenerator.ts`

- [x] **Step 1: Substituir o conteúdo de `src/utils/seedGenerator.ts`**

```ts
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
```

---

### Task 11: Reescrever `src/data/mockData.ts`

**Files:**
- Rewrite: `src/data/mockData.ts`

- [x] **Step 1: Substituir o conteúdo de `src/data/mockData.ts`**

```ts
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
```

- [x] **Step 2: Nota** — `GESTOR`, `GESTOR_ID`, `COLABORADORES`, `ALL_USERS`, `findUser` e `NOME_POR_ID` foram removidos. Qualquer importação remanescente quebrará o `tsc` e será corrigida nas próximas tasks.

- [x] **Step 3: Verificar** — `npm run build` deve listar agora **apenas** erros em `appReducer.ts`, `AppContext.tsx`, `navigation.ts`, nos componentes, no `App.tsx` e nos arquivos de teste antigos (que serão corrigidos/reescritos nas próximas fases).

---

## Fase 3 — Reducer e contexto

### Task 12: Reescrever `src/context/appReducer.ts`

**Files:**
- Rewrite: `src/context/appReducer.ts`
- Test: `src/context/AppContext.test.ts` (reescrito na Fase 6, Task 35)

- [x] **Step 1: Substituir o conteúdo de `src/context/appReducer.ts`**

```ts
import type { Task } from '../types';
import { canTransition } from '../utils/status';
import { newHistoryEntry } from '../utils/history';
import { EMPTY_FILTERS, nextTaskId } from '../utils/tasks';
import type { AppAction, AppState } from './types';

const CAMPOS_EDITAVEIS = ['titulo', 'descricao', 'prazo', 'prioridade'] as const;

const CAMPOS_WHITELIST = ['titulo', 'descricao', 'prazo', 'prioridade', 'categoria', 'tags'] as const;

type CampoEdicao = (typeof CAMPOS_WHITELIST)[number];

const LABEL_CAMPO: Record<string, string> = {
  titulo: 'Título',
  descricao: 'Descrição',
  prazo: 'Prazo',
  prioridade: 'Prioridade',
};

const PARTICIPIO_CAMPO: Record<string, string> = {
  titulo: 'alterado',
  descricao: 'alterada',
  prazo: 'alterado',
  prioridade: 'alterada',
};

function exibirValor(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') {
    return campo === 'prazo' ? 'sem prazo' : 'vazio';
  }
  return String(valor);
}

/** Compara valor por valor: tags por conteúdo (ordem preservada), categoria normalizando vazio. */
function mudou(campo: CampoEdicao, task: Task, mudancas: Partial<Task>): boolean {
  const novo = mudancas[campo];
  if (campo === 'tags') {
    const atual = task.tags ?? [];
    const prox = novo ?? [];
    return atual.length !== prox.length || atual.some((t, i) => t !== prox[i]);
  }
  if (campo === 'categoria') {
    return (novo ?? '') !== (task.categoria ?? '');
  }
  if (novo === undefined) return false;
  return novo !== task[campo];
}

function montarObservacaoEdicao(
  diffs: readonly (typeof CAMPOS_EDITAVEIS)[number][],
  task: Task,
  changes: Partial<Task>
): string {
  return diffs
    .map(
      (campo) =>
        `${LABEL_CAMPO[campo]} ${PARTICIPIO_CAMPO[campo]} de ${exibirValor(campo, task[campo])} para ${exibirValor(campo, changes[campo])}`
    )
    .join('; ');
}

function appReducerCore(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'TOGGLE_KPI_COLLAPSED':
      return { ...state, kpiCollapsed: !state.kpiCollapsed };
    case 'TOGGLE_FILTERS':
      return { ...state, filtersOpen: !state.filtersOpen };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case 'RESET_FILTERS':
      // Limpa apenas os filtros; a ordenação escolhida é preservada (reset via seletor "Ordem original").
      return { ...state, filters: { ...EMPTY_FILTERS, sortBy: state.filters.sortBy } };
    case 'OPEN_MODAL':
      return { ...state, modal: action.modal };
    case 'CLOSE_MODAL':
      return { ...state, modal: { type: 'none' } };
    case 'CREATE_TASK':
      return {
        ...state,
        tasks: [
          ...state.tasks,
          { ...action.task, atualizadaEm: action.task.criadaEm },
        ],
      };
    case 'UPDATE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (Object.keys(action.changes).length === 0) return state;
      const camposForaDaWhitelist = Object.keys(action.changes).filter(
        (campo) => !(CAMPOS_WHITELIST as readonly string[]).includes(campo)
      );
      if (camposForaDaWhitelist.length > 0) return state;
      const mudancasEfetivas = CAMPOS_WHITELIST.filter((campo) => mudou(campo, task, action.changes));
      if (mudancasEfetivas.length === 0) return state;
      const diffs = mudancasEfetivas.filter(
        (campo) => (CAMPOS_EDITAVEIS as readonly string[]).includes(campo)
      ) as typeof CAMPOS_EDITAVEIS[number][];
      const historico =
        diffs.length > 0
          ? [
              ...task.historico,
              newHistoryEntry(
                task.status,
                task.status,
                'info',
                montarObservacaoEdicao(diffs, task, action.changes)
              ),
            ]
          : task.historico;
      const mudancasAplicadas: Partial<Task> = {};
      for (const campo of mudancasEfetivas) {
        switch (campo) {
          case 'titulo':
            mudancasAplicadas.titulo = action.changes.titulo;
            break;
          case 'descricao':
            mudancasAplicadas.descricao = action.changes.descricao;
            break;
          case 'prazo':
            mudancasAplicadas.prazo = action.changes.prazo;
            break;
          case 'prioridade':
            mudancasAplicadas.prioridade = action.changes.prioridade;
            break;
          case 'categoria':
            mudancasAplicadas.categoria = action.changes.categoria;
            break;
          case 'tags':
            mudancasAplicadas.tags = action.changes.tags ?? [];
            break;
        }
      }
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, ...mudancasAplicadas, atualizadaEm: new Date().toISOString(), historico }
            : t
        ),
      };
    }
    case 'CHANGE_STATUS': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (!canTransition(task.status, action.novoStatus)) return state;
      if (action.novoStatus === 'CANCELADA' && !action.observacao?.trim()) return state;
      const entry = newHistoryEntry(
        task.status,
        action.novoStatus,
        'status',
        action.observacao
      );
      const agora = new Date().toISOString();
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                status: action.novoStatus,
                atualizadaEm: agora,
                concluidaEm:
                  action.novoStatus === 'CONCLUIDA'
                    ? agora
                    : action.novoStatus === 'EM_ANDAMENTO'
                      ? undefined
                      : t.concluidaEm,
                historico: [...t.historico, entry],
              }
            : t
        ),
      };
    }
    case 'DUPLICATE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      const agora = new Date().toISOString();
      const copy: Task = {
        ...task,
        id: nextTaskId(state.tasks),
        status: 'CAIXA_ENTRADA',
        favorita: false,
        criadaEm: agora,
        atualizadaEm: agora,
        concluidaEm: undefined,
        historico: [newHistoryEntry(null, 'CAIXA_ENTRADA', 'status', `Tarefa duplicada de ${task.id}.`)],
      };
      return { ...state, tasks: [...state.tasks, copy] };
    }
    case 'DELETE_TASK': {
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.taskId) };
    }
    case 'TOGGLE_FAVORITE': {
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, favorita: !t.favorita, atualizadaEm: new Date().toISOString() }
            : t
        ),
      };
    }
    case 'REORDER_TASKS': {
      const from = state.tasks.findIndex((t) => t.id === action.taskId);
      const to = state.tasks.findIndex((t) => t.id === action.toTaskId);
      if (from < 0 || to < 0 || from === to) return state;
      const tasks = [...state.tasks];
      const [moved] = tasks.splice(from, 1);
      // Ao mover para baixo, a remoção desloca o alvo em -1; insere "antes" do alvo.
      const target = from < to ? to - 1 : to;
      tasks.splice(target, 0, moved);
      return { ...state, tasks };
    }
    default:
      return state;
  }
}

const UNDO_LIMIT = 50;

/** Ações que mudam tarefas mas NÃO entram na pilha de undo (sem toast; undo seria confuso). */
const NO_UNDO: ReadonlySet<AppAction['type']> = new Set(['TOGGLE_FAVORITE', 'REORDER_TASKS']);

/**
 * Reducer público: aplica a ação e empilha o estado anterior em `past` sempre que
 * as tarefas mudam (base para o Desfazer). UNDO é tratado aqui, fora da pilha.
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type === 'UNDO') {
    if (state.past.length === 0) return state;
    const tasks = state.past[state.past.length - 1];
    return { ...state, tasks, past: state.past.slice(0, -1) };
  }
  const next = appReducerCore(state, action);
  if (next.tasks === state.tasks) return next;
  if (NO_UNDO.has(action.type)) return next;
  return { ...next, past: [...state.past, state.tasks].slice(-UNDO_LIMIT) };
}
```

- [x] **Step 2: Nota** — removidos: `SET_CURRENT_USER`, `SET_SECTION`, `REASSIGN`, guards de permissão (`pode`, `podeAlterarStatusPara`), `roleOf`/`podeReatribuir`, campo `usuario` das ações, `responsavelId`/`criadorId`. `CHANGE_STATUS` para `EM_ANDAMENTO` a partir de `CONCLUIDA` limpa `concluidaEm` (retomar). Guard de campos fora da whitelist agora rejeita qualquer campo desconhecido (não apenas `responsavelId`).

---

### Task 13: Reescrever `src/context/AppContext.tsx`

**Files:**
- Rewrite: `src/context/AppContext.tsx`

- [x] **Step 1: Substituir o conteúdo de `src/context/AppContext.tsx`**

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { TAREFAS } from '../data/mockData';
import { EMPTY_FILTERS } from '../utils/tasks';
import { loadState, saveState } from '../services/storage';
import { useToast } from './ToastContext';
import { appReducer } from './appReducer';
import { toastMessage } from './toastMessage';
import type { AppAction, AppState } from './types';

export type { AppAction, AppState } from './types';

const initialState: AppState = {
  tasks: TAREFAS,
  view: 'lista',
  sidebarOpen: false,
  filters: EMPTY_FILTERS,
  kpiCollapsed: false,
  filtersOpen: true,
  modal: { type: 'none' },
  past: [],
};

const KPI_COLLAPSED_KEY = 'kpiCollapsed';

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

function initState(): AppState {
  const saved = loadState();
  const kpiCollapsed = localStorage.getItem(KPI_COLLAPSED_KEY) === '1';
  if (saved) {
    // Persiste apenas as tarefas; demais campos são estado de sessão (não persistido).
    return {
      ...initialState,
      kpiCollapsed,
      tasks: saved.tasks,
    };
  }
  return { ...initialState, kpiCollapsed };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, initState);
  const toast = useToast();

  useEffect(() => {
    saveState({ tasks: state.tasks });
  }, [state.tasks]);

  useEffect(() => {
    localStorage.setItem(KPI_COLLAPSED_KEY, state.kpiCollapsed ? '1' : '0');
  }, [state.kpiCollapsed]);

  const dispatchWithToast = (action: AppAction) => {
    const next = appReducer(state, action);
    dispatch(action);
    if (next.tasks === state.tasks) return; // ação sem efeito (ex.: transição inválida)
    const message = toastMessage(action);
    if (message) {
      toast.success(message, {
        label: 'Desfazer',
        onClick: () => dispatch({ type: 'UNDO' }),
      });
    }
  };

  const value = useMemo(() => ({ state, dispatch: dispatchWithToast }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
```

---

### Task 14: Reescrever `src/context/navigation.ts`

**Files:**
- Rewrite: `src/context/navigation.ts`

- [x] **Step 1: Substituir o conteúdo de `src/context/navigation.ts`**

```ts
import type { Dispatch } from 'react';
import type { Filters } from '../types';
import type { AppAction } from './types';

/**
 * Abre a lista de Tarefas aplicando filtros (ou limpando-os quando nenhum é passado).
 * A navegação é fixa em Tarefas; unifica os atalhos da Sidebar e os KPIs.
 */
export function openTarefas(
  dispatch: Dispatch<AppAction>,
  filters?: Partial<Filters>
): void {
  dispatch({ type: 'RESET_FILTERS' });
  if (filters) {
    dispatch({ type: 'SET_FILTERS', filters });
  }
}
```

- [x] **Step 2: Verificar compilação** — `npm run build` deve listar agora apenas erros nos componentes de UI, no `App.tsx` e nos arquivos de teste antigos (reescritos na Fase 6).

---

## Fase 4 — Componentes de tarefa

### Task 15: Reescrever `src/components/tasks/StatusBadge.tsx`

**Files:**
- Rewrite: `src/components/tasks/StatusBadge.tsx`
- Test: `src/components/tasks/StatusBadge.test.tsx` (Fase 6, Task 38)

- [x] **Step 1: Substituir o conteúdo de `src/components/tasks/StatusBadge.tsx`**

```tsx
import type { TaskStatus } from '../../types';
import { STATUS_LABELS } from '../../utils/status';

const STYLES: Record<TaskStatus, string> = {
  CAIXA_ENTRADA: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  A_FAZER: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  EM_ANDAMENTO: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  CONCLUIDA: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CANCELADA: 'bg-slate-200 text-slate-600 ring-slate-500/20',
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}
```

---

### Task 16: Reescrever `src/components/tasks/cycleActions.ts`

**Files:**
- Rewrite: `src/components/tasks/cycleActions.ts`
- Test: `src/components/tasks/cycleActions.test.ts` (Fase 6, Task 38)

- [x] **Step 1: Substituir o conteúdo de `src/components/tasks/cycleActions.ts`**

```ts
import { CheckCircle2, ListTodo, Play, RotateCcw, XCircle, type LucideIcon } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';

export interface CycleAction {
  icon: LucideIcon;
  label: string;
  cls: string;
  target: TaskStatus;
}

/** Ação visual do ciclo para um alvo de transição (rótulo varia conforme o status atual). */
export function cycleActionFor(task: Task, target: TaskStatus): CycleAction | null {
  switch (target) {
    case 'A_FAZER':
      return { icon: ListTodo, label: 'Planejar', cls: 'text-cyan-600 hover:bg-cyan-50', target };
    case 'EM_ANDAMENTO':
      if (task.status === 'CONCLUIDA')
        return { icon: RotateCcw, label: 'Retomar', cls: 'text-rose-600 hover:bg-rose-50', target };
      return { icon: Play, label: 'Iniciar', cls: 'text-amber-600 hover:bg-amber-50', target };
    case 'CONCLUIDA':
      return { icon: CheckCircle2, label: 'Concluir', cls: 'text-emerald-600 hover:bg-emerald-50', target };
    case 'CANCELADA':
      return { icon: XCircle, label: 'Cancelar', cls: 'text-slate-600 hover:bg-slate-100', target };
    default:
      return null;
  }
}
```

---

### Task 17: Reescrever `src/components/tasks/CycleStepper.tsx`

**Files:**
- Rewrite: `src/components/tasks/CycleStepper.tsx`
- Test: `src/components/tasks/CycleStepper.test.tsx` (Fase 6, Task 38)

- [x] **Step 1: Substituir o conteúdo de `src/components/tasks/CycleStepper.tsx`**

```tsx
import { Check, XCircle } from 'lucide-react';
import type { TaskStatus } from '../../types';
import { STATUS_ORDER } from '../../utils/status';

const STEPS = STATUS_ORDER.filter((s) => s !== 'CANCELADA');

function stepState(status: TaskStatus, index: number): 'done' | 'current' | 'todo' {
  if (status === 'CANCELADA') return 'todo';
  const pos = STATUS_ORDER.indexOf(status);
  if (index < pos) return 'done';
  if (index === pos) return 'current';
  return 'todo';
}

interface CycleStepperProps {
  status: TaskStatus;
  compact?: boolean;
}

export default function CycleStepper({ status, compact = false }: CycleStepperProps) {
  const isCancelada = status === 'CANCELADA';

  return (
    <div className="flex items-center" title={`Ciclo: ${status}`}>
      {STEPS.map((step, index) => {
        const state = stepState(status, index);
        return (
          <div key={step} className="flex items-center">
            {index > 0 && (
              <div
                className={`h-0.5 ${compact ? 'w-4' : 'w-8'} ${
                  state === 'todo' ? 'bg-slate-200' : 'bg-indigo-500'
                }`}
              />
            )}
            <div
              className={`flex items-center justify-center rounded-full font-semibold ${
                compact ? 'h-5 w-5 text-[10px]' : 'h-7 w-7 text-xs'
              } ${
                state === 'done'
                  ? 'bg-indigo-500 text-white'
                  : state === 'current'
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : 'border border-slate-300 bg-white text-slate-400'
              }`}
            >
              {state === 'done' ? <Check className={compact ? 'h-3 w-3' : 'h-4 w-4'} /> : index + 1}
            </div>
          </div>
        );
      })}
      {isCancelada && (
        <div className="ml-2 flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">
          <XCircle className="h-3 w-3" />
          Cancelada
        </div>
      )}
    </div>
  );
}
```

---

### Task 18: Reescrever `src/components/tasks/TaskRow.tsx`

**Files:**
- Rewrite: `src/components/tasks/TaskRow.tsx`
- Test: `src/components/tasks/TaskRow.test.tsx` (Fase 6, Task 38)

- [x] **Step 1: Substituir o conteúdo de `src/components/tasks/TaskRow.tsx`**

```tsx
import { Copy, Eye, GripVertical, Pencil, Star, Trash2 } from 'lucide-react';
import type { DragEvent } from 'react';
import type { Task, TaskStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { transicoesDisponiveis } from '../../utils/status';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CycleStepper from './CycleStepper';
import DueDateCell from './DueDateCell';
import { cycleActionFor } from './cycleActions';

interface TaskRowProps {
  task: Task;
  onConfirmComplete: (task: Task) => void;
  onDeleteRequest: (task: Task) => void;
  draggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: (e: DragEvent) => void;
  onDragOver?: (e: DragEvent) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}

export default function TaskRow({
  task,
  onConfirmComplete,
  onDeleteRequest,
  draggable = false,
  isDragging = false,
  isDropTarget = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TaskRowProps) {
  const { dispatch } = useApp();

  const openDetail = () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'detail', taskId: task.id } });
  const openEdit = () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'edit', taskId: task.id } });

  const changeStatus = (novoStatus: TaskStatus) => {
    if (novoStatus === 'CONCLUIDA') {
      onConfirmComplete(task);
      return;
    }
    if (novoStatus === 'CANCELADA') {
      dispatch({ type: 'OPEN_MODAL', modal: { type: 'cancel', taskId: task.id } });
      return;
    }
    dispatch({ type: 'CHANGE_STATUS', taskId: task.id, novoStatus });
  };

  return (
    <tr
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`border-b border-slate-100 transition-colors hover:bg-slate-50/70 ${
        isDragging ? 'opacity-40' : ''
      } ${isDropTarget ? 'bg-indigo-50/60 ring-2 ring-inset ring-indigo-300' : ''}`}
    >
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            title={draggable ? undefined : 'Remova filtros e ordenação para reordenar'}
            className="shrink-0"
          >
            <GripVertical
              className={`h-4 w-4 ${
                draggable ? 'cursor-grab text-slate-300' : 'cursor-not-allowed text-slate-200'
              }`}
              aria-hidden
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{task.titulo}</p>
            <p className="truncate text-xs text-slate-400">{task.id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <PriorityBadge prioridade={task.prioridade} />
      </td>
      <td className="px-4 py-3">
        <DueDateCell task={task} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={task.status} />
      </td>
      <td className="px-4 py-3">
        <CycleStepper status={task.status} compact />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={openDetail}
            title="Ver detalhes"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', taskId: task.id })}
            title={task.favorita ? 'Remover dos favoritos' : 'Favoritar'}
            className={`rounded-lg p-1.5 transition-colors ${
              task.favorita
                ? 'text-amber-500'
                : 'text-slate-400 hover:bg-amber-50 hover:text-amber-500'
            }`}
          >
            <Star className={`h-4 w-4 ${task.favorita ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
          <button
            onClick={openEdit}
            title="Editar"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              dispatch({ type: 'DUPLICATE_TASK', taskId: task.id })
            }
            title="Duplicar"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDeleteRequest(task)}
            title="Excluir"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {transicoesDisponiveis(task.status).map((target) => {
            const act = cycleActionFor(task, target);
            if (!act) return null;
            const Icon = act.icon;
            return (
              <button
                key={target}
                onClick={() => changeStatus(target)}
                title={act.label}
                className={`rounded-lg p-1.5 transition-colors ${act.cls}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </td>
    </tr>
  );
}
```

- [x] **Step 2: Nota** — coluna de ações agora termina com `justify-end`; colunas: Tarefa, Prioridade, Prazo, Status, Ciclo, Ações. Sem responsável, sem badges de retrabalho/próximo passo, sem gates de permissão.

---

### Task 19: Reescrever `src/components/tasks/TaskCard.tsx`

**Files:**
- Rewrite: `src/components/tasks/TaskCard.tsx`

- [x] **Step 1: Substituir o conteúdo de `src/components/tasks/TaskCard.tsx`**

```tsx
import { Star } from 'lucide-react';
import type { DragEvent } from 'react';
import type { Task, TaskStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { transicoesDisponiveis } from '../../utils/status';
import PriorityBadge from './PriorityBadge';
import DueDateCell from './DueDateCell';
import CategoryTag from './CategoryTag';
import { cycleActionFor } from './cycleActions';

interface TaskCardProps {
  task: Task;
  onConfirmComplete: (task: Task) => void;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: () => void;
}

export default function TaskCard({
  task,
  onConfirmComplete,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const { dispatch } = useApp();

  const changeStatus = (novoStatus: TaskStatus) => {
    if (novoStatus === 'CONCLUIDA') {
      onConfirmComplete(task);
      return;
    }
    if (novoStatus === 'CANCELADA') {
      dispatch({ type: 'OPEN_MODAL', modal: { type: 'cancel', taskId: task.id } });
      return;
    }
    dispatch({ type: 'CHANGE_STATUS', taskId: task.id, novoStatus });
  };

  const action =
    transicoesDisponiveis(task.status)
      .map((target) => cycleActionFor(task, target))
      .find((a) => a !== null) ?? null;

  const openDetail = () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'detail', taskId: task.id } });

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="w-full cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <button
        onClick={openDetail}
        aria-label={`Ver detalhes — ${task.titulo}`}
        className="block w-full text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">{task.titulo}</p>
          <PriorityBadge prioridade={task.prioridade} />
        </div>
        <p className="mt-1 truncate text-xs text-slate-400">{task.id}</p>
        {(task.categoria || (task.tags && task.tags.length > 0)) && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {task.categoria && <CategoryTag label={task.categoria} />}
            {task.tags?.map((t) => <CategoryTag key={t} label={`#${t}`} />)}
          </div>
        )}
      </button>

      <div className="mt-3 flex items-center justify-between">
        <DueDateCell task={task} />
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', taskId: task.id })}
            title={task.favorita ? 'Remover dos favoritos' : 'Favoritar'}
            aria-label={task.favorita ? 'Remover dos favoritos' : 'Favoritar'}
            className={`rounded-lg p-1.5 transition-colors ${
              task.favorita
                ? 'text-amber-500'
                : 'text-slate-400 hover:bg-amber-50 hover:text-amber-500'
            }`}
          >
            <Star className={`h-4 w-4 ${task.favorita ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
          {action && (
            <button
              onClick={() => changeStatus(action.target)}
              title={action.label}
              aria-label={action.label}
              className={`rounded-lg p-1.5 transition-colors ${action.cls}`}
            >
              <action.icon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Task 20: Reescrever `src/components/tasks/TaskKanban.tsx`

**Files:**
- Rewrite: `src/components/tasks/TaskKanban.tsx`
- Test: `src/components/tasks/TaskKanban.test.tsx` (Fase 6, Task 38)

- [x] **Step 1: Substituir o conteúdo de `src/components/tasks/TaskKanban.tsx`**

```tsx
import { useState, type DragEvent } from 'react';
import { Ban, Inbox, Sparkles } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { canTransition, STATUS_LABELS } from '../../utils/status';
import StatusBadge from './StatusBadge';
import TaskCard from './TaskCard';

const COLUMNS: TaskStatus[] = ['CAIXA_ENTRADA', 'A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'];

interface TaskKanbanProps {
  tasks: Task[];
  totalCount: number;
  onConfirmComplete: (task: Task) => void;
}

interface DragInfo {
  id: string;
  status: TaskStatus;
}

export default function TaskKanban({ tasks, totalCount, onConfirmComplete }: TaskKanbanProps) {
  const { state, dispatch } = useApp();
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-slate-400 shadow-sm">
        {totalCount === 0 ? <Sparkles className="h-10 w-10" /> : <Inbox className="h-10 w-10" />}
        <p className="text-sm font-medium">
          {totalCount === 0 ? 'Nenhuma tarefa criada ainda' : 'Nenhuma tarefa encontrada'}
        </p>
        <p className="text-xs">
          {totalCount === 0
            ? 'Clique em "Nova Tarefa" para começar.'
            : 'Ajuste a busca ou os filtros para ver mais resultados.'}
        </p>
      </div>
    );
  }

  const handleDragStart = (taskId: string) => (e: DragEvent) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    const dragged = state.tasks.find((t) => t.id === taskId);
    if (dragged) setDragInfo({ id: dragged.id, status: dragged.status });
  };

  const canDropOn = (status: TaskStatus): boolean => {
    if (status === 'CANCELADA') return false; // cancelamento exige observação (CancelModal)
    if (!dragInfo) return true;
    const dragged = state.tasks.find((t) => t.id === dragInfo.id);
    if (!dragged) return false;
    return canTransition(dragInfo.status, status);
  };

  const handleDragOver = (status: TaskStatus) => (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = canDropOn(status) ? 'move' : 'none';
    setOverStatus(status);
  };

  const handleDrop = (status: TaskStatus) => (e: DragEvent) => {
    e.preventDefault();
    setOverStatus(null);
    setDragInfo(null);
    if (status === 'CANCELADA') return;
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    const dragged = state.tasks.find((t) => t.id === taskId);
    if (!dragged || dragged.status === status) return;
    if (!canTransition(dragged.status, status)) return;
    dispatch({ type: 'CHANGE_STATUS', taskId, novoStatus: status });
  };

  const handleDragEnd = () => {
    setOverStatus(null);
    setDragInfo(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        const isOver = overStatus === status;
        const allowed = canDropOn(status);
        const highlight = isOver ? (allowed ? 'indigo' : 'blocked') : null;
        return (
          <div
            key={status}
            onDragOver={handleDragOver(status)}
            onDrop={handleDrop(status)}
            onDragEnd={handleDragEnd}
            className={`flex min-w-[240px] flex-1 flex-col rounded-xl p-2 transition-colors ${
              highlight === 'indigo'
                ? 'bg-indigo-100/70 ring-2 ring-inset ring-indigo-300'
                : highlight === 'blocked'
                  ? 'bg-rose-100/70 ring-2 ring-inset ring-rose-300'
                  : 'bg-slate-200/60'
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <StatusBadge status={status} />
                {highlight === 'blocked' && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700"
                    title="Transição não permitida"
                  >
                    <Ban className="h-3 w-3" />
                    não permitido
                  </span>
                )}
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                {columnTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onConfirmComplete={onConfirmComplete}
                  onDragStart={handleDragStart(task.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
              {columnTasks.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400">
                  {STATUS_LABELS[status]} — vazio
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

### Task 21: Ajustar `src/components/tasks/TasksTable.tsx`

**Files:**
- Modify: `src/components/tasks/TasksTable.tsx:96-97`

- [x] **Step 1: Remover a coluna "Responsável" do cabeçalho**

Substitua as linhas 96-98:
```tsx
              <th className="px-4 py-3">Tarefa</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3">Prioridade</th>
```
por:
```tsx
              <th className="px-4 py-3">Tarefa</th>
              <th className="px-4 py-3">Prioridade</th>
```

- [x] **Step 2: Nota** — a largura mínima da tabela pode ser reduzida de `min-w-[900px]` para `min-w-[720px]` (linha 93), opcional.

---

## Fase 5 — Layout, modais e App

### Task 22: Reescrever `src/components/layout/KPICards.tsx`

**Files:**
- Rewrite: `src/components/layout/KPICards.tsx`
- Test: `src/components/layout/KPICards.test.tsx` (Fase 6, Task 39)

- [x] **Step 1: Substituir o conteúdo de `src/components/layout/KPICards.tsx`**

```tsx
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Inbox,
  ListTodo,
  PlayCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { openTarefas } from '../../context/navigation';
import type { Indicators } from '../../utils/tasks';
import type { TaskStatus } from '../../types';

interface KpiDef {
  key: string;
  label: string;
  icon: LucideIcon;
  value: number;
  color: string; // bg do ícone
  active: boolean;
  onClick: () => void;
}

export default function KPICards({ indicators }: { indicators: Indicators }) {
  const { state, dispatch } = useApp();
  const { filters, kpiCollapsed } = state;

  const openWithStatus = (statuses: TaskStatus[]) => openTarefas(dispatch, { status: statuses });
  const openVencidas = () => openTarefas(dispatch, { prazo: 'vencidas' });
  const openAll = () => openTarefas(dispatch);

  const kpis: KpiDef[] = [
    { key: 'total', label: 'Total de tarefas', icon: ClipboardList, value: indicators.total, color: 'bg-slate-100 text-slate-600', active: filters.status.length === 0 && filters.prazo === 'todas', onClick: openAll },
    { key: 'caixaEntrada', label: 'Caixa de entrada', icon: Inbox, value: indicators.caixaEntrada, color: 'bg-blue-50 text-blue-600', active: filters.status.includes('CAIXA_ENTRADA'), onClick: () => openWithStatus(['CAIXA_ENTRADA']) },
    { key: 'aFazer', label: 'A fazer', icon: ListTodo, value: indicators.aFazer, color: 'bg-cyan-50 text-cyan-600', active: filters.status.includes('A_FAZER'), onClick: () => openWithStatus(['A_FAZER']) },
    { key: 'emAndamento', label: 'Em andamento', icon: PlayCircle, value: indicators.emAndamento, color: 'bg-amber-50 text-amber-600', active: filters.status.includes('EM_ANDAMENTO'), onClick: () => openWithStatus(['EM_ANDAMENTO']) },
    { key: 'concluidas', label: 'Concluídas', icon: CheckCircle2, value: indicators.concluidas, color: 'bg-emerald-50 text-emerald-600', active: filters.status.includes('CONCLUIDA'), onClick: () => openWithStatus(['CONCLUIDA']) },
    { key: 'canceladas', label: 'Canceladas', icon: XCircle, value: indicators.canceladas, color: 'bg-slate-100 text-slate-600', active: filters.status.includes('CANCELADA'), onClick: () => openWithStatus(['CANCELADA']) },
    { key: 'atrasadas', label: 'Atrasadas', icon: AlertTriangle, value: indicators.atrasadas, color: 'bg-red-50 text-red-600', active: filters.prazo === 'vencidas', onClick: openVencidas },
  ];

  return (
    <div>
      <div className="mb-2" aria-hidden="true" />
      {!kpiCollapsed && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <button
                key={kpi.key}
                onClick={kpi.onClick}
                className={`flex items-center gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition-all hover:shadow-md ${
                  kpi.active ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
                }`}
              >
                <div className={`rounded-lg p-2 ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-slate-800">{kpi.value}</p>
                  <p className="truncate text-xs text-slate-500">{kpi.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 2: Nota** — 7 KPIs: Total, Caixa de entrada, A fazer, Em andamento, Concluídas, Canceladas, Atrasadas. Filtros de status aplicados via `openTarefas` (que já não emite `SET_SECTION`).

---

### Task 23: Reescrever `src/components/layout/FilterBar.tsx`

**Files:**
- Rewrite: `src/components/layout/FilterBar.tsx`
- Test: `src/components/layout/FilterBar.test.tsx` (Fase 6, Task 39)

- [x] **Step 1: Substituir o conteúdo de `src/components/layout/FilterBar.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, FilterX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hasActiveFilters } from '../../utils/tasks';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../utils/status';
import type { Filters, PrazoFilter, Priority, TaskSort, TaskStatus } from '../../types';

function MultiSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (values: T[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggle = (value: T) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium transition-colors ${
          selected.length > 0
            ? 'border-indigo-400 text-indigo-700 ring-2 ring-indigo-100'
            : 'border-slate-300 text-slate-600 hover:bg-slate-50'
        }`}
      >
        {label}
        {selected.length > 0 && (
          <span className="rounded-full bg-indigo-100 px-1.5 text-xs font-semibold text-indigo-700">
            {selected.length}
          </span>
        )}
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-[60] mt-1 max-h-64 w-52 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FilterBar() {
  const { state, dispatch } = useApp();
  const { filters } = state;

  const update = (patch: Partial<Filters>) => {
    dispatch({ type: 'SET_FILTERS', filters: patch });
  };

  const statusOptions = (Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
  }));
  const prioridadeOptions = (Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => ({
    value: p,
    label: PRIORITY_LABELS[p],
  }));
  const categoriaOptions = Array.from(
    new Set(state.tasks.map((t) => t.categoria).filter((c): c is string => Boolean(c)))
  ).map((c) => ({ value: c, label: c }));

  const prazoOptions: { value: PrazoFilter; label: string }[] = [
    { value: 'todas', label: 'Todas as datas' },
    { value: 'hoje', label: 'Vencem hoje' },
    { value: 'vencidas', label: 'Vencidas' },
    { value: 'proximos7', label: 'Próximos 7 dias' },
    { value: 'semPrazo', label: 'Sem prazo' },
  ];

  const sortOptions: { value: TaskSort | null; label: string }[] = [
    { value: null, label: 'Ordem original' },
    { value: 'criadaEm', label: 'Data de criação' },
    { value: 'titulo', label: 'Título' },
    { value: 'prazo', label: 'Prazo' },
    { value: 'prioridade', label: 'Prioridade' },
  ];

  const hasFilters = hasActiveFilters(filters);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelect label="Status" options={statusOptions} selected={filters.status} onChange={(v) => update({ status: v })} />
      <MultiSelect label="Prioridade" options={prioridadeOptions} selected={filters.prioridade} onChange={(v) => update({ prioridade: v })} />
      <MultiSelect label="Categoria" options={categoriaOptions} selected={filters.categorias} onChange={(v) => update({ categorias: v })} />

      <select
        value={filters.prazo}
        onChange={(e) => update({ prazo: e.target.value as PrazoFilter })}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        {prazoOptions.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      <select
        value={filters.sortBy ?? ''}
        onChange={(e) => update({ sortBy: (e.target.value || null) as TaskSort | null })}
        title="Ordenar por"
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        {sortOptions.map((s) => (
          <option key={s.value ?? 'null'} value={s.value ?? ''}>
            {s.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => dispatch({ type: 'RESET_FILTERS' })}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
        >
          <FilterX className="h-4 w-4" />
          Limpar
        </button>
      )}
    </div>
  );
}
```

- [x] **Step 2: Nota** — removidos os filtros Responsável e Movimentação (paradas); `categoriaOptions` agora deriva de `state.tasks` (todas as tarefas) em vez de `tasksVisiveis`.

---

### Task 24: Reescrever `src/components/layout/Topbar.tsx`

**Files:**
- Rewrite: `src/components/layout/Topbar.tsx`
- Test: `src/components/layout/Topbar.test.tsx` (Fase 6, Task 39)

- [x] **Step 1: Substituir o conteúdo de `src/components/layout/Topbar.tsx`**

```tsx
import {
  Eye,
  EyeOff,
  LayoutGrid,
  LayoutList,
  Menu,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TopbarProps {
  title: string;
  search: string;
  onSearch: (value: string) => void;
  onNewTask: () => void;
}

const iconButton =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-700';

export default function Topbar({ title, search, onSearch, onNewTask }: TopbarProps) {
  const { state, dispatch } = useApp();

  const alternarView = () =>
    dispatch({ type: 'SET_VIEW', view: state.view === 'lista' ? 'quadro' : 'lista' });

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className={iconButton}
          title="Abrir menu"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="truncate text-lg font-semibold text-slate-800 sm:text-xl">{title}</h1>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
        <div className="relative min-w-0 flex-1 max-w-20 transition-[max-width] duration-300 focus-within:max-w-40 sm:max-w-36 sm:focus-within:max-w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-300 bg-slate-50 pr-9 pl-9 text-sm text-slate-700 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch('')}
              aria-label="Limpar busca"
              title="Limpar busca"
              className="absolute top-1/2 right-1.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_KPI_COLLAPSED' })}
            aria-expanded={!state.kpiCollapsed}
            aria-label={state.kpiCollapsed ? 'Expandir indicadores' : 'Recolher indicadores'}
            title={state.kpiCollapsed ? 'Expandir indicadores' : 'Recolher indicadores'}
            className={iconButton}
          >
            {state.kpiCollapsed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FILTERS' })}
            aria-expanded={state.filtersOpen}
            aria-label={state.filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            title={state.filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            className={`${iconButton} ${
              state.filtersOpen ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700' : ''
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              dispatch({ type: 'SET_FILTERS', filters: { favoritas: !state.filters.favoritas } })
            }
            aria-label={state.filters.favoritas ? 'Remover favoritas' : 'Apenas favoritas'}
            title={state.filters.favoritas ? 'Remover favoritas' : 'Apenas favoritas'}
            className={`${iconButton} ${
              state.filters.favoritas ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-600' : ''
            }`}
          >
            <Star className={`h-4 w-4 ${state.filters.favoritas ? 'fill-amber-400' : ''}`} />
          </button>
          <button
            onClick={alternarView}
            aria-label={state.view === 'lista' ? 'Ver como Quadro' : 'Ver como Lista'}
            title={state.view === 'lista' ? 'Ver como Quadro' : 'Ver como Lista'}
            className={iconButton}
          >
            {state.view === 'lista' ? (
              <LayoutGrid className="h-4 w-4" />
            ) : (
              <LayoutList className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onNewTask}
            aria-label="Nova Tarefa"
            title="Nova Tarefa"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [x] **Step 2: Nota** — os controles da seção Tarefas agora ficam sempre visíveis (não há outras seções) e o botão "+" não tem gate de permissão.

---

### Task 25: Reescrever `src/components/layout/Sidebar.tsx`

**Files:**
- Rewrite: `src/components/layout/Sidebar.tsx`
- Test: `src/components/layout/Sidebar.test.tsx` (Fase 6, Task 39)

- [x] **Step 1: Substituir o conteúdo de `src/components/layout/Sidebar.tsx`**

```tsx
import { AlertTriangle, ListChecks, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { openTarefas } from '../../context/navigation';

export default function Sidebar() {
  const { dispatch } = useApp();
  const open = useApp().state.sidebarOpen;

  const close = () => dispatch({ type: 'TOGGLE_SIDEBAR' });

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={close}
        />
      )}
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-300 shadow-xl transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">
            TF
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">TaskFlow</p>
            <p className="truncate text-xs text-slate-400">Minhas Tarefas</p>
          </div>
          <button
            onClick={close}
            className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-2">
          <button
            onClick={() => {
              openTarefas(dispatch);
              if (open) close();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors bg-indigo-500/20"
          >
            <ListChecks className="h-5 w-5 shrink-0" />
            <span className="truncate">Tarefas</span>
          </button>

          <div className="pt-4 pb-1 pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Atalhos
          </div>
          <button
            onClick={() => {
              openTarefas(dispatch, { prazo: 'vencidas' });
              if (open) close();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="truncate">Atrasadas</span>
          </button>
        </nav>

        <div className="border-t border-slate-800 p-3">
          <p className="text-xs text-slate-500">App pessoal — usuário único</p>
        </div>
      </aside>
    </>
  );
}
```

- [x] **Step 2: Nota** — apenas a navegação para Tarefas (mais o atalho Atrasadas); removidos Visão Geral, Colaboradores, lista de colaboradores e o seletor de usuário.

---

### Task 26: Reescrever `src/components/modals/TaskDetailModal.tsx`

**Files:**
- Rewrite: `src/components/modals/TaskDetailModal.tsx`
- Test: `src/components/modals/TaskDetailModal.test.tsx` (Fase 6, Task 40)

- [x] **Step 1: Substituir o conteúdo de `src/components/modals/TaskDetailModal.tsx`**

```tsx
import { useState } from 'react';
import { Copy, History, Pencil, Star, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { transicoesDisponiveis } from '../../utils/status';
import { formatDate, formatDateTime } from '../../utils/date';
import Modal from '../modal/Modal';
import ConfirmDialog from '../modal/ConfirmDialog';
import StatusBadge from '../tasks/StatusBadge';
import PriorityBadge from '../tasks/PriorityBadge';
import CycleStepper from '../tasks/CycleStepper';
import DueDateCell from '../tasks/DueDateCell';
import CategoryTag from '../tasks/CategoryTag';
import { cycleActionFor } from '../tasks/cycleActions';
import type { TaskStatus } from '../../types';

const iconButton =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-700';

const dangerIconButton =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-300 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const { state, dispatch } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmConcluir, setConfirmConcluir] = useState(false);
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const changeStatus = (novoStatus: TaskStatus) => {
    dispatch({ type: 'CHANGE_STATUS', taskId: task.id, novoStatus });
    onClose();
  };

  const onClickTransicao = (novoStatus: TaskStatus) => {
    if (novoStatus === 'CONCLUIDA') {
      setConfirmConcluir(true);
      return;
    }
    if (novoStatus === 'CANCELADA') {
      dispatch({ type: 'OPEN_MODAL', modal: { type: 'cancel', taskId: task.id } });
      onClose();
      return;
    }
    changeStatus(novoStatus);
  };

  return (
    <>
      <Modal
        open
        title="Detalhes da tarefa"
        onClose={onClose}
        size="lg"
        footer={
        <>
          <button
            onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'history', taskId: task.id } })}
            aria-label="Histórico"
            title="Histórico"
            className={iconButton}
          >
            <History className="h-4 w-4" />
          </button>
          <button
            onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'edit', taskId: task.id } })}
            aria-label="Editar"
            title="Editar"
            className={iconButton}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => dispatch({ type: 'DUPLICATE_TASK', taskId: task.id })}
            aria-label="Duplicar"
            title="Duplicar"
            className={iconButton}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className={dangerIconButton}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {transicoesDisponiveis(task.status).map((target) => {
            const act = cycleActionFor(task, target);
            if (!act) return null;
            const Icon = act.icon;
            return (
              <button
                key={target}
                onClick={() => onClickTransicao(target)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${act.cls}`}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {act.label}
                </span>
              </button>
            );
          })}
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">{task.id}</span>
            <StatusBadge status={task.status} />
            <PriorityBadge prioridade={task.prioridade} />
            <button
              onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', taskId: task.id })}
              title={task.favorita ? 'Remover dos favoritos' : 'Favoritar'}
              className={`ml-auto rounded-lg p-1.5 transition-colors ${
                task.favorita
                  ? 'text-amber-500 hover:bg-amber-100 hover:text-amber-600'
                  : 'text-slate-400 hover:bg-amber-50 hover:text-amber-500'
              }`}
            >
              <Star className={`h-4 w-4 ${task.favorita ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-800">{task.titulo}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{task.descricao || 'Sem descrição.'}</p>
          {(task.categoria || (task.tags && task.tags.length > 0)) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {task.categoria && <CategoryTag label={task.categoria} />}
              {task.tags?.map((t) => <CategoryTag key={t} label={`#${t}`} />)}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-slate-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Ciclo da tarefa</p>
          <CycleStepper status={task.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[11px] text-slate-400">Criada em</p>
            <p className="font-medium text-slate-700">{formatDate(task.criadaEm)}</p>
            {task.atualizadaEm && task.atualizadaEm !== task.criadaEm && (
              <p className="text-xs text-slate-400">atualizada em {formatDateTime(task.atualizadaEm)}</p>
            )}
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Prazo</p>
            <DueDateCell task={task} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Concluída em</p>
            <p className="font-medium text-slate-700">
              {task.concluidaEm ? formatDateTime(task.concluidaEm) : '—'}
            </p>
          </div>
        </div>
      </div>
      </Modal>
      {confirmDelete && (
        <ConfirmDialog
          open
          danger
          title="Excluir tarefa"
          message={`Excluir a tarefa "${task.titulo}"? Você poderá desfazer pelo aviso exibido em seguida.`}
          confirmLabel="Excluir"
          onConfirm={() => {
            dispatch({ type: 'DELETE_TASK', taskId: task.id });
            onClose();
          }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
      {confirmConcluir && (
        <ConfirmDialog
          open
          title="Confirmar conclusão"
          message={`Marcar a tarefa "${task.titulo}" como concluída?`}
          confirmLabel="Concluir"
          onConfirm={() => changeStatus('CONCLUIDA')}
          onClose={() => setConfirmConcluir(false)}
        />
      )}
    </>
  );
}
```

- [x] **Step 2: Nota** — removidos: aprovar/devolver/reatribuir, badges de retrabalho/próximo passo, campos Responsável/Criada por. Botões do ciclo renderizados a partir de `transicoesDisponiveis` com rótulos do `cycleActionFor`.

---

### Task 27: Reescrever `src/components/modals/TaskFormModal.tsx`

**Files:**
- Rewrite: `src/components/modals/TaskFormModal.tsx`
- Test: `src/components/modals/TaskFormModal.test.tsx` (Fase 6, Task 40)

- [x] **Step 1: Substituir o conteúdo de `src/components/modals/TaskFormModal.tsx`**

```tsx
import { useState } from 'react';
import type { Priority } from '../../types';
import { useApp } from '../../context/AppContext';
import { PRIORITY_LABELS } from '../../utils/status';
import { createTask } from '../../utils/tasks';
import Modal from '../modal/Modal';

interface TaskFormModalProps {
  open: boolean;
  taskId?: string; // presente = edição
  onClose: () => void;
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';

export default function TaskFormModal({ open, taskId, onClose }: TaskFormModalProps) {
  const { state, dispatch } = useApp();
  const editing = taskId ? state.tasks.find((t) => t.id === taskId) : undefined;

  const [titulo, setTitulo] = useState(editing?.titulo ?? '');
  const [descricao, setDescricao] = useState(editing?.descricao ?? '');
  const [prioridade, setPrioridade] = useState<Priority>(editing?.prioridade ?? 'media');
  const [prazo, setPrazo] = useState(editing?.prazo ?? '');
  const [categoria, setCategoria] = useState(editing?.categoria ?? '');
  const [tags, setTags] = useState(editing?.tags?.join(', ') ?? '');

  const isEdit = Boolean(editing);
  const valid = titulo.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    if (isEdit && editing) {
      dispatch({
        type: 'UPDATE_TASK',
        taskId: editing.id,
        changes: {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          prioridade,
          prazo: prazo || null,
          categoria: categoria.trim() || undefined,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        },
      });
    } else {
      dispatch({
        type: 'CREATE_TASK',
        task: createTask(state.tasks, {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          prioridade,
          prazo: prazo || null,
          categoria: categoria.trim() || undefined,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Editar tarefa' : 'Nova tarefa'}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEdit ? 'Salvar alterações' : 'Criar tarefa'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="task-titulo" className="mb-1 block text-sm font-medium text-slate-700">Título *</label>
          <input id="task-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputCls} placeholder="Ex.: Corrigir bug de checkout" />
        </div>
        <div>
          <label htmlFor="task-descricao" className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
          <textarea
            id="task-descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={4}
            className={inputCls}
            placeholder="Detalhes da atividade..."
          />
        </div>
        <div>
          <label htmlFor="task-prioridade" className="mb-1 block text-sm font-medium text-slate-700">Prioridade</label>
          <select id="task-prioridade" value={prioridade} onChange={(e) => setPrioridade(e.target.value as Priority)} className={inputCls}>
            {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="task-prazo" className="mb-1 block text-sm font-medium text-slate-700">Prazo</label>
          <input id="task-prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-categoria" className="mb-1 block text-sm font-medium text-slate-700">Categoria</label>
            <input id="task-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputCls} placeholder="Ex.: Desenvolvimento" />
          </div>
          <div>
            <label htmlFor="task-tags" className="mb-1 block text-sm font-medium text-slate-700">Tags (separadas por vírgula)</label>
            <input id="task-tags" value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="Ex.: bug, urgente" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
```

---

### Task 28: Reescrever `src/components/modals/HistoryModal.tsx`

**Files:**
- Rewrite: `src/components/modals/HistoryModal.tsx`

- [x] **Step 1: Remover o autor do histórico**

No arquivo atual, remova a linha 35 (`<p className="text-sm font-semibold text-slate-700">{entry.usuario}</p>`). O restante permanece igual:

```tsx
      {sorted.map((entry) => (
          <div key={entry.id} className="relative pb-6 pl-4">
            <span
              className={`absolute top-1 -left-[21px] h-3 w-3 rounded-full ring-4 ring-white ${
                entry.tipo === 'status' ? 'bg-indigo-500' : 'bg-slate-400'
              }`}
            />
            <p className="text-xs font-medium text-slate-400">{formatDateTime(entry.dataHora)}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              ...
```

---

### Task 29: Reescrever `src/components/modals/CancelModal.tsx`

**Files:**
- Rewrite: `src/components/modals/CancelModal.tsx`
- Test: `src/components/modals/CancelModal.test.tsx` (Fase 6, Task 40)

- [x] **Step 1: Substituir o conteúdo de `src/components/modals/CancelModal.tsx`**

```tsx
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../modal/Modal';

interface CancelModalProps {
  taskId: string;
  onClose: () => void;
}

export default function CancelModal({ taskId, onClose }: CancelModalProps) {
  const { state, dispatch } = useApp();
  const task = state.tasks.find((t) => t.id === taskId);
  const [observacao, setObservacao] = useState('');

  if (!task) return null;

  const valid = observacao.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    dispatch({
      type: 'CHANGE_STATUS',
      taskId: task.id,
      novoStatus: 'CANCELADA',
      observacao: observacao.trim(),
    });
    onClose();
  };

  return (
    <Modal
      open
      title="Cancelar tarefa"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Voltar
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar cancelamento
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Você está cancelando a tarefa <span className="font-semibold text-slate-800">{task.titulo}</span>. Ela será
          marcada como <span className="font-semibold text-slate-600">Cancelada</span> e não poderá ser reativada.
        </p>
        <div>
          <label htmlFor="cancel-observacao" className="mb-1 block text-sm font-medium text-slate-700">
            Motivo do cancelamento *
          </label>
          <textarea
            id="cancel-observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-100"
            placeholder="Descreva por que a tarefa perdeu o sentido..."
          />
        </div>
      </div>
    </Modal>
  );
}
```

---

### Task 30: Reescrever `src/components/sections/SectionTarefas.tsx`

**Files:**
- Rewrite: `src/components/sections/SectionTarefas.tsx`
- Test: `src/components/sections/SectionTarefas.test.tsx` (Fase 6, Task 40)

- [x] **Step 1: Substituir o conteúdo de `src/components/sections/SectionTarefas.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { computeIndicators, filterTasks, hasActiveFilters } from '../../utils/tasks';
import type { Task } from '../../types';
import KPICards from '../layout/KPICards';
import FilterBar from '../layout/FilterBar';
import TasksTable from '../tasks/TasksTable';
import TaskKanban from '../tasks/TaskKanban';
import ConfirmDialog from '../modal/ConfirmDialog';

interface ConfirmState {
  task: Task;
}

export default function SectionTarefas() {
  const { state, dispatch } = useApp();
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmState | null>(null);

  const visibleTasks = useMemo(
    () => filterTasks(state.tasks, state.filters),
    [state.tasks, state.filters]
  );
  const indicators = useMemo(() => computeIndicators(state.tasks), [state.tasks]);
  const reorderEnabled = state.filters.sortBy === null && !hasActiveFilters(state.filters);

  const confirmComplete = (task: Task) => setConfirm({ task });

  return (
    <>
      <div className="mb-5 space-y-4">
        <KPICards indicators={indicators} />
        {state.filtersOpen && <FilterBar />}
      </div>
      {state.view === 'lista' ? (
        <TasksTable
          tasks={visibleTasks}
          totalCount={state.tasks.length}
          onConfirmComplete={confirmComplete}
          onDeleteRequest={(task) => setConfirmDelete({ task })}
          reorderEnabled={reorderEnabled}
          onReorder={(taskId, toTaskId) =>
            dispatch({ type: 'REORDER_TASKS', taskId, toTaskId })
          }
        />
      ) : (
        <TaskKanban
          tasks={visibleTasks}
          totalCount={state.tasks.length}
          onConfirmComplete={confirmComplete}
        />
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Confirmar conclusão"
        message={`Marcar a tarefa "${confirm?.task.titulo ?? ''}" como concluída?`}
        confirmLabel="Concluir"
        onConfirm={() => {
          if (confirm) {
            dispatch({
              type: 'CHANGE_STATUS',
              taskId: confirm.task.id,
              novoStatus: 'CONCLUIDA',
            });
          }
        }}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        danger
        title="Excluir tarefa"
        message={`Excluir a tarefa "${confirmDelete?.task.titulo ?? ''}"? Você poderá desfazer pelo aviso exibido em seguida.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (confirmDelete) {
            dispatch({ type: 'DELETE_TASK', taskId: confirmDelete.task.id });
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </>
  );
}
```

---

### Task 31: Reescrever `src/App.tsx`

**Files:**
- Rewrite: `src/App.tsx`

- [x] **Step 1: Substituir o conteúdo de `src/App.tsx`**

```tsx
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import SectionTarefas from './components/sections/SectionTarefas';
import TaskFormModal from './components/modals/TaskFormModal';
import TaskDetailModal from './components/modals/TaskDetailModal';
import CancelModal from './components/modals/CancelModal';
import HistoryModal from './components/modals/HistoryModal';

function Shell() {
  const { state, dispatch } = useApp();
  const { modal } = state;

  return (
    <div className="h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex h-full flex-col">
        <Topbar
          title="Tarefas"
          search={state.filters.search}
          onSearch={(value) => dispatch({ type: 'SET_FILTERS', filters: { search: value } })}
          onNewTask={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'create' } })}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <SectionTarefas />
        </main>
      </div>

      {/* Modais */}
      {modal.type === 'create' && (
        <TaskFormModal open onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'edit' && (
        <TaskFormModal open taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'detail' && (
        <TaskDetailModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'cancel' && (
        <CancelModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'history' && (
        <HistoryModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </ToastProvider>
  );
}
```

---

### Task 32: Remover arquivos mortos

**Files:**
- Delete: vários (ver Step 1)

- [x] **Step 1: Remover os arquivos (git rm)**

```bash
git rm -q src/components/sections/SectionVisaoGeral.tsx
git rm -q src/components/sections/SectionColaboradores.tsx
git rm -q src/components/collaborators/CollaboratorCard.tsx
git rm -q src/components/modals/CollaboratorDetailModal.tsx
git rm -q src/components/modals/ReassignModal.tsx
git rm -q src/components/modals/ApproveModal.tsx
git rm -q src/components/modals/ReturnModal.tsx
git rm -q src/components/tasks/ProximoPassoBadge.tsx
git rm -q src/components/tasks/ReworkBadge.tsx
git rm -q src/components/ui/Avatar.tsx
git rm -q src/utils/permissions.ts
git rm -q src/utils/permissions.test.ts
git rm -q src/components/tasks/ProximoPassoBadge.test.tsx
git rm -q src/components/tasks/ReworkBadge.test.tsx
git rm -q src/components/modals/ReassignModal.test.tsx
git rm -q src/components/tasks/TaskRow.permissions.test.tsx
rmdir src/components/collaborators 2>/dev/null || true
```

(`src/utils/perfis.ts` não existe no projeto atual; removê-lo não é necessário. Se o diretório `src/components/collaborators/` ficar vazio, o `rmdir` acima o remove.)

- [x] **Step 2: Verificar compilação e testes**

Run: `npm run build`
Expected: erros **apenas nos arquivos de teste antigos** (`src/**/*.test.ts(x)`) — a aplicação (código sem testes) compila. Como o `tsc` inclui `src` inteiro, os testes antigos, que referenciam a API removida, continuam acusando erro até serem reescritos na Fase 6; o build passa de fato apenas na Task 41. Qualquer erro em arquivo de aplicação é referência remanescente a corrigir (o `tsc` lista arquivo/linha).

---

## Fase 6 — Testes

> Regra: ao reescrever um teste, rode `npm test -- <arquivo>` (Vitest filtra por caminho) até ficar verde.

### Task 33: Reescrever `src/utils/status.test.ts`

**Files:**
- Rewrite: `src/utils/status.test.ts`

- [x] **Step 1: Substituir o conteúdo de `src/utils/status.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { canTransition, transicoesDisponiveis } from './status';

describe('canTransition', () => {
  it('permite o fluxo linear GTD', () => {
    expect(canTransition('CAIXA_ENTRADA', 'A_FAZER')).toBe(true);
    expect(canTransition('A_FAZER', 'EM_ANDAMENTO')).toBe(true);
    expect(canTransition('EM_ANDAMENTO', 'CONCLUIDA')).toBe(true);
  });

  it('permite retomar CONCLUIDA → EM_ANDAMENTO', () => {
    expect(canTransition('CONCLUIDA', 'EM_ANDAMENTO')).toBe(true);
  });

  it('permite cancelar a partir de qualquer status não-terminal', () => {
    for (const from of ['CAIXA_ENTRADA', 'A_FAZER', 'EM_ANDAMENTO'] as const) {
      expect(canTransition(from, 'CANCELADA')).toBe(true);
    }
  });

  it('bloqueia cancelamento a partir de CONCLUIDA', () => {
    expect(canTransition('CONCLUIDA', 'CANCELADA')).toBe(false);
  });

  it('bloqueia transições inválidas e reversas', () => {
    expect(canTransition('A_FAZER', 'CAIXA_ENTRADA')).toBe(false);
    expect(canTransition('CAIXA_ENTRADA', 'CONCLUIDA')).toBe(false);
    expect(canTransition('EM_ANDAMENTO', 'A_FAZER')).toBe(false);
    expect(canTransition('CONCLUIDA', 'A_FAZER')).toBe(false);
    expect(canTransition('CONCLUIDA', 'CAIXA_ENTRADA')).toBe(false);
  });

  it('CANCELADA é terminal: nenhuma transição de saída', () => {
    const statuses = ['CAIXA_ENTRADA', 'A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'] as const;
    for (const to of statuses) {
      expect(canTransition('CANCELADA', to)).toBe(false);
    }
  });
});

describe('transicoesDisponiveis', () => {
  it('CAIXA_ENTRADA oferece A_FAZER e CANCELADA', () => {
    expect(transicoesDisponiveis('CAIXA_ENTRADA').sort()).toEqual(['A_FAZER', 'CANCELADA']);
  });

  it('A_FAZER oferece EM_ANDAMENTO e CANCELADA', () => {
    expect(transicoesDisponiveis('A_FAZER').sort()).toEqual(['CANCELADA', 'EM_ANDAMENTO']);
  });

  it('EM_ANDAMENTO oferece CONCLUIDA e CANCELADA', () => {
    expect(transicoesDisponiveis('EM_ANDAMENTO').sort()).toEqual(['CANCELADA', 'CONCLUIDA']);
  });

  it('CONCLUIDA só oferece retomar', () => {
    expect(transicoesDisponiveis('CONCLUIDA')).toEqual(['EM_ANDAMENTO']);
  });

  it('CANCELADA não tem transições de saída', () => {
    expect(transicoesDisponiveis('CANCELADA')).toEqual([]);
  });
});
```

- [x] **Step 2: Verificar** — Run: `npm test -- src/utils/status.test.ts`
Expected: PASS

---

### Task 34: Reescrever `src/utils/tasks.test.ts`

**Files:**
- Rewrite: `src/utils/tasks.test.ts`

- [x] **Step 1: Substituir o conteúdo de `src/utils/tasks.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { TAREFAS } from '../data/mockData';
import {
  computeIndicators,
  createTask,
  EMPTY_FILTERS,
  filterTasks,
  hasActiveFilters,
  nextTaskId,
} from './tasks';

const NOW = new Date('2026-08-03T12:00:00');

describe('filterTasks', () => {
  it('filtro vazio retorna todas', () => {
    expect(filterTasks(TAREFAS, EMPTY_FILTERS, NOW)).toHaveLength(TAREFAS.length);
  });

  it('filtra por busca no título', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, search: 'checkout' }, NOW);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.titulo.toLowerCase().includes('checkout'))).toBe(true);
  });

  it('filtra por status múltiplo', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, status: ['CAIXA_ENTRADA', 'A_FAZER'] }, NOW);
    expect(result.every((t) => t.status === 'CAIXA_ENTRADA' || t.status === 'A_FAZER')).toBe(true);
  });

  it('filtra por vencidas (exclui concluídas e canceladas)', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, prazo: 'vencidas' }, NOW);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA')).toBe(true);
    expect(
      result.every((t) => t.prazo !== null && new Date(t.prazo) < new Date('2026-08-03T00:00:00'))
    ).toBe(true);
  });

  it('filtra apenas favoritas', () => {
    const favorita = { ...TAREFAS[0], id: 'TA-FAV', favorita: true };
    const result = filterTasks([TAREFAS[1], favorita], { ...EMPTY_FILTERS, favoritas: true }, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-FAV');
  });

  it('filtra por categoria', () => {
    const comCategoria = { ...TAREFAS[0], id: 'TA-CAT', categoria: 'Desenvolvimento' };
    const result = filterTasks(
      [TAREFAS[1], comCategoria],
      { ...EMPTY_FILTERS, categorias: ['Desenvolvimento'] },
      NOW
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-CAT');
  });

  it('filtra por prazo vencendo hoje', () => {
    const hoje = { ...TAREFAS[0], id: 'TA-HOJE', prazo: '2026-08-03' };
    const result = filterTasks([TAREFAS[1], hoje], { ...EMPTY_FILTERS, prazo: 'hoje' }, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-HOJE');
  });

  it('filtra por prazo sem data', () => {
    const semPrazo = { ...TAREFAS[0], id: 'TA-SEMPRAZO', prazo: null };
    const result = filterTasks([semPrazo, TAREFAS[1]], { ...EMPTY_FILTERS, prazo: 'semPrazo' }, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-SEMPRAZO');
  });

  it('ordena por título', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, sortBy: 'titulo' }, NOW);
    const titulos = result.map((t) => t.titulo);
    expect([...titulos].sort((a, b) => a.localeCompare(b))).toEqual(titulos);
  });

  it('ordena por prioridade (crítica primeiro)', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, sortBy: 'prioridade' }, NOW);
    expect(result[0].prioridade).toBe('critica');
  });
});

describe('hasActiveFilters', () => {
  it('retorna false para filtros vazios', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it('detecta busca e filtros ativos', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, search: 'x' })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, status: ['A_FAZER'] })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, favoritas: true })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, categorias: ['Marketing'] })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, prazo: 'hoje' })).toBe(true);
  });

  it('ordenação não conta como filtro', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, sortBy: 'titulo' })).toBe(false);
  });
});

describe('computeIndicators', () => {
  it('soma dos status = total', () => {
    const ind = computeIndicators(TAREFAS, NOW);
    expect(ind.total).toBe(TAREFAS.length);
    expect(
      ind.caixaEntrada +
        ind.aFazer +
        ind.emAndamento +
        ind.concluidas +
        ind.canceladas
    ).toBe(ind.total);
  });

  it('existe pelo menos uma atrasada no seed', () => {
    expect(computeIndicators(TAREFAS, NOW).atrasadas).toBeGreaterThan(0);
  });

  it('CONCLUIDA com prazo vencido não conta como atrasada', () => {
    const concluida = { ...TAREFAS[0], id: 'TA-CONCL', status: 'CONCLUIDA' as const, prazo: '2026-07-01' };
    const base = computeIndicators(TAREFAS, NOW);
    const ind = computeIndicators([...TAREFAS, concluida], NOW);
    expect(ind.concluidas).toBe(base.concluidas + 1);
    expect(ind.atrasadas).toBe(base.atrasadas);
  });

  it('conta CANCELADA e não a marca como atrasada', () => {
    const cancelada = { ...TAREFAS[0], id: 'TA-CANC', status: 'CANCELADA' as const, prazo: '2026-07-01' };
    const base = computeIndicators(TAREFAS, NOW);
    const ind = computeIndicators([...TAREFAS, cancelada], NOW);
    expect(ind.total).toBe(TAREFAS.length + 1);
    expect(ind.canceladas).toBe(base.canceladas + 1);
    expect(ind.atrasadas).toBe(base.atrasadas);
  });
});

describe('nextTaskId / createTask', () => {
  it('gera o próximo id sequencial a partir do seed', () => {
    const maxNum = TAREFAS.reduce(
      (max, t) => Math.max(max, Number(t.id.replace(/\D/g, ''))),
      0
    );
    expect(nextTaskId(TAREFAS)).toBe(`TA-${String(maxNum + 1).padStart(3, '0')}`);
  });

  it('considera ids não numéricos sem quebrar', () => {
    const lista = [{ ...TAREFAS[0], id: 'X' }, { ...TAREFAS[1], id: 'TA-099' }];
    expect(nextTaskId(lista)).toBe('TA-100');
  });

  it('gera id sequencial, status CAIXA_ENTRADA e entrada de histórico de criação', () => {
    const task = createTask(TAREFAS, {
      titulo: 'Nova tarefa',
      descricao: 'desc',
      prioridade: 'alta',
      prazo: '2026-08-10',
    });
    expect(task.status).toBe('CAIXA_ENTRADA');
    expect(task.criadaEm).toBeDefined();
    expect(task.historico).toHaveLength(1);
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: null,
      novoStatus: 'CAIXA_ENTRADA',
    });
    expect('responsavelId' in task).toBe(false);
    expect('criadorId' in task).toBe(false);
  });

  it('omite categoria vazia e tags vazias', () => {
    const task = createTask(TAREFAS, {
      titulo: 'X',
      descricao: '',
      prioridade: 'media',
      prazo: null,
      categoria: '',
      tags: [],
    });
    expect(task.categoria).toBeUndefined();
    expect(task.tags).toBeUndefined();
  });

  it('preserva categoria e tags quando preenchidos', () => {
    const task = createTask(TAREFAS, {
      titulo: 'X',
      descricao: '',
      prioridade: 'media',
      prazo: null,
      categoria: 'Marketing',
      tags: ['email', 'urgente'],
    });
    expect(task.categoria).toBe('Marketing');
    expect(task.tags).toEqual(['email', 'urgente']);
  });
});
```

- [x] **Step 2: Verificar** — Run: `npm test -- src/utils/tasks.test.ts`
Expected: PASS

> **Nota:** as asserções "filtra por vencidas" e "existe pelo menos uma atrasada no seed" dependem do seed determinístico (50 tarefas geradas com prazos entre +5 e +25 dias úteis). Se falharem ao rodar, ajuste os dados de `mockData.ts`/`seedGenerator.ts`; se optar por mudar `NOW`, atualize também os literais de data hardcoded do arquivo (o teste "hoje" usa `prazo: '2026-08-03'` e o "vencidas" compara com `new Date('2026-08-03T00:00:00')`). Não relaxe a asserção sem reavaliar o seed.

---

### Task 35: Reescrever `src/context/AppContext.test.ts`

**Files:**
- Rewrite: `src/context/AppContext.test.ts`

- [x] **Step 1: Substituir o conteúdo de `src/context/AppContext.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { appReducer } from './appReducer';
import type { AppState } from './types';

const baseState: AppState = {
  tasks: [
    {
      id: 'TA-001',
      titulo: 'Login',
      descricao: '',
      prioridade: 'alta',
      prazo: '2026-08-10',
      status: 'CAIXA_ENTRADA',
      criadaEm: '2026-08-01T08:00:00',
      historico: [],
    },
    {
      id: 'TA-002',
      titulo: 'Campanha',
      descricao: '',
      prioridade: 'media',
      prazo: null,
      status: 'CONCLUIDA',
      criadaEm: '2026-08-01T09:00:00',
      historico: [],
    },
  ],
  view: 'lista',
  sidebarOpen: false,
  filters: { search: '', status: [], prioridade: [], prazo: 'todas', favoritas: false, categorias: [], sortBy: null },
  kpiCollapsed: false,
  filtersOpen: true,
  modal: { type: 'none' },
  past: [],
};

describe('appReducer — CHANGE_STATUS', () => {
  it('avança CAIXA_ENTRADA → A_FAZER e grava histórico', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'A_FAZER',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.status).toBe('A_FAZER');
    expect(task.historico).toHaveLength(1);
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'CAIXA_ENTRADA',
      novoStatus: 'A_FAZER',
    });
  });

  it('avança A_FAZER → EM_ANDAMENTO → CONCLUIDA e define concluidaEm', () => {
    let s = appReducer(baseState, { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'A_FAZER' });
    s = appReducer(s, { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'EM_ANDAMENTO' });
    s = appReducer(s, { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'CONCLUIDA' });
    const task = s.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.status).toBe('CONCLUIDA');
    expect(task.concluidaEm).toBeDefined();
    expect(task.atualizadaEm).toBeDefined();
  });

  it('retoma CONCLUIDA → EM_ANDAMENTO e limpa concluidaEm', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-002',
      novoStatus: 'EM_ANDAMENTO',
    });
    const task = next.tasks.find((t) => t.id === 'TA-002')!;
    expect(task.status).toBe('EM_ANDAMENTO');
    expect(task.concluidaEm).toBeUndefined();
  });

  it('transição inválida (CAIXA_ENTRADA → CONCLUIDA) é no-op sem undo', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CONCLUIDA',
    });
    expect(next).toBe(baseState);
    expect(next.past).toHaveLength(0);
  });
});

describe('appReducer — cancelamento (CANCELADA)', () => {
  const comStatus = (status: Task['status']): AppState => ({
    ...baseState,
    tasks: baseState.tasks.map((t) => (t.id === 'TA-001' ? { ...t, status } : t)),
  });

  it('cancela CAIXA_ENTRADA com observação e grava histórico', () => {
    const next = appReducer(comStatus('CAIXA_ENTRADA'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CANCELADA',
      observacao: 'Tarefa perdeu o sentido.',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.status).toBe('CANCELADA');
    expect(task.concluidaEm).toBeUndefined();
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'CAIXA_ENTRADA',
      novoStatus: 'CANCELADA',
      observacao: 'Tarefa perdeu o sentido.',
    });
  });

  it('cancela a partir de A_FAZER e EM_ANDAMENTO', () => {
    for (const status of ['A_FAZER', 'EM_ANDAMENTO'] as const) {
      const next = appReducer(comStatus(status), {
        type: 'CHANGE_STATUS',
        taskId: 'TA-001',
        novoStatus: 'CANCELADA',
        observacao: 'x',
      });
      expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('CANCELADA');
    }
  });

  it('não cancela a partir de CONCLUIDA', () => {
    const next = appReducer(comStatus('CONCLUIDA'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CANCELADA',
      observacao: 'x',
    });
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('CONCLUIDA');
    expect(next.past).toHaveLength(0);
  });

  it('cancelamento sem observação é no-op (guarda anti-bypass)', () => {
    const next = appReducer(comStatus('CAIXA_ENTRADA'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CANCELADA',
    });
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('CAIXA_ENTRADA');
    expect(next.past).toHaveLength(0);
  });

  it('CANCELADA é terminal: nenhuma transição de saída', () => {
    const cancelada = comStatus('CANCELADA');
    for (const novoStatus of ['CAIXA_ENTRADA', 'A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA'] as const) {
      const next = appReducer(cancelada, {
        type: 'CHANGE_STATUS',
        taskId: 'TA-001',
        novoStatus,
      });
      expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('CANCELADA');
      expect(next.past).toHaveLength(0);
    }
  });
});

describe('appReducer — CREATE_TASK / DUPLICATE_TASK / DELETE_TASK', () => {
  it('adiciona nova tarefa', () => {
    const task: Task = {
      id: 'TA-003',
      titulo: 'Nova',
      descricao: '',
      prioridade: 'baixa',
      prazo: null,
      status: 'CAIXA_ENTRADA',
      criadaEm: '2026-08-03T10:00:00',
      historico: [],
    };
    const next = appReducer(baseState, { type: 'CREATE_TASK', task });
    expect(next.tasks).toHaveLength(baseState.tasks.length + 1);
  });

  it('duplica tarefa como CAIXA_ENTRADA com novo id', () => {
    const next = appReducer(baseState, { type: 'DUPLICATE_TASK', taskId: 'TA-001' });
    expect(next.tasks).toHaveLength(baseState.tasks.length + 1);
    const copy = next.tasks.find((t) => t.id !== 'TA-001' && t.id !== 'TA-002')!;
    expect(copy.titulo).toBe('Login');
    expect(copy.status).toBe('CAIXA_ENTRADA');
    expect(copy.historico[0]).toMatchObject({ tipo: 'status', novoStatus: 'CAIXA_ENTRADA' });
  });

  it('exclui tarefa pelo id', () => {
    const next = appReducer(baseState, { type: 'DELETE_TASK', taskId: 'TA-001' });
    expect(next.tasks.some((t) => t.id === 'TA-001')).toBe(false);
    expect(next.tasks).toHaveLength(baseState.tasks.length - 1);
  });

  it('excluir tarefa inexistente não altera o estado', () => {
    const next = appReducer(baseState, { type: 'DELETE_TASK', taskId: 'TA-999' });
    expect(next).toBe(baseState);
  });

  it('alterna o favorito da tarefa', () => {
    const next = appReducer(baseState, { type: 'TOGGLE_FAVORITE', taskId: 'TA-001' });
    expect(next.tasks.find((t) => t.id === 'TA-001')!.favorita).toBe(true);
    const back = appReducer(next, { type: 'TOGGLE_FAVORITE', taskId: 'TA-001' });
    expect(back.tasks.find((t) => t.id === 'TA-001')!.favorita).toBe(false);
  });
});

describe('appReducer — REORDER_TASKS / auditoria de edição', () => {
  it('reordena movendo a tarefa para antes do alvo', () => {
    const next = appReducer(baseState, { type: 'REORDER_TASKS', taskId: 'TA-002', toTaskId: 'TA-001' });
    expect(next.tasks.map((t) => t.id)).toEqual(['TA-002', 'TA-001']);
  });

  it('define atualizadaEm ao editar', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { titulo: 'Novo título' },
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.titulo).toBe('Novo título');
    expect(task.atualizadaEm).toBeDefined();
  });

  it('mudar prazo e prioridade grava histórico com diff', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { prazo: '2026-08-15', prioridade: 'baixa' },
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.prazo).toBe('2026-08-15');
    expect(task.prioridade).toBe('baixa');
    expect(task.historico).toHaveLength(1);
    expect(task.historico[0]).toMatchObject({
      tipo: 'info',
      statusAnterior: 'CAIXA_ENTRADA',
      novoStatus: 'CAIXA_ENTRADA',
      observacao: 'Prazo alterado de 2026-08-10 para 2026-08-15; Prioridade alterada de alta para baixa',
    });
  });

  it('UPDATE_TASK com campo fora da whitelist (ex.: status) é no-op', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { titulo: 'Novo título', status: 'CONCLUIDA' },
    });
    expect(next).toBe(baseState);
  });

  it('edição sem mudança efetiva retorna estado inalterado', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: {
        titulo: 'Login',
        descricao: '',
        prioridade: 'alta',
        prazo: '2026-08-10',
        categoria: undefined,
        tags: [],
      },
    });
    expect(next).toBe(baseState);
  });
});

describe('appReducer — UNDO', () => {
  it('desfaz a última mutação restaurando as tarefas anteriores', () => {
    const afterDelete = appReducer(baseState, { type: 'DELETE_TASK', taskId: 'TA-001' });
    expect(afterDelete.tasks.map((t) => t.id)).toEqual(['TA-002']);
    const undone = appReducer(afterDelete, { type: 'UNDO' });
    expect(undone.tasks.map((t) => t.id)).toEqual(['TA-001', 'TA-002']);
  });

  it('undo com histórico vazio não altera o estado', () => {
    expect(appReducer(baseState, { type: 'UNDO' })).toBe(baseState);
  });

  it('TOGGLE_FAVORITE e REORDER_TASKS não empilham undo', () => {
    expect(appReducer(baseState, { type: 'TOGGLE_FAVORITE', taskId: 'TA-001' }).past).toHaveLength(0);
    expect(appReducer(baseState, { type: 'REORDER_TASKS', taskId: 'TA-002', toTaskId: 'TA-001' }).past).toHaveLength(0);
  });

  it('DELETE_TASK empilha undo', () => {
    const next = appReducer(baseState, { type: 'DELETE_TASK', taskId: 'TA-001' });
    expect(next.past).toHaveLength(1);
  });
});

describe('appReducer — controles de interface', () => {
  it('TOGGLE_SIDEBAR alterna sidebarOpen', () => {
    const next = appReducer(baseState, { type: 'TOGGLE_SIDEBAR' });
    expect(next.sidebarOpen).toBe(true);
  });

  it('SET_VIEW alterna a visualização', () => {
    const next = appReducer(baseState, { type: 'SET_VIEW', view: 'quadro' });
    expect(next.view).toBe('quadro');
  });

  it('RESET_FILTERS limpa filtros e preserva a ordenação', () => {
    const comFiltros: AppState = {
      ...baseState,
      filters: { ...baseState.filters, status: ['A_FAZER'], favoritas: true, sortBy: 'titulo' },
    };
    const next = appReducer(comFiltros, { type: 'RESET_FILTERS' });
    expect(next.filters.sortBy).toBe('titulo');
    expect(next.filters.status).toEqual([]);
    expect(next.filters.favoritas).toBe(false);
  });
});
```

- [x] **Step 2: Verificar** — Run: `npm test -- src/context/AppContext.test.ts`
Expected: PASS

---

### Task 36: Reescrever `src/services/storage.test.ts`

**Files:**
- Rewrite: `src/services/storage.test.ts`

- [x] **Step 1: Substituir o conteúdo de `src/services/storage.test.ts`**

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { clearState, loadState, saveState, STORAGE_KEY } from './storage';

const fakeTask = (id: string, status: Task['status'] = 'CAIXA_ENTRADA'): Task => ({
  id,
  titulo: `Tarefa ${id}`,
  descricao: '',
  prioridade: 'media',
  prazo: null,
  status,
  criadaEm: '2026-08-03T10:00:00',
  historico: [],
});

function installMockLocalStorage() {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
}

beforeEach(() => installMockLocalStorage());

afterEach(() => {
  delete (globalThis as Record<string, unknown>).localStorage;
});

describe('storage', () => {
  it('salva e carrega o estado', () => {
    const tasks = [fakeTask('TA-001'), fakeTask('TA-002', 'CONCLUIDA')];
    saveState({ tasks });

    expect(loadState()).toEqual({ tasks });
  });

  it('retorna null quando não há dados salvos', () => {
    expect(loadState()).toBeNull();
  });

  it('retorna null para JSON corrompido', () => {
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: () => '{not-valid-json',
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    expect(loadState()).toBeNull();
  });

  it('retorna null para versão incompatível (migração futura)', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 999, tasks: [] })
    );
    expect(loadState()).toBeNull();
  });

  it('retorna null quando o shape do estado é inválido', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, tasks: 'x' }));
    expect(loadState()).toBeNull();
  });

  it('descarta apenas tarefas inválidas, mantendo as válidas', () => {
    const invalida = { id: 'TA-BAD', titulo: 42 }; // sem shape de Task
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, tasks: [fakeTask('TA-001'), invalida] })
    );
    expect(loadState()).toEqual({ tasks: [fakeTask('TA-001')] });
  });

  it('descarta tarefa com status fora do enum', () => {
    const invalida: unknown = { ...fakeTask('TA-BAD'), status: 'XPTO' };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, tasks: [fakeTask('TA-001'), invalida] })
    );
    expect(loadState()).toEqual({ tasks: [fakeTask('TA-001')] });
  });

  it('descarta tarefa com prioridade fora do enum', () => {
    const invalida: unknown = { ...fakeTask('TA-BAD'), prioridade: 'ultra' };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, tasks: [fakeTask('TA-001'), invalida] })
    );
    expect(loadState()).toEqual({ tasks: [fakeTask('TA-001')] });
  });

  it('mantém tarefa completa com campos opcionais válidos', () => {
    const completa = {
      ...fakeTask('TA-OK'),
      favorita: true,
      categoria: 'Dev',
      tags: ['a', 'b'],
      atualizadaEm: '2026-08-03T10:00:00',
      concluidaEm: '2026-08-03T11:00:00',
      historico: [
        {
          id: 'h1',
          dataHora: '2026-08-03T10:00:00',
          statusAnterior: null,
          novoStatus: 'CAIXA_ENTRADA',
          tipo: 'status',
        },
      ],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, tasks: [completa] }));
    expect(loadState()).toEqual({ tasks: [completa] });
  });

  it('clearState remove os dados', () => {
    saveState({ tasks: [fakeTask('TA-001')] });
    clearState();
    expect(loadState()).toBeNull();
  });
});
```

- [x] **Step 2: Verificar** — Run: `npm test -- src/services/storage.test.ts`
Expected: PASS

---

### Task 37: Reescrever `src/utils/date.test.ts` (isOverdue)

**Files:**
- Modify: `src/utils/date.test.ts:29-53`

- [x] **Step 1: Atualizar os testes de `isOverdue`**

Substitua o bloco `describe('isOverdue', ...)` (linhas 29-54) por:

```ts
describe('isOverdue', () => {
  it('prazo de ontem e não concluída = atrasada', () => {
    expect(isOverdue('2026-08-02T00:00:00', 'EM_ANDAMENTO', NOW)).toBe(true);
  });

  it('prazo de hoje não é atrasado', () => {
    expect(isOverdue('2026-08-03T00:00:00', 'EM_ANDAMENTO', NOW)).toBe(false);
  });

  it('tarefa concluída nunca é atrasada', () => {
    expect(isOverdue('2026-07-01T00:00:00', 'CONCLUIDA', NOW)).toBe(false);
  });

  it('tarefa cancelada nunca é atrasada', () => {
    expect(isOverdue('2026-07-01T00:00:00', 'CANCELADA', NOW)).toBe(false);
  });

  it('sem prazo nunca é atrasada', () => {
    expect(isOverdue(null, 'CAIXA_ENTRADA', NOW)).toBe(false);
  });
});
```

- [x] **Step 2: Verificar** — Run: `npm test -- src/utils/date.test.ts`
Expected: PASS

---

### Task 38: Reescrever os testes de componentes — parte 1 (tarefa)

**Files:**
- Rewrite: `src/components/tasks/StatusBadge.test.tsx`
- Rewrite: `src/components/tasks/cycleActions.test.ts`
- Rewrite: `src/components/tasks/CycleStepper.test.tsx`
- Rewrite: `src/components/tasks/TaskRow.test.tsx`
- Rewrite: `src/components/tasks/TaskKanban.test.tsx`
- Rewrite: `src/components/tasks/TasksTable.test.tsx`

- [x] **Step 1: Substituir `src/components/tasks/StatusBadge.test.tsx`**

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renderiza os rótulos dos status GTD', () => {
    render(<StatusBadge status="CAIXA_ENTRADA" />);
    render(<StatusBadge status="A_FAZER" />);
    render(<StatusBadge status="EM_ANDAMENTO" />);
    render(<StatusBadge status="CONCLUIDA" />);
    render(<StatusBadge status="CANCELADA" />);
    expect(screen.getByText('Caixa de entrada')).toBeInTheDocument();
    expect(screen.getByText('A fazer')).toBeInTheDocument();
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    expect(screen.getByText('Concluída')).toBeInTheDocument();
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Substituir `src/components/tasks/cycleActions.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import type { Task } from '../../types';
import { cycleActionFor } from './cycleActions';

const TASK: Task = {
  id: 'TA-001',
  titulo: 'Login',
  descricao: '',
  prioridade: 'media',
  prazo: null,
  status: 'CAIXA_ENTRADA',
  criadaEm: '2026-08-01T08:00:00',
  historico: [],
};

describe('cycleActionFor', () => {
  it('A_FAZER → Planejar', () => {
    const act = cycleActionFor(TASK, 'A_FAZER');
    expect(act?.label).toBe('Planejar');
  });

  it('EM_ANDAMENTO em status A_FAZER → Iniciar', () => {
    const act = cycleActionFor({ ...TASK, status: 'A_FAZER' }, 'EM_ANDAMENTO');
    expect(act?.label).toBe('Iniciar');
  });

  it('EM_ANDAMENTO em status CONCLUIDA → Retomar', () => {
    const act = cycleActionFor({ ...TASK, status: 'CONCLUIDA' }, 'EM_ANDAMENTO');
    expect(act?.label).toBe('Retomar');
  });

  it('CONCLUIDA → Concluir', () => {
    const act = cycleActionFor({ ...TASK, status: 'EM_ANDAMENTO' }, 'CONCLUIDA');
    expect(act?.label).toBe('Concluir');
  });

  it('CANCELADA → Cancelar', () => {
    const act = cycleActionFor({ ...TASK, status: 'EM_ANDAMENTO' }, 'CANCELADA');
    expect(act?.label).toBe('Cancelar');
  });
});
```

- [x] **Step 3: Substituir `src/components/tasks/CycleStepper.test.tsx`**

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import CycleStepper from './CycleStepper';

describe('CycleStepper', () => {
  it('mostra o badge Cancelada para tarefa cancelada', () => {
    render(<CycleStepper status="CANCELADA" />);
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
  });

  it('não exibe etapa Cancelada no ciclo de uma tarefa normal', () => {
    render(<CycleStepper status="CONCLUIDA" />);
    expect(screen.queryByText('Cancelada')).not.toBeInTheDocument();
  });

  it('marca todos os passos como não concluídos para uma tarefa cancelada', () => {
    render(<CycleStepper status="CANCELADA" />);
    expect(screen.getByTitle('Ciclo: CANCELADA')).toBeInTheDocument();
  });
});
```

- [x] **Step 4: Substituir `src/components/tasks/TaskRow.test.tsx`**

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskRow from './TaskRow';
import { useApp } from '../../context/AppContext';
import { renderWithApp } from '../../test/renderWithApp';
import type { Task } from '../../types';

const CAIXA_ENTRADA: Task = {
  id: 'TA-001',
  titulo: 'Login',
  descricao: '',
  prioridade: 'media',
  prazo: null,
  status: 'CAIXA_ENTRADA',
  criadaEm: '2026-08-01T08:00:00',
  historico: [],
};

const EM_ANDAMENTO: Task = { ...CAIXA_ENTRADA, id: 'TA-002', status: 'EM_ANDAMENTO' };
const CONCLUIDA: Task = { ...CAIXA_ENTRADA, id: 'TA-003', status: 'CONCLUIDA' };

/** Renderiza a linha conectada ao store (o favorito é lido de state.tasks). */
function RowFromStore({ id }: { id: string }) {
  const { state } = useApp();
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return null;
  return (
    <table>
      <tbody>
        <TaskRow task={task} onConfirmComplete={() => {}} onDeleteRequest={() => {}} />
      </tbody>
    </table>
  );
}

function renderRow(task: Task, props: Partial<Parameters<typeof TaskRow>[0]> = {}) {
  return renderWithApp(
    <table>
      <tbody>
        <TaskRow
          task={task}
          onConfirmComplete={() => {}}
          onDeleteRequest={() => {}}
          {...props}
        />
      </tbody>
    </table>
  );
}

beforeEach(() => localStorage.clear());

describe('TaskRow — ações', () => {
  it('sempre exibe Editar, Duplicar e Excluir', () => {
    renderRow(CAIXA_ENTRADA);
    expect(screen.getByTitle('Editar')).toBeInTheDocument();
    expect(screen.getByTitle('Duplicar')).toBeInTheDocument();
    expect(screen.getByTitle('Excluir')).toBeInTheDocument();
  });

  it('exibe ações do ciclo por status', () => {
    renderRow(CAIXA_ENTRADA);
    expect(screen.getByTitle('Planejar')).toBeInTheDocument();
    expect(screen.getByTitle('Cancelar')).toBeInTheDocument();

    renderRow(EM_ANDAMENTO);
    expect(screen.getByTitle('Concluir')).toBeInTheDocument();

    renderRow(CONCLUIDA);
    expect(screen.getByTitle('Retomar')).toBeInTheDocument();
  });

  it('CONCLUIDA não exibe Cancelar', () => {
    renderRow(CONCLUIDA);
    expect(screen.queryByTitle('Cancelar')).not.toBeInTheDocument();
  });

  it('favoritar alterna o estado visual da estrela', async () => {
    const user = userEvent.setup();
    renderWithApp(<RowFromStore id="TA-001" />);
    await user.click(screen.getByTitle('Favoritar'));
    expect(screen.getByTitle('Remover dos favoritos')).toBeInTheDocument();
    await user.click(screen.getByTitle('Remover dos favoritos'));
    expect(screen.getByTitle('Favoritar')).toBeInTheDocument();
  });

  it('excluir dispara onDeleteRequest', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderRow(CAIXA_ENTRADA, { onDeleteRequest: onDelete });
    await user.click(screen.getByTitle('Excluir'));
    expect(onDelete).toHaveBeenCalledWith(CAIXA_ENTRADA);
  });
});
```



- [x] **Step 5: Substituir `src/components/tasks/TaskKanban.test.tsx`**

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import TaskKanban from './TaskKanban'
import { renderWithApp } from '../../test/renderWithApp'
import { useApp } from '../../context/AppContext'
import { TAREFAS } from '../../data/mockData'

function Probe({ id }: { id: string }) {
  const { state } = useApp()
  return <output data-testid="probe">{state.tasks.find((t) => t.id === id)?.status}</output>
}

function renderKanban(props: Partial<Parameters<typeof TaskKanban>[0]> = {}) {
  return renderWithApp(
    <TaskKanban
      tasks={TAREFAS}
      totalCount={TAREFAS.length}
      onConfirmComplete={() => {}}
      {...props}
    />
  )
}

beforeEach(() => localStorage.clear())

describe('TaskKanban', () => {
  it('renderiza as cinco colunas com seus rótulos de StatusBadge', () => {
    renderKanban()
    expect(screen.getByText('Caixa de entrada')).toBeInTheDocument()
    expect(screen.getByText('A fazer')).toBeInTheDocument()
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
    expect(screen.getByText('Concluída')).toBeInTheDocument()
    expect(screen.getByText('Cancelada')).toBeInTheDocument()
  })

  it('renderiza cards de tarefa com títulos', () => {
    renderKanban()
    expect(screen.getByText('Corrigir bug de checkout')).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há tarefas e totalCount é zero', () => {
    renderKanban({ tasks: [], totalCount: 0 })
    expect(screen.getByText('Nenhuma tarefa criada ainda')).toBeInTheDocument()
  })

  it('mostra estado vazio de filtro quando não há tarefas e totalCount é maior que zero', () => {
    renderKanban({ tasks: [], totalCount: 5 })
    expect(screen.getByText('Nenhuma tarefa encontrada')).toBeInTheDocument()
  })

  it('drop válido (CAIXA_ENTRADA → A_FAZER) dispara CHANGE_STATUS', async () => {
    const taskId = 'TA-001'
    renderWithApp(
      <>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
      </>
    )

    const card = screen.getByText('Ler e-mails pendentes').closest('div[draggable]')!
    const column = screen.getAllByText('A fazer')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('A_FAZER'))
  })

  it('drop inválido (CAIXA_ENTRADA → CONCLUIDA) não altera o status', async () => {
    const taskId = 'TA-001'
    renderWithApp(
      <>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
      </>
    )

    const card = screen.getByText('Ler e-mails pendentes').closest('div[draggable]')!
    const column = screen.getAllByText('Concluída')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('CAIXA_ENTRADA'))
  })

  it('drop para CANCELADA não altera o status (cancelamento exige observação)', async () => {
    const taskId = 'TA-001'
    renderWithApp(
      <>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
      </>
    )

    const card = screen.getByText('Ler e-mails pendentes').closest('div[draggable]')!
    const column = screen.getAllByText('Cancelada')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('CAIXA_ENTRADA'))
  })
})
```

- [x] **Step 6: Substituir `src/components/tasks/TasksTable.test.tsx`**

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import TasksTable from './TasksTable';
import { renderWithApp } from '../../test/renderWithApp';
import type { Task } from '../../types';

const TASKS: Task[] = [
  {
    id: 'TA-001',
    titulo: 'Login',
    descricao: '',
    prioridade: 'media',
    prazo: null,
    status: 'CAIXA_ENTRADA',
    criadaEm: '2026-08-01T08:00:00',
    historico: [],
  },
  {
    id: 'TA-002',
    titulo: 'Campanha',
    descricao: '',
    prioridade: 'media',
    prazo: null,
    status: 'CONCLUIDA',
    criadaEm: '2026-08-01T09:00:00',
    historico: [],
  },
];

function renderTable(props: Partial<Parameters<typeof TasksTable>[0]> = {}) {
  return renderWithApp(
    <TasksTable
      tasks={TASKS}
      totalCount={TASKS.length}
      onConfirmComplete={() => {}}
      onDeleteRequest={() => {}}
      reorderEnabled={false}
      onReorder={() => {}}
      {...props}
    />
  );
}

beforeEach(() => localStorage.clear());

describe('TasksTable', () => {
  it('mostra estado vazio de lista sem nenhuma tarefa', () => {
    renderTable({ tasks: [], totalCount: 0 });
    expect(screen.getAllByText('Nenhuma tarefa criada ainda').length).toBeGreaterThanOrEqual(1);
  });

  it('mostra estado vazio de filtro sem resultado', () => {
    renderTable({ tasks: [], totalCount: 5 });
    expect(screen.getAllByText('Nenhuma tarefa encontrada').length).toBeGreaterThanOrEqual(1);
  });

  it('mostra a dica de reordenação quando desabilitada', () => {
    renderTable({ reorderEnabled: false });
    expect(screen.getByText(/Reordenação por arrastar fica disponível/)).toBeInTheDocument();
  });

  it('drop de uma linha sobre outra dispara onReorder', async () => {
    const onReorder = vi.fn();
    renderTable({ reorderEnabled: true, onReorder });

    const rows = screen.getAllByRole('row').filter((r) => r.querySelector('td'));
    const [rowA, rowB] = rows;

    fireEvent.dragStart(rowA, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } });
    fireEvent.dragOver(rowB, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() });
    fireEvent.drop(rowB, { dataTransfer: { getData: () => 'TA-001' } });

    await waitFor(() => expect(onReorder).toHaveBeenCalledWith('TA-001', 'TA-002'));
  });
});
```

- [x] **Step 7: Verificar** — Run: `npm test -- src/components/tasks`
Expected: PASS (todos os testes da pasta `tasks`)

---

### Task 39: Reescrever os testes de componentes — parte 2 (layout)

**Files:**
- Rewrite: `src/components/layout/KPICards.test.tsx`
- Rewrite: `src/components/layout/FilterBar.test.tsx`
- Rewrite: `src/components/layout/Topbar.test.tsx`
- Rewrite: `src/components/layout/Sidebar.test.tsx`

- [x] **Step 1: Substituir `src/components/layout/KPICards.test.tsx`**

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KPICards from './KPICards';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';
import { computeIndicators } from '../../utils/tasks';
import { TAREFAS } from '../../data/mockData';

beforeEach(() => localStorage.clear());

function Probe() {
  const { state, dispatch } = useApp();
  return (
    <>
      <button onClick={() => dispatch({ type: 'SET_FILTERS', filters: { search: 'relatório' } })}>
        buscar relatório
      </button>
      <button onClick={() => dispatch({ type: 'TOGGLE_KPI_COLLAPSED' })}>alternar indicadores</button>
      <output data-testid="probe">
        {JSON.stringify({
          status: state.filters.status,
          prazo: state.filters.prazo,
          search: state.filters.search,
        })}
      </output>
    </>
  );
}

const indicators = computeIndicators(TAREFAS, new Date(2026, 7, 3));

describe('KPICards', () => {
  it('renders the 7 KPI cards with seed-derived values', () => {
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    expect(screen.getByRole('button', { name: /Total de tarefas/ })).toHaveTextContent(String(indicators.total));
    expect(screen.getByRole('button', { name: /Caixa de entrada/ })).toHaveTextContent(String(indicators.caixaEntrada));
    expect(screen.getByRole('button', { name: /A fazer/ })).toHaveTextContent(String(indicators.aFazer));
    expect(screen.getByRole('button', { name: /Em andamento/ })).toHaveTextContent(String(indicators.emAndamento));
    expect(screen.getByRole('button', { name: /Concluídas/ })).toHaveTextContent(String(indicators.concluidas));
    expect(screen.getByRole('button', { name: /Canceladas/ })).toHaveTextContent(String(indicators.canceladas));
    expect(screen.getByRole('button', { name: /Atrasadas/ })).toHaveTextContent(String(indicators.atrasadas));
  });

  it('recolhe e expande os cards de indicadores via estado global', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    const total = screen.getByRole('button', { name: /Total de tarefas/ });
    expect(total).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'alternar indicadores' }));

    expect(screen.queryByRole('button', { name: /Total de tarefas/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'alternar indicadores' }));

    expect(screen.getByRole('button', { name: /Total de tarefas/ })).toBeInTheDocument();
  });

  it('persiste o estado recolhido no localStorage', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: 'alternar indicadores' }));

    expect(localStorage.getItem('kpiCollapsed')).toBe('1');
  });

  it('clicking Caixa de entrada filters status CAIXA_ENTRADA', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: /Caixa de entrada/ }));

    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.status).toEqual(['CAIXA_ENTRADA']);
    });
  });

  it('clicking Atrasadas applies prazo vencidas', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: /Atrasadas/ }));

    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.prazo).toBe('vencidas');
    });
  });

  it('KPI de status limpa filtros ativos (busca) antes de aplicar o status', async () => {
    const user = userEvent.setup();
    renderWithApp(<><KPICards indicators={indicators} /><Probe /></>);

    await user.click(screen.getByRole('button', { name: 'buscar relatório' }));
    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.search).toBe('relatório');
    });

    await user.click(screen.getByRole('button', { name: /A fazer/ }));

    await waitFor(() => {
      const probe = JSON.parse(screen.getByTestId('probe').textContent!);
      expect(probe.search).toBe('');
      expect(probe.status).toEqual(['A_FAZER']);
      expect(probe.prazo).toBe('todas');
    });
  });
});
```

- [x] **Step 2: Substituir `src/components/layout/FilterBar.test.tsx`**

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from './FilterBar';
import { renderWithApp } from '../../test/renderWithApp';

beforeEach(() => localStorage.clear());

describe('FilterBar', () => {
  it('exibe os controles de filtro e ordenação', () => {
    renderWithApp(<FilterBar />);
    expect(screen.getByRole('button', { name: /Status/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prioridade/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Categoria/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Ordenar por' })).toBeInTheDocument();
  });

  it('não mostra o filtro de responsável nem o de movimentação', () => {
    renderWithApp(<FilterBar />);
    expect(screen.queryByRole('button', { name: /Responsável/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Movimentação' })).not.toBeInTheDocument();
  });

  it('não mostra "Limpar" sem filtros ativos', () => {
    renderWithApp(<FilterBar />);
    expect(screen.queryAllByRole('button', { name: 'Limpar' })).toHaveLength(0);
  });

  it('mostra "Limpar" e contador após filtrar por categoria', async () => {
    const user = userEvent.setup();
    renderWithApp(<FilterBar />);

    await user.click(screen.getByRole('button', { name: /Categoria/ }));
    await user.click(screen.getByRole('button', { name: 'Marketing' }));

    expect(screen.getAllByRole('button', { name: 'Limpar' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Categoria/ })).toHaveTextContent('1');
  });

  it('lista as categorias derivadas das tarefas do seed', async () => {
    const user = userEvent.setup();
    renderWithApp(<FilterBar />);

    await user.click(screen.getByRole('button', { name: /Categoria/ }));

    expect(screen.getByRole('button', { name: 'Desenvolvimento' })).toBeInTheDocument();
  });

  it('oferece "Ordem original" e modos de ordenação no seletor', () => {
    renderWithApp(<FilterBar />);
    const sort = screen.getByRole('combobox', { name: 'Ordenar por' });
    expect(screen.getByRole('option', { name: 'Ordem original' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Título' })).toBeInTheDocument();
    expect(sort).toHaveValue('');
  });
});
```

- [x] **Step 3: Substituir `src/components/layout/Topbar.test.tsx`**

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import Topbar from './Topbar';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

function StateProbe() {
  const { state } = useApp();
  return (
    <output data-testid="probe">
      {JSON.stringify({
        view: state.view,
        kpiCollapsed: state.kpiCollapsed,
        filtersOpen: state.filtersOpen,
        favoritas: state.filters.favoritas,
      })}
    </output>
  );
}

beforeEach(() => localStorage.clear());

describe('Topbar — Nova Tarefa', () => {
  it('sempre exibe o botão Nova Tarefa', () => {
    renderWithApp(<Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />);
    expect(screen.getByRole('button', { name: /Nova Tarefa/ })).toBeInTheDocument();
  });
});

describe('Topbar — campo de busca', () => {
  function SearchHarness({ initial = '' }: { initial?: string }) {
    const [value, setValue] = useState(initial);
    return <Topbar title="Tarefas" search={value} onSearch={setValue} onNewTask={() => {}} />;
  }

  it('não exibe o ícone de limpar quando a busca está vazia', () => {
    renderWithApp(<SearchHarness />);
    expect(screen.queryByRole('button', { name: 'Limpar busca' })).not.toBeInTheDocument();
  });

  it('exibe o ícone de limpar quando a busca tem conteúdo', () => {
    renderWithApp(<SearchHarness initial="login" />);
    expect(screen.getByRole('button', { name: 'Limpar busca' })).toBeInTheDocument();
  });

  it('limpa a busca ao clicar no ícone e esconde o botão', async () => {
    const user = userEvent.setup();
    renderWithApp(<SearchHarness initial="relatório" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('relatório');
    expect(screen.getByRole('button', { name: 'Limpar busca' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar busca' }));

    expect(input).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Limpar busca' })).not.toBeInTheDocument();
  });
});

describe('Topbar — controles do topo', () => {
  it('exibe indicadores, filtros, favoritas e alternância de visualização', () => {
    renderWithApp(<Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />);
    expect(screen.getByRole('button', { name: 'Recolher indicadores' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocultar filtros' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apenas favoritas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver como Quadro' })).toBeInTheDocument();
  });

  it('alterna a visibilidade dos indicadores', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Recolher indicadores' }));
    expect(screen.getByRole('button', { name: 'Expandir indicadores' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).kpiCollapsed).toBe(true);
  });

  it('alterna a visibilidade dos filtros', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Ocultar filtros' }));
    expect(screen.getByRole('button', { name: 'Mostrar filtros' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).filtersOpen).toBe(false);
  });

  it('alterna o filtro de favoritas', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Apenas favoritas' }));
    expect(screen.getByRole('button', { name: 'Remover favoritas' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).favoritas).toBe(true);
  });

  it('alterna entre Lista e Quadro', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
        <StateProbe />
      </>
    );

    expect(screen.getByRole('button', { name: 'Ver como Quadro' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver como Quadro' }));
    expect(screen.getByRole('button', { name: 'Ver como Lista' })).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId('probe').textContent!).view).toBe('quadro');
  });
});
```

- [x] **Step 4: Substituir `src/components/layout/Sidebar.test.tsx`**

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

beforeEach(() => {
  localStorage.clear();
});

function Probe() {
  const { state } = useApp();
  return (
    <output data-testid="probe">
      {JSON.stringify({
        prazo: state.filters.prazo,
        sidebarOpen: state.sidebarOpen,
      })}
    </output>
  );
}

function ToggleButton() {
  const { dispatch } = useApp();
  return (
    <button onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })} title="Toggle sidebar">
      Toggle
    </button>
  );
}

describe('Sidebar', () => {
  it('renderiza apenas a navegação para Tarefas quando aberto', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));

    expect(screen.getByRole('button', { name: 'Tarefas' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Visão Geral' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Colaboradores' })).not.toBeInTheDocument();
  });

  it('não exibe seletor de usuário nem lista de colaboradores', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /João/ })).not.toBeInTheDocument();
  });

  it('clicar em Atrasadas aplica filtro vencidas', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));
    await user.click(screen.getByRole('button', { name: 'Atrasadas' }));

    await waitFor(() => {
      const probe = screen.getByTestId('probe');
      expect(probe.textContent).toContain('"prazo":"vencidas"');
    });
  });

  it('fechando a sidebar atualiza sidebarOpen para false', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));
    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toContain('"sidebarOpen":true');
    });

    await user.click(screen.getByTitle('Fechar menu'));
    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toContain('"sidebarOpen":false');
    });
  });

  it('clicar no backdrop fecha a sidebar', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <Sidebar />
        <ToggleButton />
        <Probe />
      </>
    );

    await user.click(screen.getByTitle('Toggle sidebar'));
    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toContain('"sidebarOpen":true');
    });

    const backdrop = document.querySelector('.fixed.inset-0.z-40');
    expect(backdrop).toBeInTheDocument();
    backdrop!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await waitFor(() => {
      expect(screen.getByTestId('probe').textContent).toContain('"sidebarOpen":false');
    });
  });
});
```

- [x] **Step 5: Verificar** — Run: `npm test -- src/components/layout`
Expected: PASS

---

### Task 40: Reescrever os testes de componentes — parte 3 (modais e seções)

**Files:**
- Rewrite: `src/components/modals/TaskDetailModal.test.tsx`
- Rewrite: `src/components/modals/TaskFormModal.test.tsx`
- Rewrite: `src/components/modals/CancelModal.test.tsx`
- Rewrite: `src/components/sections/SectionTarefas.test.tsx`

- [x] **Step 1: Substituir `src/components/modals/TaskDetailModal.test.tsx`**

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import TaskDetailModal from './TaskDetailModal';
import { renderWithApp } from '../../test/renderWithApp';

beforeEach(() => localStorage.clear());

describe('TaskDetailModal', () => {
  it('exibe Editar, Duplicar e Excluir para qualquer tarefa', () => {
    renderWithApp(<TaskDetailModal taskId="TA-001" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
  });

  it('CAIXA_ENTRADA exibe ações Planejar e Cancelar', () => {
    renderWithApp(<TaskDetailModal taskId="TA-001" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Planejar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('EM_ANDAMENTO exibe Concluir e Cancelar, sem Planejar', () => {
    renderWithApp(<TaskDetailModal taskId="TA-005" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Planejar' })).not.toBeInTheDocument();
  });

  it('CONCLUIDA exibe Retomar e não exibe Cancelar', () => {
    renderWithApp(<TaskDetailModal taskId="TA-007" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Retomar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('exibe categoria e tags da tarefa', () => {
    renderWithApp(<TaskDetailModal taskId="TA-003" onClose={() => {}} />);
    // TA-003 do seed: categoria Desenvolvimento, tags bug e crítico
    expect(screen.getByText('Desenvolvimento')).toBeInTheDocument();
    expect(screen.getByText('#bug')).toBeInTheDocument();
  });

  it('mostra a data de criação no formato pt-BR', () => {
    renderWithApp(<TaskDetailModal taskId="TA-003" onClose={() => {}} />);
    // TA-003 criada em 2026-08-04
    expect(screen.getByText('Criada em')).toBeInTheDocument();
    expect(screen.getByText('04/08/2026')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Substituir `src/components/modals/TaskFormModal.test.tsx`**

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useApp } from '../../context/AppContext';
import { renderWithApp } from '../../test/renderWithApp';
import TaskFormModal from './TaskFormModal';

function Probe({ id }: { id: string }) {
  const { state } = useApp();
  const task = state.tasks.find((t) => t.id === id);
  return <output data-testid="probe">{task?.titulo}</output>;
}

function LastProbe() {
  const { state } = useApp();
  const task = state.tasks[state.tasks.length - 1];
  return <output data-testid="probe-last">{task ? `${task.titulo}|${task.status}` : ''}</output>;
}

beforeEach(() => localStorage.clear());

describe('TaskFormModal', () => {
  it('não exibe o seletor de responsável (nem em criação, nem em edição)', () => {
    renderWithApp(<TaskFormModal open onClose={() => {}} />);
    expect(screen.queryByLabelText(/Responsável \*/)).not.toBeInTheDocument();

    renderWithApp(<TaskFormModal open taskId="TA-005" onClose={() => {}} />);
    expect(screen.queryByLabelText(/Responsável \*/)).not.toBeInTheDocument();
  });

  it('edita o título de uma tarefa existente via UPDATE_TASK', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <TaskFormModal open taskId="TA-005" onClose={() => {}} />
        <Probe id="TA-005" />
      </>
    );

    const titulo = screen.getByLabelText(/Título \*/);
    await user.clear(titulo);
    await user.type(titulo, 'Migração v2');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(screen.getByTestId('probe').textContent).toBe('Migração v2');
  });

  it('cria uma tarefa CAIXA_ENTRADA', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <TaskFormModal open onClose={() => {}} />
        <LastProbe />
      </>
    );

    await user.type(screen.getByLabelText(/Título \*/), 'Nova tarefa pessoal');
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() => {
      expect(screen.getByTestId('probe-last').textContent).toBe('Nova tarefa pessoal|CAIXA_ENTRADA');
    });
  });
});
```

- [x] **Step 3: Substituir `src/components/modals/CancelModal.test.tsx`**

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useApp } from '../../context/AppContext';
import { renderWithApp } from '../../test/renderWithApp';
import CancelModal from './CancelModal';

function Probe({ id }: { id: string }) {
  const { state } = useApp();
  return <output data-testid="probe">{state.tasks.find((t) => t.id === id)?.status}</output>;
}

beforeEach(() => localStorage.clear());

describe('CancelModal', () => {
  it('desabilita confirmar sem observação (obrigatória)', () => {
    renderWithApp(<CancelModal taskId="TA-003" onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Confirmar cancelamento' })).toBeDisabled();
  });

  it('cancela a tarefa com observação e dispara CHANGE_STATUS para CANCELADA', async () => {
    const user = userEvent.setup();
    renderWithApp(
      <>
        <CancelModal taskId="TA-003" onClose={() => {}} />
        <Probe id="TA-003" />
      </>
    );

    await user.type(screen.getByLabelText(/Motivo do cancelamento/), 'Tarefa perdeu o sentido.');
    await user.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));

    expect(screen.getByTestId('probe').textContent).toBe('CANCELADA');
  });
});
```

- [x] **Step 4: Substituir `src/components/sections/SectionTarefas.test.tsx`**

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import SectionTarefas from './SectionTarefas';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

function ToggleFilters() {
  const { dispatch } = useApp();
  return (
    <button onClick={() => dispatch({ type: 'TOGGLE_FILTERS' })}>alternar filtros</button>
  );
}

beforeEach(() => localStorage.clear());

describe('SectionTarefas', () => {
  it('exibe os indicadores e a barra de filtros por padrão', () => {
    renderWithApp(<SectionTarefas />);
    expect(screen.getByRole('button', { name: /Total de tarefas/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Status/ })).toBeInTheDocument();
  }, 30000);

  it('oculta a barra de filtros quando filtersOpen é false', () => {
    renderWithApp(<><SectionTarefas /><ToggleFilters /></>);

    expect(screen.getByRole('button', { name: /Status/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'alternar filtros' }));

    expect(screen.queryByRole('button', { name: /Status/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Total de tarefas/ })).toBeInTheDocument();
  }, 30000);
});
```

- [x] **Step 5: Verificar** — Run: `npm test -- src/components/modals src/components/sections`
Expected: PASS

---

### Task 41: Verificação final

- [x] **Step 1: Rodar a suíte completa**

Run: `npm test`
Expected: todos os testes PASS (nenhum FAIL).

- [x] **Step 2: Rodar o build de produção**

Run: `npm run build`
Expected: PASS (tsc sem erros + build Vite).

- [x] **Step 3: Verificar que não sobrou nenhuma referência multiusuário**

Run:
```bash
rg -n "responsavelId|criadorId|currentUserId|NOME_POR_ID|COLABORADORES|GESTOR|GESTOR_ID|findUser|roleOf|proximoPasso|podeReatribuir|permissoesDe|podeVer|podeAlterarStatus|podeReabrir|availableTransitions|usuario|paradas|comRetrabalho|TransicaoKind|transicaoKind|SET_CURRENT_USER|SET_SECTION|REASSIGN|TaskRow\.permissions|Visão Geral|Colaboradores|Reassign|Approve|Return|SectionVisaoGeral|SectionColaboradores|colaborador|FINALIZADA|DEVOLVIDA|EM_EXECUCAO|RECEBIDA" src
```
Expected: nenhum resultado (ou apenas comentários doc inócuos). Remover qualquer referência remanescente.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: converter app para tarefas pessoais com fluxo GTD (usuário único)"
```

---

## Self-Review

**1. Cobertura do spec (`2026-08-06-app-pessoal-design.md`):**
- §3 Modelo de dados → Task 1 (types), Task 6 (context types). ✔
- §4 Fluxo de status → Task 2. ✔
- §5 Estado e reducer → Tasks 6, 12, 13, 14. ✔
- §6 Persistência e seed → Tasks 9, 10, 11. ✔
- §7 Interface (removidos/ajustados) → Tasks 15-32. ✔
- §8 Testes → Tasks 33-40. ✔

**2. Placeholder scan:** nenhum `TBD`/`TODO`; todos os passos têm código ou comandos concretos. O único passo sem código é o Step de remoção de arquivos (Task 32), que lista os caminhos exatos e os comandos `git rm`.

**3. Consistência de tipos e nomes:**
- `transicoesDisponiveis(status)` (renomeado) é usado de forma consistente em TaskRow/TaskCard/TaskDetailModal/CycleStepper e testado na Task 33. O nome antigo `availableTransitions` não aparece em lugar nenhum.
- `newHistoryEntry(statusAnterior, novoStatus, tipo, observacao)` (sem `usuario`) é usado em `history.ts`, `appReducer.ts` e `tasks.ts` — assinaturas consistentes.
- `createTask(tasks, input)` sem `usuario`/`responsavelId`/`criadorId` — usado em `TaskFormModal` e testado na Task 34.
- `CHANGE_STATUS` sem `usuario`, com `observacao?` — usado em TaskRow/TaskCard/TaskDetailModal/TaskKanban/CancelModal/SectionTarefas e testado na Task 35.
- Status GTD (`CAIXA_ENTRADA`, `A_FAZER`, `EM_ANDAMENTO`, `CONCLUIDA`, `CANCELADA`) usados de forma idêntica em types/status/reducer/seed/mockData/componentes/testes.
