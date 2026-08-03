# CRM de Gestão de Tarefas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o frontend (tela única) de um CRM de gestão e atribuição de tarefas a colaboradores, com ciclo de vida NOVA→RECEBIDA→EM EXECUÇÃO→CONCLUÍDA→FINALIZADA (+DEVOLVIDA), dados mockados e visual corporativo moderno.

**Architecture:** SPA React + Vite + TypeScript + Tailwind. Estado global em memória via Context + useReducer (tarefas, colaboradores, usuário atual, filtros, seção, modais). Tela única com sidebar expansível, KPIs, tabela/kanban de tarefas, grade de colaboradores e 8 modais de ação/detalhe. Sem router, sem backend. Toda transição de status grava histórico.

**Tech Stack:** React 18, Vite 5, TypeScript, Tailwind CSS 3.4, lucide-react (ícones), Vitest (testes de lógica pura — máquina de estados, datas, filtros, reducer).

**Contexto de referência:** Spec em `docs/superpowers/specs/2026-08-03-crm-tarefas-design.md`.

**Definições fixas:**
- "Atrasada" = `prazo < início de hoje` **e** `status !== 'FINALIZADA'`. Tarefa sem prazo nunca está atrasada.
- IDs de usuário: gestor `carlos`; colaboradores `joao`, `maria`, `pedro`, `ana`, `lucas`.
- Papel: `userId === 'carlos'` ⇒ `gestor`; qualquer outro ⇒ `colaborador`.
- Nomes de arquivo/código em inglês; texto de UI/histórico em pt-BR.
- Datas do seed fixadas em julho/agosto 2026 (hoje de referência: 2026-08-03).

---

## File Structure

```
src/
  main.tsx                      — bootstrap React
  App.tsx                       — Shell: layout + seções + modais + confirm
  types.ts                      — tipos do domínio (Task, Colaborador, Filters, ModalState...)
  index.css                     — Tailwind + fonte Inter
  data/mockData.ts              — GESTOR, COLABORADORES, TAREFAS (seed) + helpers de nome
  context/AppContext.tsx        — AppProvider + appReducer (estado e ações)
  utils/status.ts               — labels, ordem, transições do ciclo (máquina de estados)
  utils/date.ts                 — formatação, isOverdue, isWithinDays
  utils/tasks.ts                — filterTasks, computeIndicators, colaboradorMetrics
  utils/status.test.ts          — testes da máquina de estados
  utils/date.test.ts            — testes de datas
  utils/tasks.test.ts           — testes de filtro/indicadores
  context/AppContext.test.ts    — testes do reducer
  components/
    layout/Sidebar.tsx          — sidebar expansível/recolhível
    layout/Topbar.tsx           — título, busca, botão Nova Tarefa
    layout/KPICards.tsx         — 8 indicadores clicáveis
    layout/FilterBar.tsx        — filtros de status/prioridade/responsável/prazo + MultiSelect
    tasks/StatusBadge.tsx       — badge de status
    tasks/PriorityBadge.tsx     — badge de prioridade
    tasks/CycleStepper.tsx      — stepper visual do ciclo (mini e grande)
    tasks/DueDateCell.tsx       — prazo com destaque de atraso
    tasks/TasksTable.tsx        — visão Lista (tabela)
    tasks/TaskRow.tsx           — linha da tabela com ações por papel
    tasks/TaskKanban.tsx        — visão Quadro (kanban por status)
    tasks/TaskCard.tsx          — card do kanban
    collaborators/CollaboratorCard.tsx — card resumido de colaborador
    modal/Modal.tsx             — modal base
    modal/ConfirmDialog.tsx     — diálogo de confirmação
    modals/TaskFormModal.tsx    — criar/editar tarefa
    modals/TaskDetailModal.tsx  — detalhes + ciclo grande + ações
    modals/ReassignModal.tsx    — alterar responsável
    modals/ApproveModal.tsx     — aprovar (CONCLUÍDA→FINALIZADA)
    modals/ReturnModal.tsx      — devolver (CONCLUÍDA→DEVOLVIDA)
    modals/HistoryModal.tsx     — histórico (timeline)
    modals/CollaboratorDetailModal.tsx — detalhes do colaborador
```

---

## Task 1: Scaffold do projeto (Vite + React + TS + Tailwind + Vitest)

**Files:**
- Create: `package.json` (via npm), `tsconfig.json`, `vite.config.ts`, `postcss.config.js`, `tailwind.config.js`, `index.html`, `.gitignore`, `src/main.tsx`, `src/index.css`, `src/App.tsx`

- [ ] **Step 1: Inicializar package.json, instalar dependências e git**

Run (na raiz `C:\Projetos\tarefas`):

```bash
npm init -y
npm pkg set type=module
npm pkg set scripts.dev="vite" scripts.build="tsc && vite build" scripts.preview="vite preview" scripts.test="vitest run"
npm install react react-dom lucide-react
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss@^3.4.0 postcss autoprefixer vitest
git init
```

Expected: `npm install` termina sem erros; `git init` cria repositório.

- [ ] **Step 2: Criar arquivos de configuração**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

Create `vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
});
```

Create `postcss.config.js`:

```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

Create `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
```

Create `index.html`:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TaskFlow — Gestão de Tarefas</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `.gitignore`:

```
node_modules/
dist/
```

- [ ] **Step 3: Criar entry points mínimos**

Create `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  font-family: 'Inter', system-ui, sans-serif;
}

body {
  @apply bg-slate-100 text-slate-800 antialiased;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  @apply rounded-full bg-slate-300;
}
::-webkit-scrollbar-track {
  background: transparent;
}
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Create `src/App.tsx` (placeholder temporário):

```tsx
export default function App() {
  return (
    <div className="flex h-screen items-center justify-center text-slate-600">
      TaskFlow — Gestão de Tarefas
    </div>
  );
}
```

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: `tsc` sem erros e Vite gera `dist/` (mensagem "built in" com tamanho do bundle).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold React + Vite + TS + Tailwind + Vitest"
```

---

## Task 2: Tipos do domínio + máquina de estados do ciclo (com testes)

**Files:**
- Create: `src/types.ts`
- Create: `src/utils/status.ts`
- Test: `src/utils/status.test.ts`

- [ ] **Step 1: Escrever o teste (TDD — falha primeiro)**

Create `src/utils/status.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { availableTransitions, canTransition } from './status';

describe('canTransition', () => {
  it('permite NOVA → RECEBIDA para colaborador', () => {
    expect(canTransition('NOVA', 'RECEBIDA', 'colaborador')).toBe(true);
  });

  it('bloqueia NOVA → RECEBIDA para gestor', () => {
    expect(canTransition('NOVA', 'RECEBIDA', 'gestor')).toBe(false);
  });

  it('permite CONCLUIDA → FINALIZADA apenas para gestor', () => {
    expect(canTransition('CONCLUIDA', 'FINALIZADA', 'gestor')).toBe(true);
    expect(canTransition('CONCLUIDA', 'FINALIZADA', 'colaborador')).toBe(false);
  });

  it('permite CONCLUIDA → DEVOLVIDA apenas para gestor', () => {
    expect(canTransition('CONCLUIDA', 'DEVOLVIDA', 'gestor')).toBe(true);
    expect(canTransition('CONCLUIDA', 'DEVOLVIDA', 'colaborador')).toBe(false);
  });

  it('permite DEVOLVIDA → EM_EXECUCAO para colaborador', () => {
    expect(canTransition('DEVOLVIDA', 'EM_EXECUCAO', 'colaborador')).toBe(true);
  });

  it('bloqueia transições inválidas e reversas', () => {
    expect(canTransition('NOVA', 'FINALIZADA', 'gestor')).toBe(false);
    expect(canTransition('FINALIZADA', 'NOVA', 'gestor')).toBe(false);
    expect(canTransition('RECEBIDA', 'NOVA', 'colaborador')).toBe(false);
  });
});

