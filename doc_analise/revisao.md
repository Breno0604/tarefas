# Revisão do Frontend — TaskFlow CRM

> Auditoria crítica do frontend (código, responsividade, lacunas, UX/consistência).
> Escopo: frontend completo/navegável, dados fictícios, sem backend/API/banco. Nenhum código foi alterado nesta etapa.
> Inventário: 42 arquivos em `src/` (~8.000 LOC), 9 páginas/rotas, 4 visualizações de tarefas, 8 usuários, 6 projetos, 8 categorias, 5 perfis de acesso.

---

## 1. Revisão de código

### Pontos fortes
- **Organização por camadas limpa**: `pages/`, `components/`, `components/ui/` (design system próprio), `store/`, `lib/`, `data/`. Componentes de UI são pequenos, reutilizáveis e consistentes (Button, Modal, Drawer, Dropdown, Badge, EmptyState, ConfirmDialog, Pagination, Skeleton, Tooltip, ProgressBar).
- **Estado centralizado e previsível** (`store.jsx`): `useReducer` puro, helpers `useStore`, `useCurrentUser`, `useActiveProfile`, `useTaskById`, `useTaskComments`. Ações tipadas e idempotentes na maioria.
- **Histórico de atividades e notificações automatizado** no reducer (uma ação de tarefa gera as atividades e notificações correspondentes) — ótimo para protótipo.
- **Menu de tarefa centralizado** em `taskMenu.js` (usado por card, lista e tabela) — evita triplicar a lógica de "mover para / prioridade / excluir".
- **Undo de exclusão via toast** (`toast.push` + `RESTORE_TASK`), inclusive para exclusão em massa — padrão de UX de alta qualidade.
- Dark/light consistente via classe `.dark`, tema persistido em `localStorage`, atalhos de teclado globais (Ctrl+K, N, F, /, 1–4, ?).
- Rota de detalhe de tarefa via query param `?task=` com drawer — permite deep-link a partir de qualquer tela.

### Problemas de código (detalhados na seção 5 com prioridades)
1. **Ordenação da visualização Tabela quebrada** — contrato de sort incompatível entre `TaskTableView` e `TasksPage`.
2. **Paleta de comandos com ações mortas** — item de usuário não faz nada; item de projeto navega para query param ignorado.
3. **Atividades de perfil/restauração sem ícone/label** — tipos `profile` e `restore` gerados pelo store não são cobertos em `ActivityFeed` nem em `ActivitiesPage`.
4. **Contrato de props `onChange` inconsistente** entre os três visualizadores de tarefas.
5. **Lógica de dismiss (fora + Esc) duplicada** em 7 componentes (Dropdown, ContextMenu, TaskPreview, NotificationsPanel, Modal, Drawer, CommandPalette).
6. **Monolitos**: `TasksPage.jsx` (805 linhas: filtros, ordenação, paginação, seleção em massa, filtros salvos, atalhos) e `AppLayout.jsx` (370 linhas).
7. **Nomenclatura ambígua**: `UPDATE_PROFILE` (usuário atual) vs `UPDATE_ACCESS_PROFILE` (perfil de acesso).
8. **Código morto/redundante**: `currentUserId` repetido em `MOCK_STATE` e `initialState`; `doneCount` calculado e descartado em `TOGGLE_SUBTASK`; wrapper `CalendarEmptyIcon` no Dashboard; Settings locais que não persistem (idioma, fuso, `firstDay`, modo compacto).
9. **Atividades não geradas em algumas ações**: limpar vencimento/projeto/categoria (checagem truthy), editar perfil, trocar perfil ativo, criar categoria, editar usuário.

---

## 2. Responsividade (desktop → notebook → tablet → celular → landscape)

### Como o layout responde hoje
| Faixa | Comportamento atual | Avaliação |
|---|---|---|
| Desktop ≥1280px (`xl`) | Sidebar fixa, grid 3–4 colunas, header completo | Bom |
| Notebook 1024–1280px (`lg`) | Sidebar fixa, grids 2–3 colunas, badges extras aparecem | Bom |
| Tablet 768–1024px (`md`) | Sidebar vira drawer (hambúrguer), colunas md de filtros, colunas da lista aparecem (status/prioridade) | Bom em geral |
| Celular <768px (`sm`/base) | Sidebar em drawer, header enxuto, grids de 1 coluna, modais quase full-screen | **Com lacunas graves** |
| Landscape (altura reduzida) | Modais centralizam com `sm:items-center`; headers sticky; desce com scroll | Razoável, mas prever teste |

