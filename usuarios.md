# Gestão de Usuários no MVP — Mapeamento do Funcionamento Atual

> **Análise descritiva do comportamento REAL do código** (sem alterações).
> Fonte: `src/types.ts`, `src/data/mockData.ts`, `src/utils/permissions.ts`, `src/utils/status.ts`, `src/components/layout/Sidebar.tsx`, `src/components/sections/SectionColaboradores.tsx`, `src/components/collaborators/CollaboratorCard.tsx`, `src/components/modals/CollaboratorDetailModal.tsx`, `src/context/appReducer.ts`, `src/services/providers/LocalStorageProvider.ts` (commit `1ae77bd`).

## 0. Resumo executivo (o que existe e o que NÃO existe)

- **Não existe cadastro, edição, exclusão ou desativação de usuários em runtime.** Não há nenhuma ação no reducer (`AppAction`) nem nenhum formulário/modal para criar, alterar ou remover usuários.
- Os usuários são **dados estáticos** definidos em `src/data/mockData.ts` (`GESTOR`, `COLABORADORES`, `ALL_USERS`), lidos em memória. Não são persistidos no `localStorage` (lá só vão as tarefas).
- O que existe de "gestão de usuários" se resume a:
  1. **Tela de Colaboradores** (somente leitura): cards com métricas + modal de detalhe com as tarefas do colaborador.
  2. **Seletor de usuário** na sidebar (troca de "sessão" simulada, `SET_CURRENT_USER`).
  3. **Permissões estáticas** derivadas do cadastro + regra especial do gestor.
- Qualquer "mudança" de usuário ou permissão só é possível **editando o código** e reconstruindo o app.

---

## 1. Cadastro e criação de usuários

| Aspecto | Comportamento real |
|---|---|
| Existe fluxo de criação? | **Não.** Nenhuma ação do tipo `CREATE_USER`, nenhum formulário, nenhuma rota. |
| Como os usuários "nascem" | São objetos `Colaborador` declarados manualmente em `mockData.ts`: o gestor em `GESTOR` e os demais no array `COLABORADORES`; `ALL_USERS = [GESTOR, ...COLABORADORES]`. |
| Quem pode criar | Ninguém — nem o gestor. Não há interface nem ação para isso. |
| Persistência | Usuários **não são salvos**; a persistência (`LocalStorageProvider`) grava apenas `{ version, tasks }`. Se o seed mudar no código, o app reflete a mudança na próxima carga (quando não houver dados salvos válidos). |
| Efeito de "criar" via código | Novo objeto no array + rebuild. O app passa a exibi-lo nos pontos que iteram sobre `COLABORADORES`/`ALL_USERS` (seção, sidebar, seletor de usuário, selects de responsável). |

## 2. Edição dos dados dos usuários

- **Não existe.** Não há ação `UPDATE_USER`, nem formulário de edição, nem botões de editar nos cards/modais de colaborador.
- Nome, cargo, e-mail, cor e permissões são **imutáveis em runtime**. Qualquer alteração é edição de código em `mockData.ts`.
- Consequência prática: não há validação de formulário, nem gravação, nem histórico de alterações de cadastro de usuário.

## 3. Exclusão, desativação ou remoção de usuários

- **Não existe.** Não há ação de excluir/desativar usuário, nem campo de "ativo/inativo" no cadastro (`Colaborador` não tem `ativo`, `status` nem data de desativação).
- **O que aconteceria se um usuário deixasse de existir no código** (único caminho possível, via edição de `mockData.ts`) — efeitos reais mapeados no código atual:

