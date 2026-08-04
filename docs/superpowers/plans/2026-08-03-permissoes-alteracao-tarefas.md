# Permissões de Alteração de Tarefas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Controlar quem pode alterar o ciclo/status das tarefas: responsável altera a própria, demais usuários só com permissão específica, gestor mantém tudo.

**Architecture:** Lista de permissões por usuário no mockData (gestor implica todas, por construção) + helper central `utils/permissions.ts`. A guarda real fica no reducer (`CHANGE_STATUS`); a UI (TaskRow, TaskCard/TaskKanban, TaskDetailModal, Topbar) oculta botões sem permissão; visualização filtrada via `tasksVisiveis` (seed preserva comportamento atual).

**Tech Stack:** React 19 + TypeScript + Vite, Vitest + Testing Library (jsdom), Tailwind.

**Referência do spec:** `docs/superpowers/specs/2026-08-03-permissoes-alteracao-tarefas.md`

---

### Task 1: Tipo Permission + campo no Colaborador + seed

**Files:**
- Modify: `src/types.ts`
- Modify: `src/data/mockData.ts`
- Test: `src/utils/permissions.test.ts` (criado na Task 2; aqui basta `tsc`)

- [ ] **Step 1: Adicionar o tipo Permission em `src/types.ts`**

```ts
export type Permission =
  | 'alterar_status_outros' // avançar/retroceder status de tarefas de outros usuários
  | 'visualizar_todas_tarefas' // ver tarefas de todos (sem isso, só as próprias)
  | 'criar_tarefas' // botão "Nova Tarefa"
  | 'gerenciar_tarefas'; // editar, excluir, duplicar, reatribuir tarefas de qualquer um
```

Adicionar ao final do arquivo `src/types.ts`.

- [ ] **Step 2: Adicionar campo `permissoes` ao `Colaborador` em `src/types.ts`**

No bloco `export interface Colaborador { ... }`, adicionar após `cor`:

```ts
  permissoes?: Permission[]; // ausente = sem permissões (exceto gestor, que tem todas)
```

- [ ] **Step 3: Preencher o seed em `src/data/mockData.ts`**

No topo do arquivo, trocar o import para incluir `Permission`:

```ts
import type { Colaborador, HistoryEntry, Permission, Task } from '../types';
```

Em cada um dos 5 objetos de `COLABORADORES` (joao, maria, pedro, ana, lucas), adicionar após `cor`:

```ts
  permissoes: ['visualizar_todas_tarefas'],
```

`GESTOR` NÃO recebe o campo (papel implica todas as permissões no código).

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/data/mockData.ts
git commit -m "feat: modelo de permissões (tipo Permission + seed)"
```

---

### Task 2: Helper central `utils/permissions.ts`

**Files:**
- Create: `src/utils/permissions.ts`
- Test: `src/utils/permissions.test.ts`

- [ ] **Step 1: Escrever o teste que falha — `src/utils/permissions.test.ts`**

```ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('../data/mockData', async (importOriginal) => {
  const original = await importOriginal<typeof import('../data/mockData')>();
  return {
    ...original,
    findUser: (id: string) => {
      const u = original.findUser(id);
      if (!u) return undefined;
      if (id === 'lucas') return { ...u, permissoes: ['alterar_status_outros', 'gerenciar_tarefas'] };
      if (id === 'maria') return { ...u, permissoes: [] };
      return u;
    },
  };
});

import { GESTOR_ID, TAREFAS } from '../data/mockData';
import type { Task } from '../types';
import { permissoesDe, pode, podeAlterarStatus, podeVer, tasksVisiveis } from './permissions';

const tarefaJoao: Task = TAREFAS.find((t) => t.id === 'TA-005')!; // responsável joao
const tarefaMaria: Task = TAREFAS.find((t) => t.id === 'TA-003')!; // responsável maria

