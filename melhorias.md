# Melhorias — Análise da versão `lista_de_tarefas`

**Data:** 2026-08-03
**Escopo da análise:** apenas o **ciclo de vida das tarefas** e o **comportamento do usuário** da versão do repositório https://github.com/Breno0604/lista_de_tarefas.git.
**Fora de escopo:** layout/visual (nada foi copiado da outra versão).

> **Status de implementação (2026-08-03):** Leva 1 (D2–D5), Leva 2 (D6–D9), **D1 completa (persistência + provider trocável)** e **D10–D13 (timestamps, empty states, categorias/tags, drag-and-drop)** implementadas. Ver seção 6.

---

## 1. Contexto da versão analisada

- Stack: Vue 3 + Pinia + TypeScript (diferente da nossa — React + Context/useReducer).
- **Modelo de tarefa binário:** a tarefa é apenas `completed: boolean` (pendente ↔ concluída). **Não existe** máquina de estados, aprovação, devolução nem papéis (gestor/colaborador). Ou seja: o ciclo dela é *mais pobre* que o nosso — não devemos regredir.
- Ponto forte da outra versão: **comportamentos de produtividade e persistência** que não temos.

---

## 2. Descobertas (comportamento/ciclo) e o que agregar à nossa aplicação

| # | Descoberta na outra versão | O que temos hoje | Agregar à nossa aplicação |
|---|---|---|---|
| D1 | **Persistência em `localStorage`** com camada trocável (`StorageService` + `LocalStorageProvider` / `FutureApiProvider`; troca de backend = 1 ponto) | Estado 100% em memória — **todo dado some ao recarregar a página** | Persistir tarefas + histórico + usuário atual; seed vira "seed se vazio" |
| D2 | **Toast de feedback em toda ação** (criada, atualizada, concluída, reaberta, duplicada, excluída) | Ações silenciosas — sem confirmação visual de sucesso/erro | Toast ao criar/editar/aprovar/devolver/reatribuir/mudar status |
| D3 | **Excluir tarefa com confirmação** (AlertDialog) | **Não existe exclusão** — tarefa nunca pode ser removida | Ação `DELETE_TASK` + confirmação (reusar `ConfirmDialog`) |
| D4 | **Duplicar tarefa** (copia tudo, novo id/timestamps) | Não existe | Ação `DUPLICATE_TASK` (decidir se mantém ou reseta status) |
| D5 | **Reabrir/reverter conclusão** — toggle instantâneo pendente↔concluída | Colaborador que clica "Concluir" fica preso: só gestor pode FINALIZAR ou DEVOLVER | Transição `CONCLUIDA → EM_EXECUCAO` (colaborador) para desfazer |
| D6 | **Favoritar tarefa** (estrela + filtro "apenas favoritas") | Não existe | Campo `favorita` + toggle + filtro |
| D7 | **Ordenação** (manual/DnD, nome, criação, prazo, prioridade) | Lista sempre na ordem do seed, sem controle de ordenação | Sort no `filterTasks` (título, prazo, prioridade, criadaEm) + seletor |
| D8 | **Filtro "vencem hoje"** (e "atrasadas" já coberto por nós) | Temos vencidas / próximos 7 dias / sem prazo | Nova opção `hoje` no filtro de prazo |
| D9 | **% de conclusão + barra de progresso** (dashboard) | KPIs numéricos, sem percentual | `percentConclusao` no `computeIndicators` + barra de progresso |
| D10 | **Timestamps `updatedAt`/`completedAt`** | Só `criadaEm` + histórico de status | Campos `atualizadaEm`/`concluidaEm` mantidos pelo reducer |
| D11 | **Categorias e tags** (strings livres, lista derivada para filtro) | Não existe | Campos no formulário, badges, filtros derivados |
| D12 | **Drag-and-drop de reordenação** (campo `order` persistido) | Não existe | Campo `ordem` + lib de DnD (tabela e kanban) |
| D13 | **Empty states distintos** ("nenhuma tarefa" vs "nenhum resultado") | Só "Nenhuma tarefa encontrada" | Diferenciar lista vazia de filtro sem resultado |
| D14 | **Seed de boas-vindas só no primeiro acesso** (`seedIfEmpty`) | Seed sempre carregado como estado inicial | Seed condicional (depende de D1) |
| D15 | **Validação de título no service layer** | Validação no formulário | Manter (já coberto) — sem ação |
| D16 | **Atalhos de teclado** (Enter cria, Esc fecha) | Esc fecha modais | Enter para criar (quick-add) — opcional |