| Efeito | Onde | Comportamento exato |
|---|---|---|
| `findUser(id)` retorna `undefined` | `mockData.ts` | Todas as buscas por usuário passam a falhar para aquele id |
| Nome em listas de tarefas vira "undefined" | `TaskRow` | `NOME_POR_ID[responsavelId]` sem entrada → texto "TA-XXX · undefined" |
| Avatar vira "?" cinza | `TaskRow`, `TaskCard`, `Sidebar`, `CollaboratorDetailModal` | Fallbacks `nome ?? '?'` e `cor ?? '#64748b'` |
| Papel passa a ser "colaborador" | `status.ts` `roleOf` | Qualquer id ≠ `carlos` é tratado como colaborador (mesmo inexistente) |
| Permissões zeram | `permissions.ts` `permissoesDe` | `findUser(...)?.permissoes ?? []` → `[]` |
| Métricas zeras | `tasks.ts` `colaboradorMetrics` | Sem tarefas próprias visíveis → ativas 0, taxa 0 |
| Tarefas órfãs continuam existindo | `appReducer`, `LocalStorageProvider` | Nada remove/revalida tarefas com `responsavelId` inexistente; a validação de persistência exige apenas que o id seja `string` |
| Ações sobre as tarefas do usuário removido | `permissions.ts` | Nenhum outro usuário passa a poder alterá-las (a não ser gestor ou quem tiver `alterar_status_outros`); permanecem atribuídas ao id órfão |

- Como não há desativação, **não existem regras de "usuário desativado"** (ex.: bloqueio de login, tarefas em aberto, transferência de tarefas).

## 4. Campos e configurações de cada usuário (`Colaborador`, em `src/types.ts`)

| Campo | Tipo | Obrigatório | Quem define | Automático? |
|---|---|---|---|---|
| `id` | `string` | ✅ | código (`mockData.ts`) | ❌ |
| `nome` | `string` | ✅ | código | ❌ |
| `cargo` | `string` | ✅ | código | ❌ |
| `email` | `string` | ✅ | código | ❌ |
| `cor` | `string` (hex) | ✅ | código | ❌ |
| `permissoes` | `Permission[]` (opcional) | ❌ | código | ❌ (ausente = nenhuma permissão; ver exceção do gestor) |

**Campos que NÃO existem:** senha, usuário de login, status ativo/inativo, datas de criação/atualização, time/departamento, avatar (imagem), notificações, idioma, etc.

**Derivações automáticas (não são campos, são calculadas):**
- **Papel** (`roleOf`): `'gestor'` se `id === 'carlos'` (constante `GESTOR_ID`); senão `'colaborador'`. Não é um campo do cadastro.
- **Permissões do gestor**: `permissoesDe('carlos')` retorna **todas** as 4 permissões, ignorando o campo `permissoes` (que o `GESTOR` nem declara).
- **Iniciais do avatar** (`colaboradorResumo`): derivadas do `nome` (primeira letra do primeiro e do último sobrenome, em maiúsculas).
- **Métricas** (`colaboradorMetrics`): derivadas das tarefas (ver seção 12).

## 5. Perfis e níveis de acesso

- **Dois perfis** (`Role`): `'gestor'` e `'colaborador'`.
- O perfil é **derivado do id** (única regra: `carlos` é gestor), não armazenado no cadastro.
- Níveis efetivos:
  - **Gestor** → todas as 4 permissões por construção (mesmo que o cadastro não liste nenhuma).
  - **Colaborador** → exatamente as permissões listadas em `permissoes`; ausente/`[]` = nenhuma.

### Permissões existentes (4 tipos, `Permission`)

| Permissão | Efeito no código | Onde é checada |
|---|---|---|
| `visualizar_todas_tarefas` | Ver tarefas que não são suas | `podeVer` / `tasksVisiveis` |
| `alterar_status_outros` | Mudar status de tarefas de outros responsáveis | `podeAlterarStatus` |
| `criar_tarefas` | Exibir o botão "+" (Nova Tarefa) na topbar | `Topbar` (somente UI; o reducer **não** valida `CREATE_TASK`) |
| `gerenciar_tarefas` | Editar, duplicar, excluir e reatribuir tarefas | UI (`TaskRow`, `TaskDetailModal`) **e** reducer (`UPDATE_TASK`, `DUPLICATE_TASK`, `DELETE_TASK`, `REASSIGN`) |

