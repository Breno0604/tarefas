# Perfis e Permissões — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o modelo de papel fixo `gestor`/`colaborador` (derivado do id) por 4 perfis prontos (Administrador, Gestor de equipe, Colaborador, Consulta) com 8 permissões, e migrar o motor de permissões, transições, reducer, gates de UI e seed.

**Architecture:** O motor passa a ser orientado a permissões resolvidas por perfil (`permissoesDe`), com transições de status anotadas por `TransicaoKind` (`ciclo`/`reabrir`/`aprovacao`). O gate de transição é: a transição deve existir (`canTransition`) **e** o usuário deve ter a permissão do kind (`podeAlterarStatusPara`). `GESTOR_ID` deixa de conferir permissões; `carlos` vira Administrador pela migração do seed.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, @testing-library/react (jsdom), tailwindcss.

**Nota de execução (importante):** Tasks 1–6 alteram módulos fortemente acoplados (`status.ts`, `permissions.ts`, `mockData.ts`, reducer e 4 componentes). Durante as Tasks 2–6, rode os testes **por arquivo** (`npx vitest run <arquivo>`); a suíte completa e o typecheck (`npm run build`) só ficam verdes a partir da Task 6 e são confirmados na Task 7. Não trate quebras de outros arquivos durante Tasks 2–6 como erro — elas são esperadas e resolvidas nas tasks seguintes, na ordem planejada.

**Espec de referência:** `docs/superpowers/specs/2026-08-06-perfis-permissoes-design.md`.

---

## File Structure

**Criados:**
- `src/utils/perfis.ts` — definição dos 4 perfis (id, label, descrição, permissões padrão).
- `src/utils/perfis.test.ts` — testes da matriz de perfis.
- `src/data/mockData.test.ts` — testes da migração do seed (perfis, sem override).

**Modificados:**
- `src/types.ts` — `Role` removido; novo `Perfil`; novo union `Permission` (8 itens); `Colaborador.perfil` obrigatório; `permissoes` vira override.
- `src/utils/status.ts` — `TRANSITIONS` com `kind`; `TransicaoKind`; `transicaoKind`; `canTransition(from,to)`; `transicoesDisponiveis`; remove `roleOf` e `availableTransitions`.
- `src/utils/status.test.ts` — reescrito.
- `src/utils/permissions.ts` — motor novo (resolve por perfil; remove `GESTOR_ID` e `podeAlterarStatus`; adiciona `podeExecutarCicloEm`).
- `src/utils/permissions.test.ts` — reescrito.
- `src/data/mockData.ts` — `carlos` → administrador; 5 colaboradores → colaborador, sem override.
- `src/context/appReducer.ts` — guards: `editar_tarefas`, `reatribuir`, `canTransition(from,to)`.
- `src/components/tasks/TaskRow.tsx` — gates novos.
- `src/components/tasks/TaskCard.tsx` — gates novos.
- `src/components/tasks/TaskKanban.tsx` — `canTransition` sem role.
- `src/components/modals/TaskDetailModal.tsx` — gates novos.

**Não mudam (verificado):** `LocalStorageProvider.ts` (tarefas não têm `perfil`; usuários não são persistidos nesta fase), `seedGenerator.ts` (usa `ALL_USERS` como `SeedUser[]`), `cycleActions.ts`, `ProximoPassoBadge.tsx`, `CycleStepper.tsx`, `SectionColaboradores.tsx`, `CollaboratorCard.tsx`, `CollaboratorDetailModal.tsx`, `Sidebar.tsx`, `FilterBar.tsx`, `Topbar.tsx`, `renderWithApp.tsx`, `AppContext.tsx`.

**Testes que permanecem sem alteração (verificados contra o motor novo):** `AppContext.test.ts` (os casos já codificam o comportamento desejado), `TaskRow.test.tsx`, `TaskRow.permissions.test.tsx`, `TaskKanban.test.tsx`, `TaskDetailModal.test.tsx`, `Topbar.test.tsx`, `SectionTarefas.test.tsx`, `TasksTable.test.tsx`.

---

### Task 1: Tipos e perfis (fundação)

**Files:**
- Modify: `src/types.ts`
- Create: `src/utils/perfis.ts`
- Create: `src/utils/perfis.test.ts`

- [ ] **Step 1: Escrever o teste da matriz de perfis (failing)**

Create `src/utils/perfis.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Perfil } from '../types';
import { PERFIL_IDS, PERFIS, permissoesPadraoDe } from './perfis';

describe('PERFIS', () => {
  it('define os 4 perfis com id, label, descricao e permissões padrão', () => {
    expect(PERFIL_IDS).toEqual(['administrador', 'gestor_equipe', 'colaborador', 'consulta']);
    for (const id of PERFIL_IDS) {
      expect(PERFIS[id].id).toBe(id);
      expect(PERFIS[id].label.length).toBeGreaterThan(0);
      expect(typeof PERFIS[id].descricao).toBe('string');
      expect(Array.isArray(PERFIS[id].permissoesPadrao)).toBe(true);
    }
  });

  it('administrador tem as 8 permissões', () => {
    expect(permissoesPadraoDe('administrador').sort()).toEqual([
      'alterar_status_outros',
      'aprovar_tarefas',
      'criar_tarefas',
      'editar_tarefas',
      'executar_ciclo',
      'gerenciar_usuarios',
      'reatribuir',
      'visualizar_todas_tarefas',
    ]);
  });

  it('gestor_equipe: visualizar_todas_tarefas, executar_ciclo, reatribuir, aprovar_tarefas', () => {
    expect(permissoesPadraoDe('gestor_equipe').sort()).toEqual([
      'aprovar_tarefas',
      'executar_ciclo',
      'reatribuir',
      'visualizar_todas_tarefas',
    ]);
  });

  it('colaborador: apenas executar_ciclo', () => {
    expect(permissoesPadraoDe('colaborador')).toEqual(['executar_ciclo']);
  });

  it('consulta: nenhuma permissão', () => {
    expect(permissoesPadraoDe('consulta')).toEqual([]);
  });

  it('permissoesPadraoDe não expõe o array interno (mutação protegida)', () => {
    const a = permissoesPadraoDe('administrador');
    a.push('criar_tarefas');
    expect(permissoesPadraoDe('administrador')).toHaveLength(8);
  });
});
```

