# Ideia — Gestão de Usuários (Documento de Decisão)

> Documento refinado a partir de `sugestao.md`, **mantendo as decisões já escolhidas** e apenas aprofundando, organizando e eliminando ambiguidades para a futura implementação.
>
> **O que NÃO mudou:** nenhuma decisão foi alterada. As opções escolhidas (3.1 Opção A, 3.2 Opção A, 3.3 com os três itens, 3.4, 3.5 Opção A com as proteções, 3.6 "Manter com aviso" e 3.7 "Mostrar os limites na tela") foram detalhadas.
>
> **Como ler:** cada decisão traz "Hoje" (como está no sistema atual), "Decisão" (o que foi escolhido), "Como vai funcionar" (fluxo detalhado), e "Quem pode / restrições" (regras claras para implementar).

---

## 1. Panorama da ideia

A gestão de usuários passará de **lista fixa no programa** para **cadastro vivo, com login por senha, perfis prontos, permissões ajustáveis em tela e desativação segura**. Em resumo:

| Decisão | Escolha |
|---|---|
| **3.1** Login e entrada | **Opção A** — usuário e senha criados pelo gestor |
| **3.2** Cadastro de usuários | **Opção A** — o gestor cadastra pela tela |
| **3.3** Perfis e permissões | Perfis prontos (Administrador, Gestor de equipe, Colaborador, Consulta) + ajuste em tela + registro de mudanças de permissão |
| **3.4** Edição de dados | Gestor edita qualquer pessoa; cada pessoa edita o próprio perfil básico (sem mudar cargo/permissões) |
| **3.5** Desativação/remoção | **Opção A** — desativar (reversível), com as regras de proteção escolhidas |
| **3.6** Tarefas de quem sai | **Manter com aviso** — selo "responsável inativo" e prazo pausado |
| **3.7** Minhas × de outros | **Mostrar os limites na tela** — avisos sobre o que cada pessoa pode fazer |

---

## 2. Decisão 3.1 — Login com usuário e senha (Opção A)

### Hoje
- Não existe senha. Um seletor na lateral permite que qualquer pessoa assuma o lugar de qualquer outra. O sistema abre sempre como gestor.

### Decisão
- Cada pessoa entra no sistema com **usuário e senha criados pelo gestor** no momento do cadastro.

### Como vai funcionar
1. **Identificador de login = e-mail** (campo que já existe no cadastro, é único e difícil de confundir). O "usuário" escolhido é o e-mail corporativo.
2. **Tela de entrada:** ao abrir o sistema, aparece a tela de login pedindo **e-mail e senha**. A pessoa só entra com as credenciais corretas.
3. **Senha inicial:** definida pelo gestor no cadastro (item 3.2) ou redefinida por ele depois (item 3.4). A pessoa pode trocar a própria senha (item 3.4).
4. **Regras de senha (definidas para a implementação):**
   - Mínimo de 6 caracteres (pode subir depois se desejarem).
   - A senha **nunca aparece em tela** e não pode ser consultada por ninguém (nem pelo gestor). Só é possível **redefinir** (criar uma nova).
   - Troca de senha: pedir a senha atual + a nova + confirmação da nova.
5. **Sessão:** a pessoa permanece conectada enquanto a aba do sistema estiver aberta. Ao fechar o navegador, volta a pedir login (não haverá "continuar conectado" nesta fase).
6. **Sair da conta:** botão de "Sair" na lateral. Ao sair, volta para a tela de login.
7. **Seletor de troca de usuário:** deixa de existir — cada pessoa entra com a própria senha (consequência natural do login).

### Quem pode / restrições
| Ação | Quem pode | Sobre quem | Restrições |
|---|---|---|---|
| Criar usuário e senha inicial | Gestor (perfil Administrador) | Qualquer usuário novo | Senha nunca visível, apenas definível/redefinível |
| Trocar a própria senha | A própria pessoa | A si mesma | Exige senha atual + nova + confirmação |
| Redefinir senha de alguém | Gestor (Administrador) | Qualquer usuário | Sempre gera uma senha nova; a antiga deixa de valer |

---

## 3. Decisão 3.2 — Cadastro de usuários pelo gestor (Opção A)

### Hoje
- Os usuários estão fixos no programa; não há tela nem ação de cadastro.