describe('availableTransitions', () => {
  it('colaborador em EM_EXECUCAO só pode CONCLUIDA', () => {
    expect(availableTransitions('EM_EXECUCAO', 'colaborador')).toEqual(['CONCLUIDA']);
  });

  it('gestor em CONCLUIDA pode FINALIZADA e DEVOLVIDA', () => {
    expect(availableTransitions('CONCLUIDA', 'gestor').sort()).toEqual(['DEVOLVIDA', 'FINALIZADA']);
  });

  it('gestor em NOVA não tem ações de ciclo', () => {
    expect(availableTransitions('NOVA', 'gestor')).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar o teste para ver falhar**

Run: `npm test -- src/utils/status.test.ts`
Expected: FAIL — `Cannot find module './status'`.

- [ ] **Step 3: Criar types.ts**

Create `src/types.ts`:

```ts
export type TaskStatus =
  | 'NOVA'
  | 'RECEBIDA'
  | 'EM_EXECUCAO'
  | 'CONCLUIDA'
  | 'DEVOLVIDA'
  | 'FINALIZADA';

export type Priority = 'baixa' | 'media' | 'alta' | 'critica';
export type Role = 'gestor' | 'colaborador';
export type Section = 'visaoGeral' | 'tarefas' | 'colaboradores';
export type TaskView = 'lista' | 'quadro';
export type PrazoFilter = 'todas' | 'vencidas' | 'proximos7' | 'semPrazo';

export interface HistoryEntry {
  id: string;
  dataHora: string; // ISO
  usuario: string; // nome do usuário
  statusAnterior: TaskStatus | null;
  novoStatus: TaskStatus | null;
  tipo: 'status' | 'info';
  observacao?: string;
}

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  responsavelId: string;
  criadorId: string;
  prioridade: Priority;
  prazo: string | null; // ISO date (yyyy-mm-dd)
  status: TaskStatus;
  criadaEm: string; // ISO datetime
  historico: HistoryEntry[];
}

export interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  cor: string; // hex para avatar
}

export interface Filters {
  search: string;
  status: TaskStatus[];
  prioridade: Priority[];
  responsavel: string[]; // ids de colaboradores
  prazo: PrazoFilter;
}

export type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; taskId: string }
  | { type: 'detail'; taskId: string }
  | { type: 'reassign'; taskId: string }
  | { type: 'approve'; taskId: string }
  | { type: 'return'; taskId: string }
  | { type: 'history'; taskId: string }
  | { type: 'colaborador'; colaboradorId: string };
```

- [ ] **Step 4: Criar a máquina de estados**

Create `src/utils/status.ts`:

```ts
import type { Priority, Role, TaskStatus } from '../types';

export const STATUS_ORDER: TaskStatus[] = [
  'NOVA',
  'RECEBIDA',
  'EM_EXECUCAO',
  'CONCLUIDA',
  'FINALIZADA',
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  NOVA: 'Nova',
  RECEBIDA: 'Recebida',
  EM_EXECUCAO: 'Em execução',
  CONCLUIDA: 'Concluída',
  DEVOLVIDA: 'Devolvida',
  FINALIZADA: 'Finalizada',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const TRANSITIONS: { from: TaskStatus; to: TaskStatus; role: Role }[] = [
  { from: 'NOVA', to: 'RECEBIDA', role: 'colaborador' },
  { from: 'RECEBIDA', to: 'EM_EXECUCAO', role: 'colaborador' },
  { from: 'EM_EXECUCAO', to: 'CONCLUIDA', role: 'colaborador' },
  { from: 'CONCLUIDA', to: 'FINALIZADA', role: 'gestor' },
  { from: 'CONCLUIDA', to: 'DEVOLVIDA', role: 'gestor' },
  { from: 'DEVOLVIDA', to: 'EM_EXECUCAO', role: 'colaborador' },
];

export function canTransition(from: TaskStatus, to: TaskStatus, role: Role): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.to === to && t.role === role);
}

export function availableTransitions(status: TaskStatus, role: Role): TaskStatus[] {
  return TRANSITIONS.filter((t) => t.from === status && t.role === role).map((t) => t.to);
}
```

- [ ] **Step 5: Rodar o teste para ver passar**

Run: `npm test -- src/utils/status.test.ts`
Expected: PASS (9 testes verdes).

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/utils/status.ts src/utils/status.test.ts
git commit -m "feat: tipos do domínio e máquina de estados do ciclo de tarefa"
```

---

## Task 3: Utilitários de data (com testes)

**Files:**
- Create: `src/utils/date.ts`
- Test: `src/utils/date.test.ts`

- [ ] **Step 1: Escrever o teste**

Create `src/utils/date.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, isOverdue, isWithinDays } from './date';

const NOW = new Date('2026-08-03T12:00:00');

describe('formatDate / formatDateTime', () => {
  it('formata data no padrão pt-BR', () => {
    expect(formatDate('2026-08-03T00:00:00')).toBe('03/08/2026');
  });

  it('formata data e hora no padrão pt-BR', () => {
    expect(formatDateTime('2026-08-03T08:30:00')).toContain('03/08/2026');
  });
});

describe('isOverdue', () => {
  it('prazo de ontem e não finalizada = atrasada', () => {
    expect(isOverdue('2026-08-02T00:00:00', 'EM_EXECUCAO', NOW)).toBe(true);
  });

  it('prazo de hoje não é atrasado', () => {
    expect(isOverdue('2026-08-03T00:00:00', 'EM_EXECUCAO', NOW)).toBe(false);
  });

  it('tarefa finalizada nunca é atrasada', () => {
    expect(isOverdue('2026-07-01T00:00:00', 'FINALIZADA', NOW)).toBe(false);
  });

  it('sem prazo nunca é atrasada', () => {
    expect(isOverdue(null, 'NOVA', NOW)).toBe(false);
  });
});

describe('isWithinDays', () => {
  it('prazo em 3 dias está dentro de 7 dias', () => {
    expect(isWithinDays('2026-08-06T00:00:00', 7, NOW)).toBe(true);
  });

  it('prazo de ontem não está dentro de 7 dias', () => {
    expect(isWithinDays('2026-08-02T00:00:00', 7, NOW)).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npm test -- src/utils/date.test.ts`
Expected: FAIL — `Cannot find module './date'`.

- [ ] **Step 3: Implementar**

Create `src/utils/date.ts`:

```ts
import type { TaskStatus } from '../types';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} ${hora}`;
}

export function startOfToday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isOverdue(
  prazo: string | null,
  status: TaskStatus,
  now: Date = new Date()
): boolean {
  if (!prazo || status === 'FINALIZADA') return false;
  return new Date(prazo) < startOfToday(now);
}

export function isWithinDays(
  prazo: string | null,
  days: number,
  now: Date = new Date()
): boolean {
  if (!prazo) return false;
  const prazoDate = new Date(prazo);
  const limit = new Date(startOfToday(now));
  limit.setDate(limit.getDate() + days);
  return prazoDate >= startOfToday(now) && prazoDate <= limit;
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `npm test -- src/utils/date.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/date.ts src/utils/date.test.ts
git commit -m "feat: utilitários de data (formatação, atraso, janela de dias)"
```

## Task 4: Dados mockados (seed)

**Files:**
- Create: `src/data/mockData.ts`

- [ ] **Step 1: Criar seed**

Create `src/data/mockData.ts`:

```ts
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
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/data/mockData.ts
git commit -m "feat: seed de dados mockados (16 tarefas, 5 colaboradores, históricos)"
```

---

## Task 5: Utilitários de tarefas — filtros, indicadores, métricas (com testes)

**Files:**
- Create: `src/utils/tasks.ts`
- Test: `src/utils/tasks.test.ts`

- [ ] **Step 1: Escrever o teste**

Create `src/utils/tasks.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { COLABORADORES, TAREFAS } from '../data/mockData';
import { colaboradorMetrics, computeIndicators, EMPTY_FILTERS, filterTasks } from './tasks';

const NOW = new Date('2026-08-03T12:00:00');
const nomes = Object.fromEntries(COLABORADORES.map((c) => [c.id, c.nome]));

describe('filterTasks', () => {
  it('filtro vazio retorna todas', () => {
    expect(filterTasks(TAREFAS, EMPTY_FILTERS, nomes, NOW)).toHaveLength(TAREFAS.length);
  });

  it('filtra por busca no título', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, search: 'login' }, nomes, NOW);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.titulo.toLowerCase().includes('login'))).toBe(true);
  });

  it('filtra por status múltiplo', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, status: ['NOVA', 'DEVOLVIDA'] }, nomes, NOW);
    expect(result.every((t) => t.status === 'NOVA' || t.status === 'DEVOLVIDA')).toBe(true);
  });

  it('filtra por responsável', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, responsavel: ['joao'] }, nomes, NOW);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.responsavelId === 'joao')).toBe(true);
  });

  it('filtra por vencidas (exclui finalizadas)', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, prazo: 'vencidas' }, nomes, NOW);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.status !== 'FINALIZADA')).toBe(true);
    expect(
      result.every((t) => t.prazo !== null && new Date(t.prazo) < new Date('2026-08-03T00:00:00'))
    ).toBe(true);
  });
});

describe('computeIndicators', () => {
  it('soma dos status = total', () => {
    const ind = computeIndicators(TAREFAS, NOW);
    expect(ind.total).toBe(TAREFAS.length);
    expect(
      ind.novas + ind.recebidas + ind.emExecucao + ind.concluidas + ind.devolvidas + ind.finalizadas
    ).toBe(ind.total);
  });

  it('existe pelo menos uma atrasada no seed', () => {
    expect(computeIndicators(TAREFAS, NOW).atrasadas).toBeGreaterThan(0);
  });
});