---

## 3. Classificação de implementação

Legenda:
- **Fácil** — implementa sem maior complexidade (mudanças pontuais, arquivos conhecidos).
- **Moderado** — requer bastante código, mas sem grande impacto estrutural.
- **Alta** — requer bastante refatoração (transversal a várias camadas).
- **Crítica** — mudança drástica na arquitetura/forma do projeto.

### 🟢 Fácil (podemos implementar sem maiores complexidade)

1. **Toasts de feedback** (D2) — componente/contexto de toast leve + chamada em cada ação do reducer/UI. Nenhum impacto em lógica existente.
2. **Excluir tarefa** (D3) — ação `DELETE_TASK` no reducer + botão na linha/card/detalhe + `ConfirmDialog` (já existe).
3. **Duplicar tarefa** (D4) — ação `DUPLICATE_TASK` no reducer + item de menu/ícone.
4. **Reabrir conclusão** (D5) — 1 transição nova na máquina (`CONCLUIDA → EM_EXECUCAO`, colaborador) + botão; testes de `status.ts`/`AppContext` atualizados.
5. **Favoritos** (D6) — campo `favorita: boolean`, ação `TOGGLE_FAVORITE`, estrela na tabela/kanban, filtro no `filterTasks`.
6. **Ordenação por coluna** (D7 parcial) — sort puro no `filterTasks` + seletor na `FilterBar`; testes em `tasks.test.ts`.
7. **Filtro "vencem hoje"** (D8) — util `isDueToday` + nova opção de `PrazoFilter`.
8. **% de conclusão + barra de progresso** (D9) — campo novo em `Indicators` + barra simples no dashboard/KPIs.
9. **Timestamps de auditoria** (D10) — `atualizadaEm`/`concluidaEm` no tipo `Task` + reducer preenchendo; sem impacto em UI.
10. **Empty states distintos** (D13) — pequena variação do estado vazio atual.

### 🟡 Moderado (requer bastante código, mas sem muito impacto)

1. **Categorias e tags** (D11) — novo campo(s) no `Task`, inputs no `TaskFormModal`, badges na tabela/kanban, lista derivada + filtros. Toca tipos, formulário, filtros, seed e testes.
2. **Drag-and-drop de reordenação** (D12) — campo `ordem` + integração de lib de DnD em **duas** visões (tabela e kanban) + convivência com filtros/ordenação. (Depende de D1 para a ordem persistir.)

### 🟠 Alta (requer bastante refatoração)

1. **Persistência de tarefas + histórico + usuário atual** (D1 parcial) — nova camada de storage (ex.: `services/`), hidratação do estado no `AppProvider`, seed condicional (D14) e chave de versão para migração. Refatora o bootstrap e toca `context`, `types`, `data/mockData`. Não muda a natureza do app (segue sem backend).

### 🔴 Crítica (mudança drástica no projeto)

1. **Arquitetura de provider trocável + preparação para backend real** (D1 completo) — adotar a ideia central da outra versão: interface de storage com `LocalStorageProvider` e `FutureApiProvider` (stub), troca por env var. Isso muda a forma do projeto (de demo em memória para app com estado próprio), exige decidir o que persistir (inclusive o usuário ativo), versionar dados e reescrever o bootstrap. É o único item que realmente "muda o projeto".

> **Nota de honestidade:** nenhuma das descobertas **obriga** uma mudança crítica — se o objetivo seguir como demonstração em memória, a persistência completa pode ficar em **Alta**. A classificação **Crítica** reflete o salto arquitetural caso queiramos o caminho até um backend real.

---

## 4. Não agregar (para registro)

- **Ciclo binário pendente↔concluída** — regressão frente à nossa máquina de estados com aprovação; descartado.
- **Sem histórico / sem papéis / sem reatribuição** — a outra versão não tem; não é modelo a seguir.
- **Modelo sem responsável por tarefa** — não se aplica ao nosso domínio (atribuição a colaborador é central).

