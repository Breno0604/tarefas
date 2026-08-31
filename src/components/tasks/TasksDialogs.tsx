import React, { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Input } from '../ui/Inputs'

export default function TasksDialogs({
  cancelTarget,
  onCloseCancel,
  onConfirmCancel,
  saveFilterOpen,
  onCloseSave,
  saveName,
  setSaveName,
  onSaveFilter,
  savedFilters,
  onApplySavedFilter,
  onRemoveSavedFilter
}: any) {
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    if (cancelTarget) setCancelReason('')
  }, [cancelTarget])

  return (
    <>
      <Modal
        open={Boolean(cancelTarget)}
        onClose={onCloseCancel}
        title="Cancelar tarefa"
        description="O motivo é opcional — anote se quiser lembrar o porquê."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onCloseCancel}>
              Voltar
            </Button>
            <Button
              onClick={() => onConfirmCancel(cancelReason.trim() || null)}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancelar tarefa
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {cancelTarget && (
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
              {cancelTarget.title}
            </div>
          )}
          <Input
            label="Motivo (opcional)"
            placeholder="Ex.: Fora de escopo, duplicada, prioridade mudou..."
            value={cancelReason}
            onChange={(e: any) => setCancelReason(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>

      <Modal
        open={saveFilterOpen}
        onClose={onCloseSave}
        title="Salvar filtros atuais"
        description="Dê um nome para reutilizar esta combinação de filtros depois."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onCloseSave}>
              Cancelar
            </Button>
            <Button onClick={onSaveFilter} disabled={!saveName.trim()}>
              Salvar
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          label="Nome do filtro"
          placeholder="Ex.: Tarefas urgentes"
          value={saveName}
          onChange={(e: any) => setSaveName(e.target.value)}
          onKeyDown={(e: any) => {
            if (e.key === 'Enter' && saveName.trim()) onSaveFilter()
          }}
        />
        {savedFilters.length > 0 && (
          <div className="mt-5">
            <p className="label-base">Filtros salvos</p>
            <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              {savedFilters.map((f: any) => (
                <li key={f.id} className="flex items-center gap-2 py-2">
                  <button
                    onClick={() => {
                      onApplySavedFilter(f)
                      onCloseSave()
                    }}
                    className="flex-1 truncate text-left text-sm font-medium text-slate-700 transition hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-300"
                  >
                    {f.name}
                  </button>
                  <button
                    onClick={() => onRemoveSavedFilter(f.id)}
                    className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    aria-label={`Excluir filtro ${f.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  )
}