describe('colaboradorMetrics', () => {
  it('ativas + finalizadas = total de tarefas do colaborador', () => {
    const m = colaboradorMetrics('joao', TAREFAS, NOW);
    const doJoao = TAREFAS.filter((t) => t.responsavelId === 'joao');
    expect(m.ativas + m.concluidas).toBe(doJoao.length);
    expect(m.taxaConclusao).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npm test -- src/utils/tasks.test.ts`
Expected: FAIL — `Cannot find module './tasks'`.

- [ ] **Step 3: Implementar**

Create `src/utils/tasks.ts`:

```ts
import type { Colaborador, Filters, Task, TaskStatus } from '../types';
import { isOverdue, isWithinDays } from './date';

export const EMPTY_FILTERS: Filters = {
  search: '',
  status: [],
  prioridade: [],
  responsavel: [],
  prazo: 'todas',
};

export function filterTasks(
  tasks: Task[],
  filters: Filters,
  nomePorId: Record<string, string>,
  now: Date = new Date()
): Task[] {
  const q = filters.search.trim().toLowerCase();
  return tasks.filter((t) => {
    if (q) {
      const responsavel = nomePorId[t.responsavelId] ?? '';
      const hay = `${t.id} ${t.titulo} ${t.descricao} ${responsavel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(t.status)) return false;
    if (filters.prioridade.length > 0 && !filters.prioridade.includes(t.prioridade)) return false;
    if (filters.responsavel.length > 0 && !filters.responsavel.includes(t.responsavelId)) return false;
    if (filters.prazo === 'vencidas' && !isOverdue(t.prazo, t.status, now)) return false;
    if (filters.prazo === 'proximos7' && !isWithinDays(t.prazo, 7, now)) return false;
    if (filters.prazo === 'semPrazo' && t.prazo !== null) return false;
    return true;
  });
}

export interface Indicators {
  total: number;
  novas: number;
  recebidas: number;
  emExecucao: number;
  concluidas: number;
  devolvidas: number;
  finalizadas: number;
  atrasadas: number;
}

export function computeIndicators(tasks: Task[], now: Date = new Date()): Indicators {
  const count = (s: TaskStatus) => tasks.filter((t) => t.status === s).length;
  return {
    total: tasks.length,
    novas: count('NOVA'),
    recebidas: count('RECEBIDA'),
    emExecucao: count('EM_EXECUCAO'),
    concluidas: count('CONCLUIDA'),
    devolvidas: count('DEVOLVIDA'),
    finalizadas: count('FINALIZADA'),
    atrasadas: tasks.filter((t) => isOverdue(t.prazo, t.status, now)).length,
  };
}

export interface ColaboradorMetrics {
  ativas: number;
  concluidas: number;
  atrasadas: number;
  taxaConclusao: number; // 0–100
}

export function colaboradorMetrics(
  colaboradorId: string,
  tasks: Task[],
  now: Date = new Date()
): ColaboradorMetrics {
  const doUsuario = tasks.filter((t) => t.responsavelId === colaboradorId);
  const finalizadas = doUsuario.filter((t) => t.status === 'FINALIZADA').length;
  return {
    ativas: doUsuario.length - finalizadas,
    concluidas: finalizadas,
    atrasadas: doUsuario.filter((t) => isOverdue(t.prazo, t.status, now)).length,
    taxaConclusao: doUsuario.length === 0 ? 0 : Math.round((finalizadas / doUsuario.length) * 100),
  };
}

export function colaboradorResumo(colaborador: Colaborador): { iniciais: string } {
  const partes = colaborador.nome.trim().split(/\s+/);
  const iniciais = (partes[0]?.[0] ?? '') + (partes[partes.length - 1]?.[0] ?? '');
  return { iniciais: iniciais.toUpperCase() };
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `npm test -- src/utils/tasks.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/tasks.ts src/utils/tasks.test.ts
git commit -m "feat: filtros, indicadores e métricas de colaborador"
```

---

## Task 6: AppContext — estado global e reducer (com testes)

**Files:**
- Create: `src/context/AppContext.tsx`
- Test: `src/context/AppContext.test.ts`

- [ ] **Step 1: Escrever o teste**

Create `src/context/AppContext.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { appReducer, type AppState } from './AppContext';

const baseState: AppState = {
  tasks: [
    {
      id: 'TA-001',
      titulo: 'Login',
      descricao: '',
      responsavelId: 'joao',
      criadorId: 'carlos',
      prioridade: 'alta',
      prazo: '2026-08-10',
      status: 'NOVA',
      criadaEm: '2026-08-01T08:00:00',
      historico: [],
    },
    {
      id: 'TA-002',
      titulo: 'Campanha',
      descricao: '',
      responsavelId: 'maria',
      criadorId: 'carlos',
      prioridade: 'media',
      prazo: null,
      status: 'CONCLUIDA',
      criadaEm: '2026-08-01T09:00:00',
      historico: [],
    },
  ],
  currentUserId: 'carlos',
  section: 'tarefas',
  view: 'lista',
  sidebarCollapsed: false,
  filters: { search: '', status: [], prioridade: [], responsavel: [], prazo: 'todas' },
  modal: { type: 'none' },
};

describe('appReducer — CHANGE_STATUS', () => {
  it('gestor aprova CONCLUIDA → FINALIZADA e grava histórico', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-002',
      novoStatus: 'FINALIZADA',
      usuario: 'Carlos Mendes',
      observacao: 'Aprovado',
    });
    const task = next.tasks.find((t) => t.id === 'TA-002')!;
    expect(task.status).toBe('FINALIZADA');
    expect(task.historico).toHaveLength(1);
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'CONCLUIDA',
      novoStatus: 'FINALIZADA',
      usuario: 'Carlos Mendes',
      observacao: 'Aprovado',
    });
  });

  it('colaborador não consegue finalizar tarefa', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'CHANGE_STATUS', taskId: 'TA-002', novoStatus: 'FINALIZADA', usuario: 'João Silva' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-002')!.status).toBe('CONCLUIDA');
  });

  it('colaborador recebe NOVA → RECEBIDA', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'RECEBIDA', usuario: 'João Silva' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('RECEBIDA');
  });

  it('gestor devolve CONCLUIDA → DEVOLVIDA com observação', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-002',
      novoStatus: 'DEVOLVIDA',
      usuario: 'Carlos Mendes',
      observacao: 'Ajustar copy',
    });
    expect(next.tasks.find((t) => t.id === 'TA-002')!.status).toBe('DEVOLVIDA');
  });
});

describe('appReducer — CREATE_TASK / REASSIGN', () => {
  it('adiciona nova tarefa', () => {
    const task: Task = {
      id: 'TA-003',
      titulo: 'Nova',
      descricao: '',
      responsavelId: 'ana',
      criadorId: 'carlos',
      prioridade: 'baixa',
      prazo: null,
      status: 'NOVA',
      criadaEm: '2026-08-03T10:00:00',
      historico: [],
    };
    const next = appReducer(baseState, { type: 'CREATE_TASK', task });
    expect(next.tasks).toHaveLength(baseState.tasks.length + 1);
  });

  it('reatribui responsável e registra entrada de histórico informativa', () => {
    const next = appReducer(baseState, {
      type: 'REASSIGN',
      taskId: 'TA-001',
      responsavelId: 'ana',
      usuario: 'Carlos Mendes',
      observacao: 'Responsável alterado para Ana Costa',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.responsavelId).toBe('ana');
    expect(task.historico[0].tipo).toBe('info');
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npm test -- src/context/AppContext.test.ts`
Expected: FAIL — `Cannot find module './AppContext'`.

- [ ] **Step 3: Implementar**

Create `src/context/AppContext.tsx`:

```tsx
import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { GESTOR_ID, TAREFAS } from '../data/mockData';
import type { Filters, HistoryEntry, ModalState, Section, Task, TaskStatus, TaskView } from '../types';
import { canTransition } from '../utils/status';
import { EMPTY_FILTERS } from '../utils/tasks';

export interface AppState {
  tasks: Task[];
  currentUserId: string;
  section: Section;
  view: TaskView;
  sidebarCollapsed: boolean;
  filters: Filters;
  modal: ModalState;
}

export type AppAction =
  | { type: 'SET_CURRENT_USER'; userId: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SECTION'; section: Section }
  | { type: 'SET_VIEW'; view: TaskView }
  | { type: 'SET_FILTERS'; filters: Partial<Filters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'OPEN_MODAL'; modal: ModalState }
  | { type: 'CLOSE_MODAL' }
  | { type: 'CREATE_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; taskId: string; changes: Partial<Task> }
  | { type: 'CHANGE_STATUS'; taskId: string; novoStatus: TaskStatus; usuario: string; observacao?: string }
  | { type: 'REASSIGN'; taskId: string; responsavelId: string; usuario: string; observacao: string };

const initialState: AppState = {
  tasks: TAREFAS,
  currentUserId: GESTOR_ID,
  section: 'tarefas',
  view: 'lista',
  sidebarCollapsed: false,
  filters: EMPTY_FILTERS,
  modal: { type: 'none' },
};

function newHistoryEntry(
  usuario: string,
  statusAnterior: TaskStatus | null,
  novoStatus: TaskStatus | null,
  tipo: HistoryEntry['tipo'],
  observacao?: string
): HistoryEntry {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dataHora: new Date().toISOString(),
    usuario,
    statusAnterior,
    novoStatus,
    tipo,
    observacao,
  };
}

export function roleOf(userId: string): 'gestor' | 'colaborador' {
  return userId === GESTOR_ID ? 'gestor' : 'colaborador';
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUserId: action.userId };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'SET_SECTION':
      return { ...state, section: action.section };
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case 'RESET_FILTERS':
      return { ...state, filters: EMPTY_FILTERS };
    case 'OPEN_MODAL':
      return { ...state, modal: action.modal };
    case 'CLOSE_MODAL':
      return { ...state, modal: { type: 'none' } };
    case 'CREATE_TASK':
      return { ...state, tasks: [...state.tasks, action.task] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId ? { ...t, ...action.changes } : t
        ),
      };
    case 'CHANGE_STATUS': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (!canTransition(task.status, action.novoStatus, roleOf(state.currentUserId))) return state;
      const entry = newHistoryEntry(
        action.usuario,
        task.status,
        action.novoStatus,
        'status',
        action.observacao
      );
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, status: action.novoStatus, historico: [...t.historico, entry] }
            : t
        ),
      };
    }
    case 'REASSIGN': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      const entry = newHistoryEntry(
        action.usuario,
        task.status,
        task.status,
        'info',
        action.observacao
      );
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, responsavelId: action.responsavelId, historico: [...t.historico, entry] }
            : t
        ),
      };
    }
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `npm test -- src/context/AppContext.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context/AppContext.tsx src/context/AppContext.test.ts
git commit -m "feat: contexto global com reducer (tarefas, filtros, modais, ciclo)"
```

## Task 7: Componentes base — Modal, ConfirmDialog, badges, stepper, prazo