### Pontos de quebra problemáticos
1. **Kanban sem touch** — `KanbanView` usa HTML5 drag-and-drop nativo (`draggable` + `onDragStart`/`onDrop`). Em tablet/celular não há como mover tarefas entre colunas; a ação principal da tela fica indisponível. Sem alternativa por teclado.
2. **Calendário inutilizável no celular** — `CalendarView` usa `grid grid-cols-7` fixo com células `min-h-[104px]`. Em telas <640px cada célula tem ~40px de largura (títulos truncados em 1 linha), sem quebra para lista mensal nem scroll horizontal. O calendário só é funcional em telas largas.
3. **Ações "hover-only" inacessíveis em touch** — em `TaskCard`, `TaskListItem` e `TaskTableView`, estrela de favorito e menu "..." ficam com `opacity-0` até hover; em dispositivos sem hover dependem de `focus` (não garantido em tap). O preview de tarefa (`TaskPreview`) só abre em `mouseenter` (delay 400ms) — inexistente no touch.
4. **Tabela com `min-w-[800px]` + `overflow-x-auto`** — aceitável (padrão), mas em celular exige scroll horizontal em todas as colunas; considerar esconder colunas em telas pequenas (a lista já faz isso com `hidden md:flex`/`lg:flex`).
5. **Dropdowns sem `max-w`** — o seletor de perfil no header usa `w-72` e pode estourar em telas muito estreitas; `Dropdown` não tem `max-w`/reposicionamento (só `right-0`/`left-0`).
6. **Toasts e painel de notificações** já usam `w-[min(380px,calc(100vw-24px))]` — bom.
7. **Grids de cards** usam `grid-cols-1 → sm:2 → xl:3/4` em todas as páginas — bom padrão, sem overflow horizontal.
8. **Header** é o ponto mais denso no mobile: menu, busca, modo foco, atalhos, tema, sino, perfil, Nova tarefa. Alguns elementos somem por breakpoint, mas a densidade no celular merece revisão (ex.: agrupar em overflow).

---

## 3. Lacunas do frontend

### Fluxos incompletos ou "mortos"
- **CommandPalette → usuário**: selecionar um usuário na busca não executa nada (não navega, não filtra).
- **CommandPalette → projeto**: navega para `/projetos?proj=X`, mas `ProjectsPage` **não lê** o parâmetro `proj` — nada acontece ao abrir a página.
- **Projetos → "Ver tarefas deste projeto"**: apenas exibe toast "Filtro aplicado" e fecha o drawer; não navega nem aplica filtro real.
- **Equipe → "Ver dashboard"**: só mostra toast "Gráfico de carga disponível no Dashboard" sem navegar.
- **Equipe → tarefa no modal do membro**: clicar numa tarefa só mostra toast "Abra a tarefa na página de Tarefas" (enquanto em Projetos a mesma ação navega — inconsistência).
- **Equipe → "Convidar membro"**: simulado (avisa "protótipo"), mas o novo membro nunca entra na lista — sem rastro do convite.
- **Configurações**: `bio` é editável mas **não é enviada** no `UPDATE_PROFILE`; idioma, fuso, início de semana e modo compacto são estados locais que **não persistem nem afetam o app** (dead config). Modo compacto explicitamente avisa "(protótipo)".
- **Atividades**: tipos `profile` (criar/excluir perfil) e `restore` (desfazer exclusão) são gerados no store mas não têm ícone na UI (`ActivityFeed`) nem filtro/label (`ActivitiesPage`).

### Estados vazios / loading / erro / feedback
- **Vazios**: bem cobertos — `EmptyState` em tarefas, projetos, categorias, equipe, atividades, perfis, comentários, dashboard. (Bom)
- **Loading**: `PageSkeleton` no boot (650ms) e `CardSkeleton` em Tarefas. Dashboard renderiza direto (sem skeleton). Aceitável para protótipo.
- **Erro**: não há `ErrorBoundary` nem tratamento de erro de runtime. (Gap baixo para protótipo, porém recomendável.)
- **404**: rota `*` redireciona para `/` sem tela de "página não encontrada".
- **Feedback inconsistente**: mudança de status/prioridade via menu no card/lista dispara "Tarefa atualizada" genérico; no `TaskDetailDrawer`, mudar status via dropdown **não** mostra toast (`msg` indefinida); no Kanban, drag usa toast próprio "Tarefa movida para X". Toasts existem, mas são inconsistentes em granularidade.
- **Confirmações**: boas — excluir (individual, em massa), restaurar dados, sair e excluir perfil têm confirmação/undo. (Bom)

