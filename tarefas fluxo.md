# Mapeamento do Funcionamento Atual do MVP — TaskFlow

> **Análise descritiva do comportamento REAL do código** (sem alterações).
> Base: `src/` (tipos, reducer, permissões, componentes) e `src/services/` (persistência), commit `1ae77bd`.
>
> - Papéis são definidos por `roleOf()` em `src/utils/status.ts`: usuário `carlos` = **gestor**; qualquer outro = **colaborador**.
> - A "sessão" é simulada: o app abre sempre como gestor e o usuário pode ser trocado no seletor da sidebar (`SET_CURRENT_USER`). O `currentUserId` **não** é persistido.

---

## 1. Fluxo das tarefas

### 1.1 Status existentes (7)

Definidos em `src/types.ts` (`TaskStatus`) e rotulados em `src/utils/status.ts`:

| Status | Rótulo | Significado no sistema |
|---|---|---|
| `NOVA` | Nova | Criada, ninguém pegou ainda |
| `RECEBIDA` | Recebida | Responsável aceitou (clicou "Receber") |
| `EM_EXECUCAO` | Em execução | Em andamento |
| `CONCLUIDA` | Concluída | Entregue, **aguardando aprovação do gestor** |
| `DEVOLVIDA` | Devolvida | Gestor devolveu para correção |
| `FINALIZADA` | Finalizada | Aprovada pelo gestor (terminal) |
| `CANCELADA` | Cancelada | Cancelada com motivo (terminal) |

Ordem de exibição no stepper de ciclo (`STATUS_ORDER`): `NOVA → RECEBIDA → EM_EXECUCAO → CONCLUIDA → FINALIZADA` (com `CANCELADA` fora do stepper e `DEVOLVIDA` tratada à parte, exibida como etapa "Concluída" atual + selo "Devolvida").

### 1.2 Transições permitidas (regra canônica)

Tabela `TRANSITIONS` em `src/utils/status.ts` + função `canTransition(from, to, role)`. **Papel (role) é a primeira barreira**; a permissão granular vem depois (seção 2).

| De | Para | Papel que pode | Ação na UI |
|---|---|---|---|
| `NOVA` | `RECEBIDA` | colaborador | Receber |
| `NOVA` | `CANCELADA` | gestor | Cancelar |
| `RECEBIDA` | `EM_EXECUCAO` | colaborador | Iniciar |
| `RECEBIDA` | `CANCELADA` | gestor | Cancelar |
| `EM_EXECUCAO` | `CONCLUIDA` | colaborador | Concluir |
| `EM_EXECUCAO` | `CANCELADA` | gestor | Cancelar |
| `CONCLUIDA` | `FINALIZADA` | gestor | Aprovar e finalizar |
| `CONCLUIDA` | `DEVOLVIDA` | gestor | Devolver |
| `CONCLUIDA` | `EM_EXECUCAO` | colaborador **e** gestor | Reabrir |
| `DEVOLVIDA` | `EM_EXECUCAO` | colaborador | Retomar |
| `DEVOLVIDA` | `CANCELADA` | gestor | Cancelar |
| `FINALIZADA` | `EM_EXECUCAO` | gestor | Reabrir aprovação |

**Não existem transições** saindo de `CANCELADA` nem para `CANCELADA` a partir de `CONCLUIDA`/`FINALIZADA`. Não há transição direta `NOVA → EM_EXECUCAO` etc. — o fluxo é sequencial (avanço um passo por vez).

### 1.3 Ações que movem a tarefa e onde aparecem

Cada ação tem **duas camadas de bloqueio**: a transição pelo papel (tabela acima) e a permissão do usuário sobre aquela tarefa (`podeAlterarStatusPara`). Os botões visíveis na linha/card/detalhe já são o resultado dessa interseção.