**Files:**
- Create: `src/components/modal/Modal.tsx`
- Create: `src/components/modal/ConfirmDialog.tsx`
- Create: `src/components/tasks/StatusBadge.tsx`
- Create: `src/components/tasks/PriorityBadge.tsx`
- Create: `src/components/tasks/CycleStepper.tsx`
- Create: `src/components/tasks/DueDateCell.tsx`

- [ ] **Step 1: Modal base**

Create `src/components/modal/Modal.tsx`:

```tsx
import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

export default function Modal({ open, title, onClose, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl ${
          size === 'lg' ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ConfirmDialog**

Create `src/components/modal/ConfirmDialog.tsx`:

```tsx
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
              danger
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`rounded-full p-2 ${danger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm leading-relaxed text-slate-600">{message}</p>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 3: StatusBadge**

Create `src/components/tasks/StatusBadge.tsx`:

```tsx
import type { TaskStatus } from '../../types';
import { STATUS_LABELS } from '../../utils/status';

const STYLES: Record<TaskStatus, string> = {
  NOVA: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  RECEBIDA: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  EM_EXECUCAO: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  CONCLUIDA: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  DEVOLVIDA: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  FINALIZADA: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
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

- [ ] **Step 4: PriorityBadge**

Create `src/components/tasks/PriorityBadge.tsx`:

```tsx
import type { Priority } from '../../types';
import { PRIORITY_LABELS } from '../../utils/status';

const STYLES: Record<Priority, string> = {
  baixa: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  media: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  alta: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  critica: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export default function PriorityBadge({ prioridade }: { prioridade: Priority }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STYLES[prioridade]}`}
    >
      {PRIORITY_LABELS[prioridade]}
    </span>
  );
}
```

- [ ] **Step 5: CycleStepper**

Create `src/components/tasks/CycleStepper.tsx`:

```tsx
import { Check, RotateCcw } from 'lucide-react';
import type { TaskStatus } from '../../types';
import { STATUS_ORDER } from '../../utils/status';