describe('permissoesDe / pode', () => {
  it('gestor tem todas as permissões por construção', () => {
    const todas = ['alterar_status_outros', 'visualizar_todas_tarefas', 'criar_tarefas', 'gerenciar_tarefas'] as const;
    expect(permissoesDe(GESTOR_ID)).toEqual([...todas]);
    for (const p of todas) expect(pode(GESTOR_ID, p)).toBe(true);
  });

  it('colaborador sem permissão declarada não tem permissões', () => {
    expect(pode('maria', 'visualizar_todas_tarefas')).toBe(false);
    expect(pode('maria', 'criar_tarefas')).toBe(false);
  });

  it('colaborador do seed com visualizar_todas_tarefas pode ver', () => {
    expect(pode('joao', 'visualizar_todas_tarefas')).toBe(true);
    expect(pode('joao', 'criar_tarefas')).toBe(false);
  });

  it('usuário com permissões declaradas pode usá-las', () => {
    expect(pode('lucas', 'alterar_status_outros')).toBe(true);
    expect(pode('lucas', 'gerenciar_tarefas')).toBe(true);
    expect(pode('lucas', 'criar_tarefas')).toBe(false);
  });
});

describe('podeAlterarStatus', () => {
  it('gestor sempre pode alterar', () => {
    expect(podeAlterarStatus(GESTOR_ID, tarefaJoao)).toBe(true);
    expect(podeAlterarStatus(GESTOR_ID, tarefaMaria)).toBe(true);
  });

  it('responsável pode alterar a própria tarefa', () => {
    expect(podeAlterarStatus('joao', tarefaJoao)).toBe(true);
    expect(podeAlterarStatus('maria', tarefaMaria)).toBe(true);
  });

  it('não-responsável sem permissão não pode alterar', () => {
    expect(podeAlterarStatus('joao', tarefaMaria)).toBe(false);
    expect(podeAlterarStatus('maria', tarefaJoao)).toBe(false);
  });

  it('não-responsável com alterar_status_outros pode alterar', () => {
    expect(podeAlterarStatus('lucas', tarefaJoao)).toBe(true);
    expect(podeAlterarStatus('lucas', tarefaMaria)).toBe(true);
  });
});

describe('podeVer / tasksVisiveis', () => {
  it('gestor e responsável veem a tarefa', () => {
    expect(podeVer(GESTOR_ID, tarefaJoao)).toBe(true);
    expect(podeVer('joao', tarefaJoao)).toBe(true);
  });

  it('usuário sem visualizar_todas_tarefas e não-responsável não vê', () => {
    expect(podeVer('maria', tarefaJoao)).toBe(false);
  });

  it('tasksVisiveis filtra apenas as que o usuário pode ver', () => {
    expect(tasksVisiveis([tarefaJoao, tarefaMaria], 'maria').map((t) => t.id)).toEqual(['TA-003']);
  });
});
```

- [ ] **Step 2: Rodar o teste para ver falhar**

Run: `npx vitest run src/utils/permissions.test.ts`
Expected: FAIL — `Failed to resolve import "./permissions"` (módulo não existe).

- [ ] **Step 3: Implementar `src/utils/permissions.ts`**

```ts
import type { Permission, Task } from '../types';
import { findUser, GESTOR_ID } from '../data/mockData';

const TODAS_AS_PERMISSOES: Permission[] = [
  'alterar_status_outros',
  'visualizar_todas_tarefas',
  'criar_tarefas',
  'gerenciar_tarefas',
];

/** Permissões de um usuário; o gestor tem todas por construção. */
export function permissoesDe(userId: string): Permission[] {
  if (userId === GESTOR_ID) return [...TODAS_AS_PERMISSOES];
  return findUser(userId)?.permissoes ?? [];
}

/** O usuário possui a permissão? (gestor sempre sim) */
export function pode(userId: string, perm: Permission): boolean {
  return permissoesDe(userId).includes(perm);
}

/** Pode avançar/retroceder o status desta tarefa? (gestor, responsável ou com permissão específica) */
export function podeAlterarStatus(userId: string, task: Task): boolean {
  return userId === GESTOR_ID || task.responsavelId === userId || pode(userId, 'alterar_status_outros');
}

/** Pode visualizar esta tarefa? (gestor, responsável ou com permissão de visualizar todas) */
export function podeVer(userId: string, task: Task): boolean {
  return userId === GESTOR_ID || task.responsavelId === userId || pode(userId, 'visualizar_todas_tarefas');
}