| Ação | De | Quem vê o botão | Caminho na UI |
|---|---|---|---|
| **Receber** | `NOVA` | colaborador com permissão (ver 1.4) | Botão de ciclo (linha/card) ou "Receber tarefa" (detalhe) |
| **Iniciar** | `RECEBIDA` | colaborador com permissão | Botão de ciclo ou "Iniciar execução" (detalhe) |
| **Concluir** | `EM_EXECUCAO` | colaborador com permissão | Botão "Concluir" **sempre via diálogo de confirmação** (linha/card e detalhe) |
| **Reabrir** | `CONCLUIDA` | responsável da tarefa ou gestor (`podeReabrir`) | Botão "Reabrir" (linha/card) ou "Reabrir tarefa" (detalhe) |
| **Retomar** | `DEVOLVIDA` | colaborador com permissão | Botão "Retomar" (linha/card) ou "Retomar após correção" (detalhe) |
| **Aprovar** | `CONCLUIDA` | gestor | **Apenas no modal de detalhes** → "Aprovar e finalizar" (abre `ApproveModal`) |
| **Devolver** | `CONCLUIDA` | gestor | **Apenas no modal de detalhes** → "Devolver" (abre `ReturnModal`) |
| **Reabrir aprovação** | `FINALIZADA` | gestor | Botão no detalhe ("Reabrir aprovação") e botão de ciclo na linha/card |
| **Cancelar** | `NOVA`, `RECEBIDA`, `EM_EXECUCAO`, `DEVOLVIDA` | gestor | Botão "Cancelar" sempre via `CancelModal` (motivo obrigatório) |
| **Reatribuir responsável** | qualquer, exceto `FINALIZADA`/`CANCELADA` | quem tem `gerenciar_tarefas` (na prática, gestor) | Botão "Alterar responsável" (linha/card/detalhe) → `ReassignModal` |

> **Observação importante:** Devolver, Aprovar e Cancelar **existem apenas no modal de detalhes** da tarefa (a não ser o cancelar, que também é botão de ciclo na linha/card — ambos abrem o `CancelModal`). Na linha e no card, o gestor vê apenas as ações de ciclo mapeadas em `cycleActionFor` (`RECEBIDA`, `EM_EXECUCAO`, `CONCLUIDA`, `CANCELADA`).

### 1.4 Regras e condições de cada mudança de status

Guards aplicados pelo reducer (`appReducer`, ação `CHANGE_STATUS`), **nesta ordem**:

1. A tarefa precisa existir.
2. `podeAlterarStatusPara(usuário, tarefa, novoStatus)`:
   - Transição `CONCLUIDA → EM_EXECUCAO` (reabrir): **somente responsável da tarefa ou gestor** (`podeReabrir`) — retirar da fila de aprovação é decisão do executor ou do gestor.
   - Qualquer outra: gestor, responsável da tarefa ou quem tem `alterar_status_outros`.
3. `canTransition(statusAtual, novoStatus, papel)` — a tabela 1.2.
4. Se `novoStatus === 'CANCELADA'`: **motivo (`observacao`) é obrigatório** (o botão da UI força o `CancelModal`, que só confirma com texto não vazio).

**Efeitos colaterais de toda mudança de status** (no reducer):

- `atualizadaEm` = timestamp atual (ISO).
- Nova entrada no `historico` (tipo `status`, com `statusAnterior`, `novoStatus`, `usuario` = nome do usuário atual e observação quando houver).
- `concluidaEm`: gravada ao entrar em `CONCLUIDA`; **mantida** ao ir para `FINALIZADA`; **apagada (undefined)** em qualquer outra transição — ou seja, reflete apenas a conclusão mais recente. Se a tarefa for reaberta e concluída de novo, a data é sobrescrita.
- Toast de sucesso ("Tarefa recebida", "Tarefa em execução", "Tarefa concluída — aguardando análise", "Tarefa devolvida", "Tarefa finalizada", "Tarefa cancelada") com botão **Desfazer** (undo), se o estado realmente mudou.
- Mudança de status entra na pilha de undo (limite de 50; ver seção 5).

