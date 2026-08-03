# Melhorias — Análise da versão `lista_de_tarefas`

**Data:** 2026-08-03
**Escopo da análise:** apenas o **ciclo de vida das tarefas** e o **comportamento do usuário** da versão do repositório https://github.com/Breno0604/lista_de_tarefas.git.
**Fora de escopo:** layout/visual (nada foi copiado da outra versão).

> **Status de implementação (2026-08-03):** Leva 1 (D2–D5), Leva 2 (D6–D9) e **D1 parcial (persistência em localStorage)** implementadas. Ver seção 6.

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

Pendente da D1 (tier **crítica**): arquitetura de **provider trocável** (`LocalStorageProvider`/`FutureApiProvider`) com troca por env var — preparação para backend real.
Pendente para levas futuras: D10–D13 (fáceis) e D11–D12 (moderadas).