/** Tarefas que o usuário pode visualizar. */
export function tasksVisiveis(tasks: Task[], userId: string): Task[] {
  return tasks.filter((t) => podeVer(userId, t));
}
```

- [ ] **Step 4: Rodar o teste para ver passar**

Run: `npx vitest run src/utils/permissions.test.ts`
Expected: PASS (7 testes).

- [ ] **Step 5: Commit**

```bash
git add src/utils/permissions.ts src/utils/permissions.test.ts
git commit -m "feat: helper de permissões (pode, podeAlterarStatus, podeVer, tasksVisiveis)"
```

---

### Task 3: Guarda de autorização no reducer (CHANGE_STATUS)

**Files:**
- Modify: `src/context/appReducer.ts`
- Modify: `src/context/AppContext.test.ts`

- [ ] **Step 1: Ajustar 2 testes existentes que assumem "qualquer colaborador altera qualquer tarefa"**

Em `src/context/AppContext.test.ts`, `baseState` tem TA-001 (responsável **joao**, NOVA) e TA-002 (responsável **maria**, CONCLUIDA). Dois testes usam `currentUserId: 'joao'` para alterar TA-002 — com a nova guarda isso deixa de ser permitido. Trocar para `currentUserId: 'maria'` (responsável):

Teste "colaborador reabre CONCLUIDA → EM_EXECUCAO e grava histórico" (linha ~90):

```ts
  it('colaborador reabre CONCLUIDA → EM_EXECUCAO e grava histórico', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'maria' },
      { type: 'CHANGE_STATUS', taskId: 'TA-002', novoStatus: 'EM_EXECUCAO', usuario: 'Maria Souza' }
    );
    const task = next.tasks.find((t) => t.id === 'TA-002')!;
    expect(task.status).toBe('EM_EXECUCAO');
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'CONCLUIDA',
      novoStatus: 'EM_EXECUCAO',
      usuario: 'Maria Souza',
    });
  });
```

Teste "limpa concluidaEm ao reabrir" (linha ~221):

```ts
  it('limpa concluidaEm ao reabrir', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'maria' },
      { type: 'CHANGE_STATUS', taskId: 'TA-002', novoStatus: 'EM_EXECUCAO', usuario: 'Maria Souza' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-002')!.concluidaEm).toBeUndefined();
  });
```

Nota: "colaborador não consegue finalizar tarefa" (joao/TA-002) continua válido — com a guarda, joao não é responsável de TA-002 e o estado permanece CONCLUIDA; e "colaborador recebe NOVA → RECEBIDA" (joao/TA-001) continua válido (joao é responsável de TA-001).

- [ ] **Step 2: Escrever os testes que falham — adicionar ao final de `src/context/AppContext.test.ts`**

Adicionar ao final do arquivo (após o describe `appReducer — TOGGLE_SIDEBAR`):

```ts
describe('appReducer — permissão de alteração de status', () => {
  it('colaborador não altera status de tarefa de outro usuário', () => {
    // TA-002 é de maria; joao não é responsável nem tem permissão
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'CHANGE_STATUS', taskId: 'TA-002', novoStatus: 'EM_EXECUCAO', usuario: 'João Silva' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-002')!.status).toBe('CONCLUIDA');
    expect(next.past).toHaveLength(0);
  });

  it('responsável pode alterar o status da própria tarefa', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'RECEBIDA', usuario: 'João Silva' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('RECEBIDA');
  });

  it('gestor continua podendo aprovar tarefa de qualquer usuário', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-002',
      novoStatus: 'FINALIZADA',
      usuario: 'Carlos Mendes',
    });
    expect(next.tasks.find((t) => t.id === 'TA-002')!.status).toBe('FINALIZADA');
  });
});
```

Nota: `baseState` já usa `TA-001` (responsável joao) e `TA-002` (responsável maria).

- [ ] **Step 3: Rodar para ver falhar**

Run: `npx vitest run src/context/AppContext.test.ts`
Expected: FAIL — "colaborador não altera status de tarefa de outro usuário" (hoje joao alteraria TA-002 para EM_EXECUCAO, pois o guarda de permissão não existe).

- [ ] **Step 4: Implementar a guarda em `src/context/appReducer.ts`**

No topo do arquivo, adicionar import:

```ts
import { podeAlterarStatus } from '../utils/permissions';
```

No caso `CHANGE_STATUS` (linha ~46), inserir a guarda logo após a busca da tarefa, antes do `canTransition`:

```ts
    case 'CHANGE_STATUS': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (!podeAlterarStatus(state.currentUserId, task)) return state;
      if (!canTransition(task.status, action.novoStatus, roleOf(state.currentUserId))) return state;