- [ ] **Step 2: Rodar o teste para ver falhar**

Run: `npx vitest run src/utils/perfis.test.ts`
Expected: FAIL — "Cannot find module .../perfis" (arquivo ainda não existe).

- [ ] **Step 3: Atualizar `src/types.ts`**

Replace line 11 (`export type Role = 'gestor' | 'colaborador';`) with:

```ts
export type Perfil = 'administrador' | 'gestor_equipe' | 'colaborador' | 'consulta';
```

Replace the `Permission` union (current lines 45–49):

```ts
export type Permission =
  | 'visualizar_todas_tarefas' // ver todas as tarefas
  | 'executar_ciclo'           // receber / iniciar / concluir / retomar nas PRÓPRIAS tarefas
  | 'alterar_status_outros'    // executar o ciclo em tarefas de outros
  | 'criar_tarefas'
  | 'editar_tarefas'           // editar, duplicar, excluir (era 'gerenciar_tarefas', estreitado)
  | 'reatribuir'               // reatribuir responsável
  | 'aprovar_tarefas'          // aprovar/finalizar, devolver, cancelar, reabrir aprovação
  | 'gerenciar_usuarios';
```

Update `Colaborador` (add `perfil`, change the `permissoes` comment):

```ts
export interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  cor: string; // hex para avatar
  perfil: Perfil;
  permissoes?: Permission[]; // override: ausente = permissões padrão do perfil; presente = lista efetiva completa
}
```

- [ ] **Step 4: Criar `src/utils/perfis.ts`**

```ts
import type { Perfil, Permission } from '../types';

export interface PerfilDef {
  id: Perfil;
  label: string;
  descricao: string;
  permissoesPadrao: Permission[];
}

export const PERFIS: Record<Perfil, PerfilDef> = {
  administrador: {
    id: 'administrador',
    label: 'Administrador',
    descricao: 'Acesso total: inclui executar o ciclo em qualquer tarefa e gerenciar usuários.',
    permissoesPadrao: [
      'visualizar_todas_tarefas',
      'executar_ciclo',
      'alterar_status_outros',
      'criar_tarefas',
      'editar_tarefas',
      'reatribuir',
      'aprovar_tarefas',
      'gerenciar_usuarios',
    ],
  },
  gestor_equipe: {
    id: 'gestor_equipe',
    label: 'Gestor de equipe',
    descricao: 'Aprova e organiza: vê tudo, aprova/devolve/cancela/reabre aprovação e reatribui.',
    permissoesPadrao: ['visualizar_todas_tarefas', 'executar_ciclo', 'reatribuir', 'aprovar_tarefas'],
  },
  colaborador: {
    id: 'colaborador',
    label: 'Colaborador',
    descricao: 'Executa o próprio trabalho: vê e avança as próprias tarefas.',
    permissoesPadrao: ['executar_ciclo'],
  },
  consulta: {
    id: 'consulta',
    label: 'Consulta',
    descricao: 'Somente leitura: nenhuma ação de mudança.',
    permissoesPadrao: [],
  },
};

export const PERFIL_IDS: Perfil[] = ['administrador', 'gestor_equipe', 'colaborador', 'consulta'];

/** Permissões padrão de um perfil (cópia defensiva). */
export function permissoesPadraoDe(perfil: Perfil): Permission[] {
  return [...PERFIS[perfil].permissoesPadrao];
}
```

- [ ] **Step 5: Rodar o teste para ver passar**

Run: `npx vitest run src/utils/perfis.test.ts`
Expected: PASS (6 testes).

- [ ] **Step 6: Confirmar que os módulos antigos ainda passam (não usam os tipos novos)**

Run: `npx vitest run src/utils/status.test.ts src/utils/permissions.test.ts`
Expected: PASS (permissions/status ainda são os antigos; rodam sem typecheck).

> Nota: `npm run build` (tsc) quebra nesta task porque `mockData.ts` ainda não tem `perfil` — esperado, o typecheck só é verificado na Task 7.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/utils/perfis.ts src/utils/perfis.test.ts
git commit -m "feat: tipos de perfil e permissões e matriz de perfis (base da gestão de usuários)"
```

---

### Task 2: Motor de transições — `src/utils/status.ts`

**Files:**
- Modify: `src/utils/status.ts`
- Modify: `src/utils/status.test.ts`

- [ ] **Step 1: Reescrever `src/utils/status.test.ts` (failing)**

Replace the full content with:

```ts
import { describe, expect, it } from 'vitest';
import {
  canTransition,
  podeReatribuir,
  proximoPasso,
  transicaoKind,
  transicoesDisponiveis,
} from './status';

