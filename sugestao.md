# Sugestões para a Gestão de Usuários — Documento de Referência

> Este documento reúne **sugestões de melhoria** para a gestão de usuários do sistema, com base na análise atual do programa (`usuarios.md`).
> **Nada aqui foi implementado.** O objetivo é servir de referência para decisões futuras.
>
> **Como ler:** cada tópico começa com **"Já existe hoje"** (o que o sistema realmente faz agora) e segue com **"Sugestão"** (o que poderia ser feito). Quando há mais de um caminho, as **opções** são apresentadas com suas diferenças, para facilitar a escolha.

---

## 1. Situação atual em resumo

| Área | Como está hoje |
|---|---|
| **Cadastro de usuários** | Não existe. As pessoas são fixas no programa e só mudam quando o sistema ganha uma nova versão |
| **Login / entrada no sistema** | Não existe senha. Qualquer pessoa pode se "trocar" por qualquer outra em um seletor na lateral — é só uma simulação |
| **Edição de dados** | Não existe. Nome, cargo, e-mail e cor não podem ser alterados em tela |
| **Remoção / desativação** | Não existe. Não há como tirar ou desativar alguém |
| **Perfis** | Apenas dois, definidos por regra fixa: o gestor (identificado pelo nome de usuário "carlos") e os demais (colaboradores) |
| **Permissões** | Quatro tipos fixos, definidos um a um para cada pessoa no programa. O gestor tem todas automaticamente |
| **Tela de usuários** | Existe uma seção "Colaboradores" que **apenas mostra** cartões com informações e métricas — sem botões de criar, editar ou excluir |
| **Relação com tarefas** | Cada tarefa tem um responsável. O responsável é quem pode avançar a tarefa; tarefas de outros ficam visíveis ou não conforme a permissão |

**Consequências práticas de hoje:** para contratar alguém, mudar o cargo, dar um novo acesso ou tirar uma pessoa, é preciso alterar o programa e lançar uma nova versão — não dá para fazer pela tela.

---

## 2. Falhas principais (o que está faltando)

1. Entrada no sistema sem senha (qualquer pessoa pode agir como qualquer outra).
2. Nenhuma forma de criar, editar, desativar ou remover usuários pela tela.
3. Perfis e permissões fixos, sem ajuste em tela e sem registro de mudanças.
4. Sem tratamento para o que acontece com as tarefas de quem sai da empresa.
5. Sem busca e filtros na tela de usuários (só uma lista de cartões).
6. Sem proteções básicas (ex.: impedir que o gestor remova a si mesmo).

---

## 3. Sugestões detalhadas

### 3.1 Login e entrada no sistema

**Já existe hoje:** não há senha nem verificação de identidade. Um seletor na lateral permite que qualquer usuário assuma o lugar de qualquer outro. O sistema sempre abre como gestor.

**Sugestão:** criar uma entrada real, com identidade de cada pessoa. Opções:

- **Opção A — Senha simples:** cada pessoa tem usuário e senha criados pelo gestor.
  - *Vantagem:* simples e rápido de implementar.
  - *Limitação:* quem sabe a senha de outra pessoa pode agir como ela.
- **Opção B — E-mail e senha:** a pessoa usa o e-mail corporativo e define a própria senha (ou recebe uma provisória).
  - *Vantagem:* mais seguro que a opção A; senha fica só com o dono.
  - *Limitação:* precisa de um meio de recuperar senha (ex.: e-mail de redefinição).
- **Opção C — Entrar com a conta da empresa (Google, Microsoft, etc.):** o sistema reconhece o login corporativo e cria/vincula o usuário automaticamente.
  - *Vantagem:* sem senhas para gerenciar; mais seguro e conveniente.
  - *Limitação:* exige que a empresa tenha essas contas e um pouco mais de trabalho de configuração.

> **Diferença-chave:** A e B são internas (o sistema guarda a senha); C transfere a verificação para a conta da empresa.

### 3.2 Cadastro de usuários

**Já existe hoje:** ninguém pode cadastrar. As pessoas estão fixas no programa.

**Sugestão:** permitir incluir pessoas pela tela. Opções:

- **Opção A — O gestor cadastra:** o gestor preenche nome, e-mail, cargo, perfil e permissões, e a pessoa já nasce pronta para usar.
  - *Vantagem:* controle total e rápido.
  - *Limitação:* trabalho manual do gestor.
- **Opção B — Auto-cadastro com aprovação:** a pessoa preenche os próprios dados e o gestor aprova antes de liberar o acesso.
  - *Vantagem:* menos trabalho do gestor; bom para times que crescem muito.
  - *Limitação:* risco de pedidos indevidos; precisa de tela de aprovação.
- **Opção C — Cadastro automático via login corporativo:** a primeira vez que a pessoa entra com a conta da empresa, o sistema cria o usuário sozinho e o gestor só define o perfil depois.
  - *Vantagem:* mínimo trabalho manual.
  - *Limitação:* depende da opção C do item 3.1.