### Lacunas estruturais
- **Permissões só como camada visual, parcial**: o gating existe no `Sidebar` e em alguns botões do header, mas **as rotas não são protegidas** e **as ações de tarefa não verificam permissão** (detalhes na seção 5, Crítico C2). A feature "perfis" (recém-entregue) fica inconsistente com o resto da UI.
- **Nível admin não auto-aplica permissões**: ao criar/editar um perfil com nível "Administrador", as permissões não são preenchidas com o conjunto total (o hint do formulário afirma "acesso total", mas o estado não muda).

---

## 4. UX e consistência geral

### O que está bem
- Visual polido e consistente: design system próprio (tokens brand/surface, sombras, keyframes), dark mode completo, tipografia e espaçamentos uniformes.
- Navegação clara com sidebar + breadcrumb por título; deep-link de tarefa por URL.
- Feedback visual rico: badges de status/prioridade/vencimento, avatares com status online, progress bars, gráficos no dashboard.
- Atalhos de teclado globais e modais de ajuda; busca global (paleta de comandos).
- Empty states com CTA; undo de exclusão com ação no toast.

### Inconsistências de UX
1. **Termos duplicados/ambíguos**: "Perfil" aparece como aba de Configurações (dados do usuário) e como "Perfis de acesso" (permissões) — distinção correta na label, mas em `SettingsPage` a aba ainda se chama "Perfil".
2. **"Meu perfil" e "Preferências"** no menu do usuário navegam para a mesma rota `/configuracoes` sem selecionar a aba correspondente.
3. **"Ver calendário de prazos"** no Dashboard navega para `/tarefas` sem abrir a visualização Calendário.
4. **Datas**: `formatDay`/`formatDate`/`formatRelative` (pt-BR manual) são consistentes; mas `Dashboard` e `TeamPage` usam `toLocaleDateString('pt-BR')` em pontos isolados. Configuração "Início da semana" não afeta o `CalendarView` (sempre inicia em domingo).
5. **Gráficos do Dashboard**: tooltips e grid lines com cores claras fixas (`#fff`, `#e2e8f0`) — em dark mode o tooltip do recharts permanece claro (aceitável, mas inconsistente).
6. **Perfis e permissões divergem entre superfícies**: Sidebar gateia; header (dropdown "Gerenciar perfis") e CommandPalette não; rotas diretas também não.
7. **Acessibilidade**: `aria-label` presente na maioria dos botões icon-only; foco visível em Button; porém menús com `opacity-0` em hover, DnD sem alternativa de teclado e Select sem chevron próprio (`appearance-none`) prejudicam acessibilidade/usabilidade.
8. **Loading genérico de Tarefas**: o mesmo skeleton (grid de cards) é usado para as 4 visualizações, exceto kanban (`flex gap-4`) — não representa o formato da lista/tabela/calendário.

---

## 5. Resultado por prioridade

### CRÍTICO

**C1 — Ordenação da visualização Tabela não funciona**
- **Local**: `src/components/tasks/TaskTableView.jsx` (SortHeader → `onSort("${sortKey}_asc"/"_desc")`) e `src/pages/TasksPage.jsx` (switch `sortKey`).
- **Problema**: os cabeçalhos da tabela enviam chaves como `title_asc`, `status_asc`, `priority_asc`, `dueDate_asc`, mas o switch de `TasksPage` só trata `dueDate`, `dueDate_desc`, `priority`, `createdAt`, `title`. Todas as chaves com sufixo caem no `default` (sem ordenação).
- **Impacto**: a principal affordance da visualização Tabela está quebrada; clicar em Título/Status/Prioridade/Vencimento não ordena, parecendo um bug de produto.
- **Recomendação**: unificar o contrato — ex.: normalizar chaves em `TasksPage` (`title_asc` → tratar `startsWith`) ou gerar as chaves do `SORT_OPTIONS` na tabela; adicionar cases para `status`, `title` desc, etc. e cobrir com teste.

