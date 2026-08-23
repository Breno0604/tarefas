import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useCan } from '../store/store'
import Button from './ui/Button'
import EmptyState from './ui/EmptyState'

export default function RequirePerm({ perm, children }) {
  const can = useCan()
  const navigate = useNavigate()

  if (!perm || can(perm)) return children

  return (
    <div className="card-base">
      <EmptyState
        icon={Lock}
        title="Acesso restrito"
        description="Seu perfil de acesso atual não tem permissão para visualizar esta página."
        action={
          <Button variant="secondary" onClick={() => navigate('/')}>
            Voltar ao Dashboard
          </Button>
        }
      />
    </div>
  )
}