### Como as permissões são concedidas, alteradas e aplicadas

- **Concessão:** exclusivamente estática, via array `permissoes` de cada colaborador em `mockData.ts` (todos os 5 cadastrados hoje têm `['visualizar_todas_tarefas']`). O gestor recebe as 4 por construção (`TODAS_AS_PERMISSOES` em `permissions.ts`).
- **Alteração:** não existe mecanismo em runtime (sem UI, sem ação, sem persistência). Só via código.
- **Aplicação:** em tempo de execução, `permissoesDe(userId)` resolve a lista, e as funções `pode`, `podeVer`, `podeAlterarStatus`, `podeAlterarStatusPara`, `podeReabrir`, `tasksVisiveis` decidem cada ação; a UI esconde os botões correspondentes. A dupla verificação **UI + reducer** existe para as ações de gestão de tarefas.
- Não existe acúmulo dinâmico, herança de permissões nem auditoria de permissões.

## 6. O que cada tipo de usuário pode (matriz de ações)

| Ação | Gestor | Responsável da tarefa | Colaborador c/ `visualizar_todas_tarefas` | Colaborador c/ `alterar_status_outros` | Colaborador c/ `gerenciar_tarefas` | Colaborador sem permissões |
|---|---|---|---|---|---|---|
| Ver tarefas | ✅ todas | ✅ as suas | ✅ todas (ver, não agir) | ✅ as suas | ✅ as suas | ✅ as suas / ❌ as de outros |
| Avançar ciclo (receber/iniciar/concluir/retomar) | ❌ *(papel gestor não tem essas transições)* | ✅ nas suas | ✅ só nas suas | ✅ em qualquer (não reabrir) | ✅ só nas suas | ✅ só nas suas |
| Reabrir `CONCLUIDA → EM_EXECUCAO` | ✅ qualquer | ✅ nas suas | ❌ nas de outros | ❌ nas de outros | ❌ nas de outros | ❌ nas de outros |
| Aprovar / Devolver / Reabrir aprovação / Cancelar | ✅ (papel gestor) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Criar tarefa (botão "+") | ✅ | ⚠️ só com `criar_tarefas` | ⚠️ idem | ⚠️ idem | ⚠️ idem | ⚠️ idem |
| Editar tarefa | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Duplicar / Excluir tarefa | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Reatribuir responsável | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Favoritar / reordenar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver seção/modal de Colaboradores | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Trocar o usuário atual (seletor) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> Detalhe de permissão cruzada: `alterar_status_outros` habilita transições do ciclo em tarefas alheias, **mas não** o reabrir de entrega de terceiros (guard `podeAlterarStatusPara`/`podeReabrir` exige responsável ou gestor).

## 7. Limites de atuação e regras próprias × de outros

- **Chave da separação "própria × de outros" é `responsavelId` da tarefa** (não o criador). O `criadorId` **não confere nenhum poder** sobre a tarefa.
- Limites por perfil:
  - **Gestor:** pode ver e gerenciar tudo, mas **não executa o ciclo de colaborador** (não recebe, não inicia, não conclui, não retoma) — as transições de papel gestor na tabela `TRANSITIONS` não incluem essas arestas, nem mesmo quando ele é o responsável.
  - **Colaborador:** fora das próprias tarefas, só age com permissões específicas (`alterar_status_outros` para status; `visualizar_todas_tarefas` para visão; `gerenciar_tarefas`/`criar_tarefas` para gestão/criação).
- Bloqueios relacionados a usuários (já mapeados em `tarefas fluxo.md`, resumo):
  - Reatribuição proibida em `FINALIZADA`/`CANCELADA` (`podeReatribuir`) e exige motivo; reatribuição só com `gerenciar_tarefas`.
  - Reabrir entrega restrito a responsável/gestor.
  - Cancelamento exige motivo; devolução exige motivo.
  - No kanban não há drop em `DEVOLVIDA`/`CANCELADA` (força os modais com motivo).