describe('transicaoKind', () => {
  it('ciclo: NOVA→RECEBIDA, RECEBIDA→EM_EXECUCAO, EM_EXECUCAO→CONCLUIDA, DEVOLVIDA→EM_EXECUCAO', () => {
    expect(transicaoKind('NOVA', 'RECEBIDA')).toBe('ciclo');
    expect(transicaoKind('RECEBIDA', 'EM_EXECUCAO')).toBe('ciclo');
    expect(transicaoKind('EM_EXECUCAO', 'CONCLUIDA')).toBe('ciclo');
    expect(transicaoKind('DEVOLVIDA', 'EM_EXECUCAO')).toBe('ciclo');
  });

  it('reabrir: CONCLUIDA→EM_EXECUCAO', () => {
    expect(transicaoKind('CONCLUIDA', 'EM_EXECUCAO')).toBe('reabrir');
  });

  it('aprovacao: FINALIZAR, DEVOLVER, reabrir aprovação e cancelar', () => {
    expect(transicaoKind('CONCLUIDA', 'FINALIZADA')).toBe('aprovacao');
    expect(transicaoKind('CONCLUIDA', 'DEVOLVIDA')).toBe('aprovacao');
    expect(transicaoKind('FINALIZADA', 'EM_EXECUCAO')).toBe('aprovacao');
    for (const from of ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'DEVOLVIDA'] as const) {
      expect(transicaoKind(from, 'CANCELADA')).toBe('aprovacao');
    }
  });

  it('transições inexistentes retornam null', () => {
    expect(transicaoKind('NOVA', 'FINALIZADA')).toBeNull();
    expect(transicaoKind('FINALIZADA', 'NOVA')).toBeNull();
    expect(transicaoKind('RECEBIDA', 'NOVA')).toBeNull();
    expect(transicaoKind('FINALIZADA', 'DEVOLVIDA')).toBeNull();
    expect(transicaoKind('CONCLUIDA', 'CANCELADA')).toBeNull();
    expect(transicaoKind('FINALIZADA', 'CANCELADA')).toBeNull();
  });
});

describe('canTransition', () => {
  it('aceita todas as arestas válidas', () => {
    expect(canTransition('NOVA', 'RECEBIDA')).toBe(true);
    expect(canTransition('EM_EXECUCAO', 'CONCLUIDA')).toBe(true);
    expect(canTransition('CONCLUIDA', 'EM_EXECUCAO')).toBe(true);
    expect(canTransition('CONCLUIDA', 'FINALIZADA')).toBe(true);
    expect(canTransition('DEVOLVIDA', 'EM_EXECUCAO')).toBe(true);
    expect(canTransition('FINALIZADA', 'EM_EXECUCAO')).toBe(true);
    expect(canTransition('NOVA', 'CANCELADA')).toBe(true);
  });

  it('rejeita transições inválidas e reversas', () => {
    expect(canTransition('NOVA', 'FINALIZADA')).toBe(false);
    expect(canTransition('FINALIZADA', 'NOVA')).toBe(false);
    expect(canTransition('RECEBIDA', 'NOVA')).toBe(false);
    expect(canTransition('FINALIZADA', 'DEVOLVIDA')).toBe(false);
    expect(canTransition('CONCLUIDA', 'CANCELADA')).toBe(false);
    expect(canTransition('FINALIZADA', 'CANCELADA')).toBe(false);
  });

  it('CANCELADA é terminal: nenhuma transição de saída', () => {
    const statuses = ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'CONCLUIDA', 'DEVOLVIDA', 'FINALIZADA', 'CANCELADA'] as const;
    for (const to of statuses) {
      expect(canTransition('CANCELADA', to)).toBe(false);
    }
  });
});

describe('transicoesDisponiveis', () => {
  it('lista todos os alvos estruturais por status (sem filtro de permissão)', () => {
    expect(transicoesDisponiveis('NOVA')).toEqual(['RECEBIDA', 'CANCELADA']);
    expect(transicoesDisponiveis('RECEBIDA')).toEqual(['EM_EXECUCAO', 'CANCELADA']);
    expect(transicoesDisponiveis('EM_EXECUCAO')).toEqual(['CONCLUIDA', 'CANCELADA']);
    expect(transicoesDisponiveis('CONCLUIDA')).toEqual(['EM_EXECUCAO', 'FINALIZADA', 'DEVOLVIDA']);
    expect(transicoesDisponiveis('DEVOLVIDA')).toEqual(['EM_EXECUCAO', 'CANCELADA']);
    expect(transicoesDisponiveis('FINALIZADA')).toEqual(['EM_EXECUCAO']);
    expect(transicoesDisponiveis('CANCELADA')).toEqual([]);
  });
});

describe('podeReatribuir', () => {
  it('permite reatribuir em estados ativos e CONCLUIDA', () => {
    for (const status of ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'CONCLUIDA', 'DEVOLVIDA'] as const) {
      expect(podeReatribuir(status)).toBe(true);
    }
  });

  it('bloqueia reatribuição de tarefas encerradas (FINALIZADA e CANCELADA)', () => {
    expect(podeReatribuir('FINALIZADA')).toBe(false);
    expect(podeReatribuir('CANCELADA')).toBe(false);
  });
});

describe('proximoPasso', () => {
  it('a vez é do colaborador em NOVA, RECEBIDA, EM_EXECUCAO e DEVOLVIDA', () => {
    for (const status of ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'DEVOLVIDA'] as const) {
      expect(proximoPasso(status)).toBe('colaborador');
    }
  });

  it('a vez é do gestor em CONCLUIDA (aguardando aprovação)', () => {
    expect(proximoPasso('CONCLUIDA')).toBe('gestor');
  });

  it('ninguém é responsável em FINALIZADA e CANCELADA', () => {
    expect(proximoPasso('FINALIZADA')).toBe('nenhum');
    expect(proximoPasso('CANCELADA')).toBe('nenhum');
  });
});
```

- [ ] **Step 2: Rodar o teste para ver falhar**

Run: `npx vitest run src/utils/status.test.ts`
Expected: FAIL — `transicaoKind`/`transicoesDisponiveis` não existem; `canTransition` recebe 3 args.

- [ ] **Step 3: Reescrever `src/utils/status.ts`**

Replace the full content with:

```ts
import type { Priority, TaskStatus } from '../types';

export type TransicaoKind = 'ciclo' | 'reabrir' | 'aprovacao';