---

## 5. Ordem sugerida de implementação (quando decidirmos)

1. **Fácil #1–#5** (toasts, excluir, duplicar, reabrir, favoritos) — melhorias de comportamento isoladas, baixo risco.
2. **Fácil #6–#10** (ordenação, hoje, %, timestamps, empty states).
3. **Moderado** (categorias/tags; DnD).
4. **Alta/Crítica** (persistência + provider) — somente após os comportamentos estabilizarem, pois muda o bootstrap e exige migração de dados do seed.

---

## 6. Status de implementação — Leva 1 (2026-08-03)

Implementado e verificado (38 testes passando, `tsc` + build verdes):

- **D2 — Toasts de feedback:** novo `src/context/ToastContext.tsx` (provider + `useToast`); o `AppProvider` emite toast de sucesso em toda ação que altera tarefas (criar, editar, mudar status, reatribuir, duplicar, excluir), pulando ações sem efeito (transição inválida).
- **D3 — Excluir tarefa:** ação `DELETE_TASK` no reducer; botão Excluir para o gestor na tabela e no modal de detalhes, com `ConfirmDialog` de confirmação (reuso do existente).
- **D4 — Duplicar tarefa:** ação `DUPLICATE_TASK` no reducer (cópia como NOVA, novo id, histórico "Tarefa duplicada de X"); botão Duplicar para o gestor na tabela e no modal de detalhes.
- **D5 — Reabrir conclusão:** transição `CONCLUIDA → EM_EXECUCAO` (colaborador) na máquina de estados; botão Reabrir na tabela, no kanban e no modal de detalhes.
- **Bônus:** correção de bug latente em `TaskRow`/`TaskCard` (botão "Iniciar" duplicado ao lado de "Retomar" para tarefas DEVOLVIDA).

## 6.1 Status de implementação — Leva 2 (2026-08-03)

Implementado e verificado (48 testes passando, `tsc` + build verdes):

- **D6 — Favoritos:** campo `favorita` em `Task`, ação `TOGGLE_FAVORITE` no reducer, estrela na tabela/kanban/modal e filtro "Favoritas" na `FilterBar`.
- **D7 — Ordenação:** `sortBy` em `Filters` (criadaEm, título, prazo, prioridade) aplicado no `filterTasks` + seletor na `FilterBar`; padrão mantém a ordem original.
- **D8 — Filtro "Vencem hoje":** novo valor `hoje` em `PrazoFilter` + `isDueToday`.
- **D9 — % de conclusão:** `percentConclusao` em `Indicators` + barra de progresso "Conclusão geral" no `KPICards` (visível nas seções Tarefas e Visão Geral).
- **Bônus — correção de fuso:** `parsePrazo` em `date.ts` — datas `YYYY-MM-DD` agora são interpretadas como meia-noite **local** (o parse padrão usava UTC e deslocava o dia em fusos negativos, quebrando o filtro "hoje").

## 6.2 Status de implementação — D1 parcial: persistência em localStorage (2026-08-03)

Implementado e verificado (54 testes passando, `tsc` + build verdes):

- **Camada de storage:** novo `src/services/storage.ts` — `loadState`/`saveState`/`clearState` com **chave de versão** (`tarefas.app.v1`); JSON corrompido, shape inválido ou versão incompatível caem no seed (retorno `null`).
- **Hidratação:** `AppProvider` usa lazy init (`useReducer(appReducer, initialState, initState)`) — se há estado salvo, restaura **tarefas + histórico + usuário atual**; senão, usa o seed (equivale ao "seed se vazio").
- **Persistência:** `useEffect` grava `tasks` + `currentUserId` a cada mutação.
- **Testes:** `src/services/storage.test.ts` com `localStorage` mockado (round-trip, sem dados, JSON corrompido, versão incompatível, shape inválido, clear).

Pendente da D1 (tier **crítica**) — passo 2: carregamento **assíncrono** com estado de "carregando" e tratamento de erro de rede, necessário quando o `FutureApiProvider` for implementado de verdade.