- **O gestor nunca pode ser escolhido como responsável**: os selects de responsável (`TaskFormModal` criação e `ReassignModal`) listam apenas `COLABORADORES` (5), excluindo `carlos`.

## 8. Comportamento da interface de gestão de usuários

### 8.1 Seção "Colaboradores" (`SectionColaboradores`)

- Exibe um **grid de cards** — um para cada item de `COLABORADORES`. **O gestor não aparece** nessa seção (nem na lista da sidebar).
- Acesso: item "Colaboradores" no menu da sidebar, disponível para **qualquer usuário** (sem gate de permissão).
- **Sem busca, sem filtro, sem ordenação** específica de usuários nesta tela (a busca da topbar filtra tarefas, e o filtro "Responsável" da barra de filtros atua sobre tarefas, não sobre usuários).

### 8.2 Card de colaborador (`CollaboratorCard`)

- Conteúdo: avatar (iniciais + cor), nome, cargo e **4 métricas**: Ativas, Finalizadas, Atrasadas, Conclusão (%).
- As métricas são calculadas sobre **as tarefas visíveis ao usuário logado** (`tasksVisiveis`) — perspectiva do observador, não absoluta.
- É um **botão de leitura**: clique abre o `CollaboratorDetailModal`. **Não há** botões de editar/excluir/ativar/desativar.
- Nota de definição: "Finalizadas" aqui conta apenas `FINALIZADA` (diferente do KPI "Concluídas", que soma `CONCLUIDA` + `FINALIZADA`).

### 8.3 Modal de detalhe do colaborador (`CollaboratorDetailModal`)

- Abre com `modal = { type: 'colaborador', colaboradorId }` (a partir do card ou da sidebar).
- Conteúdo: avatar grande, nome, cargo, e-mail; 4 KPIs (Ativas, Finalizadas, Atrasadas, Conclusão); lista das **tarefas visíveis** cujo `responsavelId` é o colaborador, com prazo e status.
- Clicar numa tarefa abre o `TaskDetailModal` dessa tarefa (com todas as ações/permissões da tarefa em questão).
- Se o `colaboradorId` não existir, o modal renderiza `null` (nada).
- **Sem nenhum recurso de gestão** (sem edição, sem exclusão, sem alterar permissões, sem reatribuir em lote).

### 8.4 Sidebar

- Bloco "Colaboradores": lista os 5 colaboradores com nome + badge de **tarefas ativas** (contagem sobre `tasksVisiveis`; badge só aparece se > 0). Clique → navega para a seção Colaboradores **e** abre o modal de detalhe.
- Bloco "Usuário atual" (rodapé): avatar do usuário logado + **seletor** com todos os usuários (`ALL_USERS`, incluindo o gestor). Trocar dispara `SET_CURRENT_USER`.
  - Sem senha/confirmação; sem restrição de quem pode trocar (qualquer usuário pode "logar como" qualquer outro — sessão simulada).
  - Trocar de usuário **não** reseta filtros/seção/visão, **não** altera tarefas persistidas e **não** entra na pilha de undo.
  - O app **sempre inicia como gestor** (`currentUserId` inicial = `GESTOR_ID`); o usuário escolhido **não é persistido**.

### 8.5 Formulários, botões e filtros relacionados a usuários

| Recurso | Existe? | Detalhe |
|---|---|---|
| Formulário criar usuário | ❌ | — |
| Formulário editar usuário | ❌ | — |
| Botão excluir/desativar usuário | ❌ | — |
| Alterar permissões na UI | ❌ | — |
| Busca de usuários | ❌ | A busca global filtra tarefas; não há busca de cadastro |
| Filtro "Responsável" | ✅ | Na barra de filtros de **Tarefas** — filtra tarefas pelo `responsavelId`; as opções são os 5 colaboradores |
| Seletor de responsável (criar/reatribuir) | ✅ | `TaskFormModal` (só na criação) e `ReassignModal` — lista `COLABORADORES`, exigindo motivo na reatribuição |
| Seletor de usuário atual | ✅ | Sidebar, `ALL_USERS`, sem validações |