**Diferença de comportamento entre lista/card e kanban:**
- Na lista e no card, "Concluir" sempre passa por **confirmação** (`ConfirmDialog`); no **kanban**, arrastar o card para a coluna `CONCLUIDA` conclui **sem confirmação**.
- No kanban, **nunca é possível soltar em `DEVOLVIDA` ou `CANCELADA`** (o drop é bloqueado para forçar o uso dos modais com motivo). Soltar em `FINALIZADA` (gestor, de `CONCLUIDA`) é permitido e **não** passa por modal.
- A ordenação da fila de aprovação: quando o único filtro de status é `CONCLUIDA`, a lista ordena por **tempo de espera (mais antigo primeiro) e depois prioridade** (`filterTasks`). `diasAguardandoAprovacao` usa `concluidaEm` (ou a última entrada `CONCLUIDA` do histórico, ou `atualizadaEm`/`criadaEm` como fallback).

---

## 2. Permissões dos usuários

### 2.1 Perfis

- **Gestor** — `roleOf(userId)`: única conta com id `carlos` (`GESTOR_ID`). **Tem todas as permissões por construção** (`permissoesDe` retorna a lista completa sem ler o cadastro).
- **Colaborador** — qualquer outro id. Permissões vêm do campo `permissoes` do cadastro (`Colaborador.permissoes`); **ausente = nenhuma permissão**.

### 2.2 Permissões existentes (4 tipos)

Definidas em `src/types.ts` (`Permission`) e avaliadas em `src/utils/permissions.ts`:

| Permissão | Efeito exato no código | Onde é checada |
|---|---|---|
| `alterar_status_outros` | Permite mudar status de tarefas de **outros** responsáveis (além das próprias) | `podeAlterarStatus` |
| `visualizar_todas_tarefas` | Permite **ver** tarefas que não são suas | `podeVer` / `tasksVisiveis` |
| `criar_tarefas` | Libera o botão "+" (Nova Tarefa) na topbar | `Topbar` (somente UI — o reducer **não** valida `CREATE_TASK`) |
| `gerenciar_tarefas` | Libera editar, duplicar, excluir e reatribuir | `TaskRow`/`TaskDetailModal` (UI) **e** `appReducer` (`UPDATE_TASK`, `DUPLICATE_TASK`, `DELETE_TASK`, `REASSIGN`) |

### 2.3 Matriz de ações (o que cada um pode)

Legenda: ✅ permitido · ❌ bloqueado · ⚠️ condicionado (descrito ao lado).

| Ação | Gestor (carlos) | Responsável da tarefa (colaborador) | Colaborador c/ `alterar_status_outros` | Colaborador sem permissão |
|---|---|---|---|---|
| Ver a tarefa | ✅ (todas) | ✅ (as suas) | ✅ (as suas) ⚠️ (`visualizar_todas_tarefas` para ver as demais) | ✅ as suas / ❌ as de outros |
| Avançar status do ciclo (receber/iniciar/concluir/retomar) | ❌ *(papel gestor não tem essas transições)* | ✅ nas suas | ✅ em qualquer tarefa (respeitando a tabela 1.2) | ✅ só nas suas |
| Reabrir `CONCLUIDA → EM_EXECUCAO` | ✅ em qualquer | ✅ nas suas | ❌ em tarefas de outros | ❌ em tarefas de outros |
| Aprovar / Devolver / Reabrir aprovação / Cancelar | ✅ (papel gestor) | ❌ | ❌ | ❌ |
| Criar tarefa | ✅ (tem `criar_tarefas`) | ⚠️ apenas se tiver `criar_tarefas` | ⚠️ idem | ⚠️ idem |
| Editar (título, descrição, prazo, prioridade, categoria, tags) | ✅ (tem `gerenciar_tarefas`) | ❌ (não tem `gerenciar_tarefas`) | ❌ | ❌ |
| Reatribuir responsável | ✅ | ❌ | ❌ | ❌ |
| Duplicar | ✅ | ❌ | ❌ | ❌ |
| Excluir | ✅ | ❌ | ❌ | ❌ |
| Favoritar/desfavoritar | ✅ em qualquer visível | ✅ | ✅ | ✅ (qualquer visível) |
| Reordenar por arrasto | ✅ | ✅ (sem filtros) | ✅ | ✅ (sem filtros) |