```

- [ ] **Step 5: Rodar os testes para ver passar**

Run: `npx vitest run src/context/AppContext.test.ts`
Expected: PASS (todos, incluindo os 3 novos e os existentes ajustados).

- [ ] **Step 6: Commit**

```bash
git add src/context/appReducer.ts src/context/AppContext.test.ts
git commit -m "feat: guarda de permissão no CHANGE_STATUS (responsável ou gestor ou permissão)"
```

---

### Task 4: TaskRow — ocultar ações sem permissão

**Files:**
- Modify: `src/components/tasks/TaskRow.tsx`
- Modify: `src/components/tasks/TaskRow.test.tsx`

- [ ] **Step 1: Escrever o teste que falha — adicionar a `src/components/tasks/TaskRow.test.tsx`**

Adicionar ao final do arquivo:

```tsx
describe('TaskRow — permissões', () => {
  it('colaborador não vê ações do ciclo de tarefa de outro usuário', () => {
    // NOVA tem responsavelId 'joao'; maria não é responsável nem tem permissão
    const Harness = switchUser('maria');
    renderWithApp(
      <table>
        <tbody>
          <Harness>
            <TaskRow task={NOVA} onConfirmComplete={() => {}} onDeleteRequest={() => {}} />
          </Harness>
        </tbody>
      </table>
    );
    expect(screen.queryByTitle('Receber')).not.toBeInTheDocument();
  });

  it('colaborador vê ações do ciclo da própria tarefa', () => {
    const Harness = switchUser('joao');
    renderWithApp(
      <table>
        <tbody>
          <Harness>
            <TaskRow task={NOVA} onConfirmComplete={() => {}} onDeleteRequest={() => {}} />
          </Harness>
        </tbody>
      </table>
    );
    expect(screen.getByTitle('Receber')).toBeInTheDocument();
  });

  it('colaborador sem gerenciar_tarefas não vê ações de gestão', () => {
    const Harness = switchUser('maria');
    renderWithApp(
      <table>
        <tbody>
          <Harness>
            <TaskRow task={NOVA} onConfirmComplete={() => {}} onDeleteRequest={() => {}} />
          </Harness>
        </tbody>
      </table>
    );
    expect(screen.queryByTitle('Editar')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Excluir')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run src/components/tasks/TaskRow.test.tsx`
Expected: FAIL — "colaborador não vê ações do ciclo de tarefa de outro usuário" (hoje maria vê "Receber", pois qualquer colaborador pode).

- [ ] **Step 3: Implementar em `src/components/tasks/TaskRow.tsx`**

Trocar imports (linha 13-15):

```ts
import { roleOf, availableTransitions } from '../../utils/status';
import { pode, podeAlterarStatus } from '../../utils/permissions';
```

Dentro do componente, substituir as linhas 49-51:

```tsx
  const role = roleOf(state.currentUserId);
  const responsavel = findUser(task.responsavelId);
  const can = availableTransitions(task.status, role);
  const podeGerenciar = pode(state.currentUserId, 'gerenciar_tarefas');
  const podeAlterar = podeAlterarStatus(state.currentUserId, task);
```

Trocar o bloco `{role === 'gestor' && (` (linha 140) por `{podeGerenciar && (`.

Trocar o bloco `{can.map((target) => {` (linha 178) por:

```tsx
          {podeAlterar && can.map((target) => {
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
```

- [ ] **Step 4: Rodar os testes para ver passar**

Run: `npx vitest run src/components/tasks/TaskRow.test.tsx`
Expected: PASS (todos os testes, incluindo os existentes: gestor vê gestão; joao vê ciclo da própria).

- [ ] **Step 5: Commit**

```bash
git add src/components/tasks/TaskRow.tsx src/components/tasks/TaskRow.test.tsx
git commit -m "feat: TaskRow oculta ações sem permissão (ciclo e gestão)"
```

---

### Task 5: TaskCard + TaskKanban — drag e ações por permissão

**Files:**
- Modify: `src/components/tasks/TaskCard.tsx`
- Modify: `src/components/tasks/TaskKanban.tsx`
- Modify: `src/components/tasks/TaskKanban.test.tsx`

- [ ] **Step 1: Escrever os testes que falham — adicionar a `src/components/tasks/TaskKanban.test.tsx`**

Adicionar ao final do arquivo:

```tsx
describe('TaskKanban — permissões', () => {
  it('colaborador não arrasta nem vê ação de ciclo de tarefa de outro', () => {
    // TA-003 (Criar campanha de e-mail) é de maria; joao não tem permissão
    const Harness = switchUser('joao');
    renderWithApp(
      <Harness>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
      </Harness>
    );

    const card = screen.getByText('Criar campanha de e-mail').closest('div[draggable]');
    expect(card).toBeNull();
    expect(screen.queryByRole('button', { name: /Reabrir/ })).not.toBeInTheDocument();
  });

  it('colaborador arrasta a própria tarefa', () => {
    // TA-005 (Corrigir bug de checkout) é de joao
    const Harness = switchUser('joao');
    renderWithApp(
      <Harness>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
      </Harness>
    );

    const card = screen.getByText('Corrigir bug de checkout').closest('div[draggable]');
    expect(card).not.toBeNull();
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run src/components/tasks/TaskKanban.test.tsx`
Expected: FAIL — "colaborador não arrasta nem vê ação de ciclo de tarefa de outro" (hoje todos os cards são `draggable`).

- [ ] **Step 3: Implementar em `src/components/tasks/TaskCard.tsx`**

Trocar imports (linha 5-7):

```ts
import { roleOf, availableTransitions } from '../../utils/status';
import { podeAlterarStatus } from '../../utils/permissions';
```

Dentro do componente, substituir linhas 27-29:

```tsx
  const role = roleOf(state.currentUserId);
  const responsavel = findUser(task.responsavelId);
  const can = availableTransitions(task.status, role);
  const podeAlterar = podeAlterarStatus(state.currentUserId, task);
```

Trocar o `div` raiz (linhas 49-54) para draggable condicional:

```tsx
    <div
      draggable={podeAlterar}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`w-full rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
        podeAlterar ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
    >
```

Trocar o botão de ação (linhas 90-99):

```tsx
          {podeAlterar && action && (
            <button
              onClick={() => changeStatus(action.target)}
              title={action.label}
              aria-label={action.label}
              className={`rounded-lg p-1.5 transition-colors ${action.cls}`}
            >
              <action.icon className="h-4 w-4" />
            </button>
          )}
```

- [ ] **Step 4: Implementar em `src/components/tasks/TaskKanban.tsx`**

Trocar import (linha 5):

```ts
import { roleOf } from '../../utils/status';
import { podeAlterarStatus } from '../../utils/permissions';
```

Substituir `canDropOn` (linha 54-55):

```tsx
  const canDropOn = (status: TaskStatus): boolean => {
    if (!dragInfo) return true;
    const dragged = state.tasks.find((t) => t.id === dragInfo.id);
    if (!dragged) return false;
    return podeAlterarStatus(state.currentUserId, dragged) && canTransition(dragInfo.status, status, role);
  };
```

Substituir o bloco do `handleDrop` (linhas 69-71):

```tsx
    const dragged = state.tasks.find((t) => t.id === taskId);
    if (!dragged || dragged.status === status) return;
    if (!podeAlterarStatus(state.currentUserId, dragged)) return;
    if (!canTransition(dragged.status, status, role)) return;
```

- [ ] **Step 5: Rodar os testes para ver passar**

Run: `npx vitest run src/components/tasks/TaskKanban.test.tsx`
Expected: PASS. Nota: o teste existente "drop inválido como colaborador para FINALIZADA não altera o status" usa joao arrastando TA-003 (de maria) — verificar se continua válido; se o card não for mais draggable, ajustar esse teste para usar TA-005 (de joao) arrastando para a coluna Finalizada (transição de papel inválida):

```tsx
  it('drop inválido como colaborador para FINALIZADA não altera o status', async () => {
    const taskId = 'TA-005'
    const Harness = switchUser('joao')
    renderWithApp(
      <Harness>
        <TaskKanban tasks={TAREFAS} totalCount={TAREFAS.length} onConfirmComplete={() => {}} />
        <Probe id={taskId} />
      </Harness>
    )

    const card = screen.getByText('Corrigir bug de checkout').closest('div[draggable]')!
    const column = screen.getAllByText('Finalizada')[0].closest('div[class*="min-w-"]')!

    fireEvent.dragStart(card, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } })
    fireEvent.dragOver(column, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() })
    fireEvent.drop(column, { dataTransfer: { getData: () => taskId } })

    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('NOVA'))
  })
```

(TA-005 é NOVA e de joao; NOVA→FINALIZADA é transição inválida para colaborador.)

- [ ] **Step 6: Commit**

```bash
git add src/components/tasks/TaskCard.tsx src/components/tasks/TaskKanban.tsx src/components/tasks/TaskKanban.test.tsx
git commit -m "feat: TaskCard/TaskKanban restringem drag e ações por permissão"
```

---

### Task 6: TaskDetailModal — botões por permissão

**Files:**
- Modify: `src/components/modals/TaskDetailModal.tsx`
- Modify: `src/components/modals/TaskDetailModal.test.tsx`

- [ ] **Step 1: Escrever o teste que falha — adicionar a `src/components/modals/TaskDetailModal.test.tsx`**

Adicionar ao final do arquivo:

```tsx
describe('TaskDetailModal — permissões', () => {
  it('colaborador não vê ações de ciclo de tarefa de outro usuário', () => {
    // TA-003 (CONCLUIDA) é de maria; joao não é responsável nem tem permissão
    renderWithApp(<TaskDetailModal taskId="TA-003" onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Reabrir tarefa' })).not.toBeInTheDocument();
  });

  it('colaborador responsável vê as ações de ciclo da própria tarefa', () => {
    const Harness = switchUser('maria');
    renderWithApp(
      <Harness>
        <TaskDetailModal taskId="TA-003" onClose={() => {}} />
      </Harness>
    );
    expect(screen.getByRole('button', { name: 'Reabrir tarefa' })).toBeInTheDocument();
  });

  it('colaborador não vê ações de gestão (editar, excluir, etc.)', () => {
    renderWithApp(<TaskDetailModal taskId="TA-003" onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
  });
});
```

Ajustar o teste existente "colaborador em CONCLUIDA vê Reabrir, não Aprovar" (linhas 33-42): ele usa `switchUser('joao')` com TA-003 (de maria) — trocar para `switchUser('maria')`:

```tsx
  it('colaborador em CONCLUIDA vê Reabrir, não Aprovar', () => {
    const Harness = switchUser('maria');
    renderWithApp(
      <Harness>
        <TaskDetailModal taskId="TA-003" onClose={() => {}} />
      </Harness>
    );
    expect(screen.getByRole('button', { name: 'Reabrir tarefa' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprovar e finalizar' })).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run src/components/modals/TaskDetailModal.test.tsx`
Expected: FAIL — "colaborador não vê ações de ciclo de tarefa de outro usuário" (hoje joao veria Reabrir).

- [ ] **Step 3: Implementar em `src/components/modals/TaskDetailModal.tsx`**

Trocar import (linha 6-7):

```ts
import { availableTransitions } from '../../utils/status';
import { pode, podeAlterarStatus } from '../../utils/permissions';
```

Dentro do componente, após `const can = availableTransitions(...)` (linha 32), adicionar:

```tsx
  const podeGerenciar = pode(state.currentUserId, 'gerenciar_tarefas');
  const podeAlterar = podeAlterarStatus(state.currentUserId, task);
```

Trocar `{role === 'gestor' && (` (linha 60) por `{podeGerenciar && (`.

Envolver cada botão de ciclo com `podeAlterar`:
- linha 98: `{can.includes('RECEBIDA') && (` → `{podeAlterar && can.includes('RECEBIDA') && (`
- linha 103: `{can.includes('EM_EXECUCAO') && task.status === 'RECEBIDA' && (` → `{podeAlterar && can.includes('EM_EXECUCAO') && task.status === 'RECEBIDA' && (`
- linha 108: `{task.status === 'DEVOLVIDA' && role === 'colaborador' && (` → `{podeAlterar && task.status === 'DEVOLVIDA' && role === 'colaborador' && (`
- linha 113: `{task.status === 'CONCLUIDA' && role === 'colaborador' && (` → `{podeAlterar && task.status === 'CONCLUIDA' && role === 'colaborador' && (`
- linha 118: `{can.includes('CONCLUIDA') && (` → `{podeAlterar && can.includes('CONCLUIDA') && (`

Os botões Aprovar/Devolver (linhas 123-138) ficam dentro de `{task.status === 'CONCLUIDA' && role === 'gestor' && (` — manter como está (gestor mantém todas as permissões).

- [ ] **Step 4: Rodar os testes para ver passar**

Run: `npx vitest run src/components/modals/TaskDetailModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/modals/TaskDetailModal.tsx src/components/modals/TaskDetailModal.test.tsx
git commit -m "feat: TaskDetailModal oculta ações sem permissão"
```

---

### Task 7: Topbar — botão "Nova Tarefa" por permissão

**Files:**
- Modify: `src/components/layout/Topbar.tsx`
- Create: `src/components/layout/Topbar.test.tsx`

- [ ] **Step 1: Escrever o teste que falha — `src/components/layout/Topbar.test.tsx`**

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { useEffect, useRef, type ReactNode } from 'react';
import Topbar from './Topbar';
import { renderWithApp } from '../../test/renderWithApp';
import { useApp } from '../../context/AppContext';

function switchUser(userId: string) {
  function Harness({ children }: { children: ReactNode }) {
    const { dispatch } = useApp();
    const dispatched = useRef(false);
    useEffect(() => {
      if (!dispatched.current) {
        dispatched.current = true;
        dispatch({ type: 'SET_CURRENT_USER', userId });
      }
    }, [dispatch, userId]);
    return <>{children}</>;
  }
  return Harness;
}

beforeEach(() => localStorage.clear());

describe('Topbar — Nova Tarefa por permissão', () => {
  it('gestor vê o botão Nova Tarefa', () => {
    renderWithApp(
      <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
    );
    expect(screen.getByRole('button', { name: /Nova Tarefa/ })).toBeInTheDocument();
  });

  it('colaborador sem criar_tarefas não vê o botão Nova Tarefa', () => {
    const Harness = switchUser('joao');
    renderWithApp(
      <Harness>
        <Topbar title="Tarefas" search="" onSearch={() => {}} onNewTask={() => {}} />
      </Harness>
    );
    expect(screen.queryByRole('button', { name: /Nova Tarefa/ })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run src/components/layout/Topbar.test.tsx`
Expected: FAIL — "colaborador sem criar_tarefas não vê o botão Nova Tarefa" (hoje o botão é visível para todos).

- [ ] **Step 3: Implementar em `src/components/layout/Topbar.tsx`**

Adicionar import:

```ts
import { pode } from '../../utils/permissions';
```

Em `const { dispatch } = useApp();` (linha 12), trocar para:

```tsx
  const { state, dispatch } = useApp();
  const podeCriar = pode(state.currentUserId, 'criar_tarefas');
```

Envolver o botão "Nova Tarefa" (linhas 37-43):

```tsx
        {podeCriar && (
          <button
            onClick={onNewTask}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Tarefa</span>
          </button>
        )}
```

- [ ] **Step 4: Rodar os testes para ver passar**

Run: `npx vitest run src/components/layout/Topbar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Topbar.tsx src/components/layout/Topbar.test.tsx
git commit -m "feat: botão Nova Tarefa visível apenas com permissão criar_tarefas"
```

---

### Task 8: Visualização — seções usam tasksVisiveis

**Files:**
- Modify: `src/components/sections/SectionTarefas.tsx`
- Modify: `src/components/sections/SectionVisaoGeral.tsx`
- Modify: `src/components/sections/SectionColaboradores.tsx` (via CollaboratorCard)
- Modify: `src/components/collaborators/CollaboratorCard.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Implementar em `src/components/sections/SectionTarefas.tsx`**

Adicionar import:

```ts
import { tasksVisiveis } from '../../utils/permissions';
```

Substituir as linhas 22-26:

```tsx
  const visiveis = useMemo(
    () => tasksVisiveis(state.tasks, state.currentUserId),
    [state.tasks, state.currentUserId]
  );
  const visibleTasks = useMemo(
    () => filterTasks(visiveis, state.filters, NOME_POR_ID),
    [visiveis, state.filters]
  );
  const indicators = useMemo(() => computeIndicators(visiveis), [visiveis]);
```

- [ ] **Step 2: Implementar em `src/components/sections/SectionVisaoGeral.tsx`**

Adicionar import:

```ts
import { tasksVisiveis } from '../../utils/permissions';
```

Substituir as linhas 10-23:

```tsx
export default function SectionVisaoGeral() {
  const { state } = useApp();
  const visiveis = useMemo(
    () => tasksVisiveis(state.tasks, state.currentUserId),
    [state.tasks, state.currentUserId]
  );
  const indicators = useMemo(() => computeIndicators(visiveis), [visiveis]);
  const atrasadas = useMemo(
    () => filterTasks(visiveis, { ...EMPTY_FILTERS, prazo: 'vencidas' }, NOME_POR_ID).slice(0, 5),
    [visiveis]
  );
  const proximas = useMemo(
    () =>
      visiveis
        .filter((t) => t.prazo !== null && t.status !== 'FINALIZADA' && t.status !== 'CONCLUIDA')
        .sort((a, b) => (a.prazo ?? '').localeCompare(b.prazo ?? ''))
        .slice(0, 5),
    [visiveis]
  );
```

- [ ] **Step 3: Implementar em `src/components/collaborators/CollaboratorCard.tsx`**

Adicionar import:

```ts
import { tasksVisiveis } from '../../utils/permissions';
```

Substituir a linha 9:

```tsx
  const m = colaboradorMetrics(colaborador.id, tasksVisiveis(state.tasks, state.currentUserId));
```

- [ ] **Step 4: Implementar em `src/components/layout/Sidebar.tsx`**

Adicionar import:

```ts
import { tasksVisiveis } from '../../utils/permissions';
```

Substituir a linha 136:

```tsx
            const metrics = colaboradorMetrics(c.id, tasksVisiveis(state.tasks, state.currentUserId));
```

- [ ] **Step 5: Rodar a suíte completa e o build**

Run: `npm test`
Expected: todos os testes passam (o seed preserva o comportamento — todos os colaboradores veem tudo).

Run: `npm run build`
Expected: `tsc && vite build` sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/SectionTarefas.tsx src/components/sections/SectionVisaoGeral.tsx src/components/collaborators/CollaboratorCard.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: visualização filtrada por permissão (tasksVisiveis nas seções)"
```

---

### Task 9: Verificação final

- [ ] **Step 1: Suíte completa**

Run: `npm test`
Expected: 16 arquivos passando (146 existentes + novos: permissions, Topbar, 3 novos no AppContext, 3 no TaskRow, 2 no Kanban, 3 no DetailModal).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: sem erros.

- [ ] **Step 3: Revisão de regressão da exceção do gestor**

Verificar manualmente nos testes existentes que seguem passando: "gestor vê Editar, Duplicar e Excluir" (TaskRow), "gestor em CONCLUIDA vê Aprovar e Devolver" (DetailModal), "drop válido como gestor dispara CHANGE_STATUS" (Kanban), "gestor devolve CONCLUIDA → DEVOLVIDA" (AppContext). Gestor mantém todas as permissões atuais.
