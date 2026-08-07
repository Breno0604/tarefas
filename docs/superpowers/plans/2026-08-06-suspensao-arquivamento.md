# Plano: SUSPENSA, ARQUIVADA (ex-CANCELADA), motivo obrigatório, edição de itens e histórico completo

Data: 06/08/2026 · Decisões do usuário: ação **Arquivar/Arquivada** (coerente) · retorno de ARQUIVADA → **Caixa de entrada** · suspensão **A_FAZER/EM_ANDAMENTO → SUSPENSA → A_FAZER** · **exclusão definitiva atual** mantida (entrada registrada no histórico antes da remoção).

## 1. Novo status SUSPENSA

- `TaskStatus` ganha `'SUSPENSA'` (e `'ARQUIVADA'` no lugar de `'CANCELADA'`).
- Transições: `A_FAZER → SUSPENSA`, `EM_ANDAMENTO → SUSPENSA`; retorno `SUSPENSA → A_FAZER`; também `SUSPENSA → ARQUIVADA`.
- Ao suspender: `CHANGE_STATUS { novoStatus: 'SUSPENSA', retornoEm?: string | null }` — `retornoEm` = data 'YYYY-MM-DD' ou `null` (sem prazo definido).
- Tarefa guarda `retornoEm`; histórico registra observação `"Suspensa; retorno previsto em YYYY-MM-DD"` ou `"Suspensa sem prazo definido de retorno."`. Ao sair de SUSPENSA, `retornoEm` é limpo.
- UI: novo **SuspendModal** (modal `{ type: 'suspend' }`) com opções "Com data de retorno" (input de data obrigatório) / "Sem prazo definido para retorno". Ações do ciclo: botão **Suspender** (A_FAZER/EM_ANDAMENTO) e **Reativar** (SUSPENSA → A_FAZER). Badge "Suspensa" + chip de retorno no stepper/detalhes/linha/card.
- `isOverdue` não marca SUSPENSA como atrasada (está parada).

## 2. CANCELADA → ARQUIVADA com retorno

- Renomear status/labels/estilos/mensagens/tests de `CANCELADA`/`Cancelada`/`canceladas` → `ARQUIVADA`/`Arquivada`/`arquivadas`.
- Transições de arquivamento (exigem motivo): `CAIXA_ENTRADA/A_FAZER/EM_ANDAMENTO/SUSPENSA → ARQUIVADA`.
- **Desarquivar**: `ARQUIVADA → CAIXA_ENTRADA` (label "Desarquivar"), registrado no histórico.
- **ArquivoModal** (ex-CancelModal, modal `{ type: 'archive' }`): motivo obrigatório, botão desabilitado sem motivo.

## 3. Motivo do cancelamento (arquivação) obrigatório

- Já existia a guarda no reducer (`ARQUIVADA` sem `observacao` é no-op); mantida e renomeada.
- Modal obriga o motivo (campo `Motivo da arquivação *`); motivo fica na entrada de histórico.

## 4. Edição de subtarefas e anotações

- Novas ações `UPDATE_SUBTAREFA` e `UPDATE_ANOTACAO` (renomeiam/reescrevem preservando o conteúdo anterior no histórico):
  - `Subtarefa "X" renomeada para "Y".`
  - `Anotação editada de "X" para "Y".`
- UI: botão lápis em cada item no TaskDetailModal → edição inline (input/textarea com salvar/cancelar).

## 5. Histórico completo (sem exceções por status)

- `HistoryEntry` ganha `usuario?: string` (app pessoal → `'Eu'`), gravado por `newHistoryEntry`; exibido no HistoryModal.
- `UPDATE_TASK`: histórico `info` passa a cobrir **todos** os campos da whitelist (categoria, tags, projeto, lembrete, recorrência — além de título/descrição/prazo/prioridade).
- `ADD/REMOVE_SUBTAREFA`, `TOGGLE_SUBTAREFA`, `ADD/REMOVE_ANOTACAO`: registram entrada `info` no histórico (antes: silenciosas).
- `DELETE_TASK`: registra `"Tarefa excluída."` no histórico antes da remoção (exclusão definitiva atual; undo restaura).
- `CREATE_TASK`/`CHANGE_STATUS`/`DUPLICATE_TASK` já registravam; inalterados.

## Modelo / arquivos

- `types.ts` (status, `HistoryEntry.usuario`, `Task.retornoEm`, `ModalState` archive/suspend) · `status.ts` (labels/ordem/transições) · `history.ts` (`usuario: 'Eu'`) · `date.ts` (`isOverdue`) · `tasks.ts` (`Indicators`: +`suspensas`, `canceladas`→`arquivadas`) · `seedGenerator.ts` (contagens: CAIXA 10, A_FAZER 10, EM 10, SUSPENSA 3, CONCL 12, ARQUIVADA 5 = 50; planos de passos) · `context/*` (ações, reducer, toasts) · `LocalStorageProvider` (`retornoEm`, `usuario`) · UI (StatusBadge, CycleStepper, TaskKanban 6 colunas, KPICards 8 cards, ArchiveModal, SuspendModal, TaskDetailModal, TaskRow, TaskCard, App.tsx, HistoryModal).
- Testes atualizados: status, tasks, date, AppContext, storage, simulacao-semana, KPICards, TaskKanban, TaskRow, CycleStepper, StatusBadge, TaskDetailModal, ArchiveModal (ex-CancelModal), cycleActions. Novos: SuspendModal, update de subtarefa/anotação, desarquivar, retornoEm.

## Validação

`npm test` completo verde e `npm run build` sem erros; revisão de código; commit + push.

## Decisões pós-revisão (aplicadas)

- **Drag & drop não suspende nem arquiva**: `TaskKanban` bloqueia drop nas colunas SUSPENSA e ARQUIVADA — ambas exigem dados via modal (retornoEm / motivo). Teste novo cobre o drop bloqueado para SUSPENSA.
- **Favoritar registrado no histórico**: `TOGGLE_FAVORITE` gera entrada `info` ("Tarefa adicionada/removida dos favoritos.") — requisito 5 sem exceções; continua fora da pilha de undo.
- **`retornoEm` consistente**: reducer normaliza `undefined → null` ao suspender e limpa ao sair de SUSPENSA; SuspendModal força a escolha (data ou sem prazo) com confirm desabilitado.
- **Edições preservam o anterior**: `UPDATE_SUBTAREFA` → "renomeada de X para Y"; `UPDATE_ANOTACAO` → "editada de X para Y"; `UPDATE_TASK` cobre todos os campos da whitelist.
- **Exclusão definitiva**: `DELETE_TASK` registra "Tarefa excluída." no histórico antes de remover; o registro permanece no snapshot de undo (decisão do usuário: exclusão definitiva atual).

## Resultado

- **201/201 testes (22 arquivos)** e **build OK** após a fase de testes + revisão.
- Testes: suíte completa verde (status, date, tasks, AppContext, storage, simulação da semana, KPICards, TaskKanban, TaskRow, CycleStepper, StatusBadge, TaskDetailModal, ArchiveModal, cycleActions).