**Exceções especiais do gestor (documentadas em `permissions.ts`):**
- É a única conta que **sempre** tem todas as permissões, independente do cadastro.
- Pode mudar status de **qualquer** tarefa (via transições de papel gestor).
- Pode reabrir `CONCLUIDA` mesmo sem ser o responsável (regra compartilhada com o responsável).
- **Mas não pode** fazer as transições "de colaborador" (receber, iniciar, concluir, retomar) — o papel gestor não tem essas arestas na tabela `TRANSITIONS`, mesmo sendo o responsável da tarefa.

**Usuários do seed (todos os 5 colaboradores cadastrados):** `joao`, `maria`, `pedro`, `ana`, `lucas` — **todos** têm apenas `['visualizar_todas_tarefas']`. Na prática, hoje todos enxergam todas as tarefas, mas **nenhum** tem `criar_tarefas` nem `gerenciar_tarefas`: só o gestor consegue criar/editar/duplicar/excluir/reatribuir pelo app.

---

## 3. Limites e restrições (bloqueios)

### 3.1 Bloqueios por status

| Restrição | Onde | Detalhe |
|---|---|---|
| Reatribuir em tarefas encerradas | `podeReatribuir(status)` + botões | `FINALIZADA` e `CANCELADA` **não** exibem "Alterar responsável" e o reducer recusa `REASSIGN` |
| Cancelar exige motivo | `CHANGE_STATUS` + `CancelModal` | Sem `observacao` não vazia, a transição para `CANCELADA` é descartada |
| Devolver exige motivo | `ReturnModal` (obrigatório) | Botão só confirma com texto |
| Reatribuir exige motivo | `ReassignModal` (obrigatório) | Idem; se o responsável escolhido for o mesmo, o modal apenas fecha (sem ação) |
| Reabrir restrito | `podeAlterarStatusPara` | `CONCLUIDA → EM_EXECUCAO` só para responsável/gestor (mesmo com `alterar_status_outros`) |
| Kanban não aceita soltar em Devolvida/Cancelada | `TaskKanban.canDropOn` | Colunas `DEVOLVIDA` e `CANCELADA` recusam drop (destino só via modal, com motivo) |
| Edição com `responsavelId` é rejeitada | `appReducer` `UPDATE_TASK` | Se `changes` contiver `responsavelId` (ou campo fora da whitelist), a ação inteira é ignorada; responsável só muda via `REASSIGN` |
| Form de edição não permite trocar responsável | `TaskFormModal` | O `<select>` de responsável só existe no modo criação |

### 3.2 Restrições de edição de campos (whitelist)

`UPDATE_TASK` só aplica: `titulo`, `descricao`, `prazo`, `prioridade`, `categoria`, `tags`. Campos como `id`, `status`, `criadorId`, `criadaEm`, `historico`, `favorita` **não** são editáveis por essa via. Se nenhum campo da whitelist mudou de fato, nada acontece (nem histórico, nem `atualizadaEm`). Comparações: `tags` por conteúdo/ordem; `categoria` normaliza vazio.

### 3.3 Restrições de UI