function stepState(status: TaskStatus, index: number): 'done' | 'current' | 'todo' {
  if (status === 'DEVOLVIDA') {
    if (index < 3) return 'done';
    if (index === 3) return 'current';
    return 'todo';
  }
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
  const isDevolvida = status === 'DEVOLVIDA';

  return (
    <div className="flex items-center" title={`Ciclo: ${status}`}>
      {STATUS_ORDER.map((step, index) => {
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
      {isDevolvida && (
        <div className="ml-2 flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
          <RotateCcw className="h-3 w-3" />
          Devolvida
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: DueDateCell**

Create `src/components/tasks/DueDateCell.tsx`:

```tsx
import { AlertTriangle, CalendarClock } from 'lucide-react';
import type { Task } from '../../types';
import { formatDate, isOverdue } from '../../utils/date';

export default function DueDateCell({ task }: { task: Task }) {
  if (!task.prazo) return <span className="text-sm text-slate-400">Sem prazo</span>;
  const overdue = isOverdue(task.prazo, task.status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm ${
        overdue ? 'font-medium text-rose-600' : 'text-slate-600'
      }`}
    >
      {overdue ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <CalendarClock className="h-4 w-4 text-slate-400" />
      )}
      {formatDate(task.prazo)}
    </span>
  );
}
```

- [ ] **Step 7: Verificar tipos e commit**

Run: `npx tsc --noEmit`
Expected: sem erros.

```bash
git add src/components/modal src/components/tasks
git commit -m "feat: componentes base (modal, confirmação, badges, stepper do ciclo, prazo)"
```

---

## Task 8: Sidebar expansível/recolhível

**Files:**
- Create: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Implementar Sidebar**

Create `src/components/layout/Sidebar.tsx`:

```tsx
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  ListChecks,
  Users,
  AlertTriangle,
  CheckCircle2,
  Undo2,
} from 'lucide-react';
import { ALL_USERS, COLABORADORES, findUser, GESTOR } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { colaboradorMetrics, colaboradorResumo } from '../../utils/tasks';
import type { Section } from '../../types';

const NAV: { section: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { section: 'visaoGeral', label: 'Visão Geral', icon: LayoutDashboard },
  { section: 'tarefas', label: 'Tarefas', icon: ListChecks },
  { section: 'colaboradores', label: 'Colaboradores', icon: Users },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const collapsed = state.sidebarCollapsed;

  const goTo = (section: Section) => dispatch({ type: 'SET_SECTION', section });

  const atalhos = [
    {
      label: 'Atrasadas',
      icon: AlertTriangle,
      onClick: () => {
        dispatch({ type: 'SET_SECTION', section: 'tarefas' });
        dispatch({ type: 'SET_FILTERS', filters: { prazo: 'vencidas' } });
      },
    },
    {
      label: 'Finalizadas',
      icon: CheckCircle2,
      onClick: () => {
        dispatch({ type: 'SET_SECTION', section: 'tarefas' });
        dispatch({ type: 'SET_FILTERS', filters: { status: ['FINALIZADA'] } });
      },
    },
    {
      label: 'Devolvidas',
      icon: Undo2,
      onClick: () => {
        dispatch({ type: 'SET_SECTION', section: 'tarefas' });
        dispatch({ type: 'SET_FILTERS', filters: { status: ['DEVOLVIDA'] } });
      },
    },
  ];

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-300 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2 px-4 py-4 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">
          TF
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">TaskFlow</p>
            <p className="truncate text-xs text-slate-400">Gestão de Tarefas</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="mt-2 flex-1 space-y-1 px-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = state.section === item.section;
          return (
            <button
              key={item.section}
              onClick={() => goTo(item.section)}
              title={collapsed ? item.label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                active
                  ? 'bg-indigo-500/20 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}

        {!collapsed && (
          <div className="pt-4 pb-1 pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Atalhos
          </div>
        )}
        {atalhos.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={a.onClick}
              title={collapsed ? a.label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{a.label}</span>}
            </button>
          );
        })}

        {/* Colaboradores */}
        {!collapsed && (
          <div className="pt-4 pb-1 pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Colaboradores
          </div>
        )}
        {COLABORADORES.map((c) => {
          const metrics = colaboradorMetrics(c.id, state.tasks);
          const iniciais = colaboradorResumo(c).iniciais;
          return (
            <button
              key={c.id}
              onClick={() => {
                goTo('colaboradores');
                dispatch({ type: 'OPEN_MODAL', modal: { type: 'colaborador', colaboradorId: c.id } });
              }}
              title={collapsed ? c.nome : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-800 ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: c.cor }}
              >
                {iniciais}
              </span>
              {!collapsed && (
                <span className="flex min-w-0 flex-1 items-center justify-between">
                  <span className="truncate text-slate-300">{c.nome.split(' ')[0]}</span>
                  {metrics.ativas > 0 && (
                    <span className="ml-1 rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      {metrics.ativas}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Usuário atual */}
      <div className="border-t border-slate-800 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: findUser(state.currentUserId)?.cor ?? '#64748b' }}
            >
              {colaboradorResumo(findUser(state.currentUserId) ?? GESTOR).iniciais}
            </span>
            <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {findUser(state.currentUserId)?.nome ?? state.currentUserId}
              </p>
              <select
                value={state.currentUserId}
                onChange={(e) => dispatch({ type: 'SET_CURRENT_USER', userId: e.target.value })}
                className="mt-0.5 w-full cursor-pointer rounded bg-transparent text-xs text-slate-400 outline-none hover:text-slate-200"
              >
                {ALL_USERS.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-800 text-slate-200">
                    {u.nome} — {u.cargo}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Botão recolher */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        className="flex items-center justify-center border-t border-slate-800 py-2.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        title={collapsed ? 'Expandir' : 'Recolher'}
      >
        {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
      </button>
    </aside>
  );
}
```

- [ ] **Step 2: Verificar tipos e commit**

Run: `npx tsc --noEmit`
Expected: sem erros. (Nota: `SHORTCUTS` declarado como `[]` no topo do arquivo é usado apenas como placeholder tipado; se o `noUnusedLocals` acusar, remova a linha.)

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: sidebar expansível com navegação, atalhos e lista de colaboradores"
```

---

## Task 9: Topbar, KPICards e FilterBar

**Files:**
- Create: `src/components/layout/Topbar.tsx`
- Create: `src/components/layout/KPICards.tsx`
- Create: `src/components/layout/FilterBar.tsx`

- [ ] **Step 1: Topbar**

Create `src/components/layout/Topbar.tsx`:

```tsx
import { Plus, Search } from 'lucide-react';

interface TopbarProps {
  title: string;
  search: string;
  onSearch: (value: string) => void;
  onNewTask: () => void;
}

export default function Topbar({ title, search, onSearch, onNewTask }: TopbarProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar tarefas..."
            className="w-64 rounded-lg border border-slate-300 bg-slate-50 py-2 pr-3 pl-9 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button
          onClick={onNewTask}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: KPICards**

Create `src/components/layout/KPICards.tsx`:

```tsx
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  ClipboardList,
  Flag,
  Inbox,
  PlayCircle,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Indicators } from '../../utils/tasks';
import type { Priority, TaskStatus } from '../../types';

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
  const { filters } = state;

  const openWithStatus = (statuses: TaskStatus[]) => {
    dispatch({ type: 'SET_SECTION', section: 'tarefas' });
    dispatch({ type: 'SET_FILTERS', filters: { status: statuses } });
  };
  const openVencidas = () => {
    dispatch({ type: 'SET_SECTION', section: 'tarefas' });
    dispatch({ type: 'SET_FILTERS', filters: { prazo: 'vencidas' } });
  };
  const openAll = () => {
    dispatch({ type: 'SET_SECTION', section: 'tarefas' });
    dispatch({ type: 'RESET_FILTERS' });
  };

  const kpis: KpiDef[] = [
    { key: 'total', label: 'Total de tarefas', icon: ClipboardList, value: indicators.total, color: 'bg-slate-100 text-slate-600', active: filters.status.length === 0 && filters.prazo === 'todas', onClick: openAll },
    { key: 'novas', label: 'Novas', icon: Inbox, value: indicators.novas, color: 'bg-blue-50 text-blue-600', active: filters.status.includes('NOVA'), onClick: () => openWithStatus(['NOVA']) },
    { key: 'recebidas', label: 'Recebidas', icon: CircleDashed, value: indicators.recebidas, color: 'bg-cyan-50 text-cyan-600', active: filters.status.includes('RECEBIDA'), onClick: () => openWithStatus(['RECEBIDA']) },
    { key: 'emExecucao', label: 'Em execução', icon: PlayCircle, value: indicators.emExecucao, color: 'bg-amber-50 text-amber-600', active: filters.status.includes('EM_EXECUCAO'), onClick: () => openWithStatus(['EM_EXECUCAO']) },
    { key: 'concluidas', label: 'Concluídas', icon: CircleDot, value: indicators.concluidas, color: 'bg-violet-50 text-violet-600', active: filters.status.includes('CONCLUIDA'), onClick: () => openWithStatus(['CONCLUIDA']) },
    { key: 'devolvidas', label: 'Devolvidas', icon: Undo2, value: indicators.devolvidas, color: 'bg-rose-50 text-rose-600', active: filters.status.includes('DEVOLVIDA'), onClick: () => openWithStatus(['DEVOLVIDA']) },
    { key: 'finalizadas', label: 'Finalizadas', icon: CheckCircle2, value: indicators.finalizadas, color: 'bg-emerald-50 text-emerald-600', active: filters.status.includes('FINALIZADA'), onClick: () => openWithStatus(['FINALIZADA']) },
    { key: 'atrasadas', label: 'Atrasadas', icon: AlertTriangle, value: indicators.atrasadas, color: 'bg-red-50 text-red-600', active: filters.prazo === 'vencidas', onClick: openVencidas },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
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
  );
}
```

- [ ] **Step 3: FilterBar**

Create `src/components/layout/FilterBar.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, FilterX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { COLABORADORES } from '../../data/mockData';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../utils/status';
import type { Filters, PrazoFilter, Priority, TaskStatus } from '../../types';

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
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

  const toggle = (value: string) => {
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
        <div className="absolute top-full left-0 z-30 mt-1 max-h-64 w-52 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
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
  const responsavelOptions = COLABORADORES.map((c) => ({ value: c.id, label: c.nome }));

  const prazoOptions: { value: PrazoFilter; label: string }[] = [
    { value: 'todas', label: 'Todas as datas' },
    { value: 'vencidas', label: 'Vencidas' },
    { value: 'proximos7', label: 'Próximos 7 dias' },
    { value: 'semPrazo', label: 'Sem prazo' },
  ];

  const hasFilters =
    filters.status.length > 0 ||
    filters.prioridade.length > 0 ||
    filters.responsavel.length > 0 ||
    filters.prazo !== 'todas';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelect label="Status" options={statusOptions} selected={filters.status} onChange={(v) => update({ status: v })} />
      <MultiSelect label="Prioridade" options={prioridadeOptions} selected={filters.prioridade} onChange={(v) => update({ prioridade: v })} />
      <MultiSelect label="Responsável" options={responsavelOptions} selected={filters.responsavel} onChange={(v) => update({ responsavel: v })} />
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

- [ ] **Step 4: Verificar tipos e commit**

Run: `npx tsc --noEmit`
Expected: sem erros. (Se o helper `setFilters` não utilizado acusar `noUnusedLocals`, remova a linha do `setFilters`.)

```bash
git add src/components/layout/Topbar.tsx src/components/layout/KPICards.tsx src/components/layout/FilterBar.tsx
git commit -m "feat: topbar, indicadores clicáveis e barra de filtros"
```

## Task 10: Visão Tarefas — Tabela, Linha, Kanban e Card

**Files:**
- Create: `src/components/tasks/TasksTable.tsx`
- Create: `src/components/tasks/TaskRow.tsx`
- Create: `src/components/tasks/TaskKanban.tsx`
- Create: `src/components/tasks/TaskCard.tsx`

- [ ] **Step 1: TaskRow**

Create `src/components/tasks/TaskRow.tsx`:

```tsx
import {
  ArrowDownToLine,
  CheckCircle2,
  Eye,
  Pencil,
  Play,
  RotateCcw,
  UserCog,
} from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { findUser, NOME_POR_ID } from '../../data/mockData';
import { roleOf } from '../../context/AppContext';
import { availableTransitions } from '../../utils/status';
import { colaboradorResumo } from '../../utils/tasks';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CycleStepper from './CycleStepper';
import DueDateCell from './DueDateCell';

interface TaskRowProps {
  task: Task;
  onConfirmComplete: (task: Task) => void;
}

export default function TaskRow({ task, onConfirmComplete }: TaskRowProps) {
  const { state, dispatch } = useApp();
  const role = roleOf(state.currentUserId);
  const responsavel = findUser(task.responsavelId);
  const can = availableTransitions(task.status, role);

  const openDetail = () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'detail', taskId: task.id } });
  const openEdit = () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'edit', taskId: task.id } });
  const openReassign = () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'reassign', taskId: task.id } });

  const changeStatus = (novoStatus: TaskStatus) => {
    if (novoStatus === 'CONCLUIDA') {
      onConfirmComplete(task);
      return;
    }
    dispatch({
      type: 'CHANGE_STATUS',
      taskId: task.id,
      novoStatus,
      usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
    });
  };

  const actionFor = (target: TaskStatus) => {
    if (target === 'RECEBIDA')
      return { icon: ArrowDownToLine, label: 'Receber', className: 'text-cyan-600 hover:bg-cyan-50' };
    if (target === 'EM_EXECUCAO')
      return { icon: Play, label: 'Iniciar', className: 'text-amber-600 hover:bg-amber-50' };
    if (target === 'CONCLUIDA')
      return { icon: CheckCircle2, label: 'Concluir', className: 'text-violet-600 hover:bg-violet-50' };
    return null;
  };

  return (
    <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50/70">
      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{task.titulo}</p>
          <p className="truncate text-xs text-slate-400">
            {task.id} · {NOME_POR_ID[task.responsavelId]}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: responsavel?.cor ?? '#64748b' }}
          >
            {colaboradorResumo(responsavel ?? { nome: '?' }).iniciais}
          </span>
          <span className="text-sm text-slate-600">{responsavel?.nome.split(' ')[0]}</span>
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
        <div className="flex items-center gap-1">
          <button
            onClick={openDetail}
            title="Ver detalhes"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Eye className="h-4 w-4" />
          </button>
          {role === 'gestor' && (
            <>
              <button
                onClick={openEdit}
                title="Editar"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={openReassign}
                title="Alterar responsável"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <UserCog className="h-4 w-4" />
              </button>
            </>
          )}
          {can.map((target) => {
            const act = actionFor(target);
            if (!act) return null;
            const Icon = act.icon;
            return (
              <button
                key={target}
                onClick={() => changeStatus(target)}
                title={act.label}
                className={`rounded-lg p-1.5 transition-colors ${act.className}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
          {task.status === 'DEVOLVIDA' && role === 'colaborador' && (
            <button
              onClick={() => changeStatus('EM_EXECUCAO')}
              title="Retomar"
              className="rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
```

- [ ] **Step 2: TasksTable**

Create `src/components/tasks/TasksTable.tsx`:

```tsx
import { Inbox } from 'lucide-react';
import type { Task } from '../../types';
import TaskRow from './TaskRow';

interface TasksTableProps {
  tasks: Task[];
  onConfirmComplete: (task: Task) => void;
}

export default function TasksTable({ tasks, onConfirmComplete }: TasksTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[900px] text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Tarefa</th>
            <th className="px-4 py-3">Responsável</th>
            <th className="px-4 py-3">Prioridade</th>
            <th className="px-4 py-3">Prazo</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Ciclo</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onConfirmComplete={onConfirmComplete} />
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
          <Inbox className="h-10 w-10" />
          <p className="text-sm font-medium">Nenhuma tarefa encontrada</p>
          <p className="text-xs">Ajuste a busca ou os filtros para ver mais resultados.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: TaskCard (kanban)**

Create `src/components/tasks/TaskCard.tsx`:

```tsx
import { CheckCircle2, Play, ArrowDownToLine, RotateCcw } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { findUser, NOME_POR_ID } from '../../data/mockData';
import { roleOf } from '../../context/AppContext';
import { availableTransitions } from '../../utils/status';
import { colaboradorResumo } from '../../utils/tasks';
import PriorityBadge from './PriorityBadge';
import DueDateCell from './DueDateCell';

interface TaskCardProps {
  task: Task;
  onConfirmComplete: (task: Task) => void;
}

export default function TaskCard({ task, onConfirmComplete }: TaskCardProps) {
  const { state, dispatch } = useApp();
  const role = roleOf(state.currentUserId);
  const responsavel = findUser(task.responsavelId);
  const can = availableTransitions(task.status, role);

  const changeStatus = (novoStatus: TaskStatus) => {
    if (novoStatus === 'CONCLUIDA') {
      onConfirmComplete(task);
      return;
    }
    dispatch({
      type: 'CHANGE_STATUS',
      taskId: task.id,
      novoStatus,
      usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
    });
  };

  const quickAction = () => {
    if (can.includes('RECEBIDA')) {
      return { icon: ArrowDownToLine, label: 'Receber', target: 'RECEBIDA' as TaskStatus, cls: 'text-cyan-600 hover:bg-cyan-50' };
    }
    if (can.includes('EM_EXECUCAO')) {
      return { icon: Play, label: 'Iniciar', target: 'EM_EXECUCAO' as TaskStatus, cls: 'text-amber-600 hover:bg-amber-50' };
    }
    if (can.includes('CONCLUIDA')) {
      return { icon: CheckCircle2, label: 'Concluir', target: 'CONCLUIDA' as TaskStatus, cls: 'text-violet-600 hover:bg-violet-50' };
    }
    if (can.includes('EM_EXECUCAO') && task.status === 'DEVOLVIDA') {
      return { icon: RotateCcw, label: 'Retomar', target: 'EM_EXECUCAO' as TaskStatus, cls: 'text-rose-600 hover:bg-rose-50' };
    }
    return null;
  };

  const action = quickAction();

  return (
    <button
      onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'detail', taskId: task.id } })}
      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{task.titulo}</p>
        <PriorityBadge prioridade={task.prioridade} />
      </div>
      <p className="mt-1 truncate text-xs text-slate-400">
        {task.id} · {responsavel?.nome.split(' ')[0]}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <DueDateCell task={task} />
        {action && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              changeStatus(action.target);
            }}
            title={action.label}
            className={`rounded-lg p-1.5 ${action.cls}`}
          >
            <action.icon className="h-4 w-4" />
          </span>
        )}
      </div>
    </button>
  );
}
```

- [ ] **Step 4: TaskKanban**

Create `src/components/tasks/TaskKanban.tsx`:

```tsx
import type { Task, TaskStatus } from '../../types';
import { STATUS_LABELS } from '../../utils/status';
import StatusBadge from './StatusBadge';
import TaskCard from './TaskCard';

const COLUMNS: TaskStatus[] = ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'CONCLUIDA', 'DEVOLVIDA', 'FINALIZADA'];

interface TaskKanbanProps {
  tasks: Task[];
  onConfirmComplete: (task: Task) => void;
}

export default function TaskKanban({ tasks, onConfirmComplete }: TaskKanbanProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <div key={status} className="flex min-w-[240px] flex-1 flex-col rounded-xl bg-slate-200/60 p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <StatusBadge status={status} />
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                {columnTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} onConfirmComplete={onConfirmComplete} />
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

- [ ] **Step 5: Verificar tipos e commit**

Run: `npx tsc --noEmit`
Expected: sem erros.

```bash
git add src/components/tasks
git commit -m "feat: visão de tarefas em tabela e kanban com ações por papel"
```

---

## Task 11: Visão Colaboradores — card resumido

**Files:**
- Create: `src/components/collaborators/CollaboratorCard.tsx`

- [ ] **Step 1: Implementar**

Create `src/components/collaborators/CollaboratorCard.tsx`:

```tsx
import { AlertTriangle, CheckCircle2, ListChecks, TrendingUp } from 'lucide-react';
import type { Colaborador } from '../../types';
import { useApp } from '../../context/AppContext';
import { colaboradorMetrics, colaboradorResumo } from '../../utils/tasks';

export default function CollaboratorCard({ colaborador }: { colaborador: Colaborador }) {
  const { state, dispatch } = useApp();
  const m = colaboradorMetrics(colaborador.id, state.tasks);
  const iniciais = colaboradorResumo(colaborador).iniciais;

  const open = () =>
    dispatch({ type: 'OPEN_MODAL', modal: { type: 'colaborador', colaboradorId: colaborador.id } });

  return (
    <button
      onClick={open}
      className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: colaborador.cor }}
        >
          {iniciais}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{colaborador.nome}</p>
          <p className="truncate text-xs text-slate-500">{colaborador.cargo}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <ListChecks className="h-4 w-4 text-indigo-500" />
          <div>
            <p className="text-sm font-bold text-slate-800">{m.ativas}</p>
            <p className="text-[11px] text-slate-500">Ativas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <div>
            <p className="text-sm font-bold text-slate-800">{m.concluidas}</p>
            <p className="text-[11px] text-slate-500">Finalizadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          <div>
            <p className="text-sm font-bold text-slate-800">{m.atrasadas}</p>
            <p className="text-[11px] text-slate-500">Atrasadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <TrendingUp className="h-4 w-4 text-cyan-500" />
          <div>
            <p className="text-sm font-bold text-slate-800">{m.taxaConclusao}%</p>
            <p className="text-[11px] text-slate-500">Conclusão</p>
          </div>
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Verificar tipos e commit**

Run: `npx tsc --noEmit`
Expected: sem erros.

```bash
git add src/components/collaborators/CollaboratorCard.tsx
git commit -m "feat: card resumido de colaborador com métricas"
```

---

## Task 12: Modais — formulário, detalhes, reatribuição, aprovação, devolução, histórico, colaborador

**Files:**
- Create: `src/components/modals/TaskFormModal.tsx`
- Create: `src/components/modals/TaskDetailModal.tsx`
- Create: `src/components/modals/ReassignModal.tsx`
- Create: `src/components/modals/ApproveModal.tsx`
- Create: `src/components/modals/ReturnModal.tsx`
- Create: `src/components/modals/HistoryModal.tsx`
- Create: `src/components/modals/CollaboratorDetailModal.tsx`

- [ ] **Step 1: TaskFormModal (criar/editar)**

Create `src/components/modals/TaskFormModal.tsx`:

```tsx
import { useState } from 'react';
import type { Priority } from '../../types';
import { useApp } from '../../context/AppContext';
import { COLABORADORES, NOME_POR_ID } from '../../data/mockData';
import { PRIORITY_LABELS } from '../../utils/status';
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
  const [responsavelId, setResponsavelId] = useState(editing?.responsavelId ?? COLABORADORES[0].id);
  const [prioridade, setPrioridade] = useState<Priority>(editing?.prioridade ?? 'media');
  const [prazo, setPrazo] = useState(editing?.prazo ?? '');

  const isEdit = Boolean(editing);
  const valid = titulo.trim().length > 0 && responsavelId.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    if (isEdit && editing) {
      dispatch({
        type: 'UPDATE_TASK',
        taskId: editing.id,
        changes: {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          responsavelId,
          prioridade,
          prazo: prazo || null,
        },
      });
    } else {
      const maxNum = state.tasks.reduce((max, t) => {
        const n = Number(t.id.replace(/\D/g, ''));
        return Number.isFinite(n) ? Math.max(max, n) : max;
      }, 0);
      const now = new Date().toISOString();
      dispatch({
        type: 'CREATE_TASK',
        task: {
          id: `TA-${String(maxNum + 1).padStart(3, '0')}`,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          responsavelId,
          criadorId: state.currentUserId,
          prioridade,
          prazo: prazo || null,
          status: 'NOVA',
          criadaEm: now,
          historico: [
            {
              id: `h-${Date.now()}`,
              dataHora: now,
              usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
              statusAnterior: null,
              novoStatus: 'NOVA',
              tipo: 'status',
              observacao: 'Tarefa criada.',
            },
          ],
        },
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
          <label className="mb-1 block text-sm font-medium text-slate-700">Título *</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputCls} placeholder="Ex.: Corrigir bug de checkout" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={4}
            className={inputCls}
            placeholder="Detalhes da atividade..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Responsável *</label>
            <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)} className={inputCls}>
              {COLABORADORES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Prioridade</label>
            <select value={prioridade} onChange={(e) => setPrioridade(e.target.value as Priority)} className={inputCls}>
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Prazo</label>
          <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className={inputCls} />
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: TaskDetailModal**

Create `src/components/modals/TaskDetailModal.tsx`:

```tsx
import { CalendarClock, FileText, History, Pencil, UserCog } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { findUser, NOME_POR_ID } from '../../data/mockData';
import { roleOf } from '../../context/AppContext';
import { availableTransitions } from '../../utils/status';
import { formatDate } from '../../utils/date';
import { colaboradorResumo } from '../../utils/tasks';
import Modal from '../modal/Modal';
import StatusBadge from '../tasks/StatusBadge';
import PriorityBadge from '../tasks/PriorityBadge';
import CycleStepper from '../tasks/CycleStepper';
import DueDateCell from '../tasks/DueDateCell';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const { state, dispatch } = useApp();
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const role = roleOf(state.currentUserId);
  const responsavel = findUser(task.responsavelId);
  const criador = findUser(task.criadorId);
  const can = availableTransitions(task.status, role);

  const changeStatus = (novoStatus: typeof task.status) => {
    dispatch({
      type: 'CHANGE_STATUS',
      taskId: task.id,
      novoStatus,
      usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
    });
    onClose();
  };

  return (
    <Modal
      open
      title="Detalhes da tarefa"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button
            onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'history', taskId: task.id } })}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <History className="h-4 w-4" />
            Histórico
          </button>
          {role === 'gestor' && (
            <>
              <button
                onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'edit', taskId: task.id } })}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'reassign', taskId: task.id } })}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <UserCog className="h-4 w-4" />
                Responsável
              </button>
            </>
          )}
          {can.includes('RECEBIDA') && (
            <button onClick={() => changeStatus('RECEBIDA')} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">
              Receber tarefa
            </button>
          )}
          {can.includes('EM_EXECUCAO') && task.status !== 'DEVOLVIDA' && (
            <button onClick={() => changeStatus('EM_EXECUCAO')} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
              Iniciar execução
            </button>
          )}
          {task.status === 'DEVOLVIDA' && role === 'colaborador' && (
            <button onClick={() => changeStatus('EM_EXECUCAO')} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
              Retomar após correção
            </button>
          )}
          {can.includes('CONCLUIDA') && (
            <button onClick={() => changeStatus('CONCLUIDA')} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
              Marcar como concluída
            </button>
          )}
          {task.status === 'CONCLUIDA' && role === 'gestor' && (
            <>
              <button
                onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'return', taskId: task.id } })}
                className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                Devolver
              </button>
              <button
                onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'approve', taskId: task.id } })}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Aprovar e finalizar
              </button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">{task.id}</span>
            <StatusBadge status={task.status} />
            <PriorityBadge prioridade={task.prioridade} />
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-800">{task.titulo}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{task.descricao || 'Sem descrição.'}</p>
        </div>

        <div className="rounded-lg bg-slate-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Ciclo da tarefa</p>
          <CycleStepper status={task.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: responsavel?.cor ?? '#64748b' }}
            >
              {colaboradorResumo(responsavel ?? { nome: '?' }).iniciais}
            </span>
            <div>
              <p className="text-[11px] text-slate-400">Responsável</p>
              <p className="font-medium text-slate-700">{responsavel?.nome}</p>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Criada por</p>
            <p className="font-medium text-slate-700">{criador?.nome}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Criada em</p>
            <p className="font-medium text-slate-700">{formatDate(task.criadaEm)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Prazo</p>
            <DueDateCell task={task} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 3: ReassignModal**

Create `src/components/modals/ReassignModal.tsx`:

```tsx
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COLABORADORES, NOME_POR_ID } from '../../data/mockData';
import Modal from '../modal/Modal';

interface ReassignModalProps {
  taskId: string;
  onClose: () => void;
}

export default function ReassignModal({ taskId, onClose }: ReassignModalProps) {
  const { state, dispatch } = useApp();
  const task = state.tasks.find((t) => t.id === taskId);
  const [novoResponsavelId, setNovoResponsavelId] = useState(task?.responsavelId ?? COLABORADORES[0].id);

  if (!task) return null;

  const submit = () => {
    if (novoResponsavelId === task.responsavelId) {
      onClose();
      return;
    }
    const nome = NOME_POR_ID[novoResponsavelId] ?? novoResponsavelId;
    dispatch({
      type: 'REASSIGN',
      taskId: task.id,
      responsavelId: novoResponsavelId,
      usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
      observacao: `Responsável alterado para ${nome}.`,
    });
    onClose();
  };

  return (
    <Modal
      open
      title="Alterar responsável"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={submit} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Salvar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Tarefa: <span className="font-semibold text-slate-800">{task.titulo}</span>
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Novo responsável</label>
          <select
            value={novoResponsavelId}
            onChange={(e) => setNovoResponsavelId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {COLABORADORES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} — {c.cargo}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 4: ApproveModal**

Create `src/components/modals/ApproveModal.tsx`:

```tsx
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NOME_POR_ID } from '../../data/mockData';
import Modal from '../modal/Modal';