> **Diferença-chave:** quem faz o trabalho de cadastro (gestor, a própria pessoa ou o sistema) e se há aprovação no meio do caminho.

### 3.3 Perfis e permissões

**Já existe hoje:** dois perfis fixos (gestor e colaborador) e quatro permissões individuais: ver todas as tarefas, mudar o andamento de tarefas de outros, criar tarefas e gerenciar tarefas (editar, duplicar, excluir, reatribuir). Cada permissão é definida pessoa por pessoa, no programa, e o gestor tem todas automaticamente. Não há como ajustar em tela nem histórico de mudanças.

**Sugestões:**

1. **Perfis prontos (modelos):** criar conjuntos de permissões prontos com nomes claros, por exemplo: *Administrador* (tudo), *Gestor de equipe* (aprovar, devolver, reatribuir, ver tudo), *Colaborador* (só as próprias tarefas), *Consulta* (apenas visualizar).
   - *Ganho:* não precisa configurar cada pessoa do zero; basta escolher o perfil.
2. **Grupos de permissão:** montar grupos (ex.: "Time de Marketing") e vincular pessoas ao grupo. Mudou o grupo, mudou todo mundo junto.
   - *Diferença para o perfil:* perfil define o nível da pessoa; grupo organiza por área. Podem ser combinados.
3. **Ajuste em tela:** o gestor marca/desmarca as permissões de cada pessoa em uma tela com caixas de seleção, em vez de depender de nova versão do programa.
4. **Registro de mudanças de permissão:** guardar quem mudou, o que mudou e quando (ver item 3.10).

### 3.4 Edição dos dados dos usuários

**Já existe hoje:** nada pode ser editado em tela.

**Sugestão:**

- **O gestor edita qualquer pessoa:** nome, e-mail, cargo, cor/avatar e permissões.
- **Cada pessoa edita o próprio perfil básico** (ex.: nome de exibição, senha), sem poder mudar o próprio cargo ou permissões.
- *Regras sugeridas:* e-mail único (não podem existir dois iguais) e campos obrigatórios bem definidos (nome e e-mail sempre necessários).

### 3.5 Desativação e remoção de usuários

**Já existe hoje:** não há como desativar ou remover ninguém. Se a pessoa sai da empresa, o nome continua aparecendo e as tarefas continuam paradas com ela.

**Sugestão:** criar uma forma de "tirar" pessoas. Opções:

- **Opção A — Desativar (recomendada):** a pessoa não consegue mais entrar, mas o histórico e as tarefas ficam preservados. Dá para reativar depois.
  - *Vantagem:* seguro e reversível; nada se perde.
  - *Limitação:* a pessoa ainda aparece em listas antigas (com marca de "inativo").
- **Opção B — Excluir definitivamente:** apaga o cadastro por completo.
  - *Vantagem:* dados limpos.
  - *Limitação:* arriscado — tarefas e histórico podem ficar sem dono; só faz sentido quando a pessoa não tem tarefas.
- **Opção C — Arquivar:** meio-termo — a pessoa some das listas normais, mas os registros antigos continuam consultáveis.

> **Regras de proteção sugeridas (valem para qualquer opção):**
> - O gestor **não pode** desativar/excluir a si mesmo.
> - Não pode ficar o sistema sem nenhum gestor ativo (o último gestor não pode sair sem indicar substituto).
> - Exigir confirmação (e, se houver senha, digitar a senha novamente).
> - Antes de remover, resolver o que fazer com as tarefas da pessoa (item 3.6).

### 3.6 O que fazer com as tarefas de quem sai

**Já existe hoje:** nada é feito. As tarefas continuam atribuídas à pessoa, mesmo que ela não exista mais de fato; ninguém pode agir nelas (a não ser o gestor) e o nome dela aparece quebrado nas listas.

**Sugestão:** oferecer opções na hora de desativar/remover:

- **Transferir tarefas em massa:** escolher para quem as tarefas em aberto vão (ex.: outra pessoa da mesma área ou o gestor).
- **Manter com aviso:** se o gestor preferir, as tarefas ficam onde estão, mas com um selo de alerta ("responsável inativo") e com o prazo pausado para não contar como atraso.
- **Bloquear prazos:** enquanto a tarefa não for reatribuída, ela não conta como "parada" nem "atrasada".

### 3.7 Regras de "minhas tarefas × tarefas de outros"

**Já existe hoje:** o responsável da tarefa é o dono dela — só ele (e o gestor, para ações específicas) pode avançar o andamento. Quem tem permissão pode ver ou agir em tarefas alheias. Uma curiosidade atual: o gestor **não pode** executar o ciclo comum (receber, iniciar, concluir, retomar), nem mesmo em tarefa própria — ele só aprova, devolve, cancela e reatribui.

**Sugestões:**