export const STATUS_ORDER: TaskStatus[] = [
  'NOVA',
  'RECEBIDA',
  'EM_EXECUCAO',
  'CONCLUIDA',
  'FINALIZADA',
  'CANCELADA',
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  NOVA: 'Nova',
  RECEBIDA: 'Recebida',
  EM_EXECUCAO: 'Em execução',
  CONCLUIDA: 'Concluída',
  DEVOLVIDA: 'Devolvida',
  FINALIZADA: 'Finalizada',
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

/** Arestas do fluxo. CONCLUIDA→EM_EXECUCAO é uma única aresta (reabrir). */
export const TRANSITIONS: { from: TaskStatus; to: TaskStatus; kind: TransicaoKind }[] = [
  { from: 'NOVA', to: 'RECEBIDA', kind: 'ciclo' },
  { from: 'RECEBIDA', to: 'EM_EXECUCAO', kind: 'ciclo' },
  { from: 'EM_EXECUCAO', to: 'CONCLUIDA', kind: 'ciclo' },
  { from: 'DEVOLVIDA', to: 'EM_EXECUCAO', kind: 'ciclo' },
  { from: 'CONCLUIDA', to: 'EM_EXECUCAO', kind: 'reabrir' },
  { from: 'CONCLUIDA', to: 'FINALIZADA', kind: 'aprovacao' },
  { from: 'CONCLUIDA', to: 'DEVOLVIDA', kind: 'aprovacao' },
  { from: 'FINALIZADA', to: 'EM_EXECUCAO', kind: 'aprovacao' },
  { from: 'NOVA', to: 'CANCELADA', kind: 'aprovacao' },
  { from: 'RECEBIDA', to: 'CANCELADA', kind: 'aprovacao' },
  { from: 'EM_EXECUCAO', to: 'CANCELADA', kind: 'aprovacao' },
  { from: 'DEVOLVIDA', to: 'CANCELADA', kind: 'aprovacao' },
];

export function transicaoKind(from: TaskStatus, to: TaskStatus): TransicaoKind | null {
  return TRANSITIONS.find((t) => t.from === from && t.to === to)?.kind ?? null;
}

/** Checagem de existência da transição (sem papel). */
export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return transicaoKind(from, to) !== null;
}

/** Todos os alvos estruturalmente válidos; o filtro por permissão fica na UI/reducer. */
export function transicoesDisponiveis(status: TaskStatus): TaskStatus[] {
  return TRANSITIONS.filter((t) => t.from === status).map((t) => t.to);
}

/** Reatribuição de responsável é bloqueada para tarefas encerradas (FINALIZADA/CANCELADA). */
export function podeReatribuir(status: TaskStatus): boolean {
  return status !== 'FINALIZADA' && status !== 'CANCELADA';
}

/** De quem é o próximo passo no fluxo, dado o status atual. */
export function proximoPasso(status: TaskStatus): 'gestor' | 'colaborador' | 'nenhum' {
  switch (status) {
    case 'NOVA':
    case 'RECEBIDA':
    case 'EM_EXECUCAO':
    case 'DEVOLVIDA':
      return 'colaborador';
    case 'CONCLUIDA':
      return 'gestor';
    case 'FINALIZADA':
    case 'CANCELADA':
      return 'nenhum';
  }
}
```

- [ ] **Step 4: Rodar o teste para ver passar**

Run: `npx vitest run src/utils/status.test.ts`
Expected: PASS.

> Nota: consumidores (`appReducer`, `TaskRow`, `TaskCard`, `TaskKanban`, `TaskDetailModal`) quebram nesta task (importam `roleOf`/`availableTransitions`). Esperado — serão migrados nas Tasks 5 e 6.

- [ ] **Step 5: Commit**

```bash
git add src/utils/status.ts src/utils/status.test.ts
git commit -m "feat: transições de status por kind (ciclo/reabrir/aprovacao) sem papel fixo"
```

---

### Task 3: Motor de permissões — `src/utils/permissions.ts`

**Files:**
- Modify: `src/utils/permissions.ts`
- Modify: `src/utils/permissions.test.ts`

- [ ] **Step 1: Reescrever `src/utils/permissions.test.ts` (failing)**

Replace the full content with:

```ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('../data/mockData', async (importOriginal) => {
  const original = await importOriginal<typeof import('../data/mockData')>();
  return {
    ...original,
    findUser: (id: string) => {
      const u = original.findUser(id);
      if (!u) return undefined;
      if (id === 'lucas') return { ...u, perfil: 'colaborador', permissoes: ['alterar_status_outros'] };
      if (id === 'maria') return { ...u, perfil: 'colaborador', permissoes: [] };
      if (id === 'pedro') return { ...u, perfil: 'gestor_equipe' };
      if (id === 'joao') return { ...u, perfil: 'colaborador' };
      if (id === 'carlos') return { ...u, perfil: 'administrador' };
      return u;
    },
  };
});

import { TAREFAS } from '../data/mockData';
import type { Task } from '../types';
import {
  permissoesDe,
  pode,
  podeAlterarStatusPara,
  podeExecutarCicloEm,
  podeReabrir,
  podeVer,
  tasksVisiveis,
} from './permissions';

const tarefaJoao: Task = TAREFAS.find((t) => t.id === 'TA-005')!; // responsável joao, NOVA
const tarefaMaria: Task = TAREFAS.find((t) => t.id === 'TA-003')!; // responsável maria, CONCLUIDA
const concluidaJoao: Task = { ...tarefaJoao, status: 'CONCLUIDA' };

