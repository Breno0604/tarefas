# Decisões da Diretoria — TaskFlow CRM

> Registro das decisões tomadas pela diretoria sobre as questões levantadas na análise de negócio (`analise-sistema-tarefas.html`).
> Data: 21/08/2026. Cada decisão deve ser refletida no código (Fase A do `proximos_passos.md`).

---

## A · Modelo de estados

### A1. Cancelamento de tarefas
**Decisão**: Criar o status **"Cancelada"**, com **motivo** e **quem decidiu** (registro obrigatório).

### A2. Pausa, bloqueio e suspensão
**Decisão**: Manter status **"Bloqueada"** e criar status **"Pausada"** separados. Sem status "Suspensa".

### A3. Fluxo formal de aprovação
**Decisão**: Criar ações **"Aprovar"** / **"Devolver"** com **motivo** e **notificação** ao responsável.

---

## B · Regras de negócio

### B4. Quem pode editar o quê
**Decisão**: A permissão "Editar tarefas" passa a valer **apenas para tarefas atribuídas a mim** (restrição por responsável, não por projeto).

### B5. Reatribuição de tarefas
**Decisão**: **Reatribuir somente gestores**. Membro não redistribui o próprio trabalho.

### B6. Tarefa sem responsável
**Decisão**: **Permitir** tarefas sem responsável e **apenas avisar no painel** (alerta visual, sem bloqueio).

### B7. Notificações
**Decisão**: Ampliar avisos para além de atribuição e comentário:
- Avisar **atraso/vencimento** ao responsável;
- Avisar **mudança de status das minhas tarefas**;
- Avisar **devolução** ao responsável;
- **Implementar menções** em comentários.

### B8. Tratamento de atraso
**Decisão**: **Avisar responsável e gestor** (sem escalonamento automático nem mudança de prioridade).

### B9. Comentário no perfil "Somente leitura"
**Decisão**: **Manter comentar = editar** (perfil somente leitura continua sem comentar — comportamento atual).

---

## C · Validações de coerência

### C10. Perfil "Gerente de Projetos"
**Decisão**: **Adicionar "Gerenciar equipe"** ao perfil padrão do Gerente.

### C11. Visibilidade de tarefas e indicadores
**Decisão**: Implementar **visão por projeto/equipe** (visão restrita, com base no escopo do usuário).

### C12. Perfis por pessoa
**Decisão**: **Permitir múltiplos perfis por pessoa** (um mesmo usuário pode ter mais de um perfil de acesso).

### C13. Horas reais e progresso
**Decisão**: **Manter apenas estimativas** (comportamento atual, sem registro de horas nem progresso manual).

### C14. Saída de membro
**Decisão**: **Permitir inativar/excluir membro** e **reatribuir** suas tarefas.

### C15. Alternar entre usuários
**Decisão**: **Permitir alternar entre usuários** (troca rápida do usuário ativo na simulação).

---

## Status de implementação

| # | Decisão | Status no código |
|---|---------|------------------|
| A1 | Status "Cancelada" com motivo e autor | Implementado |
| A2 | Status "Pausada" separado de "Bloqueada" | Implementado |
| A3 | Aprovar/Devolver com motivo e notificação | Implementado |
| B4 | Edição restrita às tarefas do responsável | Implementado |
| B5 | Reatribuição somente por gestores | Implementado |
| B6 | Tarefa sem responsável com aviso no painel | Implementado |
| B7 | Novas notificações (vencimento, status, devolução, menção) | Implementado |
| B8 | Aviso de atraso a responsável e gestor | Implementado |
| B9 | Manter comentar = editar | Já implementado |
| C10 | "Gerenciar equipe" no padrão do Gerente | Implementado |
| C11 | Visão por projeto/equipe | Implementado |
| C12 | Múltiplos perfis por pessoa | Implementado |
| C13 | Manter apenas estimativas | Já implementado |
| C14 | Inativar/excluir membro e reatribuir | Implementado |
| C15 | Alternar entre usuários | Implementado |

*Atualizar a coluna "Status no código" conforme a implementação avança.*
