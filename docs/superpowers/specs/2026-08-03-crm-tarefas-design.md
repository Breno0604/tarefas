# Design — CRM de Gestão de Tarefas (Frontend)

Data: 2026-08-03
Status: Aprovado (fluxo de continuação automática)

## 1. Visão geral

Aplicação frontend (SPA) de **tela única** para gestores criarem, atribuírem, acompanharem, revisarem e finalizarem tarefas de colaboradores. Todas as informações e ações que normalmente exigiriam outra página são apresentadas via **modais**. Dados fictícios (mockados) em memória. Sem backend, banco de dados, autenticação ou integrações externas.

## 2. Stack técnica (assumida)

- **React 18 + Vite + TypeScript** (padrão de mercado para CRMs; evolução fácil para backend real depois)
- **Tailwind CSS** para estilização consistente
- **lucide-react** para ícones
- Sem router (tela única); estado via `Context + useReducer`
- Datas com `Date` nativo + `Intl` (locale pt-BR)
- Idioma da UI: **português (pt-BR)**

## 3. Modelo de dados

### Colaborador
- `id`, `nome`, `cargo`, `email`, `cor` (avatar com iniciais)
- Métricas **derivadas** a partir das tarefas: ativas, concluídas, atrasadas, taxa de conclusão

### Tarefa
- `id` (ex.: TA-001), `titulo`, `descricao`, `responsavelId`, `criadorId` (gestor), `prioridade` (`baixa | media | alta | critica`), `prazo` (data ISO), `status`, `criadaEm`
- `historico`: `[{ id, dataHora, usuario, statusAnterior, novoStatus, observacao? }]`

### Usuário atual (mock)
- Seletor "logado como" no rodapé da sidebar: Carlos (Gestor) ou um dos colaboradores.
- Habilidades por papel:
  - **Gestor**: criar, editar, atribuir, alterar responsável, aprovar, devolver
  - **Colaborador**: receber (NOVA→RECEBIDA), iniciar (RECEBIDA→EM EXECUÇÃO), concluir (EM EXECUÇÃO→CONCLUÍDA), retomar (DEVOLVIDA→EM EXECUÇÃO)

## 4. Regras do ciclo de vida

Transições permitidas (toda mudança grava registro no histórico com data/hora, usuário, status anterior/novo e observação opcional):

- `NOVA` → `RECEBIDA` (colaborador aceitou)
- `RECEBIDA` → `EM EXECUÇÃO` (colaborador iniciou)
- `EM EXECUÇÃO` → `CONCLUÍDA` (colaborador entregou)
- `CONCLUÍDA` → `FINALIZADA` (gestor aprovou)
- `CONCLUÍDA` → `DEVOLVIDA` (gestor devolveu — observação **obrigatória**)
- `DEVOLVIDA` → `EM EXECUÇÃO` (colaborador retomou após correção)

## 5. Layout da tela única

- **Sidebar dark (slate-900) expansível/recolhível**: ao recolher vira apenas ícones; transição suave; conteúdo principal se adapta automaticamente.
  - Logo/nome do sistema
  - Navegação: Visão Geral, Tarefas, Colaboradores
  - Atalhos de filtro: Atrasadas, Finalizadas, Devolvidas
  - Lista resumida de colaboradores com indicador de pendências
  - Rodapé: usuário atual (seletor mock)
- **Topbar**: título da seção, campo de busca, botão "Nova Tarefa"
- **KPIs (8 cards clicáveis** que filtram a lista): Total, Novas, Recebidas, Em Execução, Concluídas, Devolvidas, Finalizadas, Atrasadas

## 6. Conteúdo principal

### Visão Tarefas
- Toggle de visualização: **Lista (tabela)** / **Quadro (kanban por status)**
- Tabela (desktop): Tarefa (título + ID + descrição resumida), Responsável (avatar + nome), Prioridade (badge), Prazo (destaque vermelho se atrasada), Status (badge), Ciclo (CycleStepper mini), Ações (detalhes, editar, avançar status, aprovar, devolver)
- Responsivo: tabela vira cards em telas pequenas

