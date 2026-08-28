import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, ArrowLeft, Home } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <Compass size={30} />
        </span>
        <h1 className="mt-5 text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          404
        </h1>
        <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          Página não encontrada
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Voltar
          </Button>
          <Button icon={Home} onClick={() => navigate('/dashboard')}>
            Ir para o Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