1. **Mostrar os limites na tela:** pequenos avisos ou dicas mostrando o que a pessoa pode fazer com aquela tarefa (ex.: "você só pode visualizar esta tarefa").
2. **Decidir o papel do gestor:** escolher uma das posturas abaixo:
   - *Manter como está* (gestor não executa o ciclo), ou
   - *Permitir que o gestor execute em nome do responsável* (ex.: um botão "agir em nome de"), ou
   - *Permitir que o gestor assuma o papel de responsável* (ex.: reatribuir para si e executar normalmente).
3. **Regra de exceção documentada para o gestor:** se o gestor deixar de ser "fixo no programa" e passar a ser configurável (item 3.3), definir claramente quais ações de gestor ele pode executar.

### 3.8 Visibilidade por área ou equipe

**Já existe hoje:** cada pessoa vê as próprias tarefas e, se tiver permissão, todas as demais. Não existe noção de "área" ou "equipe".

**Sugestão:** adicionar equipes/áreas como um nível intermediário de visibilidade:

- *Ver só as minhas* (já existe), *ver as da minha equipe* (novo), *ver todas* (já existe via permissão).
- *Como funciona:* ao criar/reatribuir uma tarefa, ela pode ser vinculada a uma equipe; a permissão "ver as da equipe" é dada por perfil ou por pessoa.
- *Diferença:* dá para restringir informação sem depender de permissão individual, em empresas maiores.

### 3.9 Interface de gestão de usuários

**Já existe hoje:** seção "Colaboradores" com cartões de consulta (nome, cargo e métricas) e um modal com o detalhe e as tarefas da pessoa. Não há busca, filtros, nem botões de ação.

**Sugestão:** transformar em uma tela de gestão de verdade, com:

- **Busca por nome, e-mail ou cargo.**
- **Filtros** por perfil, por permissão e por situação (ativo/inativo).
- **Lista em tabela** (além dos cartões), com colunas de status (ativo/inativo) e acesso.
- **Botões de ação** por pessoa: editar, desativar, reativar, excluir, redefinir senha, transferir tarefas — aparecendo só para quem tem permissão para isso (o gestor).
- **Convite por e-mail:** o gestor envia um convite e a pessoa entra no sistema pelo link (combina com os itens 3.1 e 3.2).

### 3.10 Registro de mudanças (histórico de usuários)

**Já existe hoje:** as tarefas têm histórico (quem mudou o quê e quando), mas **os usuários não**. Não há nenhum registro de criação, edição, desativação ou mudança de permissão.

**Sugestão:** criar um registro simples de eventos de usuário, guardando: **quem fez, o que fez, em quem e quando** (ex.: "Carlos desativou Maria em 10/08/2026"; "Carlos deu a Maria a permissão de criar tarefas em 12/08/2026"). Isso ajuda a auditar acessos e entender mudanças.

### 3.11 Proteções e boas práticas

**Já existe hoje:** nenhuma proteção específica de usuário (não há o que proteger, pois não há ações).

**Sugestão:** ao implementar as funcionalidades acima, incluir proteções básicas:

- Impedir remoção/desativação do próprio usuário.
- Impedir que o sistema fique sem gestor ativo.
- Exigir confirmação para ações delicadas (desativar, excluir, mudar permissões).
- Guardar registro das ações delicadas (item 3.10).
- Bloquear e-mails duplicados e validar formato de e-mail.

---

## 4. Sugestão de prioridades

> Ordem sugerida apenas como ponto de partida — a decisão é de quem cuida do produto.

| Prioridade | Tema | Por quê |
|---|---|---|
| **Alta** | Login real (3.1) | Hoje qualquer pessoa pode agir como qualquer outra — risco de segurança |
| **Alta** | Cadastro e edição de usuários (3.2, 3.4) | Sem isso, toda mudança de equipe exige nova versão do programa |
| **Alta** | Desativação e destino das tarefas (3.5, 3.6) | Necessário para o dia a dia (entrada/saída de pessoas) |
| **Média** | Perfis e permissões ajustáveis (3.3) | Simplifica a administração de acessos |
| **Média** | Tela de gestão com busca/filtros (3.9) | Facilita encontrar e administrar pessoas |
| **Média** | Registro de mudanças (3.10) | Transparência e segurança |
| **Baixa** | Visibilidade por equipe (3.8) | Útil quando o time crescer |
| **Baixa** | "Agir em nome de" para o gestor (3.7) | Conveniência, depende da decisão sobre o papel do gestor |

---

## 5. Observações finais

- Este documento **não implementa nada** — é apenas referência para planejamento.
- Todas as sugestões respeitam o que já existe: nada aqui presume que uma funcionalidade sugerida já esteja no sistema.
- As opções apresentadas são **alternativas simples**; cada uma tem prós e contras resumidos para facilitar a decisão.
- Ao decidir implementar, recomenda-se definir também: quem pode fazer cada ação (provavelmente o gestor), em quem, e com quais restrições — seguindo a mesma lógica de permissões já usada nas tarefas.