**C2 — Perfis de acesso: permissões não bloqueiam ações de tarefa nem protegem rotas**
- **Local**: `src/store/store.jsx` (reducer aceita `CREATE_TASK`/`UPDATE_TASK`/`DELETE_TASK` sem checar permissão); `src/components/tasks/TaskDetailDrawer.jsx` (excluir/duplicar/comentar/editar sempre habilitados); `src/components/tasks/TaskFormModal.jsx` (só `assigneeId` é bloqueado); `src/App.jsx` (rotas sem guard); `src/pages/ProfilesPage.jsx` (sem gate); `src/components/layout/CommandPalette.jsx` (navega sem gate).
- **Problema**: apenas o Sidebar e o header ("Nova tarefa", atalho N, reatribuição) respeitam permissões. Um perfil "Convidado / Leitura" (apenas `view_tasks`) ainda pode: criar/editar/excluir/duplicar tarefas pela página de Tarefas ou pelo drawer, criar/excluir perfis via `/perfis` (acessível por URL ou pelo dropdown do header), acessar Configurações/Equipe por URL.
- **Impacto**: o recurso central entregue na fase anterior (controle de acesso) é contradito pela própria UI — a simulação perde credibilidade e confunde o usuário.
- **Recomendação**: decidir o modelo — (a) gating completo: bloquear ações no reducer/componentes (ex.: `can('edit_tasks')` desabilita editar/excluir/duplicar/comentar) e proteger rotas com um guard que redireciona/avisa, ou (b) declarar explicitamente que é apenas visual e remover os elementos bloqueados inconsistentes. Alinhar header ("Gerenciar perfis"), CommandPalette e Sidebar ao mesmo critério.

### IMPORTANTE

**I1 — Paleta de comandos: usuário selecionado não faz nada**
- **Local**: `src/components/layout/CommandPalette.jsx` (`run()` — só trata `task`, `page`, `project`).
- **Problema**: o tipo `user` é listado/acionável mas cai no vazio.
- **Impacto**: busca por pessoas parece quebrada; fluxo prometido ("Buscar tarefas, pessoas, projetos...") incompleto.
- **Recomendação**: navegar para `/equipe?user=ID` (e ler o param na página) ou abrir o modal do membro; ou remover o grupo usuários.

**I2 — Paleta de comandos: navegação para projeto é morta**
- **Local**: `CommandPalette.jsx` (`/projetos?proj=…`) e `src/pages/ProjectsPage.jsx` (não usa `useSearchParams`).
- **Problema**: o parâmetro `proj` é enviado mas nunca lido.
- **Impacto**: abrir um projeto pela busca não abre nada (volta à página sem seleção).
- **Recomendação**: ler `proj` em `ProjectsPage` para abrir o drawer do projeto automaticamente (espelhar o padrão `?task=` de Tarefas).

**I3 — Atividades de perfil e restauração sem ícone/label**
- **Local**: `src/components/ActivityFeed.jsx` (`TYPE_ICON` sem `profile`/`restore`) e `src/pages/ActivitiesPage.jsx` (`TYPE_LABELS` sem `profile`/`restore`).
- **Problema**: o store gera atividades `profile` (criar/excluir perfil) e `restore` (desfazer), que caem no fallback (ícone de status) e não aparecem no filtro por tipo.
- **Impacto**: o histórico (recém-relevante com a feature de perfis) mostra ações de perfil com iconografia errada e não filtráveis.
- **Recomendação**: adicionar entradas `profile` e `restore` em ambos os mapas (ícones `Shield`/`RotateCcw`, labels "Perfil"/"Restauração").

**I4 — Fluxos "mortos" com toast no lugar de navegação/ação**
- **Local**: `ProjectsPage.jsx` ("Ver tarefas deste projeto"), `TeamPage.jsx` ("Ver dashboard" e tarefa no modal do membro), `TeamPage.jsx` ("Convidar membro" não adiciona membro).
- **Problema**: botões que prometem ação apenas exibem toast informativo.
- **Impacto**: sensação de protótipo "maquiado"; ações esperadas não acontecem; comportamento inconsistente entre páginas (Projetos navega para a tarefa; Equipe só avisa).
- **Recomendação**: ou completar os fluxos (navegar com query param, aplicar filtro real, adicionar convidado à lista) ou remover os botões/CTA e deixar só texto.

**I5 — Kanban: drag-and-drop sem suporte touch/teclado**
- **Local**: `src/components/tasks/KanbanView.jsx` + `TaskCard.jsx` (`draggable`).
- **Problema**: DnD nativo HTML5 não funciona em tablet/celular e não tem alternativa de acessibilidade.
- **Impacto**: em dispositivos touch, mover tarefas entre colunas é impossível — funcionalidade central da visualização indisponível.
- **Recomendação**: adicionar menu "Mover para" no card/`taskMenu` para todas as plataformas, ou usar lib de DnD com touch (ex.: dnd-kit) — mínimo: ação de mover via menu já existente.

**I6 — Calendário inutilizável em telas pequenas**
- **Local**: `src/components/tasks/CalendarView.jsx` (`grid grid-cols-7`, `min-h-[104px]`).
- **Problema**: sem quebra responsiva; em celular cada célula fica com ~40px.
- **Impacto**: visualização Calendário degrada drasticamente em mobile (texto truncado, células minúsculas).
- **Recomendação**: para `sm`/base, alternar para lista de dias ou grid compacto com células menores; garantir scroll horizontal como fallback.

