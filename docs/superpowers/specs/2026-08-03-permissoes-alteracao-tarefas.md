# Design — Permissões de alteração de tarefas

Data: 2026-08-03
Status: Aprovado

## 1. Objetivo

Controlar quem pode alterar o ciclo/status das tarefas. O responsável pode avançar/retroceder
o status da própria tarefa; demais usuários só podem com permissão específica. Gestor mantém
todas as permissões atuais, sem restrição.

## 2. Modelo de permissões

### 2.1 Tipo Permission — `src/types.ts`

```ts
export type Permission =
  | 'alterar_status_outros' // avançar/retroceder status de tarefas de outros usuários
  | 'visualizar_todas_tarefas' // ver tarefas de todos (sem isso, só as próprias)
  | 'criar_tarefas' // botão "Nova Tarefa"
  | 'gerenciar_tarefas'; // editar, excluir, duplicar, reatribuir tarefas de qualquer um
```

### 2.2 Colaborador — `src/data/mockData.ts`

- `Colaborador` ganha `permissoes?: Permission[]`.
- Seed: os 5 colaboradores recebem `permissoes: ['visualizar_todas_tarefas']`.
- Gestor (`carlos`): não declara permissões — o papel de gestor implica **todas** (regra garantida
  no código, imune a erro de seed).

### 2.3 Helper — novo `src/utils/permissions.ts`

- `permissoesDe(userId: string): Permission[]` — gestor → todas as permissões; senão, lê do mockData (padrão `[]`).
- `pode(userId: string, perm: Permission): boolean` — gestor → `true`; senão `permissoesDe(userId).includes(perm)`.
- `podeAlterarStatus(userId: string, task: Task): boolean` — gestor **ou** `task.responsavelId === userId` **ou** `pode(userId, 'alterar_status_outros')`.
- `podeVer(userId: string, task: Task): boolean` — gestor **ou** `task.responsavelId === userId` **ou** `pode(userId, 'visualizar_todas_tarefas')`.
- `tasksVisiveis(tasks: Task[], userId: string): Task[]` — `tasks.filter((t) => podeVer(userId, t))`.

## 3. Guarda no reducer (autorização real)

`CHANGE_STATUS` em `src/context/appReducer.ts`:

- Nova guarda: se `!podeAlterarStatus(state.currentUserId, task)` → retorna o estado inalterado
  (sem mutação, sem histórico, sem entrada de undo).
- `canTransition` permanece: define as transições válidas do ciclo por papel.
- Gestor inalterado: `podeAlterarStatus` retorna `true` por construção; transições de gestor
  (CONCLUIDA→FINALIZADA, CONCLUIDA→DEVOLVIDA) continuam idênticas.

## 4. UI — ocultar/desabilitar conforme permissão

- `TaskRow` (`src/components/tasks/TaskRow.tsx`):
  - Botões de ciclo (`can.map`) só renderizam se `podeAlterarStatus(state.currentUserId, task)`.
  - Ações de gestão (editar, reatribuir, duplicar, excluir) passam de `role === 'gestor'` para
    `pode(state.currentUserId, 'gerenciar_tarefas')` — resultado idêntico hoje (só gestor tem).
- `TaskKanban` (`src/components/tasks/TaskKanban.tsx`):
  - `TaskCard` só é `draggable` se `podeAlterarStatus` na tarefa arrastada.
  - `canDropOn`/`handleDrop` também checam `podeAlterarStatus` (dupla verificação com `canTransition`).
- `TaskDetailModal` (`src/components/modals/TaskDetailModal.tsx`):
  - Botões de ciclo e aprovar/devolver conforme `podeAlterarStatus`.
  - Editar, reatribuir, duplicar, excluir conforme `gerenciar_tarefas`.
- `Topbar` (`src/components/layout/Topbar.tsx`): botão "Nova Tarefa" só renderiza se
  `pode(state.currentUserId, 'criar_tarefas')`. Colaboradores do seed não têm → só gestor cria.
- Visualização (badges, CycleStepper, detalhes) permanece disponível para quem pode ver.

## 5. Visualização

- Seções Tarefas (tabela/kanban + KPIs) e Visão Geral passam a usar `tasksVisiveis(state.tasks, state.currentUserId)`.
- Seed: todos têm `visualizar_todas_tarefas` → comportamento atual preservado integralmente.
- Seção Colaboradores: lista de pessoas inalterada; métricas usam tarefas visíveis (mesmo resultado hoje).

## 6. Testes

- Novo `src/utils/permissions.test.ts`:
  - gestor tem todas as permissões;
  - responsável pode alterar o status da própria tarefa;
  - não-responsável sem permissão não pode;
  - `alterar_status_outros` habilita alteração de tarefas de outros;
  - `tasksVisiveis` filtra corretamente; seed preserva comportamento.
- `src/context/AppContext.test.ts`: CHANGE_STATUS de outro usuário sem permissão → estado inalterado;
  com `alterar_status_outros` → altera.
- `TaskRow.test.tsx`: botões de ciclo ocultos para tarefa de outro; ações de gestão conforme permissão.
- `TaskDetailModal.test.tsx`: botões conforme permissão.
- `TaskKanban.test.tsx`: drag desabilitado para tarefa de outro.
- `Topbar` (novo teste ou existente): "Nova Tarefa" oculto para colaborador sem `criar_tarefas`.

## 7. Fora de escopo

- Não criar UI de administração de permissões (estático no mockData).
- Não alterar regras de transição do ciclo (`TRANSITIONS`).
- Não restringir nenhuma permissão atual do gestor.