### Decisão
- O **gestor cadastra** cada pessoa pela tela, com os dados dela e a senha inicial.

### Como vai funcionar
1. A tela atual de **Colaboradores** ganha o botão **"Novo usuário"** (visível apenas para quem tem permissão de gerenciar usuários — na prática, o perfil Administrador).
2. **Formulário de cadastro** com os campos:
   - **Nome** — obrigatório.
   - **E-mail** — obrigatório, **único** (não podem existir dois iguais) e com formato válido (ex.: `nome@empresa.com`).
   - **Cargo** — opcional (texto livre, como hoje).
   - **Cor/avatar** — escolha de cor (como hoje); as iniciais do nome formam o avatar.
   - **Perfil** — obrigatório, escolhido entre os modelos prontos (item 4).
   - **Permissões** — pré-marcadas conforme o perfil escolhido; o gestor pode ajustar na mesma tela (caixas de seleção, item 4.2).
   - **Senha inicial** — obrigatória, criada pelo gestor (com a regra de mínimo de 6 caracteres).
3. **Validações no momento de salvar:**
   - Nome e e-mail não podem estar vazios.
   - E-mail precisa ser válido e único (se já existe, o sistema avisa e não salva).
   - Perfil e senha inicial obrigatórios.
4. O usuário novo **nasce ativo** e já consegue entrar com e-mail + senha.

### Quem pode / restrições
| Ação | Quem pode | Sobre quem | Restrições |
|---|---|---|---|
| Cadastrar usuário | Gestor (Administrador) | Qualquer pessoa nova | Só quem tem permissão de gerenciar usuários; validações acima |

---

## 4. Decisão 3.3 — Perfis, permissões e registro de mudanças

### 4.1 Perfis prontos (modelos)

### Hoje
- Apenas dois perfis fixos (gestor identificado pelo nome de usuário "carlos", e os demais como colaboradores), com 4 permissões individuais definidas no programa.

### Decisão
- Criar **quatro perfis prontos**, com nomes claros e permissões padrão, para não configurar cada pessoa do zero.

### Perfis e permissões padrão (matriz para a implementação)

Legenda: ✅ tem por padrão · ⬜ não tem por padrão (pode ser ligado pelo ajuste em tela)

| Capacidade | Administrador | Gestor de equipe | Colaborador | Consulta |
|---|---|---|---|---|
| Entrar no sistema | ✅ | ✅ | ✅ | ✅ |
| Ver as próprias tarefas | ✅ | ✅ | ✅ | ✅ |
| Ver todas as tarefas | ✅ | ✅ | ⬜ | ⬜ |
| Executar o ciclo nas próprias tarefas (receber, iniciar, concluir, retomar) | ✅ | ✅ | ✅ | ⬜ |
| Executar o ciclo em tarefas de outros | ✅ | ⬜ | ⬜ | ⬜ |
| Criar tarefas | ✅ | ⬜ | ⬜ | ⬜ |
| Editar, duplicar e excluir tarefas | ✅ | ⬜ | ⬜ | ⬜ |
| Reatribuir responsável | ✅ | ✅ | ⬜ | ⬜ |
| Aprovar/finalizar, devolver, cancelar e reabrir aprovação | ✅ | ✅ | ⬜ | ⬜ |
| Gerenciar usuários (cadastrar, editar, desativar, reativar, perfis, permissões, senhas) | ✅ | ⬜ | ⬜ | ⬜ |
| Favoritar e reordenar tarefas | ✅ | ✅ | ✅ | ✅ |

**Definições para tirar ambiguidades:**
- **Administrador** = "tudo": inclui o ciclo de execução em qualquer tarefa (hoje o gestor fixo **não** pode executar o ciclo comum; com a decisão de "Administrador (tudo)", essa limitação deixa de existir para esse perfil).
- **Gestor de equipe** = responsável pela parte de aprovação e organização: ver tudo, aprovar, devolver, cancelar, reabrir aprovação e reatribuir. **Não** edita/exclui tarefas por padrão nem gerencia usuários.
- **Colaborador** = executa o próprio trabalho: vê e avança as próprias tarefas. Por padrão **não** vê as de outros nem cria tarefas (comportamento atual dos colaboradores é mantido; o gestor pode ligar qualquer permissão depois).
- **Consulta** = apenas visualizar: entra no sistema, vê as tarefas permitidas, mas **nenhuma ação de mudança** (nem favoritar ações de gestão — só visualização).

