# Próximos Passos — TaskFlow CRM

> Documento de continuidade da implementação, baseado em:
> - `analise-sistema-tarefas.html` — análise de negócio apresentada à diretoria;
> - `revisao.md` — auditoria técnica do frontend (críticos/importantes/melhorias e status das correções).

---

## 1. Decisões pendentes da diretoria (bloqueiam o roadmap)

Antes de implementar novas regras, a diretoria precisa decidir os pontos abaixo (seção "Decisões" da análise de negócio). Sem essas definições, há risco de retrabalho.

1. **Status "Cancelada" / "Pausada"**: incluir novos estados no ciclo de vida ou manter apenas os 5 atuais?
2. **Fluxo de revisão**: criar a figura de **revisor formal** (só revisor aprova/devolve) ou manter revisão aberta a qualquer pessoa com edição?
3. **Conclusão de tarefa**: restringir conclusão ao responsável (ou ao revisor) ou manter permissão geral?
4. **Escopo de edição**: edição global para quem tem permissão ou restringir por projeto/equipe?
5. **Notificações**: quais avisos devem ser reais (vencimento, atraso, menção, mudança de status) além de atribuição e comentário?
6. **Perfil "Gerente de Projetos"**: incluir a permissão "Gerenciar equipe" no perfil padrão?
7. **Relatório de horas**: medir tempo real por tarefa ou manter apenas prazos?
8. **Meta de progresso**: manter progresso derivado de subtarefas ou permitir valor manual?

> Ao final desta etapa, documentar as decisões em um `DECISOES.md` e refleti-las no código.

---

## 2. Fase A — Fundação de negócio (curto prazo)

Aplicar as regras aprovadas pela diretoria na camada de dados e estado.

- **A1. Modelo de estados**: adicionar/ajustar status conforme decisão 1, atualizando `src/lib/constants.js`, colunas do Kanban, badges e o fluxo de transições permitidas.
- **A2. Regras de transição**: validar no `store` as transições permitidas (ex.: não concluir direto de "A fazer" se a diretoria exigir passar por "Em revisão"; registrar motivo de bloqueio/devolução).
- **A3. Revisor formal**: criar campo `reviewerId` na tarefa e regra de aprovação/devolução conforme decisão 2.
- **A4. Responsabilidade de conclusão**: regra de conclusão conforme decisão 3 (apenas responsável/revisor).
- **A5. Escopo de permissões**: aplicar escopo por projeto/equipe conforme decisão 4, estendendo o gating atual (rotas já protegidas; agora granularizar as ações).
- **A6. Correção de perfil**: revisar o perfil padrão "Gerente de Projetos" (decisão 6) e o comportamento de aplicar permissões padrão por nível.

---

## 3. Fase B — Confiabilidade dos dados (curto/médio prazo)

- **B1. Notificações reais**: implementar avisos aprovados (decisão 5) — vencimento próximo, atraso, menção em comentário, mudança de status — no `store` e no painel de notificações.
- **B2. Persistência real**: enquanto não há backend, persistir estado em `localStorage` para que dados, perfis e preferências sobrevivam ao recarregamento.
- **B3. Horas e progresso**: conforme decisões 7 e 8, adicionar registro de horas e/ou progresso manual.
- **B4. Validações de entrada**: data de vencimento, prioridade e campos obrigatórios com feedback claro no formulário de tarefa.

---

## 4. Fase C — Endurecimento técnico (pendências da revisão)

Pendências estruturais da `revisao.md` (não bloqueantes, priorizar em seguida):

- **C1. Monolitos (M1)**: extrair `useTaskFilters` (filtros + ordenação + paginação) e subcomponentes de `TasksPage.jsx` (805 linhas) e `AppLayout.jsx` (370 linhas).
- **C2. Hook `useDismissable` (M7)**: unificar dismiss fora + Esc dos 7 componentes (Dropdown, ContextMenu, TaskPreview, NotificationsPanel, Modal, Drawer, CommandPalette).
- **C3. Contrato `onChange` (M8)**: padronizar assinatura entre `TaskCard`, `TaskListItem`, `TaskTableView` e `TasksPage`.
- **C4. Testes automatizados**: cobrir com smoke/unit tests as regras de estado (transições, permissões, undo, atividades) e os contratos de ordenação — hoje a validação é manual.

---

## 5. Fase D — Backend e colaboração (médio prazo)

- **D1. Backend/API**: substituir dados mock por API real (usuários, projetos, tarefas, comentários, histórico, notificações) quando houver infraestrutura.
- **D2. Autenticação**: login real e sessões; amarrar o usuário logado ao perfil de acesso.
- **D3. Convidar membros**: fluxo real de convite (hoje é simulado no protótipo).
- **D4. Reversão do protótipo**: remover avisos de "protótipo" (modo compacto, convites) conforme features forem implementadas.

---

## 6. Critérios de aceite para cada fase

- Regras de negócio aprovadas documentadas em `DECISOES.md` e refletidas no código.
- `npm run build` sem erros e smoke tests do store/UI passando.
- Nenhuma permissão contornável (rotas, ações e atalhos respeitam `can(perm)`).
- Notificações e histórico de atividades coerentes com as ações executadas.
- Responsividade mantida (Kanban com "Mover para", Calendário com fallback em lista no mobile).

---

## 7. Ordem sugerida de execução

```
1. Diretoria decide (seção 1) → registrar em DECISOES.md
2. Fase A (regras de negócio no código)
3. Fase B (notificações, persistência, validações)
4. Fase C (refactor técnico + testes)
5. Fase D (backend/API) — quando houver infraestrutura
```

*Documento de planejamento — revisar a cada nova rodada de apresentação à diretoria.*