### Visão Colaboradores
- Grade de cards: avatar, nome, cargo, mini-KPIs (ativas, concluídas, atrasadas, taxa de conclusão)
- Clique abre modal de detalhes com lista de tarefas do colaborador

## 7. Busca e filtros

- **Busca**: por título, descrição ou responsável
- **Filtros**: status (múltiplo), prioridade, responsável, prazo (todas / vencidas / próximos 7 dias / sem prazo)
- KPIs clicáveis aplicam filtro correspondente; "Atrasadas" filtra por atraso

## 8. Modais

- Criar tarefa / Editar tarefa (título, descrição, responsável, prioridade, prazo)
- Detalhes da tarefa (informações completas + ciclo grande + ações conforme papel)
- Alterar responsável
- Aprovar tarefa (confirmar, observação opcional)
- Devolver tarefa (observação **obrigatória**)
- Histórico da tarefa (timeline cronológica com data/hora, usuário, transição, observação)
- Detalhes do colaborador
- Confirmação genérica (AlertDialog)

## 9. Ciclo visual (CycleStepper)

Componente reutilizável:
- Stepper horizontal: `NOVA → RECEBIDA → EM EXECUÇÃO → CONCLUÍDA → FINALIZADA`
- Quando `DEVOLVIDA`: nodo vermelho destacado entre CONCLUÍDA e FINALIZADA, com badge "DEVOLVIDA" e seta de retorno para EM EXECUÇÃO
- Variantes: mini (tabela/kanban) e grande (modal de detalhes)

## 10. Design visual

- Paleta: neutros `slate` + primário `indigo` (corporativo); área principal clara sobre sidebar escura
- Semântica de status: NOVA=azul, RECEBIDA=ciano, EM EXECUÇÃO=âmbar, CONCLUÍDA=violeta (aguardando), FINALIZADA=verde, DEVOLVIDA=vermelho
- Prioridade: baixa=cinza, média=âmbar, alta=laranja, crítica=vermelho
- Tipografia: Inter; bordas arredondadas (rounded-xl); sombras sutis; densidade corporativa
- Responsivo: sidebar vira ícones < lg; tabela vira cards < md
- Foco em desktop de alta qualidade

## 11. Estado e ações

`AppContext` (useReducer):
- Estado: `tasks`, `colaboradores`, `currentUser`, `filtros`, `view`, `modal`
- Ações: `createTask`, `updateTask`, `changeStatus` (com histórico), `reassignTask`, `approveTask` (= changeStatus→FINALIZADA), `returnTask` (= changeStatus→DEVOLVIDA com observação obrigatória), `addHistoryEntry`
- Tudo em memória; seed com ~15 tarefas cobrindo todos os status, incluindo devolvidas e atrasadas, e 5 colaboradores

## 12. Estrutura de arquivos

```
src/
  main.tsx
  App.tsx
  types.ts
  index.css
  data/mockData.ts
  context/AppContext.tsx
  utils/date.ts, utils/status.ts, utils/priority.ts
  components/
    layout/Sidebar.tsx, Topbar.tsx, KPICards.tsx
    tasks/TasksTable.tsx, TaskRow.tsx, TaskKanban.tsx, TaskCard.tsx
    tasks/StatusBadge.tsx, PriorityBadge.tsx, CycleStepper.tsx, DueDateCell.tsx
    collaborators/CollaboratorCard.tsx
    modal/Modal.tsx, ConfirmDialog.tsx
    modals/TaskFormModal.tsx, TaskDetailModal.tsx, ReassignModal.tsx,
           ApproveModal.tsx, ReturnModal.tsx, HistoryModal.tsx, CollaboratorDetailModal.tsx
```

## 13. Fora de escopo

Backend, banco de dados, autenticação, integrações externas, notificações reais, persistência em servidor.

## 14. Verificação

- Build sem erros (`tsc` + `vite build`)
- Testes manuais de todos os fluxos do ciclo de vida
- QA visual (consistência, responsividade, estados)