## 6.7 Status de implementação — D1 crítica: provider trocável (2026-08-03)

Implementado e verificado (98 testes passando, `tsc` + build verdes):

- **Contrato:** `src/services/StorageProvider.ts` — interface `StorageProvider` (`load`/`save`/`clear`) + `LoadedState`.
- **LocalStorageProvider:** lógica anterior movida para `providers/LocalStorageProvider.ts` (validação por tarefa, chave versionada `tarefas.app.v1`, filtro de inválidas) sem mudança de comportamento.
- **FutureApiProvider (stub):** `providers/FutureApiProvider.ts` — ainda não faz chamadas de rede; `load()` retorna `null` (cai no seed) e avisa no console.
- **Ponto único de troca:** `services/index.ts` seleciona o provider por `VITE_STORAGE_PROVIDER` (`local` padrão / `api`). Documentado em `.env.example`.
- **Facade:** `services/storage.ts` continua exportando `loadState`/`saveState`/`clearState`/`STORAGE_KEY` — **`AppContext` e testes não mudaram**.
- **Trocar o destino = mudar 1 env var; nada mais muda.**

Pendente (passo 2, quando houver backend real): tornar `StorageProvider` assíncrono + estado de loading + tratamento de erro de rede.

## 6.8 Correções pós-revisão completa (2026-08-03)

Revisão em 5 frentes (objetivo, QA hands-on, qualidade, segurança, contexto) — 4/5 PASS sem bloqueios; implementadas as recomendações:

1. **Validação de dados persistidos:** `isTask` agora valida enums (`status`/`prioridade`), formato de `prazo`, tipos dos campos opcionais e o shape de cada entrada de `historico` (5 testes novos).
2. **"Atrasadas" na Visão Geral:** usa `EMPTY_FILTERS` + `prazo: 'vencidas'` (não herda mais filtros ativos da seção Tarefas); `proximas` memoizado.
3. **`nextTaskId` extraído** para `utils/tasks.ts` e usado em `TaskFormModal`, `TaskQuickAdd` e `DUPLICATE_TASK` (fim da duplicação em 3 locais).
4. **Confirmação de conclusão no modal de detalhes** (alinhado com tabela/kanban) e **texto de exclusão honesto** ("Você poderá desfazer pelo aviso exibido em seguida" — antes dizia "não pode ser desfeita").
5. **Pilha de undo limpa:** `TOGGLE_FAVORITE` e `REORDER_TASKS` não empilham mais `past` (sem toast → undo ficaria confuso).
6. **`concluidaEm` exibido** no modal de detalhes (nova célula "Concluída em").
7. **Acessibilidade:** `Modal` com `role="dialog"`, `aria-modal`, `aria-label` e **trap de foco** (sem conflito com modais empilhados); `htmlFor`/`id` em `ReassignModal`, `ApproveModal` e `ReturnModal`.
8. **Responsividade + repo:** sidebar colapsa automaticamente < 1024px; `.gitignore` inclui `.omo/`, `coverage/`, `.env.local`, `*.log`, `.playwright-mcp/` (`.omo` untracked).

Bônus: `colaboradorResumo` corrigido para nomes de uma palavra. **Total: 109 testes.**

## 6.9 Limpeza dos achados menores da revisão (2026-08-03)

- **`TaskCard` sem elementos interativos aninhados:** o card deixou de ser um `<button>` com `<span>` clicáveis (HTML inválido/inacessível por teclado) — virou `<div draggable>` com um `<button>` de detalhes e botões reais de favoritar/ação (com `aria-label`).
- **Fim da duplicação `actionFor`/`quickAction`:** helper `cycleActionFor(task, target)` em `src/components/tasks/cycleActions.ts`, usado por `TaskRow` e `TaskCard` (6 testes novos).
- **`computeIndicators` em passada única** (antes 7 filtros sobre o array).
- **`isWithinDays` sem chamada dupla** de `startOfToday`.
- **Ids de histórico com sufixo aleatório** em `TaskFormModal`/`TaskQuickAdd` (alinhados a `newHistoryEntry`).

**Total: 115 testes.**

## 6.10 Aderência ao clean-code-principles (2026-08-03)