| Restrição | Onde |
|---|---|
| Botão "Nova Tarefa" só com `criar_tarefas` | `Topbar` |
| Botões editar/duplicar/excluir/reatribuir só com `gerenciar_tarefas` | `TaskRow`, `TaskDetailModal` |
| Reordenação por arrasto **apenas** sem busca, filtros ou ordenação (`reorderEnabled`) | `SectionTarefas` / `TasksTable` (banner de aviso é exibido quando bloqueada) |
| Card arrastável no kanban só se `podeAlterarStatus` | `TaskCard` |
| Tarefa "parada" é um filtro derivado: sem movimentação há **≥ 7 dias** (`PARADAS_MIN_DIAS`) e não `FINALIZADA`/`CANCELADA` | `filterTasks`/`computeIndicators` |
| Atrasadas: `prazo < hoje` e status **não** `FINALIZADA`, `CANCELADA`, `CONCLUIDA` (concluída aguardando aprovação nunca conta como atrasada) | `isOverdue` (`src/utils/date.ts`) |

### 3.4 Undo (Desfazer)

- Toda ação que altera o array de tarefas empilha o estado anterior (`past`), **exceto** `TOGGLE_FAVORITE` e `REORDER_TASKS` (fora da pilha por design).
- Limite de **50** estados (`UNDO_LIMIT`). A pilha **não** é persistida.
- O `UNDO` restaura **apenas as tarefas** (não restaura usuário, filtros, seção, modais).
- O toast "Desfazer" aparece somente quando a ação mudou tarefas **e** tem mensagem (`toastMessage`): criar, atualizar, duplicar, excluir, reatribuir e mudanças de status.

---

## 4. Configuração das tarefas

### 4.1 Campos e propriedades (`src/types.ts` — `Task`)

| Campo | Tipo | Obrigatório | Quem define | Automático? |
|---|---|---|---|---|
| `id` | `string` | ✅ | sistema | ✅ sequencial `TA-NNN` (`nextTaskId`: maior sufixo numérico + 1) |
| `titulo` | `string` | ✅ (form exige texto) | quem cria (gestor na prática) | ❌ |
| `descricao` | `string` | ❌ | quem cria/edita | ❌ |
| `responsavelId` | `string` | ✅ (form exige) | quem cria (no select); muda só via `REASSIGN` | ❌ |
| `criadorId` | `string` | ✅ | sistema | ✅ = usuário atual na criação; na duplicação vira o usuário que duplicou |
| `prioridade` | `'baixa' \| 'media' \| 'alta' \| 'critica'` | ✅ (default `media`) | quem cria/edita | ❌ |
| `prazo` | `string \| null` (ISO `yyyy-mm-dd`) | ❌ (null = sem prazo) | quem cria/edita | ❌ |
| `status` | `TaskStatus` | ✅ | sistema | ✅ sempre `NOVA` na criação/duplicação |
| `favorita` | `boolean` (opcional) | ❌ | qualquer usuário (botão estrela) | padrão `false` |
| `categoria` | `string` (opcional) | ❌ (undefined = sem) | quem cria/edita | ❌ |
| `tags` | `string[]` (opcional) | ❌ (padrão `[]`) | quem cria/edita (separadas por vírgula) | ❌ |
| `criadaEm` | `string` ISO | ✅ | sistema | ✅ timestamp de criação |
| `atualizadaEm` | `string` ISO (opcional) | ❌ | sistema | ✅ atualizado em criar/editar/mudar status/favoritar/reatribuir/duplicar |
| `concluidaEm` | `string` ISO (opcional) | ❌ | sistema | ✅ ao entrar em `CONCLUIDA`; mantida em `FINALIZADA`; removida ao reabrir |
| `historico` | `HistoryEntry[]` | ✅ | sistema | ✅ entradas em criar/mudar status/editar/reatribuir/duplicar |

### 4.2 Campos obrigatórios vs opcionais (formulário — `TaskFormModal`)

- **Obrigatórios:** Título (não vazio) e Responsável (select — na criação).
- **Opcionais:** Descrição, Prioridade (default `media`), Prazo, Categoria, Tags.
- Na **edição**, o responsável não é editável; os demais campos vêm preenchidos.
- Validação do botão: `titulo.trim() !== '' && responsavelId.trim() !== ''`.

