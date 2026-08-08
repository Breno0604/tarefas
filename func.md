# Backlog de melhorias — TaskFlow

Análise do estado atual do projeto (fluxo GTD, quadro/listagem, filtros de Status/Prioridade/Categoria/Prazo/Favoritas/Busca, KPIs, favoritos, subtarefas, anotações, histórico, lembretes, recorrência, undo, tema claro/escuro, persistência local).

Nenhuma sugestão abaixo está implementada. São melhorias pequenas, independentes e de baixa complexidade, prontas para serem feitas **uma por vez**, sem alterar a lógica principal do app.

## Prioridade Alta — muito úteis e de implementação simples

### 1. Filtro por tags
- **Descrição objetiva:** adicionar um MultiSelect "Tags" na barra de filtros, no mesmo padrão do filtro de Categoria.
- **Problema que resolve:** as tarefas já possuem tags (`bug`, `urgente`, etc.), mas não há como filtrar por elas — o dado existe e fica sem uso no dia a dia.
- **Comportamento esperado:** o filtro lista as tags presentes nas tarefas; ao selecionar uma ou mais, a lista/quadro mostra apenas tarefas que possuem ao menos uma delas; a opção "Limpar" funciona como nos demais filtros.
- **Benefício prático:** triagem rápida por tópicos transversais às categorias, sem mudança no modelo de dados.

### 2. Contagem de resultados visíveis ("X de Y tarefas")
- **Descrição objetiva:** exibir, acima da lista/quadro, quantas tarefas estão visíveis após busca/filtros em relação ao total.
- **Problema que resolve:** ao filtrar, o usuário não sabe o quanto a lista reduziu nem se há itens ocultos.
- **Comportamento esperado:** texto discreto (ex.: "12 de 58 tarefas") que aparece apenas quando há busca ou filtro ativo.
- **Benefício prático:** percepção imediata do efeito dos filtros; evita a impressão de que tarefas "sumiram".

### 3. Limpar a busca com a tecla Esc
- **Descrição objetiva:** ao pressionar Esc com o foco no campo de busca, limpar o termo.
- **Problema que resolve:** limpar a busca exige clicar no "X" ou apagar o texto manualmente.
- **Comportamento esperado:** Esc no campo de busca limpa o valor (e devolve o foco à página); com o campo vazio, Esc apenas remove o foco.
- **Benefício prático:** fluxo de busca/limpeza mais rápido para quem usa teclado.

### 4. Contador de atrasadas no título da aba
- **Descrição objetiva:** atualizar `document.title` com o total de tarefas atrasadas (ex.: "3 atrasadas · TaskFlow").
- **Problema que resolve:** o usuário precisa abrir o app para saber se há pendências vencidas.
- **Comportamento esperado:** sempre que as tarefas mudarem, recalcular as atrasadas e atualizar o título; sem atrasadas, manter o título padrão.
- **Benefício prático:** visibilidade imediata de pendências mesmo com a aba em segundo plano.

## Prioridade Média — úteis, mas não essenciais

### 5. Persistir a visualização Lista/Quadro
- **Descrição objetiva:** salvar a última visualização escolhida no `localStorage`, como já ocorre com o tema e o estado dos KPIs.
- **Problema que resolve:** ao recarregar a página, a visualização sempre volta para "lista".
- **Comportamento esperado:** ao alternar a view, persistir a escolha; ao abrir o app, restaurar a última usada.
- **Benefício prático:** continuidade de uso para quem prefere o quadro.

### 6. Números por status no filtro de Status
- **Descrição objetiva:** exibir a contagem de tarefas ao lado de cada opção no dropdown de Status.
- **Problema que resolve:** o usuário não sabe quantas tarefas existem em cada status antes de filtrar.
- **Comportamento esperado:** cada opção mostra o total (ex.: "Em andamento · 12").
- **Benefício prático:** decisão de filtragem baseada em dados, sem consulta manual.

### 7. Nova tarefa por coluna no Kanban
- **Descrição objetiva:** botão "+" em cada coluna do quadro que abre o formulário já criando a tarefa no status da coluna.
- **Problema que resolve:** criar uma tarefa já direcionada a um status exige criar e depois mover.
- **Comportamento esperado:** ao clicar no "+" da coluna, o formulário abre e, ao confirmar, a tarefa é criada diretamente no status da coluna.
- **Benefício prático:** entrada rápida de tarefas já posicionadas no fluxo GTD.

### 8. Prazo relativo nos cards e linhas
- **Descrição objetiva:** exibir o prazo de forma relativa (hoje, amanhã, em 3 dias, há 2 dias) no card/linha, com a data completa no tooltip.
- **Problema que resolve:** datas absolutas exigem interpretação mental do calendário.
- **Comportamento esperado:** o indicador de prazo mostra texto relativo quando pertinente, mantendo o destaque de atrasadas atual.
- **Benefício prático:** leitura rápida da urgência na listagem e no quadro.

### 9. Busca por tags (#tag)
- **Descrição objetiva:** incluir as tags no texto pesquisado e interpretar termos iniciados com `#` como busca específica por tag.
- **Problema que resolve:** hoje a busca só varre ID, título e descrição; procurar por uma tag exige lembrar do texto exato.
- **Comportamento esperado:** digitar `bug` ou `#bug` encontra tarefas com essa tag; os demais comportamentos da busca atual são preservados.
- **Benefício prático:** localização precisa por marcador, complementando o filtro de tags.

## Prioridade Baixa — complementares ou de conveniência

### 10. Copiar título/ID da tarefa
- **Descrição objetiva:** botão no detalhe da tarefa que copia "ID — Título" para a área de transferência.
- **Problema que resolve:** referenciar ou compartilhar uma tarefa exige copiar manualmente.
- **Comportamento esperado:** clique no ícone copia via Clipboard API e exibe um breve feedback (toast).
- **Benefício prático:** conveniência ao citar tarefas em outros contextos.

### 11. Modal de atalhos de teclado
- **Descrição objetiva:** modal leve listando os atalhos existentes (N, /, V, Ctrl+Z), aberto pela tecla "?" ou botão "?".
- **Problema que resolve:** os atalhos existentes são pouco descobertos.
- **Comportamento esperado:** abrir/fechar o modal de ajuda com "?", listando os atalhos atuais.
- **Benefício prático:** maior descoberta e uso da produtividade via teclado.

### 12. Opção "Sem categoria" no filtro de Categoria
- **Descrição objetiva:** adicionar uma opção especial "Sem categoria" ao filtro de Categoria.
- **Problema que resolve:** tarefas sem categoria não são acessíveis pelo filtro atual.
- **Comportamento esperado:** marcar "Sem categoria" mostra apenas tarefas sem categoria, combinável com categorias específicas.
- **Benefício prático:** triagem de tarefas ainda não organizadas.

### 13. Tema seguindo o sistema
- **Descrição objetiva:** opção de tema "automático" que acompanha a preferência do sistema operacional, com a escolha manual como sobrescrita.
- **Problema que resolve:** o usuário precisa alternar manualmente entre claro/escuro.
- **Comportamento esperado:** no modo automático, o app responde à preferência do SO até que o usuário escolha um tema manualmente.
- **Benefício prático:** conforto visual sem ação manual.