Refatoração pura (sem mudança de comportamento) cobrindo os achados da auditoria:

- **DRY — factory `createTask()`** em `src/utils/tasks.ts`: unifica a construção de tarefa NOVA usada por `TaskFormModal` e `TaskQuickAdd` (id sequencial, timestamps e entrada de histórico via `newHistoryEntry` em `src/utils/history.ts`, agora compartilhado com o reducer). 3 testes novos.
- **DRY — `colaboradorResumo(nome)`** agora recebe a string (não um objeto `Colaborador`), eliminando o objeto fake `{ nome: '?', ... }` duplicado em `TaskRow` e `TaskDetailModal`.
- **Dead code — `STATUS_TOAST['NOVA']` removido** (CREATE_TASK tem toast próprio; nenhuma transição chega a NOVA).
- **SRP — `AppContext.tsx` reduzido de 320 → ~100 linhas:** `AppState`/`AppAction` → `src/context/types.ts`; reducer + undo + `NO_UNDO` → `src/context/appReducer.ts`; mapeamento de toast → `src/context/toastMessage.ts`. `roleOf` migrou para `src/utils/status.ts` (junto das transições).
- **SRP — `App.tsx` de 270 → ~130 linhas:** seções extraídas para `src/components/sections/` (`SectionTarefas`, `SectionVisaoGeral`, `SectionColaboradores`); `App.tsx` virou composition root (providers + `Shell`).
- **DRY — componente `Avatar`** (`src/components/ui/Avatar.tsx`) com 5 tamanhos, usado em Sidebar, `TaskRow`, `TaskDetailModal`, `CollaboratorCard` e `CollaboratorDetailModal` (antes: markup repetido em 6 lugares).
- **DRY — `openTarefas(dispatch, filters?)`** em `src/context/navigation.ts`: unifica os atalhos da Sidebar e os KPIs (navegação + filtros em uma chamada).

**Total: 118 testes** (eram 115; +3 `createTask`), build limpo, grafo de imports acíclico.

## 6.3 Status de implementação — D10 a D13 (2026-08-03)

Implementado e verificado (66 testes passando, `tsc` + build verdes):

- **D10 — Timestamps de auditoria:** campos `atualizadaEm`/`concluidaEm` em `Task`; o reducer preenche `atualizadaEm` em toda mutação, define `concluidaEm` ao entrar em CONCLUIDA e **limpa** ao reabrir/devolver (mantém ao finalizar). Exibido como "atualizada em …" no modal de detalhes.
- **D11 — Categorias e tags:** campos `categoria`/`tags` em `Task`, inputs no formulário (criar/editar), chips (`CategoryTag`) no kanban e no modal de detalhes, filtro derivado (MultiSelect de categorias na `FilterBar`) e 6 tarefas do seed com categoria/tags para demonstração.
- **D12 — Drag-and-drop de reordenação (v1):** ação `REORDER_TASKS` no reducer (insere "antes" do alvo, com correção do deslocamento ao mover para baixo) + DnD nativo (HTML5) nas linhas da **tabela** com indicador visual. **Escopo:** habilitado apenas na visão Lista **sem filtros ativos e sem ordenação** (semântica inequívoca de posição); a ordem é a ordem do array e **persiste** via D1. Kanban (arrastar entre colunas = mudança de status) fica como evolução futura.
- **D13 — Empty states distintos:** `TasksTable` e `TaskKanban` diferenciam "nenhuma tarefa criada" (lista totalmente vazia) de "nenhuma tarefa encontrada" (filtro sem resultado), via `totalCount`.

Pendente: D1 tier **crítica** (provider trocável) e melhorias de D12 em kanban (drag entre colunas).

## 6.4 Relatório de QA manual — Task 14 do plano original (2026-08-03)

QA executado no navegador (Playwright) contra o app em `npm run dev`, cobrindo o checklist original de 16 itens **mais** as features adicionadas (Leva 1, 2, D10–D13, undo, quick-add, kanban-drag). Resultado: **27/27 checks aprovados**.