**I7 — Configurações: campos "decorativos" e bio não salva**
- **Local**: `src/pages/SettingsPage.jsx` (`saveProfile` sem `bio`; estados `appearance`/`prefs`/`notifPrefs` locais) e `CalendarView.jsx` (ignora `firstDay`).
- **Problema**: `bio` editável é descartado no dispatch; idioma/fuso/início da semana/modo compacto não persistem nem influenciam nada.
- **Impacto**: usuário configura opções que não têm efeito; `bio` se perde ao trocar de aba.
- **Recomendação**: incluir `bio` no `UPDATE_PROFILE`; ou marcar explicitamente como "protótipo" os campos sem efeito; pelo menos persistir `firstDay` e aplicá-lo no calendário.

**I8 — Ações hover-only inacessíveis no touch**
- **Local**: `TaskCard.jsx`, `TaskListItem.jsx`, `TaskTableView.jsx` (estrela e "..." com `opacity-0`), `TaskPreview.jsx` (só `mouseenter`).
- **Problema**: elementos dependem de hover/focus.
- **Impacto**: em celular/tablet, favoritar e abrir menu exigem toque duplo ou ficam inacessíveis; preview nunca aparece.
- **Recomendação**: manter visíveis em `@media (hover: none)`/touch (ex.: `opacity-100` em toque ou detectar `pointer: coarse`); remover/simplificar preview em dispositivos sem hover.

**I9 — Perfil "Administrador" não aplica permissões padrão ao criar/editar**
- **Local**: `src/pages/ProfilesPage.jsx` (`openCreate`/`openEdit` usam `LEVEL_DEFAULTS` só no reset; mudar nível não ajusta permissões).
- **Problema**: o hint diz que admin recebe "acesso total", mas as permissões não mudam; um perfil admin pode acabar sem `manage_profiles`.
- **Impacto**: comportamento contraditório com o copy; risco de perfil mal configurado.
- **Recomendação**: ao selecionar nível, aplicar `LEVEL_DEFAULTS[level]` (e avisar que permissões custom podem ser ajustadas); ao mudar nível em edição, oferecer "aplicar padrão do nível".

**I10 — Gating inconsistente entre Sidebar, header, CommandPalette e rotas**
- **Local**: `Sidebar.jsx` (gateia), `AppLayout.jsx` (dropdown "Gerenciar perfis" sem gate), `CommandPalette.jsx` (sem gate e sem `/perfis`), `App.jsx` (rotas sem guard).
- **Problema**: a permissão é aplicada em uma superfície e ignorada em outras; a paleta também não lista "Perfis de acesso".
- **Impacto**: usuário com perfil restrito descobre atalhos que "furam" o bloqueio da sidebar.
- **Recomendação**: centralizar uma função `can(perm)` (já existe) e usá-la em CommandPalette (filtrar/esconder itens sem permissão, incluir `/perfis`), header e em um guard de rota.

### MELHORIA

**M1 — Monolitos: `TasksPage` (805 linhas) e `AppLayout` (370 linhas)**
- **Local**: `src/pages/TasksPage.jsx`, `src/components/layout/AppLayout.jsx`.
- **Problema**: filtros, ordenação, paginação, seleção em massa, filtros salvos, atalhos e 4 visualizações concentrados num componente; layout concentra header, perfis, paleta, atalhos e confirmações.
- **Impacto**: dificulta manutenção/teste; risco de regressão ao adicionar features.
- **Recomendação**: extrair hook `useTaskFilters` (filtros+ordenação+página) e componentes de barra de filtros; separar header/perfis/atalhos em subcomponentes.

**M2 — Nomenclatura ambígua `UPDATE_PROFILE` vs `UPDATE_ACCESS_PROFILE`**
- **Local**: `src/store/store.jsx`.
- **Problema**: `UPDATE_PROFILE` atualiza o usuário atual; `UPDATE_ACCESS_PROFILE` atualiza perfil de acesso.
- **Impacto**: confusão em leitura de código; risco de usar o dispatch errado.
- **Recomendação**: renomear para `UPDATE_CURRENT_USER` (ou `UPDATE_USER_PROFILE`) e manter `UPDATE_ACCESS_PROFILE`.

**M3 — `currentUserId` duplicado**
- **Local**: `src/data/mock.js` (`MOCK_STATE`) e `src/store/store.jsx` (`initialState`).
- **Problema**: valor definido duas vezes.
- **Impacto**: se um dia divergirem, comportamento inesperado.
- **Recomendação**: remover de `MOCK_STATE`, deixando só em `initialState`.

