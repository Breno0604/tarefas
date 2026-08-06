# Design — Perfis e Permissões (fundação da gestão de usuários)

Data: 2026-08-06
Status: Aprovado

## 1. Objetivo

Substituir o modelo atual de permissões (papel fixo `gestor`/`colaborador` derivado do id e 4 permissões
individuais) por um modelo de **4 perfis prontos** com permissões padrão, seguindo a matriz da seção 4.1
do `ideia.md`. Esta é a fundação para as fases seguintes (cadastro, login, edição e desativação de usuários).

Escopo desta fase: **tipos, definição de perfis, motor de permissões, transições, reducer, gates de UI,
seed/migração e testes**. Não inclui cadastro, login, edição, desativação nem persistência de usuários.

## 2. Modelo de dados — `src/types.ts`

```ts
export type Perfil = 'administrador' | 'gestor_equipe' | 'colaborador' | 'consulta';

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

- `Colaborador` ganha `perfil: Perfil` (obrigatório).
- `permissoes?: Permission[]` passa a ter semântica de **override**: ausente = usa as permissões padrão
  do perfil; presente = lista efetiva completa.
- O tipo `Role` (`'gestor' | 'colaborador'`) e a função `roleOf` **deixam de existir**.
- `gerenciar_tarefas` é renomeado para `editar_tarefas` e perde a reatribuição (vira `reatribuir`).

## 3. Definição de Perfis — novo `src/utils/perfis.ts`

```ts
export interface PerfilDef {
  id: Perfil;
  label: string;       // ex.: "Administrador"
  descricao: string;   // ex.: "Acesso total, inclui ciclo de execução em qualquer tarefa"
  permissoesPadrao: Permission[];
}
export const PERFIS: Record<Perfil, PerfilDef>;
export const PERFIL_IDS: Perfil[];
export function permissoesPadraoDe(perfil: Perfil): Permission[];
```

Matriz de permissões padrão (✅ = tem por padrão):

| Permissão | Administrador | Gestor de equipe | Colaborador | Consulta |
|---|---|---|---|---|
| visualizar_todas_tarefas | ✅ | ✅ | — | — |
| executar_ciclo | ✅ | ✅ | ✅ | — |
| alterar_status_outros | ✅ | — | — | — |
| criar_tarefas | ✅ | — | — | — |
| editar_tarefas | ✅ | — | — | — |
| reatribuir | ✅ | ✅ | — | — |
| aprovar_tarefas | ✅ | ✅ | — | — |
| gerenciar_usuarios | ✅ | — | — | — |

Rótulos:
- **Administrador** = "Acesso total" — inclui executar o ciclo em qualquer tarefa (muda o comportamento
  atual: o gestor fixo hoje não executa o ciclo comum).
- **Gestor de equipe** = "Aprova e organiza" — vê tudo, aprova/devolve/cancela/reabre aprovação e reatribui;
  não edita/exclui e não gerencia usuários por padrão.
- **Colaborador** = "Executa o próprio trabalho" — vê e avança as próprias tarefas.
- **Consulta** = "Somente leitura" — nenhuma ação de mudança.

Favoritar e reordenar permanecem livres para todos (sem permissão).

## 4. Motor de permissões — `src/utils/permissions.ts`

- `permissoesDe(userId): Permission[]` — resolve via `findUser`:
  `user.permissoes ?? permissoesPadraoDe(user.perfil)`; id desconhecido → `[]`.
  **Remove o caso especial do `GESTOR_ID`** (carlos vira Administrador pela migração).
- `pode(userId, perm): boolean` — `permissoesDe(userId).includes(perm)`.
- `podeExecutarCicloEm(userId, task): boolean` — própria: `executar_ciclo`; de outros: `alterar_status_outros`.
- `podeReabrir(userId, task): boolean` — própria: `executar_ciclo` (retomar); de outro: `aprovar_tarefas`
  (reabrir aprovação).
- `podeAlterarStatusPara(userId, task, novoStatus): boolean` — resolve o `TransicaoKind` da transição e
  aplica a permissão correspondente (`ciclo` → `podeExecutarCicloEm`; `reabrir` → `podeReabrir`;
  `aprovacao` → `pode(userId, 'aprovar_tarefas')`).
- `podeVer(userId, task): boolean` — `task.responsavelId === userId || pode(userId, 'visualizar_todas_tarefas')`.
- `tasksVisiveis(tasks, userId): Task[]` — `tasks.filter((t) => podeVer(userId, t))`.
- `podeAlterarStatus` **some** (substituído por `podeExecutarCicloEm`).

## 5. Transições — `src/utils/status.ts`

```ts
export type TransicaoKind = 'ciclo' | 'reabrir' | 'aprovacao';
```

- `TRANSITIONS` deixa de ter `role` e ganha `kind`. São 12 arestas distintas (as mesmas do ciclo atual,
  com `CONCLUIDA→EM_EXECUCAO` unificada — hoje há uma entrada para reabrir e outra para o gestor):

| Transição | kind |
|---|---|
| NOVA→RECEBIDA · RECEBIDA→EM_EXECUCAO · EM_EXECUCAO→CONCLUIDA · DEVOLVIDA→EM_EXECUCAO | `ciclo` |
| CONCLUIDA→EM_EXECUCAO | `reabrir` |
| CONCLUIDA→FINALIZADA · CONCLUIDA→DEVOLVIDA · FINALIZADA→EM_EXECUCAO · NOVA/RECEBIDA/EM_EXECUCAO/DEVOLVIDA→CANCELADA | `aprovacao` |

- `transicaoKind(from, to): TransicaoKind | null`.
- `canTransition(from, to): boolean` — checagem de existência (sem role).
- `transicoesDisponiveis(status): TaskStatus[]` — todos os alvos válidos; o filtro por permissão fica na
  UI/reducer (`podeAlterarStatusPara`).
- `podeReatribuir(status)` e `proximoPasso(status)` permanecem (o badge "aguardando gestor" é conceito de
  fluxo, não de permissão).
- Remove `roleOf`, `availableTransitions(status, role)` e o tipo `Role`.

## 6. Reducer — `src/context/appReducer.ts`

| Ação | Guarda |
|---|---|
| `CHANGE_STATUS` | `canTransition(task.status, novoStatus)` **e** `podeAlterarStatusPara(currentUserId, task, novoStatus)` |
| `REASSIGN` | `pode(currentUserId, 'reatribuir')` e `podeReatribuir(task.status)` |
| `UPDATE_TASK` | `pode(currentUserId, 'editar_tarefas')` |
| `DUPLICATE_TASK` | `pode(currentUserId, 'editar_tarefas')` |
| `DELETE_TASK` | `pode(currentUserId, 'editar_tarefas')` |
| `CREATE_TASK` | sem guarda nova (gated na UI por `criar_tarefas`), como hoje |

## 7. UI — gates de permissão

| Componente | Mudança |
|---|---|
| `TaskRow` | Editar/Duplicar/Excluir → `editar_tarefas`; Reatribuir → `reatribuir`; ciclo via `transicoesDisponiveis` + `podeAlterarStatusPara`; remove `roleOf`/`availableTransitions` |
| `TaskCard` | `podeAlterarStatus` → `podeExecutarCicloEm`; remove role |
| `TaskKanban` | `canTransition(…, role)` → `canTransition(from, to)`; mantém `podeAlterarStatusPara` |
| `TaskDetailModal` | `gerenciar_tarefas` → `editar_tarefas`/`reatribuir`; `podeAlterarStatus` → `podeExecutarCicloEm`; aprovar via `aprovar_tarefas` |
| `Topbar` | sem mudança (`criar_tarefas`) |
| `FilterBar`/`TaskFormModal`/`ReassignModal` | sem mudança (usuários ainda estáticos nesta fase) |

## 8. Seed e migração — `src/data/mockData.ts`

- `carlos` → `perfil: 'administrador'`, sem override (⇒ 8 permissões pelas padrão).
- Os 5 colaboradores → `perfil: 'colaborador'`, sem override (⇒ perdem `visualizar_todas_tarefas`;
  passam a ver apenas as próprias tarefas — migração da seção 10 do `ideia.md`).
- `GESTOR_ID` permanece exportado (id do carlos, usado pelo gerador de seed), mas **não** confere
  permissões por construção.

## 9. Testes

- `permissions.test.ts` → reescrito: resolução por perfil (padrão/override/desconhecido), matriz dos 4
  perfis, `podeExecutarCicloEm`, `podeReabrir` (própria × de outros), `podeAlterarStatusPara`, `podeVer`/
  `tasksVisiveis`.
- `status.test.ts` → reescrito: `canTransition` sem role, `transicaoKind`, `transicoesDisponiveis`;
  mantém `podeReatribuir`/`proximoPasso`.
- `AppContext.test.ts` → ajustes: bases de estado e casos usam as novas permissões (ex.: 'joao'
  colaborador não edita/exclui/reatribui; 'lucas' mockado com `editar_tarefas`/`reatribuir` para gestão).
- `TaskRow.permissions.test.tsx` e `TaskDetailModal.test.tsx` → mocks de `findUser` passam a ser por
  perfil/permissões.
- Demais testes (Sidebar, kanban, undo, storage, form modais) → ajustes pontuais se um gate mudar de nome.

## 10. Comportamento resultante

- Administrador executa o ciclo em qualquer tarefa (novo, versus gestor fixo de hoje).
- Gestor de equipe aprova/devolve/cancela/reabre aprovação e reatribui, mas não edita/exclui nem gerencia
  usuários.
- Colaborador avança apenas as próprias tarefas e não vê as de outros (mudança de comportamento dos 5 do
  seed, conforme migração aprovada).
- Consulta apenas visualiza as próprias tarefas (e todas, se ganhar `visualizar_todas_tarefas` por ajuste).

## 11. Fora de escopo (fases futuras)

- Cadastro de usuários pelo gestor (3.2).
- Login/senha e sessão (3.1).
- Ajuste em tela de perfil/permissões com caixas de seleção e registro de mudanças (3.3 UI).
- Edição de dados de usuário (3.4), desativação (3.5) e regras de tarefas de quem sai (3.6).
- Persistência de usuários em localStorage.