### 4.3 Regras de histórico (`HistoryEntry`)

Cada entrada tem: `id` único, `dataHora` ISO, `usuario` (**nome**, não id), `statusAnterior`, `novoStatus`, `tipo` (`status` = transição, `info` = edição/observação), `observacao?`.

- **Criação:** `null → NOVA` com "Tarefa criada.".
- **Mudança de status:** `statusAnterior → novoStatus` (+ observação se houver).
- **Edição:** `tipo: 'info'`, sem mudança de status, com texto descritivo ("Título alterado de X para Y; Prioridade alterada de Z para W") — apenas para os 4 campos editáveis (título, descrição, prazo, prioridade); mudanças só de categoria/tags não geram entrada.
- **Reatribuição:** `tipo: 'info'` com a observação do motivo.
- **Duplicação:** `null → NOVA` com "Tarefa duplicada de {id}.".
- O modal de histórico exibe as entradas em ordem cronológica.

### 4.4 Relacionamentos

- **Tarefa → Responsável (`responsavelId`)**: único dono ativo; quem executa o ciclo. Pode ser trocado apenas com `gerenciar_tarefas` + tarefa não encerrada + motivo.
- **Tarefa → Criador (`criadorId`)**: quem criou/duplicou; **não confere nenhum poder especial** — o criador não é tratado como "dono" por `podeVer`/`podeAlterarStatus` (quem manda é `responsavelId`, papel e permissões).
- **Tarefa → Status**: regido pela tabela 1.2.
- **Tarefa → Prioridade**: rank `critica > alta > media > baixa` para ordenação/indicadores.
- **Tarefa → Datas**: `criadaEm`/`atualizadaEm`/`concluidaEm` alimentam "aguardando gestor", "paradas" e a fila de aprovação.
- **Tarefa → Categoria/Tags**: strings livres usadas em filtros; a lista de categorias do filtro é derivada das categorias **visíveis** ao usuário.

---

## 5. Configuração dos usuários

### 5.1 Dados do cadastro (`Colaborador`)

| Campo | Tipo | Uso |
|---|---|---|
| `id` | `string` | Chave; `carlos` identifica o gestor (`roleOf`, `permissoesDe`) |
| `nome` | `string` | Exibição, avatares, histórico (nome do usuário atual nas entradas) |
| `cargo` | `string` | Exibição (cards, seletor de usuário) |
| `email` | `string` | Exibição no modal do colaborador |
| `cor` | `string` (hex) | Cor do avatar |
| `permissoes` | `Permission[]` (opcional) | Permissões adicionais; ausente = nenhuma; **ignorada para o gestor** (tem todas) |

### 5.2 Como o cadastro influencia o comportamento

- `roleOf(userId)` → `'gestor'` se `id === 'carlos'`, senão `'colaborador'`. Determina **quais transições** o usuário tem (tabela 1.2).
- `permissoesDe(userId)` → gestor: todas; colaborador: `findUser(userId)?.permissoes ?? []`. Determina **sobre quais tarefas** pode agir (`podeVer`, `podeAlterarStatus`, `podeReabrir`).
- `findUser`/`NOME_POR_ID` → nome/cor para exibição; usuário desconhecido cai em `nome = id` como fallback.
- O seletor da sidebar (`ALL_USERS`) permite trocar a "sessão" para qualquer usuário cadastrado a qualquer momento.

### 5.3 Métricas por colaborador (`colaboradorMetrics`)

Calculadas apenas sobre as tarefas **visíveis** ao usuário atual (`tasksVisiveis`): `ativas` (responsabilidade − finalizadas), `concluidas` (só `FINALIZADA`), `atrasadas` (`isOverdue`), `taxaConclusao` (`round(finalizadas/total × 100)`, 0 se sem tarefas). Exibidas nos cards da seção Colaboradores, no modal do colaborador e nos contadores da sidebar. **Nota:** "Concluídas" aqui conta apenas `FINALIZADA`, diferentemente do KPI "Concluídas" (que soma `CONCLUIDA` + `FINALIZADA`).

