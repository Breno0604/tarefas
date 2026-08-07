# Design — App de Tarefas Pessoal (usuário único)

Data: 2026-08-06
Status: Aprovado

## 1. Objetivo

Converter a aplicação de um sistema multiusuário (colaboradores, perfis, permissões, seletor de
sessão) em um **app pessoal de tarefas, de usuário único**. Remover toda a camada multiusuário e
simplificar o fluxo de trabalho para um modelo GTD enxuto, mantendo os recursos de organização de
tarefas já existentes.

Decisão de projeto do usuário: "Eu serei o único usuário da aplicação. A aplicação se tornará algo
pessoal."

## 2. Decisões (registradas em 06/08)

| Tema | Decisão |
|---|---|
| Modelo | Simplificar para pessoal puro — remover conceito de responsável |
| Campo responsável | Remover `responsavelId` (e `criadorId`) |
| Fluxo de status | GTD: Caixa de entrada → A fazer → Em andamento → Concluída (+ Cancelada), com migração |
| Recursos mantidos | Prioridade, Prazo, Categorias/tags, Favoritas, Histórico, KPIs |
| Partes multiusuário | Remover seção Colaboradores, seletor de usuário e permissões |
| Filtros | Remover responsável, paradas e retrabalho; manter busca, status, prioridade, prazo, favoritas, categorias, ordenação |
| Visões | Manter lista e quadro (kanban); remover Visão Geral; KPIs passam para o topo de Tarefas |
| Navegação | Sidebar só com Tarefas |
| Histórico | Sem campo autor |
| Badge | Remover "Próximo passo" |
| Dados persistidos | Limpar e recomeçar (bump de versão do storage + seed novo) |
| Fase anterior | Descartar Perfis e Permissões (docs + branch `traycer/perfis-permissoes`) |

## 3. Modelo de dados — `src/types.ts`

```ts
export type TaskStatus =
  | 'CAIXA_ENTRADA'
  | 'A_FAZER'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA';
```

- `Task` **perde** `responsavelId` e `criadorId`.
- `HistoryEntry` **perde** `usuario`.
- Removidos: `Role`, `Permission`, `Colaborador`, `Section` (navegação fixa em Tarefas).
- `Filters` perde `responsavel`, `paradas`, `comRetrabalho`.

## 4. Fluxo de status — `src/utils/status.ts`

```
CAIXA_ENTRADA → A_FAZER → EM_ANDAMENTO → CONCLUIDA
      └────────────┬───────────┴──────────┘
                   ↓
      CANCELADA (a partir de qualquer status não-terminal)
      CONCLUIDA → EM_ANDAMENTO (retomar)
```

- `TRANSITIONS` sem `kind` nem `role`; `canTransition(from, to)` puramente estrutural.
- `transicoesDisponiveis(status)` mantém.
- Removidos: `podeReatribuir`, `proximoPasso`, `TransicaoKind`, `transicaoKind`.

## 5. Estado e reducer — `src/context/*`

- `AppState` perde `currentUserId` e `section`.
- Removidas as ações `SET_CURRENT_USER` e `REASSIGN`.
- Guards de permissão removidos de `UPDATE_TASK`, `DUPLICATE_TASK`, `DELETE_TASK`, `CHANGE_STATUS`.
- Ações `UPDATE_TASK`, `CHANGE_STATUS`, `DUPLICATE_TASK` perdem o campo `usuario`.
- `CHANGE_STATUS` passa a validar apenas `canTransition(task.status, novoStatus)` (e motivo para CANCELADA).

## 6. Persistência e seed

- `src/services/storage.ts` / `LocalStorageProvider.ts`: **bump de versão** invalida dados antigos
  (recomeço limpo); `isTask` deixa de validar `responsavelId`/`criadorId`.
- `src/data/mockData.ts`: remove `GESTOR`, `COLABORADORES`, `ALL_USERS`, `GESTOR_ID`, `findUser`.
- `src/utils/seedGenerator.ts`: gera tarefas nos novos status, sem responsável/criador.
- `src/utils/permissions.ts` e `src/utils/perfis.ts` (se existirem) são removidos.

## 7. Interface

**Removidos:**
- `SectionVisaoGeral.tsx`, `SectionColaboradores.tsx`
- `CollaboratorCard.tsx`, `CollaboratorDetailModal.tsx`
- `ReassignModal.tsx`, `ApproveModal.tsx`, `ReturnModal.tsx`
- `ProximoPassoBadge.tsx`, `ReworkBadge.tsx`
- Seletor de usuário / bloco "Usuário atual" / lista de colaboradores na `Sidebar`

**Ajustados:**
- `KPICards` passa a ser renderizado no topo de `SectionTarefas`.
- `Sidebar` mantém apenas a navegação para Tarefas.
- `Topbar`: botão "+" sempre visível (sem gate de permissão).
- `FilterBar`: remove filtros responsável, paradas e comRetrabalho.
- `TaskRow`, `TaskCard`, `TaskKanban`, `TaskDetailModal`: sem gates de permissão, sem exibição de
  responsável, sem ações de aprovar/devolver/reatribuir; transições novas.
- `TaskFormModal`: remove o campo de responsável.
- `HistoryModal`: remove a coluna/indicação de autor.
- `CancelModal` mantém (motivo obrigatório para CANCELADA).
- `App.tsx`: remove seções e modais removidos; roteiro fixo em Tarefas.

## 8. Testes

- `permissions.test.ts`, `perfis.test.ts`, `mockData.test.ts` (se criados) → removidos.
- `status.test.ts` → reescrito para o novo fluxo GTD.
- `AppContext.test.ts` → casos de permissão removidos/reescritos.
- Testes de componentes (TaskRow, TaskKanban, TaskDetailModal, Sidebar, Topbar, FilterBar, KPIs,
  form modais) → ajustados para o modelo pessoal.
- Novo seed testado por `storage.test.ts`/`mockData.test.ts` conforme necessário.

## 9. Comportamento resultante

- Toda tarefa é do usuário único; nenhuma ação é bloqueada por permissão.
- Fluxo linear GTD com retomar (CONCLUIDA → EM_ANDAMENTO) e cancelamento motivado.
- KPIs refletem o conjunto todo de tarefas (sem filtro por responsável).
- Nenhuma referência a colaboradores, usuário atual, perfil ou permissão permanece.

## 10. Fora de escopo

- Login/senha, sessão e persistência de usuário (não fazem mais sentido).
- Perfis e permissões.
- Qualquer conceito multiusuário (times, atribuição, reatribuição, aprovação por terceiros).