describe('permissoesDe / pode', () => {
  it('administrador tem as 8 permissões', () => {
    expect(permissoesDe('carlos')).toHaveLength(8);
    expect(pode('carlos', 'gerenciar_usuarios')).toBe(true);
    expect(pode('carlos', 'editar_tarefas')).toBe(true);
    expect(pode('carlos', 'aprovar_tarefas')).toBe(true);
  });

  it('colaborador (sem override) tem apenas executar_ciclo', () => {
    expect(pode('joao', 'executar_ciclo')).toBe(true);
    expect(pode('joao', 'visualizar_todas_tarefas')).toBe(false);
    expect(pode('joao', 'criar_tarefas')).toBe(false);
    expect(pode('joao', 'aprovar_tarefas')).toBe(false);
  });

  it('gestor_equipe usa as permissões padrão do perfil', () => {
    expect(pode('pedro', 'aprovar_tarefas')).toBe(true);
    expect(pode('pedro', 'reatribuir')).toBe(true);
    expect(pode('pedro', 'visualizar_todas_tarefas')).toBe(true);
    expect(pode('pedro', 'editar_tarefas')).toBe(false);
    expect(pode('pedro', 'gerenciar_usuarios')).toBe(false);
  });

  it('override substitui as permissões padrão do perfil', () => {
    expect(permissoesDe('lucas')).toEqual(['alterar_status_outros']);
    expect(pode('lucas', 'executar_ciclo')).toBe(false);
    expect(pode('lucas', 'alterar_status_outros')).toBe(true);
  });

  it('override vazio significa nenhuma permissão', () => {
    expect(permissoesDe('maria')).toEqual([]);
    expect(pode('maria', 'executar_ciclo')).toBe(false);
  });

  it('usuário inexistente não tem permissões', () => {
    expect(permissoesDe('zzz')).toEqual([]);
    expect(pode('zzz', 'criar_tarefas')).toBe(false);
  });
});

describe('podeExecutarCicloEm', () => {
  it('responsável com executar_ciclo executa a própria tarefa', () => {
    expect(podeExecutarCicloEm('joao', tarefaJoao)).toBe(true);
  });

  it('responsável sem executar_ciclo (override vazio) não executa a própria tarefa', () => {
    expect(podeExecutarCicloEm('maria', tarefaMaria)).toBe(false);
  });

  it('tarefa de outro exige alterar_status_outros', () => {
    expect(podeExecutarCicloEm('lucas', tarefaJoao)).toBe(true);
    expect(podeExecutarCicloEm('joao', tarefaMaria)).toBe(false);
  });
});

describe('podeReabrir', () => {
  it('responsável reabre a própria CONCLUIDA (executar_ciclo)', () => {
    expect(podeReabrir('joao', concluidaJoao)).toBe(true);
  });

  it('tarefa de outro exige aprovar_tarefas', () => {
    expect(podeReabrir('carlos', concluidaJoao)).toBe(true);
    expect(podeReabrir('pedro', concluidaJoao)).toBe(true);
    expect(podeReabrir('lucas', concluidaJoao)).toBe(false);
    expect(podeReabrir('maria', concluidaJoao)).toBe(false);
  });
});

describe('podeAlterarStatusPara', () => {
  it('ciclo na própria tarefa exige executar_ciclo', () => {
    expect(podeAlterarStatusPara('joao', tarefaJoao, 'RECEBIDA')).toBe(true);
  });

  it('ciclo em tarefa de outro exige alterar_status_outros', () => {
    expect(podeAlterarStatusPara('lucas', tarefaJoao, 'RECEBIDA')).toBe(true);
    expect(podeAlterarStatusPara('joao', tarefaMaria, 'EM_EXECUCAO')).toBe(false);
  });

  it('reabrir exige responsável (executar_ciclo) ou aprovar_tarefas', () => {
    expect(podeAlterarStatusPara('joao', concluidaJoao, 'EM_EXECUCAO')).toBe(true);
    expect(podeAlterarStatusPara('carlos', concluidaJoao, 'EM_EXECUCAO')).toBe(true);
    expect(podeAlterarStatusPara('lucas', concluidaJoao, 'EM_EXECUCAO')).toBe(false);
  });

  it('aprovação (aprovar/finalizar, devolver, cancelar) exige aprovar_tarefas', () => {
    expect(podeAlterarStatusPara('carlos', tarefaMaria, 'FINALIZADA')).toBe(true);
    expect(podeAlterarStatusPara('pedro', tarefaMaria, 'FINALIZADA')).toBe(true);
    expect(podeAlterarStatusPara('joao', tarefaMaria, 'FINALIZADA')).toBe(false);
    expect(podeAlterarStatusPara('carlos', tarefaJoao, 'CANCELADA')).toBe(true);
    expect(podeAlterarStatusPara('joao', tarefaJoao, 'CANCELADA')).toBe(false);
  });

  it('transição inexistente nunca é permitida', () => {
    expect(podeAlterarStatusPara('carlos', tarefaJoao, 'FINALIZADA')).toBe(false);
    expect(podeAlterarStatusPara('joao', tarefaJoao, 'CONCLUIDA')).toBe(false);
  });
});

describe('podeVer / tasksVisiveis', () => {
  it('responsável vê a própria tarefa; visualizar_todas_tarefas vê qualquer uma', () => {
    expect(podeVer('joao', tarefaJoao)).toBe(true);
    expect(podeVer('carlos', tarefaJoao)).toBe(true);
    expect(podeVer('pedro', tarefaJoao)).toBe(true);
    expect(podeVer('joao', tarefaMaria)).toBe(false);
  });

  it('tasksVisiveis filtra apenas as que o usuário pode ver', () => {
    expect(tasksVisiveis([tarefaJoao, tarefaMaria], 'joao').map((t) => t.id)).toEqual(['TA-005']);
    expect(tasksVisiveis([tarefaJoao, tarefaMaria], 'carlos').map((t) => t.id)).toEqual(['TA-005', 'TA-003']);
  });
});
```

- [ ] **Step 2: Rodar o teste para ver falhar**

Run: `npx vitest run src/utils/permissions.test.ts`
Expected: FAIL — `podeExecutarCicloEm` não existe; `permissoesDe` ainda usa o caso especial do gestor.

- [ ] **Step 3: Reescrever `src/utils/permissions.ts`**

Replace the full content with:

```ts
import type { Permission, Task, TaskStatus } from '../types';
import { findUser } from '../data/mockData';
import { permissoesPadraoDe } from './perfis';
import { transicaoKind } from './status';

