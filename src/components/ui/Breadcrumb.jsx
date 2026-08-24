import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/tarefas': 'Tarefas',
  '/equipe': 'Equipe',
  '/projetos': 'Projetos',
  '/categorias': 'Categorias',
  '/atividades': 'Atividades',
  '/configuracoes': 'Configurações',
  '/perfis': 'Perfis de acesso'
}

export default function Breadcrumb() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(Boolean)

  if (pathnames.length === 0) return null

  const items = [
    { label: 'Início', to: '/', icon: Home },
    ...pathnames.map((segment, index) => {
      const to = '/' + pathnames.slice(0, index + 1).join('/')
      const label = ROUTE_LABELS[to] || segment.charAt(0).toUpperCase() + segment.slice(1)
      return { label, to }
    })
  ]

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          const Icon = item.icon
          return (
            <li key={item.to} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />}
              {isLast ? (
                <span className="text-slate-600 dark:text-slate-300" aria-current="page">
                  {Icon && <Icon size={12} className="mr-1 inline" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="flex items-center gap-1 transition hover:text-brand-600 dark:hover:text-brand-400"
                >
                  {Icon && <Icon size={12} />}
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