**M4 — Alterações que "limpam" campos não geram atividade**
- **Local**: `src/store/store.jsx` (`makeChangeActivities`: `patch.dueDate &&`, `patch.projectId &&`, `patch.categoryId &&`).
- **Problema**: usar valor truthy como teste impede registrar quando o campo é limpo (`null`/`''`).
- **Impacto**: histórico omite remoções de vencimento/projeto/categoria (inconsistente com o tratamento de `assigneeId`, que usa `'in'`).
- **Recomendação**: usar `'dueDate' in patch`, `'projectId' in patch`, `'categoryId' in patch`.

**M5 — `TOGGLE_SUBTASK` calcula e descarta `doneCount`; progress não é atualizado**
- **Local**: `src/store/store.jsx`.
- **Problema**: `doneCount` é calculado e não usado; `task.progress` nunca é sincronizado com subtarefas.
- **Impacto**: código morto; progresso de tarefas com subtarefas fica dessincronizado.
- **Recomendação**: calcular progresso a partir de subtarefas quando existirem, ou remover a variável.

**M6 — Ações sem atividade registrada**
- **Local**: `src/store/store.jsx` (`UPDATE_ACCESS_PROFILE`, `SET_CURRENT_PROFILE`, `CREATE_CATEGORY`, `UPDATE_PROFILE`).
- **Problema**: criar categoria, editar perfil, trocar perfil ativo e editar usuário não geram histórico (demais ações geram).
- **Impacto**: histórico incompleto/inconsistente.
- **Recomendação**: adicionar `activityEntry` para essas ações (tipos `category`, `profile`, etc.).

**M7 — Dismiss (fora + Esc) duplicado em 7 componentes**
- **Local**: `Dropdown.jsx`, `ContextMenu.jsx`, `TaskPreview.jsx`, `NotificationsPanel.jsx`, `Modal.jsx`, `Drawer.jsx`, `CommandPalette.jsx`.
- **Problema**: mesma lógica de `mousedown` fora + `Escape` copiada.
- **Impacto**: manutenção e risco de divergência (ex.: alguns usam `mousedown`, outros `click`).
- **Recomendação**: extrair hook `useDismissable(ref, onClose)`.

**M8 — Contrato `onChange` inconsistente entre visualizadores**
- **Local**: `TaskCard.jsx` (`(patch) => onChange(patch, task.id)`), `TaskListItem.jsx` (repassa `onChange` direto), `TaskTableView.jsx` (wrap), `TasksPage.jsx`.
- **Problema**: a assinatura muda conforme a origem; `taskMenu.js` depende do contrato certo.
- **Impacto**: frágil ao reutilizar; risco de dupla aplicação de id.
- **Recomendação**: padronizar: visualizadores recebem `onChange(patch, taskId)` e repassam ao `taskMenu` de forma uniforme.

**M9 — Confirmação de exclusão duplicada nos 3 visualizadores**
- **Local**: `TaskCard.jsx`, `TaskListItem.jsx`, `TaskTableView.jsx`.
- **Problema**: cada um possui seu próprio `ConfirmDialog` de exclusão.
- **Impacto**: copy divergente ("Excluir "X"?" vs "Você poderá desfazer").
- **Recomendação**: centralizar em `taskMenu`/wrapper com `useConfirm` ou componente compartilhado.

**M10 — `Select` sem indicador visual (chevron)**
- **Local**: `src/components/ui/Inputs.jsx` (`Select` com `appearance-none` e sem seta própria).
- **Problema**: parece um input de texto; usuário não percebe que é um select.
- **Impacto**: usabilidade em formulários (Projetos, Perfis, Configurações, Tarefas).
- **Recomendação**: adicionar chevron posicionado à direita.

**M11 — `NotificationsPanel`: `onClose` é um toggle inline frágil**
- **Local**: `AppLayout.jsx` (`onClose={() => setNotifOpen(!notifOpen)}`) + `NotificationsPanel.jsx`.
- **Problema**: o mesmo handler alterna o estado em vez de fechar; listeners de `mousedown`/`keydown` são re-registrados a cada render (dependência `onClose` instável).
- **Impacto**: risco de abrir/fechar inesperado e custo desnecessário de re-registro.
- **Recomendação**: passar `onOpenChange`/`onClose` puro e estabilizar com `useCallback`.

**M12 — Sidebar: card do usuário no rodapé sem ação**
- **Local**: `src/components/layout/Sidebar.jsx` (botão do usuário sem `onClick`).
- **Problema**: área clicável que não faz nada.
- **Impacto**: usuário espera abrir perfil/configurações.
- **Recomendação**: navegar para `/configuracoes` (tab perfil).