/** Permissões efetivas de um usuário: override quando declarado, senão as padrão do perfil. */
export function permissoesDe(userId: string): Permission[] {
  const user = findUser(userId);
  if (!user) return [];
  if (user.permissoes) return [...user.permissoes];
  return permissoesPadraoDe(user.perfil);
}

/** O usuário possui a permissão? */
export function pode(userId: string, perm: Permission): boolean {
  return permissoesDe(userId).includes(perm);
}

/** Pode executar o ciclo (receber/iniciar/concluir/retomar) nesta tarefa? */
export function podeExecutarCicloEm(userId: string, task: Task): boolean {
  return task.responsavelId === userId
    ? pode(userId, 'executar_ciclo')
    : pode(userId, 'alterar_status_outros');
}

/** Pode reabrir a entrega (CONCLUIDA → EM_EXECUCAO)? Própria: executar_ciclo; de outro: aprovar_tarefas. */
export function podeReabrir(userId: string, task: Task): boolean {
  return task.responsavelId === userId
    ? pode(userId, 'executar_ciclo')
    : pode(userId, 'aprovar_tarefas');
}

/** Pode levar a tarefa a este status? Resolve o kind da transição e aplica a permissão. */
export function podeAlterarStatusPara(userId: string, task: Task, novoStatus: TaskStatus): boolean {
  switch (transicaoKind(task.status, novoStatus)) {
    case 'ciclo':
      return podeExecutarCicloEm(userId, task);
    case 'reabrir':
      return podeReabrir(userId, task);
    case 'aprovacao':
      return pode(userId, 'aprovar_tarefas');
    default:
      return false;
  }
}

/** Pode visualizar esta tarefa? (responsável ou com permissão de ver todas) */
export function podeVer(userId: string, task: Task): boolean {
  return task.responsavelId === userId || pode(userId, 'visualizar_todas_tarefas');
}

/** Tarefas que o usuário pode visualizar. */
export function tasksVisiveis(tasks: Task[], userId: string): Task[] {
  return tasks.filter((t) => podeVer(userId, t));
}
```

- [ ] **Step 4: Rodar o teste para ver passar**

Run: `npx vitest run src/utils/permissions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/permissions.ts src/utils/permissions.test.ts
git commit -m "feat: motor de permissões orientado a perfil (override) e transição por kind"
```

---

### Task 4: Migração do seed — `src/data/mockData.ts`

**Files:**
- Modify: `src/data/mockData.ts`
- Create: `src/data/mockData.test.ts`

- [ ] **Step 1: Escrever o teste da migração (failing)**

Create `src/data/mockData.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { COLABORADORES, GESTOR } from './mockData';

