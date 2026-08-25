# TaskFlow — Tarefas pessoais

[![CI](https://github.com/Breno0604/tarefas/actions/workflows/ci.yml/badge.svg)](https://github.com/Breno0604/tarefas/actions/workflows/ci.yml)

Aplicação **pessoal** de gestão de tarefas: um único usuário, sem equipes, perfis ou permissões — apenas o seu fluxo de trabalho do dia a dia.

## Funcionalidades

- **Visão "Hoje"** (tela inicial) — agenda do dia: atrasadas → hoje → próximas 7 dias → sem data, com concluir em 1 clique
- **Kanban** com 4 colunas e arrastar-e-soltar · lista · tabela · calendário
- **Tarefas recorrentes** — diária, semanal ou mensal; concluir gera automaticamente a próxima ocorrência
- **Notas da tarefa** em vez de comentários
- Projetos, categorias, tags, subtarefas, prioridades
- Filtros combináveis com deep-links (`?project=`, `?category=`, `?tag=`) e filtros salvos
- Tema claro/escuro, atalhos de teclado, paleta de comandos (`Ctrl+K`)
- Export de backup em JSON; dados persistidos localmente

## Stack

React 18 · Vite · React Router · Tailwind CSS · Zustand-like store próprio com reducer · Recharts · Vitest + Testing Library · Playwright

## Desenvolvimento

```bash
npm install        # instalar dependências
npm run dev        # servidor de desenvolvimento
npm test           # testes unitários (vitest)
npm run build      # build de produção
npm run preview    # servir o build (usado pelo E2E)
npx playwright test  # testes E2E
```

## CI

O pipeline roda em cada push/PR para `main`: testes unitários + smoke + build nas linhas LTS Node 22 e 24, seguidos dos testes E2E contra o build de produção.