### 4.2 Ajuste em tela (permissões com caixas de seleção)

### Hoje
- Permissões só mudam com nova versão do programa.

### Decisão
- O gestor **marca/desmarca** as permissões de cada pessoa em uma tela com caixas de seleção.

### Como vai funcionar
1. Na edição de um usuário (item 5) há a seção **"Perfil e permissões"**:
   - Um campo **Perfil** (escolha entre os 4 modelos).
   - Ao escolher o perfil, as permissões padrão dele são marcadas automaticamente.
   - Embaixo, uma **lista de caixas de seleção** com cada capacidade (ver todas, criar tarefas, editar/excluir, reatribuir, aprovar/devolver/cancelar, executar ciclo em tarefas de outros, gerenciar usuários). O gestor pode ligar ou desligar qualquer uma.
2. **Comportamento do perfil:** se o gestor personalizar as permissões de alguém, o sistema mostra que a pessoa está com perfil "ajustado" (o modelo continua sendo a base, mas as permissões marcadas valem como estão).
3. **Ficam de fora do ajuste:** as capacidades que dependem de papéis de segurança (ver item 5.3 — ninguém altera o próprio perfil/permissões).

### 4.3 Registro de mudanças de permissão

### Hoje
- Nenhum registro de mudança de permissão (nem de usuário).

### Decisão
- Guardar **quem mudou, o que mudou (de X para Y) e quando** — sempre que houver mudança de perfil ou de permissões individuais de um usuário.

### Como vai funcionar
1. Toda alteração de perfil ou de permissões gera um **registro automático** com:
   - Data e hora;
   - Quem fez a mudança (nome do gestor);
   - Em quem foi feita (nome do usuário);
   - O que mudou (ex.: "permissão 'ver todas as tarefas' ativada"; "perfil alterado de Colaborador para Gestor de equipe").
2. O registro é **visível apenas para quem gerencia usuários** (Administrador), dentro da tela do usuário (aba/sessão "Histórico de permissões").
3. **Não é possível apagar** esses registros.
4. Escopo: o registro cobre **perfil e permissões** (decisão escolhida). Mudanças de nome/e-mail/cargo/senha/desativação **não** entram neste registro (ficam fora do escopo desta fase — ver item 9).

### Quem pode / restrições (perfis e permissões)
| Ação | Quem pode | Sobre quem | Restrições |
|---|---|---|---|
| Escolher perfil | Gestor (Administrador) | Qualquer usuário | Ninguém altera o próprio perfil (inclusive o Administrador) |
| Ajustar permissões individuais | Gestor (Administrador) | Qualquer usuário | Ninguém altera as próprias permissões; mudanças ficam registradas |
| Ver o registro de mudanças | Gestor (Administrador) | Todos os usuários | Somente leitura; não há como apagar |

---

## 5. Decisão 3.4 — Edição dos dados dos usuários

### Hoje
- Nada pode ser editado em tela.

### Decisão
- **O gestor edita qualquer pessoa** (nome, e-mail, cargo, cor/avatar e permissões).
- **Cada pessoa edita o próprio perfil básico** (nome de exibição, senha), **sem poder mudar o próprio cargo ou permissões**.

### Como vai funcionar
1. **Tela de edição pelo gestor** (aberta a partir do card do colaborador ou do detalhe):
   - Campos editáveis: **nome, e-mail, cargo, cor/avatar, perfil e permissões** (seção do item 4.2).
   - Validações: e-mail único e válido; nome obrigatório.
   - Botão "Redefinir senha" (gera senha nova; a antiga deixa de valer).
2. **Auto-atendimento (a própria pessoa):**
   - "Meu perfil" com: **nome de exibição, senha e cor/avatar**.
   - **Não** pode mudar: e-mail, cargo, perfil e permissões (próprios).
   - Troca de senha: senha atual + nova + confirmação (regra do item 2).
3. **Regra de segurança definida:** ninguém pode alterar o próprio **perfil ou permissões** — nem o Administrador. Isso impede que alguém, por engano, tire os próprios acessos. Mudanças de perfil/permissões sempre passam por outro usuário com permissão de gerenciar usuários.