describe('seed — perfis (migração)', () => {
  it('carlos tem perfil administrador e nenhum override', () => {
    expect(GESTOR.perfil).toBe('administrador');
    expect(GESTOR.permissoes).toBeUndefined();
  });

  it('os 5 colaboradores têm perfil colaborador e nenhum override', () => {
    expect(COLABORADORES).toHaveLength(5);
    for (const c of COLABORADORES) {
      expect(c.perfil).toBe('colaborador');
      expect(c.permissoes).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Rodar o teste para ver falhar**

Run: `npx vitest run src/data/mockData.test.ts`
Expected: FAIL — `perfil` não existe nos objetos (e typecheck quebraria, mas o teste roda via esbuild).

- [ ] **Step 3: Migrar `src/data/mockData.ts`**

Add `perfil` to `GESTOR`:

```ts
export const GESTOR: Colaborador = {
  id: 'carlos',
  nome: 'Carlos Mendes',
  cargo: 'Gestor de Projetos',
  email: 'carlos@empresa.com',
  cor: '#4f46e5',
  perfil: 'administrador',
};
```

Replace the `COLABORADORES` array (lines 14–20) — add `perfil: 'colaborador'` and **remove** every `permissoes: ['visualizar_todas_tarefas']`:

```ts
export const COLABORADORES: Colaborador[] = [
  { id: 'joao', nome: 'João Silva', cargo: 'Desenvolvedor', email: 'joao@empresa.com', cor: '#0ea5e9', perfil: 'colaborador' },
  { id: 'maria', nome: 'Maria Souza', cargo: 'Analista de Marketing', email: 'maria@empresa.com', cor: '#f59e0b', perfil: 'colaborador' },
  { id: 'pedro', nome: 'Pedro Oliveira', cargo: 'Designer', email: 'pedro@empresa.com', cor: '#8b5cf6', perfil: 'colaborador' },
  { id: 'ana', nome: 'Ana Costa', cargo: 'Suporte', email: 'ana@empresa.com', cor: '#10b981', perfil: 'colaborador' },
  { id: 'lucas', nome: 'Lucas Pereira', cargo: 'Desenvolvedor', email: 'lucas@empresa.com', cor: '#f43f5e', perfil: 'colaborador' },
];
```

> `GESTOR_ID` permanece exportado (id do carlos, usado pelo `seedGenerator`), mas **não** confere mais permissões por construção.

- [ ] **Step 4: Rodar o teste para ver passar**

Run: `npx vitest run src/data/mockData.test.ts src/utils/permissions.test.ts src/utils/perfis.test.ts`
Expected: PASS (o mock de `permissions.test.ts` fornece `perfil` explicitamente, então continua verde).

- [ ] **Step 5: Commit**

```bash
git add src/data/mockData.ts src/data/mockData.test.ts
git commit -m "feat: migra o seed para perfis (carlos administrador, colaboradores sem override)"
```

---

### Task 5: Guards do reducer — `src/context/appReducer.ts`

**Files:**
- Modify: `src/context/appReducer.ts`
- Modify: `src/context/AppContext.test.ts` (apenas textos de `describe`, cosmético)

- [ ] **Step 1: Rodar o teste do reducer para ver falhar**

Run: `npx vitest run src/context/AppContext.test.ts`
Expected: FAIL — erro de importação (`roleOf` não existe mais em `status.ts`).

- [ ] **Step 2: Atualizar os guards do reducer**

In `src/context/appReducer.ts`:

- Line 2 — import:

```ts
import { canTransition, podeReatribuir } from '../utils/status';
```

- `CHANGE_STATUS` (current line 157):

```ts
if (!canTransition(task.status, action.novoStatus)) return state;
```

- `UPDATE_TASK` (current line 97), `DUPLICATE_TASK` (line 217) e `DELETE_TASK` (line 234) — trocar `'gerenciar_tarefas'` por `'editar_tarefas'`:

```ts
if (!pode(state.currentUserId, 'editar_tarefas')) return state;
```

- `REASSIGN` (current line 190) — trocar para `'reatribuir'`:

```ts
if (!pode(state.currentUserId, 'reatribuir')) return state;
```

- [ ] **Step 3: Atualizar os textos de `describe` em `AppContext.test.ts` (cosmético)**

In `src/context/AppContext.test.ts` (current lines 479–507), rename the describe block:

```ts
describe('appReducer — permissão de gestão (editar_tarefas / reatribuir)', () => {
  it('colaborador sem editar_tarefas não edita tarefa', () => {
  ...
  it('colaborador sem editar_tarefas não exclui tarefa', () => {
  ...
  it('colaborador sem editar_tarefas não duplica tarefa', () => {
  ...
  it('colaborador sem reatribuir não reatribui tarefa', () => {
```

(Os `it` mantêm o mesmo corpo; apenas o texto muda.)

- [ ] **Step 4: Rodar o teste do reducer para ver passar**

Run: `npx vitest run src/context/AppContext.test.ts`
Expected: PASS.

> Os casos de `AppContext.test.ts` já codificam o comportamento desejado (carlos=admin aprova/edita/exclui; joao=colaborador não cancela nem edita; lucas com `alterar_status_outros` não reabre de outro) e passam com o motor novo sem mudanças de lógica.

- [ ] **Step 5: Commit**

```bash
git add src/context/appReducer.ts src/context/AppContext.test.ts
git commit -m "feat: reducer com guards por permissão (editar_tarefas/reatribuir) e canTransition sem papel"
```

---

### Task 6: Gates de UI nos componentes

**Files:**
- Modify: `src/components/tasks/TaskRow.tsx`
- Modify: `src/components/tasks/TaskCard.tsx`
- Modify: `src/components/tasks/TaskKanban.tsx`
- Modify: `src/components/modals/TaskDetailModal.tsx`

- [ ] **Step 1: Rodar os testes de UI para ver falhar**

Run: `npx vitest run src/components/tasks/TaskRow.test.tsx src/components/tasks/TaskRow.permissions.test.tsx src/components/tasks/TaskCard.test.tsx src/components/tasks/TaskKanban.test.tsx src/components/modals/TaskDetailModal.test.tsx`
Expected: FAIL — erro de importação (`roleOf`/`availableTransitions` não existem mais).

- [ ] **Step 2: Atualizar `src/components/tasks/TaskRow.tsx`**

- Line 13 — import:

```ts
import { transicoesDisponiveis, podeReatribuir } from '../../utils/status';
```

- Line 52 — remover `const role = roleOf(state.currentUserId);`
- Line 54:

```ts
const can = transicoesDisponiveis(task.status);
```

- Line 55:

```ts
const podeGerenciar = pode(state.currentUserId, 'editar_tarefas');
```

- Line 161 — gate do botão "Alterar responsável" (dentro do bloco `podeGerenciar`):

```tsx
{pode(state.currentUserId, 'reatribuir') && podeReatribuir(task.status) && (
```

O mapa de ações (linhas 192–207) já filtra cada alvo com `podeAlterarStatusPara` — permanece como está.

- [ ] **Step 3: Rodar os testes de TaskRow para ver passar**

Run: `npx vitest run src/components/tasks/TaskRow.test.tsx src/components/tasks/TaskRow.permissions.test.tsx`
Expected: PASS (os casos existentes — "colaborador não vê Cancelar", "colaborador em FINALIZADA não vê Reabrir aprovação", "alterar_status_outros não reabre de outro" — passam com o motor novo).

- [ ] **Step 4: Atualizar `src/components/tasks/TaskCard.tsx`**

- Line 5 — import:

```ts
import { transicoesDisponiveis } from '../../utils/status';
```

- Line 6 — import:

```ts
import { podeAlterarStatusPara, podeExecutarCicloEm } from '../../utils/permissions';
```

- Lines 30–33:

```ts
const responsavel = findUser(task.responsavelId);
const can = transicoesDisponiveis(task.status).filter((alvo) =>
  podeAlterarStatusPara(state.currentUserId, task, alvo)
);
const podeAlterar = podeExecutarCicloEm(state.currentUserId, task);
```

O restante (seleção de `action`, botões, drag) permanece como está.

- [ ] **Step 5: Atualizar `src/components/tasks/TaskKanban.tsx`**

- Line 5 — remover `import { roleOf } from '../../utils/status';`
- Line 46 — remover `const role = roleOf(state.currentUserId);`
- Line 60:

```ts
return podeAlterarStatusPara(state.currentUserId, dragged, status) && canTransition(dragInfo.status, status);
```

- Line 79:

```ts
if (!canTransition(dragged.status, status)) return;
```

- Line 121 — texto do tooltip do badge "não permitido" (ajuste de copy):

```tsx
title="Transição não permitida para o usuário atual"
```

- [ ] **Step 6: Atualizar `src/components/modals/TaskDetailModal.tsx`**

- Line 4 — remover `import { roleOf } from '../../utils/status';`
- Line 6 — import:

```ts
import { transicoesDisponiveis, podeReatribuir } from '../../utils/status';
```

- Line 7 — import:

```ts
import { pode, podeAlterarStatusPara, podeExecutarCicloEm } from '../../utils/permissions';
```

- Lines 39–44:

```ts
const responsavel = findUser(task.responsavelId);
const criador = findUser(task.criadorId);
const can = transicoesDisponiveis(task.status).filter((alvo) =>
  podeAlterarStatusPara(state.currentUserId, task, alvo)
);
const podeGerenciar = pode(state.currentUserId, 'editar_tarefas');
const podeAlterar = podeExecutarCicloEm(state.currentUserId, task);
```

- Line 125 — "Retomar após correção" (DEVOLVIDA):

```tsx
{podeAlterar && task.status === 'DEVOLVIDA' && can.includes('EM_EXECUCAO') && (
```

- Line 140 — bloco "Devolver"/"Aprovar e finalizar" (CONCLUIDA):

```tsx
{task.status === 'CONCLUIDA' && pode(state.currentUserId, 'aprovar_tarefas') && (
```

- Line 156 — "Reabrir aprovação" (FINALIZADA):

```tsx
{task.status === 'FINALIZADA' && pode(state.currentUserId, 'aprovar_tarefas') && (
```

- Line 164 — "Cancelar":

```tsx
{can.includes('CANCELADA') && (
```

(`can` já vem filtrado por permissão, então `aprovar_tarefas` está embutido.)

- [ ] **Step 7: Rodar os testes de UI para ver passar**

Run: `npx vitest run src/components/tasks/TaskRow.test.tsx src/components/tasks/TaskRow.permissions.test.tsx src/components/tasks/TaskCard.test.tsx src/components/tasks/TaskKanban.test.tsx src/components/modals/TaskDetailModal.test.tsx src/components/layout/Topbar.test.tsx`
Expected: PASS (todos os casos de permissão já codificados passam com o motor novo).

- [ ] **Step 8: Commit**

```bash
git add src/components/tasks/TaskRow.tsx src/components/tasks/TaskCard.tsx src/components/tasks/TaskKanban.tsx src/components/modals/TaskDetailModal.tsx
git commit -m "feat: gates de UI por permissão (editar_tarefas, reatribuir, aprovar_tarefas, executar_ciclo)"
```

---

### Task 7: Integração — suíte completa e typecheck

**Files:** nenhum esperado; corrija stragglers se aparecerem.

- [ ] **Step 1: Rodar a suíte completa**

Run: `npm test`
Expected: PASS (todos os arquivos de teste). Se algum falhar, corrija na causa raiz e rode de novo.

- [ ] **Step 2: Rodar o typecheck + build**

Run: `npm run build`
Expected: PASS (`tsc` sem erros + `vite build`). Verifique que não sobrou `gerenciar_tarefas`, `Role`, `roleOf` ou `availableTransitions` referenciados:

```bash
rg -n "gerenciar_tarefas|roleOf|availableTransitions|Role" src
```

Expected: nenhum match em `src`.

- [ ] **Step 3: Commit (se houver correções)**

```bash
git add -A
git commit -m "fix: ajustes de integração do modelo de perfis e permissões"
```

(Se nada foi corrigido, pule este passo.)

---

## Self-Review

**Cobertura da spec:**
- §2 tipos (Perfil, Permission, Colaborador.perfil, Role removido) → Task 1.
- §3 perfis (PERFIS/PERFIL_IDS/permissoesPadraoDe + matriz) → Task 1.
- §4 motor de permissões (permissoesDe/pode/podeExecutarCicloEm/podeReabrir/podeAlterarStatusPara/podeVer/tasksVisiveis, GESTOR_ID removido, podeAlterarStatus some) → Task 3.
- §5 transições (TransicaoKind, TRANSITIONS com kind, transicaoKind, canTransition, transicoesDisponiveis, roleOf/availableTransitions removidos) → Task 2.
- §6 reducer (guards) → Task 5.
- §7 UI (TaskRow/TaskCard/TaskKanban/TaskDetailModal) → Task 6. Topbar/FilterBar/TaskFormModal/ReassignModal sem mudança (confirmado).
- §8 seed/migração → Task 4.
- §9 testes → Tasks 1–6 + AppContext/TaskRow/TaskKanban/TaskDetailModal/Topbar permanecem verdes (validados por trace; confirmados na Task 7).
- §10 comportamento resultante (admin executa ciclo em qualquer tarefa; gestor_equipe aprova/reatribui mas não edita; colaborador só vê as próprias) → coberto pelos gates e pelo seed migrado.
- §11 fora de escopo: nada implementado.

**Placeholders:** nenhum — todo código de cada passo está completo.

**Consistência de tipos/nomes:** nomes finais usados em todas as tasks — `Perfil`, `Permission`, `Colaborador.perfil`, `TransicaoKind`, `transicaoKind`, `canTransition(from,to)`, `transicoesDisponiveis(status)`, `permissoesDe`, `pode`, `podeExecutarCicloEm`, `podeReabrir`, `podeAlterarStatusPara`, `podeVer`, `tasksVisiveis`, `editar_tarefas`, `reatribuir`, `aprovar_tarefas`, `executar_ciclo`, `gerenciar_usuarios`, `criar_tarefas`, `alterar_status_outros`, `visualizar_todas_tarefas`. `proximoPasso` e `podeReatribuir(status)` mantêm a assinatura.