**M13 — Sem tela de 404**
- **Local**: `src/App.jsx` (`*` → `<Navigate to="/" />`).
- **Problema**: URL inexistente redireciona silenciosamente.
- **Impacto**: confusão em links antigos; sem feedback de erro.
- **Recomendação**: criar página 404 com CTA de voltar ao Dashboard.

**M14 — Pequenos deslizes no Dashboard**
- **Local**: `src/pages/Dashboard.jsx` (`CalendarEmptyIcon` renderiza `<Timer>`; tooltips/grid de gráficos com cores claras fixas).
- **Problema**: ícone errado no empty state de prazos; tooltip claro em dark mode.
- **Impacto**: detalhe visual inconsistente.
- **Recomendação**: usar ícone `CalendarDays`/`CalendarClock` e tooltip temático (dark/light).

**M15 — CTAs que não levam ao destino prometido**
- **Local**: `Dashboard.jsx` ("Ver calendário de prazos" → `/tarefas` sem visão Calendário), `AppLayout.jsx` (menu do usuário: "Meu perfil"/"Preferências" sem tab).
- **Problema**: navegam para a página, mas não para a aba/visão específica.
- **Impacto**: expectativa frustrada; clique extra.
- **Recomendação**: setar a visão/aba via query param e consumi-la na página.

**M16 — Feedback de alterações de status inconsistente**
- **Local**: `TaskDetailDrawer.jsx` (mudar status sem toast), `TasksPage.jsx` (`changeTask` sempre "Tarefa atualizada"), `KanbanView.jsx` (toast próprio).
- **Problema**: granularidade diferente de feedback para a mesma ação.
- **Impacto**: sensação de comportamento desigual.
- **Recomendação**: padronizar mensagens por tipo de alteração (ex.: "Movida para Em andamento").

**M17 — `SET_CURRENT_PROFILE` sem validação**
- **Local**: `src/store/store.jsx`.
- **Problema**: aceita `profileId` inexistente; `useActiveProfile` faz fallback para `profiles[0]` silenciosamente.
- **Impacto**: estado inconsistente se o id for inválido.
- **Recomendação**: validar no reducer (retornar `state` se não encontrar) e gerar toast de erro na UI.

---

## 6. Avaliação geral

### O que está bem
- **Base de código organizada e com design system próprio**, visual de alta qualidade, dark/light completo e consistência visual forte entre as 9 páginas e as 4 visualizações de tarefas.
- **Conceitos de produto bem executados**: undo de exclusão (individual e em massa), deep-link de tarefa, histórico de atividades e notificações gerados automaticamente, filtros salvos, empty states com CTA, atalhos de teclado, menu de tarefa centralizado.
- **Responsividade boa no topo da pirâmide**: desktop/notebook/tablet respondem bem (sidebar em drawer, grids adaptáveis, header enxuto).
- **Feature de perfis de acesso** foi integrada em várias superfícies (seletor no header, página dedicada, gating na sidebar e em Nova tarefa/reatribuição) com bons detalhes visuais (badges, nível, switches de permissão).

### Principais problemas e lacunas
1. **Inconsistência central do controle de acesso (Crítico)**: a simulação de perfis é aplicada em algumas superfícies e ignorada em outras (rotas sem guard, tarefas sem checagem de `edit/delete/create`, CommandPalette/header sem gating). Isso mina a feature recém-entregue.
2. **Bugs funcionais em fluxos prometidos (Crítico/Importante)**: ordenação da Tabela quebrada; busca de usuário na paleta sem ação; navegação de projeto na paleta morta; vários botões que só exibem toast.
3. **Mobile tem duas visualizações frágeis**: Kanban (sem touch) e Calendário (grid fixo), além de ações hover-only inacessíveis em touch.
4. **Campos "decorativos"** em Configurações (idioma, fuso, início da semana, modo compacto, bio) dão a impressão de feature pronta que não existe — gera expectativa quebrada.

### Riscos
- **Conceito de permissões contradito pela própria UI** é o maior risco de percepção de qualidade (parece bug, não simulação).
- **Funcionalidades "mortas"** (paleta, CTAs com toast) reforçam a impressão de protótipo inacabado, apesar do acabamento visual.
- **Dependência de hover/touch** pode fazer o app parecer "desktop-only" em dispositivos móveis, apesar do layout adaptativo.

### O que corrigir primeiro
1. **Crítico**: unificar o contrato de ordenação da Tabela (C1) e fechar o gating de permissões (C2 — ações de tarefa, rotas, CommandPalette, header).
2. **Importante com alto impacto percebido**: fluxos mortos (I1, I2, I3, I4) e mobile (I5 Kanban, I6 Calendário, I8 hover-only).
3. **Depois**: persistência/efeito das configurações (I7, I9), e por fim as melhorias estruturais (monolitos, hook de dismiss, nomenclatura).