### Quem pode / restrições
| Ação | Quem pode | Sobre quem | Restrições |
|---|---|---|---|
| Editar nome, e-mail, cargo, cor, perfil, permissões | Gestor (Administrador) | Qualquer usuário | Exceto as próprias permissões/perfil (regra acima); e-mail único |
| Redefinir senha | Gestor (Administrador) | Qualquer usuário | Gera senha nova; senha nunca é exibida |
| Editar próprio perfil básico | A própria pessoa | A si mesma | Só nome de exibição, senha e cor/avatar; nunca cargo/e-mail/perfil/permissões |

---

## 6. Decisão 3.5 — Desativação de usuários (Opção A)

### Hoje
- Não existe desativação nem remoção; a pessoa permanece "eterna" no sistema.

### Decisão
- **Desativar** (não excluir): a pessoa **não consegue mais entrar**, mas o histórico e as tarefas são **preservados**, e dá para **reativar** depois.

### Como vai funcionar
1. **Tela de desativação:** na edição do usuário (ou no detalhe), botão **"Desativar"**.
2. **Efeitos da desativação:**
   - A pessoa **não entra mais** no sistema (login bloqueado).
   - As tarefas dela ficam com o selo "responsável inativo" e com prazo pausado (item 7).
   - O nome dela **continua aparecendo** em históricos, listas e como autora de ações passadas — nada se perde.
   - Nas listas de usuários, aparece a marca **"Inativo"**.
3. **Reativação:** botão **"Reativar"** (quem gerencia usuários). A pessoa volta a entrar e as tarefas voltam ao funcionamento normal (o prazo volta a contar — item 7).
4. **Não existe exclusão definitiva** nesta fase (não foi escolhida).

### Regras de proteção escolhidas (obrigatórias na implementação)
1. **O gestor não pode desativar a si mesmo** (ninguém pode desativar o próprio usuário).
2. **Nunca pode ficar sem um gestor ativo:** se a pessoa a ser desativada for Administrador e for a **última** com esse perfil ativo, o sistema **bloqueia** a desativação e informa que é preciso **indicar um substituto** (transferir o perfil Administrador para outro usuário ativo) antes.
3. **Confirmação obrigatória:** aparece uma tela de confirmação explicando os efeitos; como agora existe senha, **é preciso digitar a senha novamente** para confirmar.
4. **Antes de desativar, resolver as tarefas:** o sistema mostra quantas tarefas a pessoa tem em aberto e pede uma das saídas do item 7 (manter com aviso, como escolhido — e lembra que a reatribuição segue disponível para quem tiver permissão).

### Quem pode / restrições
| Ação | Quem pode | Sobre quem | Restrições |
|---|---|---|---|
| Desativar | Gestor (Administrador) | Qualquer usuário ativo | Nunca a si mesmo; nunca o último Administrador ativo; exige confirmação com senha; exige resolver as tarefas em aberto |
| Reativar | Gestor (Administrador) | Qualquer usuário inativo | Sem restrições adicionais |

---

## 7. Decisão 3.6 — Tarefas de quem sai: manter com aviso

### Hoje
- As tarefas continuam paradas no nome da pessoa, sem aviso; se a pessoa "sumir", o nome aparece quebrado nas listas e o prazo continua contando.

### Decisão
- As tarefas **ficam onde estão**, mas com um **selo de alerta "responsável inativo"** e com o **prazo pausado**, para não contar como atraso.

### Como vai funcionar
1. **Selo de alerta:** toda tarefa cujo responsável esteja inativo mostra um selo visível (na lista e no detalhe) com o texto **"responsável inativo"**.
2. **Prazo pausado:** enquanto o responsável estiver inativo, a tarefa **não conta como atrasada** nem como "parada". O prazo volta a contar normalmente quando a tarefa for **reativada com o usuário** ou **reatribuída** para uma pessoa ativa.
3. **Quem pode agir na tarefa:** continua valendo a regra atual — quem tiver permissão (Administrador ou, se ligado, Gestor de equipe) pode **reatribuir** a tarefa para outra pessoa ativa; ao reatribuir, o selo e a pausa de prazo somem automaticamente.
4. **Sugestão visual:** quando existem tarefas com responsável inativo, a tela pode lembrar o gestor de reatribuí-las (sem bloquear nada — apenas lembrete).
5. **Histórico preservado:** o nome da pessoa desativada continua correto em todo o histórico da tarefa.