interface ApproveModalProps {
  taskId: string;
  onClose: () => void;
}

export default function ApproveModal({ taskId, onClose }: ApproveModalProps) {
  const { state, dispatch } = useApp();
  const task = state.tasks.find((t) => t.id === taskId);
  const [observacao, setObservacao] = useState('');

  if (!task) return null;

  const submit = () => {
    dispatch({
      type: 'CHANGE_STATUS',
      taskId: task.id,
      novoStatus: 'FINALIZADA',
      usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
      observacao: observacao.trim() || 'Aprovada pelo gestor.',
    });
    onClose();
  };

  return (
    <Modal
      open
      title="Aprovar tarefa"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={submit} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Aprovar e finalizar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Você está aprovando a tarefa <span className="font-semibold text-slate-800">{task.titulo}</span>. Ela será
          marcada como <span className="font-semibold text-emerald-600">Finalizada</span>.
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Observação (opcional)</label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="Comentário sobre a aprovação..."
          />
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 5: ReturnModal**

Create `src/components/modals/ReturnModal.tsx`:

```tsx
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NOME_POR_ID } from '../../data/mockData';
import Modal from '../modal/Modal';

interface ReturnModalProps {
  taskId: string;
  onClose: () => void;
}

export default function ReturnModal({ taskId, onClose }: ReturnModalProps) {
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
      novoStatus: 'DEVOLVIDA',
      usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
      observacao: observacao.trim(),
    });
    onClose();
  };

  return (
    <Modal
      open
      title="Devolver tarefa"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Devolver para correção
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Você está devolvendo a tarefa <span className="font-semibold text-slate-800">{task.titulo}</span>. Ela voltará
          para o colaborador em <span className="font-semibold text-rose-600">Devolvida</span>.
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Motivo da devolução *
          </label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
            placeholder="Descreva o que precisa ser corrigido ou complementado..."
          />
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 6: HistoryModal**

Create `src/components/modals/HistoryModal.tsx`:

```tsx
import { ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { STATUS_LABELS } from '../../utils/status';
import { formatDateTime } from '../../utils/date';
import Modal from '../modal/Modal';
import StatusBadge from '../tasks/StatusBadge';

interface HistoryModalProps {
  taskId: string;
  onClose: () => void;
}

export default function HistoryModal({ taskId, onClose }: HistoryModalProps) {
  const { state } = useApp();
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const sorted = [...task.historico].sort((a, b) => a.dataHora.localeCompare(b.dataHora));

  return (
    <Modal open title={`Histórico — ${task.titulo}`} onClose={onClose} size="lg">
      <div className="relative space-y-0 pl-6">
        <div className="absolute top-2 bottom-2 left-2 w-px bg-slate-200" />
        {sorted.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            Nenhum registro de histórico ainda.
          </p>
        )}
        {sorted.map((entry) => (
          <div key={entry.id} className="relative pb-6 pl-4">
            <span
              className={`absolute top-1 -left-[21px] h-3 w-3 rounded-full ring-4 ring-white ${
                entry.tipo === 'status' ? 'bg-indigo-500' : 'bg-slate-400'
              }`}
            />
            <p className="text-xs font-medium text-slate-400">{formatDateTime(entry.dataHora)}</p>
            <p className="text-sm font-semibold text-slate-700">{entry.usuario}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {entry.tipo === 'status' ? (
                <>
                  {entry.statusAnterior ? <StatusBadge status={entry.statusAnterior} /> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">—</span>}
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  {entry.novoStatus ? <StatusBadge status={entry.novoStatus} /> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">—</span>}
                </>
              ) : (
                <span className="text-sm text-slate-600">{entry.observacao}</span>
              )}
            </div>
            {entry.observacao && entry.tipo === 'status' && (
              <p className="mt-1 text-sm text-slate-500">{entry.observacao}</p>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
```

- [ ] **Step 7: CollaboratorDetailModal**

Create `src/components/modals/CollaboratorDetailModal.tsx`:

```tsx
import { Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { findUser } from '../../data/mockData';
import { colaboradorMetrics, colaboradorResumo } from '../../utils/tasks';
import Modal from '../modal/Modal';
import StatusBadge from '../tasks/StatusBadge';
import DueDateCell from '../tasks/DueDateCell';

interface CollaboratorDetailModalProps {
  colaboradorId: string;
  onClose: () => void;
}

export default function CollaboratorDetailModal({ colaboradorId, onClose }: CollaboratorDetailModalProps) {
  const { state, dispatch } = useApp();
  const colaborador = findUser(colaboradorId);
  if (!colaborador) return null;

  const m = colaboradorMetrics(colaborador.id, state.tasks);
  const tarefas = state.tasks.filter((t) => t.responsavelId === colaborador.id);
  const iniciais = colaboradorResumo(colaborador).iniciais;

  return (
    <Modal open title="Colaborador" onClose={onClose} size="lg">
      <div className="flex items-start gap-4">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold text-white"
          style={{ backgroundColor: colaborador.cor }}
        >
          {iniciais}
        </span>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{colaborador.nome}</h3>
          <p className="text-sm text-slate-500">{colaborador.cargo}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-400">
            <Mail className="h-4 w-4" /> {colaborador.email}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3">
        {[
          { label: 'Ativas', value: m.ativas },
          { label: 'Finalizadas', value: m.concluidas },
          { label: 'Atrasadas', value: m.atrasadas },
          { label: 'Conclusão', value: `${m.taxaConclusao}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-slate-50 px-3 py-3 text-center">
            <p className="text-lg font-bold text-slate-800">{s.value}</p>
            <p className="text-[11px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Tarefas ({tarefas.length})
        </p>
        <div className="space-y-2">
          {tarefas.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400">
              Nenhuma tarefa atribuída.
            </p>
          )}
          {tarefas.map((t) => (
            <button
              key={t.id}
              onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'detail', taskId: t.id } })}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-700">
                  {t.id} — {t.titulo}
                </p>
                <div className="mt-1">
                  <DueDateCell task={t} />
                </div>
              </div>
              <StatusBadge status={t.status} />
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 8: Verificar tipos e commit**

Run: `npx tsc --noEmit`
Expected: sem erros.

```bash
git add src/components/modals
git commit -m "feat: modais de criar/editar, detalhes, responsável, aprovar, devolver, histórico e colaborador"
```

## Task 13: App.tsx — Shell, seções, modais e confirmação

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Reescrever App.tsx**

Replace the placeholder `src/App.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { AlertTriangle, ListChecks, Users, Clock } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { COLABORADORES, NOME_POR_ID } from './data/mockData';
import { filterTasks, computeIndicators } from './utils/tasks';
import { formatDate } from './utils/date';
import type { Task } from './types';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import KPICards from './components/layout/KPICards';
import FilterBar from './components/layout/FilterBar';
import TasksTable from './components/tasks/TasksTable';
import TaskKanban from './components/tasks/TaskKanban';
import CollaboratorCard from './components/collaborators/CollaboratorCard';
import ConfirmDialog from './components/modal/ConfirmDialog';
import TaskFormModal from './components/modals/TaskFormModal';
import TaskDetailModal from './components/modals/TaskDetailModal';
import ReassignModal from './components/modals/ReassignModal';
import ApproveModal from './components/modals/ApproveModal';
import ReturnModal from './components/modals/ReturnModal';
import HistoryModal from './components/modals/HistoryModal';
import CollaboratorDetailModal from './components/modals/CollaboratorDetailModal';

interface ConfirmState {
  task: Task;
}

function SectionTarefas() {
  const { state, dispatch } = useApp();
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const visibleTasks = useMemo(
    () => filterTasks(state.tasks, state.filters, NOME_POR_ID),
    [state.tasks, state.filters]
  );
  const indicators = useMemo(() => computeIndicators(state.tasks), [state.tasks]);

  const confirmComplete = (task: Task) => setConfirm({ task });

  const header = (
    <div className="mb-5 space-y-4">
      <KPICards indicators={indicators} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar />
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {(['lista', 'quadro'] as const).map((v) => (
            <button
              key={v}
              onClick={() => dispatch({ type: 'SET_VIEW', view: v })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                state.view === v ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {v === 'lista' ? 'Lista' : 'Quadro'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {header}
      {state.view === 'lista' ? (
        <TasksTable tasks={visibleTasks} onConfirmComplete={confirmComplete} />
      ) : (
        <TaskKanban tasks={visibleTasks} onConfirmComplete={confirmComplete} />
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Confirmar conclusão"
        message={`Marcar a tarefa "${confirm?.task.titulo ?? ''}" como concluída? Ela ficará aguardando a análise do gestor.`}
        confirmLabel="Concluir"
        onConfirm={() => {
          if (confirm) {
            dispatch({
              type: 'CHANGE_STATUS',
              taskId: confirm.task.id,
              novoStatus: 'CONCLUIDA',
              usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
            });
          }
        }}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}

function SectionVisaoGeral() {
  const { state } = useApp();
  const indicators = useMemo(() => computeIndicators(state.tasks), [state.tasks]);
  const atrasadas = useMemo(
    () => filterTasks(state.tasks, { ...state.filters, search: '', prazo: 'vencidas' }, NOME_POR_ID).slice(0, 5),
    [state.tasks, state.filters]
  );
  const proximas = state.tasks
    .filter((t) => t.prazo !== null && t.status !== 'FINALIZADA' && t.status !== 'CONCLUIDA')
    .sort((a, b) => (a.prazo ?? '').localeCompare(b.prazo ?? ''))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <KPICards indicators={indicators} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-700">Atrasadas</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {atrasadas.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma tarefa atrasada. 🎉</p>
            )}
            {atrasadas.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{t.titulo}</p>
                  <p className="text-xs text-slate-400">{NOME_POR_ID[t.responsavelId]}</p>
                </div>
                <span className="text-xs font-semibold text-rose-600">{t.prazo ? formatDate(t.prazo) : ''}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <Clock className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">Próximos prazos</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {proximas.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhum prazo próximo.</p>
            )}
            {proximas.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{t.titulo}</p>
                  <p className="text-xs text-slate-400">{NOME_POR_ID[t.responsavelId]}</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">{t.prazo ? formatDate(t.prazo) : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionColaboradores() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {COLABORADORES.map((c) => (
        <CollaboratorCard key={c.id} colaborador={c} />
      ))}
    </div>
  );
}

function Shell() {
  const { state, dispatch } = useApp();
  const { modal, section } = state;

  const titles: Record<string, string> = {
    visaoGeral: 'Visão Geral',
    tarefas: 'Tarefas',
    colaboradores: 'Colaboradores',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={titles[section]}
          search={state.filters.search}
          onSearch={(value) => dispatch({ type: 'SET_FILTERS', filters: { search: value } })}
          onNewTask={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'create' } })}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {section === 'visaoGeral' && <SectionVisaoGeral />}
          {section === 'tarefas' && <SectionTarefas />}
          {section === 'colaboradores' && <SectionColaboradores />}
        </main>
      </div>

      {/* Modais */}
      {modal.type === 'create' && (
        <TaskFormModal open onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'edit' && (
        <TaskFormModal
          open
          taskId={modal.taskId}
          onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        />
      )}
      {modal.type === 'detail' && (
        <TaskDetailModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'reassign' && (
        <ReassignModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'approve' && (
        <ApproveModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'return' && (
        <ReturnModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'history' && (
        <HistoryModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'colaborador' && (
        <CollaboratorDetailModal
          colaboradorId={modal.colaboradorId}
          onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
```

- [ ] **Step 2: Verificar build completo**

Run: `npm run build`
Expected: `tsc` sem erros e Vite gera `dist/` com sucesso. Corrija qualquer erro de tipo apontado antes de continuar.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: shell com seções, integração de modais e confirmação de conclusão"
```

---

## Task 14: Verificação final — testes, build e QA manual

**Files:** nenhum novo

- [ ] **Step 1: Rodar toda a suíte de testes**

Run: `npm test`
Expected: todos os testes passam (status machine, datas, filtros, reducer). Corrija qualquer falha antes de prosseguir.

- [ ] **Step 2: Rodar build de produção**

Run: `npm run build`
Expected: `tsc` sem erros e bundle gerado em `dist/` sem warnings críticos.

- [ ] **Step 3: QA manual no navegador**

Run: `npm run dev` e abra `http://localhost:5173`.

Verifique manualmente cada item abaixo e anote o resultado:

1. **Sidebar** expande/recolhe e o conteúdo se adapta suavemente.
2. **KPIs** mostram Total, Novas, Recebidas, Em Execução, Concluídas, Devolvidas, Finalizadas e Atrasadas; clicar filtra a lista.
3. **Busca** filtra por título/descrição/responsável/ID.
4. **Filtros** de status (múltiplo), prioridade, responsável e prazo funcionam; "Limpar" reseta.
5. **Toggle Lista/Quadro** alterna entre tabela e kanban.
6. **Tabela** exibe ciclo (stepper compacto), prazo com destaque de atraso, prioridade e status coloridos.
7. **Criar tarefa**: modal abre, validação de título/responsável, nova tarefa aparece como NOVA com histórico inicial.
8. **Editar tarefa** (gestor) persiste alterações.
9. **Ciclo de vida**: como colaborador (troque no rodapé da sidebar), NOVA→RECEBIDA→EM EXECUÇÃO→CONCLUÍDA (com confirmação).
10. **Como gestor**: CONCLUÍDA mostra "Aprovar" e "Devolver"; aprovar → FINALIZADA; devolver exige observação → DEVOLVIDA.
11. **Retomar**: como colaborador, DEVOLVIDA → EM EXECUÇÃO.
12. **Histórico**: timeline mostra data/hora, usuário, transição e observações (ex.: TA-001 tem o ciclo completo do exemplo do spec).
13. **Responsável**: alterar responsável registra entrada "info" no histórico.
14. **Colaboradores**: cards com métricas; modal de detalhes lista as tarefas.
15. **Responsivo**: em largura < 1024px a sidebar vira ícones; < 768px a tabela rola horizontalmente.
16. **Nenhum erro no console** do navegador.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore: verificação final do frontend do CRM"
```

---

## Self-Review (checklist do plano vs spec)

- [x] Tela única + modais (Tasks 8–13; nenhuma rota/página separada).
- [x] Sidebar expansível/recolhível (Task 8) com adaptação do conteúdo (Task 13).
- [x] Ciclo NOVA→RECEBIDA→EM EXECUÇÃO→CONCLUÍDA→FINALIZADA + DEVOLVIDA→EM EXECUÇÃO (Task 2, testes; Tasks 10–13).
- [x] Histórico com data/hora, usuário, status anterior/novo, observação (Task 6 reducer, Task 12 HistoryModal, seed Task 4).
- [x] Indicadores: Total, Novas, Recebidas, Em Execução, Concluídas, Devolvidas, Finalizadas, Atrasadas (Task 5, Task 9).
- [x] Busca e filtros por status/prioridade/responsável/prazo (Task 5, Task 9).
- [x] Modais: criar, editar, detalhes, alterar responsável, aprovar, devolver, histórico, colaborador, confirmação (Tasks 7, 12).
- [x] Tarefas atrasadas destacadas (DueDateCell, indicador, QA).
- [x] Resumo de colaboradores + detalhes (Tasks 11, 12).
- [x] Dados mockados; sem backend/auth/integrações (Task 4).

**Notas de risco conhecidas e mitigação:**
- `TaskRow` e `TaskCard` importam `roleOf` do `AppContext` (função pura, sem DOM) — ok para testes em ambiente `node`.
- Seed com 16 tarefas garante cobertura de todos os status e pelo menos 3 atrasadas em 2026-08-03.
- Se o `tsc` acusar `noUnusedLocals`/`noUnusedParameters` em qualquer arquivo (imports órfãos de ajustes), remova a linha indicada e re-execute `npm run build`.