---

## 6. Regras de negócio

### 6.1 Regras gerais (implementadas)

1. **Ciclo sequencial com aprovação do gestor**: ninguém pula etapas; `CONCLUIDA` é um estado de espera; só o gestor aprova (`FINALIZADA`), devolve (`DEVOLVIDA`) ou reabre aprovação.
2. **Encerramento só pelo gestor**: `FINALIZADA` e `CANCELADA` são terminais e exigem papel gestor; `CANCELADA` exige motivo.
3. **Executor da tarefa = responsável**: colaborador só avança o ciclo de tarefas em que é responsável (ou com `alterar_status_outros`).
4. **Reabrir é decisão do executor ou do gestor**: `CONCLUIDA → EM_EXECUCAO` restrita a responsável/gestor.
5. **Tarefa encerrada é imutável no fluxo**: sem reatribuição, sem cancelamento a partir dela; único movimento possível é `FINALIZADA → EM_EXECUCAO` (gestor).
6. **Todo movimento é auditado**: qualquer mudança de status/edição/reatribuição gera entrada no histórico com autor e timestamp.
7. **Tudo é desfazível** (exceto favoritar/reordenar): undo restaura o array de tarefas anterior (limite 50).
8. **Atraso desconsidera a fila de aprovação**: `CONCLUIDA` nunca é contada como atrasada.
9. **Tarefa parada = ≥7 dias sem movimentação** (e não encerrada).
10. **IDs e timestamps automáticos**: `TA-NNN` sequencial; criação/atualização/conclusão gravadas pelo sistema.
11. **Persistência local com fallback seguro**: dados inválidos/corrompidos → descartados → app cai no seed (ver seção 7).
12. **Favoritar e reordenar não têm restrição de permissão** (qualquer usuário, sobre qualquer tarefa visível; reordenar só sem filtros).

### 6.2 Exceções e condições específicas

| # | Condição | Exceção/Comportamento |
|---|---|---|
| E1 | Colaborador com `visualizar_todas_tarefas` | Vê todas, mas continua sem poder agir sobre as de outros (salvo `alterar_status_outros`) |
| E2 | Colaborador com `alterar_status_outros` | Avança ciclo em tarefas alheias, **menos** reabrir `CONCLUIDA` (exigência de responsável/gestor) |
| E3 | Gestor responsável por tarefa | Não pode "receber/iniciar/concluir/retomar" (papel gestor não tem essas arestas) |
| E4 | `CREATE_TASK` no reducer | **Não** valida `criar_tarefas`; a permissão é garantida só escondendo o botão na UI |
| E5 | Duplicar | Copia dados, mas zera o ciclo: status `NOVA`, nova data, sem `concluidaEm`, sem favorito; `criadorId` = quem duplicou |
| E6 | Concluir no kanban | Soltar o card em `CONCLUIDA` conclui **sem** diálogo de confirmação (na lista/card, concluir sempre confirma) |
| E7 | Soltar em `FINALIZADA` | Permitido (gestor) **sem** modal/observação — aprovacao direta |
| E8 | Aprovação sem observação | `ApproveModal` permite vazio; grava "Aprovada pelo gestor." |
| E9 | Mesmo responsável na reatribuição | Modal fecha sem nenhuma ação (no-op) |
| E10 | Reset de filtros | `RESET_FILTERS` limpa os filtros mas **preserva** a ordenação escolhida |

### 6.3 O que NÃO está implementado (não presumir)

- Sem autenticação/login real: a troca de usuário é um seletor local; `currentUserId` não persiste.
- Sem backend: `FutureApiProvider` (ativado por `VITE_STORAGE_PROVIDER=api`) é um **stub** que sempre retorna `null` (cai no seed) e apenas loga avisos.
- Sem e-mails, notificações, comentários, anexos, sub-tarefas, metas, ou qualquer ciclo além do descrito.
- O perfil "gestor" é **hardcoded** pelo id `carlos`; não existe campo `role` no cadastro.