### Quem pode / restrições
| Ação | Quem pode | Sobre quem | Restrições |
|---|---|---|---|
| Ver o selo "responsável inativo" | Todos que veem a tarefa | — | Apenas informativo |
| Reatribuir tarefa com responsável inativo | Quem tiver permissão de reatribuir (Administrador; Gestor de equipe) | Tarefas de usuários inativos | Regras atuais de reatribuição continuam valendo (não pode em tarefas encerradas; exige motivo) |

---

## 8. Decisão 3.7 — Mostrar os limites na tela

### Hoje
- Os botões já são escondidos conforme a permissão, mas o usuário não sabe **por quê** — e em algumas telas (kanban) o bloqueio aparece sem explicação clara.

### Decisão
- Mostrar, na tela, **avisos e dicas** que explicam o que a pessoa pode fazer com cada tarefa (ex.: "você só pode visualizar esta tarefa").

### Como vai funcionar
1. **No detalhe da tarefa:** uma faixa no topo informa o papel da pessoa naquela tarefa:
   - "Você é o responsável — pode avançar o andamento desta tarefa."
   - "Você só pode visualizar esta tarefa."
   - "A tarefa aguarda a aprovação do gestor."
2. **Nos botões de ação:** quando uma ação existe mas **não está disponível para a pessoa**, o sistema mostra o motivo (ex.: "apenas o perfil Gestor de equipe pode aprovar"; "tarefa encerrada — reatribuição bloqueada").
3. **No quadro (kanban):** o aviso "não permitido" que já aparece ao arrastar é mantido e padronizado com as mesmas mensagens claras.
4. **Na lista:** o texto de dica (ao passar o mouse sobre um item bloqueado) explica a regra em linguagem simples.
5. Os avisos são **pessoais**: cada pessoa vê os seus próprios limites (o gestor vê avisos quando ele próprio estiver limitado, por exemplo, se um perfil sem ciclo comum estiver em uso).

### Quem pode / restrições
- Avisos informativos para **todos os usuários**; nenhuma ação é alterada — apenas **explicada**. As regras reais de permissão continuam as mesmas (itens 4 e 5).

---

## 9. Fora do escopo desta ideia (não escolhido — não implementar nesta fase)

Para não haver dúvida no futuro, ficam **fora** desta fase:

- Auto-cadastro de usuários (a pessoa se cadastra sozinha).
- Login com conta corporativa (Google/Microsoft) e convite por e-mail.
- Exclusão definitiva de usuários e arquivamento.
- Transferência automática em massa de tarefas (a reatribuição continua manual).
- Visibilidade por equipes/áreas (nível intermediário de visibilidade).
- Busca e filtros avançados na tela de usuários (a busca atual filtra tarefas, não usuários).
- Registro de mudanças de nome/e-mail/cargo/senha/desativação (o registro escolhido cobre **apenas** perfil e permissões).

---

## 10. Migração do estado atual para a nova versão

Definições para quando a ideia for implementada (para não haver ambiguidade):

1. **Perfis dos usuários existentes:**
   - O usuário atual "Carlos" (gestor fixo) passa a ter o perfil **Administrador** (mantém o acesso total que tem hoje).
   - Os 5 colaboradores atuais passam a ter o perfil **Colaborador** — ou seja, deixam de ter a permissão de "ver todas as tarefas" que tinham no programa (se o gestor quiser, liga essa permissão individualmente depois).
2. **Senhas:** na primeira versão com login, o gestor define a senha inicial de cada usuário na tela de cadastro/edição. Nenhum usuário fica sem senha.
3. **Seletor de troca de usuário:** é substituído pela tela de login + botão "Sair".
4. **Cadastro novo:** o cadastro de usuário passa a ter o campo **Perfil** e passa a ser salvo pelo sistema (os usuários deixam de ser "fixos no programa").

---

## 11. Nota final

- Este documento **não implementa nada** — é a especificação da ideia escolhida, pronta para orientar uma futura implementação.
- As decisões aqui descritas **respeitam as escolhas feitas em `sugestao.md`**; tudo o que foi detalhado serve para eliminar dúvidas de interpretação.
- Qualquer mudança de rumo (ex.: adotar um item "fora do escopo") deve ser uma **nova decisão** e deve ser registrada aqui antes de implementar.
