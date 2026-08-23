import React from 'react'
import { CheckCheck, Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import Dropdown from '../ui/Dropdown'
import { STATUS } from '../../lib/constants'

export default function BulkTasksBar({ selected, canEdit, canDelete, onApplyStatus, onRequestDelete, onClear }) {
  if (selected.size === 0) return null
  return (
    <div className="sticky top-16 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 dark:border-brand-500/30 dark:bg-brand-500/10">
      <p className="text-sm font-bold text-brand-800 dark:text-brand-200">
        {selected.size} selecionada(s)
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {canEdit && (
          <>
            <Button size="sm" variant="subtle" icon={CheckCheck} onClick={() => onApplyStatus('done')}>
              Concluir
            </Button>
            <Dropdown
              align="right"
              trigger={
                <Button size="sm" variant="secondary">
                  Mover para
                </Button>
              }
              items={Object.values(STATUS)
                .filter((s) => s.key !== 'cancelled')
                .map((s) => ({
                  label: s.label,
                  onClick: () => onApplyStatus(s.key)
                }))}
            />
          </>
        )}
        {canDelete && (
          <Button size="sm" variant="ghost" icon={Trash2} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10" onClick={onRequestDelete}>
            Excluir
          </Button>
        )}
      </div>
      <span className="flex-1" />
      <Button size="sm" variant="ghost" onClick={onClear}>
        Limpar seleção
      </Button>
    </div>
  )
}
