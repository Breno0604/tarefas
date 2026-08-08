# Design — Migração de Persistência para Supabase (100% Online)

Data: 2026-08-08
Status: Aprovado

## 1. Objetivo

Substituir toda persistência local (localStorage) pelo **Supabase** como fonte oficial e
persistente dos dados. Ao final, a aplicação deve funcionar 100% online: criar, ler, editar e
excluir tarefas no Supabase; dados permanecem após recarregar a página; sem dependência de
localStorage/sessionStorage/IndexedDB/mocks/JSON como fonte de dados.

## 2. Decisões registradas

| Tema | Decisão |
|---|---|
| Segurança | Supabase Auth (email/senha) + RLS + tela de login no app (senha digitada) |
| IDs | UUID gerado pelo banco (`gen_random_uuid()`); ID deixa de ser exibido na UI |
| Dados aninhados | Colunas `jsonb` (`subtarefas`, `anotacoes`, `historico`) na tabela `tasks` |
| Preferências de UI | Tabela `preferencias` no Supabase (tema, view, kpi_collapsed) |
| Seed de demonstração | Banco começa vazio; seed sai do carregamento da aplicação |
| Persistência local | Remover `LocalStorageProvider` e usos de `localStorage` para dados/preferências |
| Token de sessão | `@supabase/supabase-js` guarda o token de sessão (credencial de auth, não é dado da aplicação) — permitido |

## 3. Tabela `tasks`

Mapeamento do `Task` (src/types.ts) para colunas SQL:

| Campo TS | Coluna SQL | Tipo | Regra |
|---|---|---|---|
| `id` | `id` | `uuid` | PK, default `gen_random_uuid()` |
| (novo) | `usuario_id` | `uuid` | NOT NULL, dono da tarefa (RLS) |
| (novo) | `posicao` | `integer` | NOT NULL, default `0` — ordem manual da lista |
| `titulo` | `titulo` | `text` | NOT NULL, `CHECK (length(trim(titulo)) > 0)` |
| `descricao` | `descricao` | `text` | NOT NULL, default `''` |
| `prioridade` | `prioridade` | `text` | NOT NULL, default `'media'`, CHECK enum |
| `prazo` | `prazo` | `date` | NULL |
| `status` | `status` | `text` | NOT NULL, default `'CAIXA_ENTRADA'`, CHECK enum GTD |
| `favorita` | `favorita` | `boolean` | NOT NULL, default `false` |
| `categoria` | `categoria` | `text` | NULL |
| `projeto` | `projeto` | `text` | NULL |
| `tags` | `tags` | `text[]` | NOT NULL, default `'{}'` |
| `lembrete` | `lembrete` | `timestamptz` | NULL |
| `lembreteNotificado` | `lembrete_notificado` | `boolean` | NOT NULL, default `false` |
| `recorrencia` | `recorrencia` | `text` | NULL, CHECK enum |
| `retornoEm` | `retorno_em` | `date` | NULL |
| `criadaEm` | `criada_em` | `timestamptz` | NOT NULL, default `now()` |
| `atualizadaEm` | `atualizada_em` | `timestamptz` | NULL |
| `concluidaEm` | `concluida_em` | `timestamptz` | NULL |
| `subtarefas` | `subtarefas` | `jsonb` | NOT NULL, default `'[]'` |
| `anotacoes` | `anotacoes` | `jsonb` | NOT NULL, default `'[]'` |
| `historico` | `historico` | `jsonb` | NOT NULL, default `'[]'` |

## 4. Tabela `preferencias`

| Coluna | Tipo | Regra |
|---|---|---|
| `usuario_id` | `uuid` | PK, dono (RLS) |
| `tema` | `text` | NOT NULL, default `'claro'`, CHECK (`claro`\|`escuro`) |
| `view` | `text` | NOT NULL, default `'lista'`, CHECK (`lista`\|`quadro`) |
| `kpi_collapsed` | `boolean` | NOT NULL, default `false` |
| `atualizada_em` | `timestamptz` | NOT NULL, default `now()` |

## 5. Relacionamentos

- `tasks.usuario_id` → `auth.users(id)` com `ON DELETE CASCADE`.
- `preferencias.usuario_id` → `auth.users(id)` com `ON DELETE CASCADE`.
- Dados aninhados (subtarefas, anotações, histórico) vivem em JSONB na própria tarefa;
  **sem** tabelas filhas. Justificativa: só são lidos junto da tarefa; não existem consultas
  transversais por esses campos. Evita normalização excessiva.

## 6. Restrições e índices

- CHECK enums: `prioridade`, `status`, `recorrencia`, `tema`, `view`.
- CHECK: `titulo` não vazio.
- Índices: PK em `id` (automático) + índice em `usuario_id`.
- `posicao`: usado para preservar a ordem manual da lista (reordenação por arrastar).
- Sem índices em status/prioridade/tags (filtragem é client-side sobre o conjunto completo).
- Sem UNIQUE além da PK.

## 7. Segurança (RLS)

- Ativar RLS em `tasks` e `preferencias`.
- Policy única por tabela: `USING (usuario_id = auth.uid())` com `WITH CHECK` equivalente
  (SELECT/INSERT/UPDATE/DELETE) — o usuário gerencia apenas as próprias linhas.
- Auth: Supabase Auth email/senha, usuário único criado no painel.

## 8. Migração do código

| Arquivo | Mudança |
|---|---|
| `.env.example` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; remover `VITE_STORAGE_PROVIDER` |
| `package.json` | adicionar `@supabase/supabase-js` |
| `src/services/providers/SupabaseProvider.ts` | novo provider assíncrono (mesma interface `StorageProvider`) |
| `src/services/index.ts` | sempre selecionar o provider Supabase |
| `src/context/AppContext.tsx` | boot assíncrono com estado de carregando/erro; sync ao Supabase a cada mudança; tela de login |
| `src/main.tsx` | remover leitura síncrona de tema (tema vem do Supabase) |
| `src/data/mockData.ts`, `src/utils/seedGenerator.ts` | saem do carregamento |
| `src/services/providers/LocalStorageProvider.ts`, `FutureApiProvider.ts` | removidos |
| Login | componente de login + gestão de sessão via Supabase Auth |
| ID na UI | deixar de exibir `task.id` (TaskRow, TaskCard, TaskDetailModal) |
| Testes | mockar o provider Supabase; atualizar dependentes do seed/localStorage |

Sincronização: manter o modelo atual de "salvar o conjunto completo de tarefas a cada
alteração", porém assíncrono — upsert em lote das tarefas + exclusão das removidas
(diff por id, preservando UUIDs). Pilha de "Desfazer" continua em memória.

## 9. Fora de escopo

- Paginação/servidor-side (o app carrega o conjunto todo).
- Multi-usuário/convites.
- Storage de arquivos (imagens etc.).