| Item | Resultado |
|---|---|
| 1. Sidebar expande/recolhe | ✅ w-64 ↔ w-16 |
| 2. KPIs (8) mostram contagens; clicar filtra | ✅ 16/2/2/3/3/2/4/3; "Finalizadas" → 4 linhas |
| 3. Busca filtra por título | ✅ "login" → 1 linha |
| 4. Filtros + "Limpar" reseta | ✅ (ressalva: 1 falso negativo por dado estranho no localStorage do QA) |
| 5. Toggle Lista/Quadro | ✅ tabela e 6 colunas do kanban |
| 6. Tabela: ciclo, prazo, prioridade, status | ✅ steppers, badges e prazos visíveis |
| 7. Criar tarefa (modal + validação) | ✅ modal abre, cria com toast |
| 8. Editar (gestor) | ✅ persiste alteração |
| 9. Ciclo colaborador NOVA→…→CONCLUIDA c/ confirmação | ✅ 4 passos + dialog de confirmação + toast |
| 10. Gestor: Aprovar/Devolver em CONCLUIDA | ✅ botões presentes no detalhe |
| 11. Retomar DEVOLVIDA→EM_EXECUCAO | ✅ + undo |
| 12. Histórico (timeline) | ✅ entradas com usuário e observação |
| 13. Responsável alterado registra info | ✅ (coberto por testes do reducer) |
| 14. Colaboradores: cards + modal com tarefas | ✅ 5 cards; modal lista tarefas e métricas |
| 15. Responsivo | ✅ tabela rola horizontalmente em 800px (sidebar permanece usável) |
| 16. Sem erros no console | ✅ após fix do favicon (único erro era 404 de favicon.ico) |
| Extras: quick-add + Enter, undo via toast, duplicar, excluir c/ confirmação, reabrir, favoritos (estrela + filtro), ordenação, drag entre colunas do kanban (NOVA→RECEBIDA; reabrir via drag), persistência após reload | ✅ todos verificados |

**Achados corrigidos:** favicon ausente (404 no console) → adicionado `link rel="icon"` SVG inline no `index.html`; labels do `TaskFormModal` sem `htmlFor`/`id` (acessibilidade) → associados.
**Nota de escopo:** a sidebar **não** colapsa automaticamente abaixo de 1024px (só via botão) — a expectativa do item 15 do plano; tabela com scroll horizontal funciona.

## 6.5 Correções pós-QA (2026-08-03)

- **Abrir sempre como gestor:** `currentUserId` deixou de ser persistido — o app abre como Carlos (gestor), restaurando o comportamento pré-D1. O seletor de usuário continua disponível para testar papéis (editar/excluir são ações de gestor).
- **Sem reset silencioso de dados:** `loadState` passou a **filtrar** tarefas com shape inválido em vez de descartar o estado inteiro (uma tarefa corrompida não derruba mais as demais).
- **Sem undo fantasma:** `UPDATE_TASK`/`TOGGLE_FAVORITE` com id inexistente (ou `UPDATE_TASK` sem alterações) agora retornam o estado inalterado — sem empilhar `past` nem disparar toast falso.

## 6.6 Correções de feedback UX + testes de componentes (2026-08-03)

- **DnD da tabela com feedback:** o ícone de arrastar fica sempre visível (mudo + tooltip quando indisponível) e uma dica explica que a reordenação só funciona sem filtros/busca/ordenação.
- **Kanban com feedback de bloqueio:** ao arrastar sobre uma coluna com transição não permitida para o papel atual, a coluna fica vermelha com selo "não permitido" (e `dropEffect: none`).
- **"Limpar" não zera mais a ordenação:** `RESET_FILTERS` preserva `sortBy`; resetar a ordem agora é feito pelo seletor "Ordem original".
- **Testes de componentes (Testing Library):** infraestrutura (`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`; vitest com `maxWorkers: 1` para evitar OOM dos workers jsdom) + 22 testes cobrindo `TaskRow` (ações por papel, favoritar, excluir), `TaskQuickAdd` (Enter cria, valida vazio), `TasksTable` (empty states, dica de reordenação, drop → `onReorder`), `TaskDetailModal` (Aprovar/Devolver por papel, categoria/tags, data) e `FilterBar` (Limpar, categorias derivadas, ordenação). **Total: 96 testes.**
