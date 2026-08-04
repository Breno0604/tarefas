# Design — Cards KPI responsivos + recolher/expandir + remoção de funcionalidades

Data: 2026-08-03
Status: Aprovado

## 1. Objetivo

Ajustes de UX na seção de cards KPI (visão Tarefas e Visão Geral):

1. Grid responsivo com mínimo de 2 cards por linha no menor tamanho, aumentando conforme a largura.
2. Seção recolhível/expandível de forma simples e rápida, com estado persistente.
3. Remoção das funcionalidades "Conclusão geral" (barra de progresso) e do campo "Adicione uma tarefa e pressione Enter..." (TaskQuickAdd).

## 2. Alterações

### 2.1 Grid responsivo dos cards KPI — `src/components/layout/KPICards.tsx`

Grade atual: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8`.

Nova grade (8 cards):

- Base (celular): `grid-cols-2` → 2 cards por linha, 4 linhas
- `md`: `grid-cols-4` → 4 por linha, 2 linhas
- `xl`: `grid-cols-8` → 8 por linha, 1 linha

### 2.2 Recolher/expandir — `src/components/layout/KPICards.tsx`

- Barra de cabeçalho discreta acima da grade com botão de chevron (▲/▼).
- Clicar alterna o estado recolhido/expandido da grade de cards.
- Estado persistido em `localStorage` (chave `kpiCollapsed`), lido na inicialização.
- Recolhido mostra apenas a barra com o botão (sem cards).
- Aplicável a ambos os locais de uso (Tarefas e Visão Geral), pois o estado é compartilhado pelo mesmo componente/chave.

### 2.3 Remoção da barra "Conclusão geral"

- Remover o bloco de progresso (label + percentual + barra) do `KPICards`.
- O campo `percentConclusao` em `Indicators` pode permanecer (computado em `utils/tasks.ts`), sem uso na UI.

### 2.4 Remoção do TaskQuickAdd

- Remover `<TaskQuickAdd />` de `src/components/sections/SectionTarefas.tsx` (componente e import).
- Apagar `src/components/tasks/TaskQuickAdd.tsx`.
- Apagar `src/components/tasks/TaskQuickAdd.test.tsx`.
- A criação de tarefas continua disponível pelo botão "Nova tarefa" (Topbar) e pelo modal `TaskFormModal`.
- `createTask` em `utils/tasks.ts` permanece (usado por `TaskFormModal` e pelo reducer).

## 3. Testes

- `KPICards.test.tsx`: remover o teste da barra "Conclusão geral"; adicionar teste do recolher/expandir (alternância e persistência).
- Apagar `TaskQuickAdd.test.tsx`.
- `TaskQuickAdd` removido: conferir se `SectionTarefas`/`App` não referenciam mais o componente.

## 4. Fora de escopo

- Não alterar demais seções, filtros, tabela/kanban ou modais.
- Não remover `percentConclusao` do model de indicadores.