## 9. Validações e regras aplicadas aos dados de usuários

- **Não há validação de cadastro** (não há formulário nem gravação de usuários).
- **Única validação indireta:** ao carregar o `localStorage`, `LocalStorageProvider.isTask` exige que `responsavelId` e `criadorId` sejam `string` — **não verifica** se o usuário existe em `ALL_USERS`.
- `findUser` retorna `undefined` para ids desconhecidos e os componentes aplicam fallbacks (nome "?", cor `#64748b`); `roleOf` trata qualquer id ≠ `carlos` como colaborador; `permissoesDe` retorna `[]`.
- O mapa `NOME_POR_ID` é gerado de `ALL_USERS` (usado para exibir nomes e gravar o **nome** do autor no histórico — o histórico guarda nome, não id).

## 10. Relações entre usuários e tarefas

- **`responsavelId`** → é o "dono executante": define visibilidade (`podeVer`), permissão de alterar status (`podeAlterarStatus`), direito de reabrir (`podeReabrir`) e as métricas do colaborador. Pode ser trocado por quem tem `gerenciar_tarefas`, em tarefa não encerrada, com motivo (gera entrada de histórico do tipo `info`; **não** muda o status).
- **`criadorId`** → apenas registro (quem criou/duplicou). Sem poderes.
- **Histórico** → grava o `usuario` (nome) que executou cada ação.
- **Colaborador → tarefas:** o modal de colaborador lista as tarefas visíveis do usuário; cards e sidebar usam `colaboradorMetrics` (sobre `tasksVisiveis`).
- **Persistência:** as tarefas podem referenciar usuários; os usuários não dependem das tarefas (sem cascata — remover usuário via código não remove/revalida tarefas).

## 11. Informações manuais × automáticas

| Item | Manual (código) | Automático (sistema) |
|---|---|---|
| id, nome, cargo, email, cor, permissoes | ✅ `mockData.ts` | ❌ |
| Papel (gestor/colaborador) | ❌ | ✅ derivado do id (`roleOf`) |
| Permissões do gestor | ❌ | ✅ todas por construção |
| Iniciais do avatar | ❌ | ✅ `colaboradorResumo(nome)` |
| Métricas dos cards/modal/sidebar | ❌ | ✅ `colaboradorMetrics` sobre tarefas visíveis |
| Tarefas atribuídas por usuário | ❌ | ✅ filtro por `responsavelId` |
| Usuário logado inicial | ❌ | ✅ sempre gestor na carga |

## 12. Referência rápida de arquivos

| Assunto | Arquivo |
|---|---|
| Interface `Colaborador`, `Permission`, `Role` | `src/types.ts` |
| Usuários do seed (GESTOR, COLABORADORES, ALL_USERS, findUser, NOME_POR_ID) | `src/data/mockData.ts` |
| Papel e transições por papel | `src/utils/status.ts` |
| Permissões (concessão/checagem) | `src/utils/permissions.ts` |
| Troca de usuário (única ação de "usuário" do reducer) | `src/context/appReducer.ts` (`SET_CURRENT_USER`) |
| Seção Colaboradores + cards + modal | `src/components/sections/SectionColaboradores.tsx`, `collaborators/CollaboratorCard.tsx`, `modals/CollaboratorDetailModal.tsx` |
| Lista de colaboradores + seletor de usuário | `src/components/layout/Sidebar.tsx` |
| Botão "+" gated por `criar_tarefas` | `src/components/layout/Topbar.tsx` |
| Validação de persistência (apenas tarefas) | `src/services/providers/LocalStorageProvider.ts` |
