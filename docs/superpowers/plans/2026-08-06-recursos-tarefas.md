# Plano: Recursos para o usuário nas tarefas (F1–F3, F5, O1, O4 + anotações)

Data: 06/08/2026 · Escopo escolhido pelo usuário: **F1 subtarefas, F2 recorrência, F3 lembrete+notificação, F5 projetos, O1 atalhos de teclado, O4 tema escuro + anotações personalizadas**.

## Visão geral

O app é pessoal (usuário único) com fluxo GTD. Esta fase amplia o modelo de dados da `Task`
(campos **opcionais**, retrocompatíveis com o `localStorage` v2 atual) e adiciona:

1. **Subtarefas / checklist** — itens com check, progresso no card/linha e gestão no modal de detalhes.
2. **Tarefas recorrentes** — ao concluir uma tarefa com recorrência, gera-se automaticamente a próxima ocorrência.
3. **Lembrete + notificação** — data/hora de lembrete por tarefa; hook dispara `Notification` do navegador.
4. **Projetos / áreas** — campo `projeto` (string livre com datalist), filtro com progresso por projeto.
5. **Anotações personalizadas** — lista de notas com timestamp no modal de detalhes.
6. **O1 — atalhos de teclado** — `N` nova tarefa, `/` busca, `V` alternar lista/quadro, `Ctrl+Z` desfazer.
7. **O4 — tema escuro** — `darkMode: 'class'` no Tailwind, toggle no Topbar, persistido em `localStorage`.

## Modelo de dados (`src/types.ts`)

```ts
export type Recorrencia = 'diaria' | 'semanal' | 'mensal';

export interface Subtarefa { id: string; titulo: string; concluida: boolean }
export interface Anotacao  { id: string; texto: string; criadaEm: string } // ISO

// Campos novos em Task (todos opcionais — localStorage v2 continua válido):
//   subtarefas?: Subtarefa[]        (padrão [])
//   anotacoes?: Anotacao[]          (padrão [])
//   projeto?: string                (string livre; ausente = sem projeto)
//   lembrete?: string | null        (ISO datetime | null; padrão null)
//   lembreteNotificado?: boolean    (flag interna do hook de notificação)
//   recorrencia?: Recorrencia | null (padrão null)
```

`Filters` ganha `projeto?: string | null` (null = todos; sentinela `SEM_PROJETO` para "sem projeto").
`AppState` ganha `tema: 'claro' | 'escuro'` (persistido em `localStorage['tarefas.tema']`, como `kpiCollapsed`).

## Ações novas no reducer (`src/context/types.ts` + `appReducer.ts`)

| Ação | Efeito | Undo | Toast |
|---|---|---|---|
| `ADD_SUBTAREFA {taskId, titulo}` | adiciona subtarefa não concluída | sim | "Subtarefa adicionada" |
| `TOGGLE_SUBTAREFA {taskId, subtarefaId}` | alterna check | **não** (NO_UNDO) | nenhum |
| `REMOVE_SUBTAREFA {taskId, subtarefaId}` | remove item | sim | "Subtarefa removida" |
| `ADD_ANOTACAO {taskId, texto}` | adiciona nota com timestamp | sim | "Anotação adicionada" |
| `REMOVE_ANOTACAO {taskId, anotacaoId}` | remove nota | sim | "Anotação removida" |
| `MARK_LEMBRETE_NOTIFICADO {taskId}` | marca lembrete como notificado | **não** (NO_UNDO) | nenhum |
| `TOGGLE_TEMA` | alterna claro/escuro | n/a (não mexe em tasks) | nenhum |

- `UPDATE_TASK`: whitelist ganha `projeto`, `lembrete`, `recorrencia`. Se `lembrete` mudar → reseta `lembreteNotificado: false`.
- `CHANGE_STATUS → CONCLUIDA` com `task.recorrencia` definida: além de concluir, **cria a próxima ocorrência**:
  - id sequencial (`nextTaskId`), status `CAIXA_ENTRADA`, prazo avançado (`proximaOcorrencia`), timestamps = agora,
    `concluidaEm` ausente, `lembrete`/`lembreteNotificado` zerados, subtarefas desmarcadas (lista preservada),
    histórico com entrada `"Próxima ocorrência (diaria|semanal|mensal) de {id}."`. Copia título, descrição,
    prioridade, categoria, tags, projeto, favorita, recorrência.