---

## 7. Status das correções

> Fase de correções concluída em 20/08/2026. Itens de código corrigidos; smoke tests do store e da UI passando; `npm run build` sem erros.

### Críticos — corrigidos
- **C1** Ordenação da Tabela: contrato unificado via `parseSortKey` + `compareTasks` em `TasksPage.jsx` (chaves `_asc`/`_desc` de `TaskTableView` agora ordenam Título/Status/Prioridade/Vencimento).
- **C2** Perfis de acesso: guardas no reducer (`profileCan` em create/update/delete/duplicar/subtarefa/comentário/membro), gating de UI (`TaskDetailDrawer`, `TaskFormModal`, `CommandPalette`, `AppLayout`), rotas protegidas com `RequirePerm` e página `/perfis` gateada.

### Importantes — corrigidos
- **I1** Paleta → usuário navega para `/equipe?user=ID`.
- **I2** Paleta → projeto é lido em `ProjectsPage` (abre o drawer do projeto via `?proj=…`).
- **I3** Atividades `profile`/`restore` com ícones (`Shield`/`RotateCcw`) e labels ("Perfil"/"Restauração") em `ActivityFeed` e `ActivitiesPage`.
- **I4** Fluxos mortos completados: Projetos navega para `/tarefas?project=…`; Equipe navega para o Dashboard e para a tarefa; convite adiciona o membro à lista.
- **I5** Kanban: menu "…" do card com "Mover para" (fallback para touch/teclado); hint atualizado.
- **I6** Calendário responsivo: fallback em lista para telas `< sm` (`sm:hidden` / `hidden sm:block`).
- **I7** Configurações: `bio` enviada no `UPDATE_CURRENT_USER`; `firstDay` persistido e aplicado no `CalendarView`.
- **I8** Ações hover-only visíveis em touch (`sm:opacity-0 sm:group-hover:opacity-100`); preview só em `matchMedia('(hover: hover)')`.
- **I9** Perfil "Administrador" aplica `LEVEL_DEFAULTS[level]` ao mudar o nível no formulário.
- **I10** Gating centralizado via `can(perm)` em CommandPalette (inclui `/perfis`), header e guard de rotas.

### Melhorias — corrigidas
- **M2** `UPDATE_PROFILE` renomeado para `UPDATE_CURRENT_USER`.
- **M3** `currentUserId` duplicado removido de `MOCK_STATE` (permanece em `initialState`).
- **M4** `makeChangeActivities` usa `'dueDate' in patch` / `'projectId' in patch` / `'categoryId' in patch` (registra remoções) com mensagens adequadas.
- **M5** `TOGGLE_SUBTASK` sincroniza `progress` a partir das subtarefas; variável morta removida.
- **M6** Atividades adicionadas para `UPDATE_ACCESS_PROFILE`, `SET_CURRENT_PROFILE`, `CREATE_CATEGORY` e `UPDATE_CURRENT_USER`.
- **M9** Copy de confirmação de exclusão unificada nos 3 visualizadores.
- **M10** `Select` com chevron indicador (`ChevronDown` posicionado à direita).
- **M11** `NotificationsPanel` usa `onOpenChange` estável (setState do AppLayout); toggle frágil removido.
- **M12** Card do usuário na Sidebar navega para `/configuracoes`.
- **M13** Página 404 criada (`NotFoundPage`) e rota `*` mapeada para ela.
- **M14** `CalendarEmptyIcon` do Dashboard usa `CalendarClock` (antes `Timer`).
- **M15** CTAs com destino preciso via query params: Dashboard → `/tarefas?view=calendar` (lido em `TasksPage`); menu do usuário → `/configuracoes?tab=profile|preferences` (lido em `SettingsPage`).
- **M16** Alteração de status no `TaskDetailDrawer` exibe toast ("Movida para …").
- **M17** `SET_CURRENT_PROFILE` valida o `profileId` no reducer (no-op se inexistente/igual ao atual).

### Pendências (refactor estrutural, não bloqueantes)
- **M1** Monolitos `TasksPage`/`AppLayout` — extração de hooks/filtros fica para fase posterior.
- **M7** Hook `useDismissable` unificando o dismiss fora+Esc dos 7 componentes.
- **M8** Contrato `onChange` padronizado entre visualizadores.

---

*Auditoria concluída em 17/08/2026 — apenas diagnóstico; correções serão tratadas em fase posterior.*