---

## 7. Persistência e dados iniciais (seed)

### 7.1 Persistência (`src/services/`)

- Chave: `tarefas.app.v1` (version `1`). Salva **apenas as tarefas** (o payload é `{ version, tasks }`), em toda mudança de tarefas (efeito `useEffect`).
- **Validação na leitura** (`LocalStorageProvider`): shape de cada tarefa (ids, status/prioridade dentro dos enums, prazo no formato, histórico válido). Tarefas inválidas são **descartadas individualmente**; versão diferente, JSON corrompido ou ausência de dados → `null` → **fallback para o seed**.
- **Não persistido:** usuário atual, filtros, seção/view, pilha de undo. Única exceção de UI: `kpiCollapsed` (chave separada `kpiCollapsed`).
- Falha ao salvar (quota/serialização) apenas loga `console.warn`, sem derrubar o app.

### 7.2 Dados iniciais (`src/data/mockData.ts` + `src/utils/seedGenerator.ts`)

- **Base verbatim (TA-001..TA-016):** 16 tarefas manuais cobrindo todos os status, com históricos completos (inclusive exemplos de devolução e reabertura).
- **Geradas (TA-017..TA-070, 54 tarefas):** determinísticas (PRNG `mulberry32` com seed `20260706`), simulando uso em dias úteis de 06/07/2026 a 05/08/2026. Distribuição por status: `NOVA` 6, `RECEBIDA` 6, `EM_EXECUCAO` 10, `CONCLUIDA` 8, `DEVOLVIDA` 5, `FINALIZADA` 14, `CANCELADA` 5.
- Regras do gerador: criador sempre o gestor; categorias por área do responsável (75% das tarefas); tags em ~60%; favorito ~10%; sem prazo ~12%; devoluções/observações de cancelamento e aprovação a partir de pools de texto; **tarefas `CONCLUIDA` nunca são atribuídas ao `joao`** (requisito do teste de permissão do kanban).
- `SEED_EXTRA_COUNT` expõe o total gerado (54).

---

## 8. Referência rápida de arquivos (onde cada coisa mora)

| Assunto | Arquivo |
|---|---|
| Tipos (Task, Colaborador, Permission, Filters, ModalState) | `src/types.ts` |
| Tipos de estado/ações do app | `src/context/types.ts` |
| Papel, status, labels, transições, reatribuição, próximo passo | `src/utils/status.ts` |
| Permissões (podeVer, podeAlterarStatus, podeReabrir, tasksVisiveis) | `src/utils/permissions.ts` |
| Reducer (guards + efeitos de cada ação, undo) | `src/context/appReducer.ts` |
| Contexto, persistência automática, toast+undo | `src/context/AppContext.tsx` |
| Mensagens de toast por ação | `src/context/toastMessage.ts` |
| Filtros, ordenação, indicadores, criação de tarefa, ids | `src/utils/tasks.ts` |
| Datas (prazo, atraso, janelas, dias desde) | `src/utils/date.ts` |
| Ações visuais do ciclo (ícones/rótulos) | `src/components/tasks/cycleActions.ts` |
| Botões por perfil/status (linha, card, detalhe) | `TaskRow.tsx`, `TaskCard.tsx`, `TaskDetailModal.tsx` |
| Regras de drop do kanban | `TaskKanban.tsx` |
| Modais com motivo obrigatório | `CancelModal`, `ReturnModal`, `ReassignModal` |
| Formulário criar/editar (obrigatórios, responsável só na criação) | `TaskFormModal.tsx` |
| Persistência (validação e fallback) | `services/providers/LocalStorageProvider.ts`, `services/index.ts` |
| Seed determinístico | `utils/seedGenerator.ts` |