## Utilitários (`src/utils/tasks.ts`, `date.ts`)

- `proximaOcorrencia(prazo: string | null, freq): string | null` — diária +1d, semanal +7d, mensal +1 mês
  (clampeada ao último dia do mês). `date.ts` ganha `addDays`/`addMonths` internos ou utilitário próprio.
- `subtarefasProgresso(task): { feitas, total, pct }`.
- `projetosDe(tasks): string[]` (únicos, ordenados) e `progressoProjeto(tasks, projeto)`.
- `EMPTY_FILTERS` ganha `projeto: null`; `filterTasks` filtra por `projeto` (sentinelas).

## Persistência (`LocalStorageProvider`)

`isTask` ganha validação dos campos opcionais (sem exigir presença): `subtarefas`/`anotacoes` como arrays
válidos se presentes, `projeto` string, `lembrete` string|null, `recorrencia` dentro do enum. **VERSION permanece 2**
(backward compatible: dados antigos sem os campos continuam carregando).

## UI

- **TaskFormModal**: campos Projeto (input + datalist de projetos existentes), Lembrete (datetime-local),
  Recorrência (select nenhuma/diária/semanal/mensal). Enviados no create/update.
- **TaskDetailModal**: seções "Subtarefas" (progresso x/y, adicionar, alternar, remover) e "Anotações"
  (adicionar, listar com data, remover); grade de metadados ganha Projeto, Lembrete, Recorrência.
- **TaskRow / TaskCard**: sob o título, chips compactos de progresso (x/y), projeto e sino de lembrete.
- **FilterBar**: novo select "Projeto" (Todos / Sem projeto / projetos com progresso concluídas/total).
- **Topbar**: toggle de tema (Sol/Lua) e botão de permissão de notificações (sino com ponto quando `default`).
- **App.tsx**: hooks `useLembretes` (intervalo 20s + checagem inicial; marca `lembreteNotificado`) e
  `useShortcuts` (n, /, v, Ctrl+Z; ignorados em inputs/modais, exceto Ctrl+Z).
- **Tema escuro**: `tailwind.config.js` → `darkMode: 'class'`; classes `dark:` em body, App, Sidebar, Topbar,
  FilterBar, KPICards, tabela/linhas, kanban, modais, badges, inputs, toasts, stepper. Aplicado via
  `document.documentElement.classList` a partir de `state.tema`.

## Fases

1. **Domínio**: types, reducer (ações + recorrência + whitelist), toastMessage, utils (proximaOcorrencia, progresso, projetos), AppContext (tema).
2. **Persistência**: validadores novos + testes.
3. **UI**: form, detail, row/card/kanban, FilterBar, Topbar.
4. **Tema escuro** + atalhos + notificações.
5. **Testes**: novos (reducer, utils, storage, componentes) + atualização dos existentes
   (AppContext, form, detail, filterbar, topbar, simulacao-semana ganha `tema` no boot).
6. **Validação**: `npm test` completo, `npm run build`, revisão de código, correções.

## Decisões pós-revisão

- **Drift mensal**: recorrência mensal clampeia 31/01 → 28/02; a ocorrência seguinte parte de 28/02. Limitação aceita (sem âncora de dia).
- **`lembreteNotificado`**: reabrir a tarefa (EM_ANDAMENTO) reseta a flag → pode notificar de novo; marcada uma única vez por lembrete enquanto ativa.
- **Comparação do lembrete**: `useLembretes` normaliza para `YYYY-MM-DDTHH:mm` (slice 16) antes de comparar com o horário local atual.
- **Tema escuro sem flash**: `main.tsx` aplica a classe `dark` antes do primeiro paint se `tarefas.tema === 'escuro'`; o toggle segue pelo AppContext.

## Critérios de aceite

- Concluir tarefa recorrente cria a próxima ocorrência com prazo correto (diária/semanal/mensal).
- Lembrete dispara notificação uma única vez (flag persistida) e não notifica concluídas/canceladas.
- Subtarefas e anotações persistem e sobrevivem ao reload; undo funciona para adição/remoção.
- Filtro por projeto reflete progresso; tema escuro cobre todos os componentes principais.
- `npm test` verde e `npm run build` sem erros.
