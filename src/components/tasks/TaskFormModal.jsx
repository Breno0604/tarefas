import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Save } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Input, Textarea, Select, Field } from '../ui/Inputs'
import { useStore } from '../../store/store'
import { STATUS, PRIORITY, RECURRENCE } from '../../lib/constants'
import { useToast } from '../../store/toast'

export default function TaskFormModal({ open, onClose, task, defaults = {} }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const isEdit = Boolean(task)

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    projectId: '',
    categoryId: '',
    dueDate: '',
    estimatedHours: '',
    tagsText: '',
    recurrence: 'none'
  })
  const [errors, setErrors] = useState({})
  const wasOpenRef = useRef(false)

  // Only reset form when modal transitions from closed → open
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      if (task) {
        setForm({
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          projectId: task.projectId || '',
          categoryId: task.categoryId || '',
          dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
          estimatedHours: task.estimatedHours ? String(task.estimatedHours) : '',
          tagsText: (task.tags || []).join(', '),
          recurrence: task.recurrence || 'none'
        })
      } else {
        setForm({
          title: '',
          description: '',
          status: defaults.status || 'todo',
          priority: defaults.priority || 'medium',
          projectId: defaults.projectId || '',
          categoryId: defaults.categoryId || '',
          dueDate: defaults.dueDate ? String(defaults.dueDate).slice(0, 10) : '',
          estimatedHours: '',
          tagsText: '',
          recurrence: 'none'
        })
      }
      setErrors({})
    }
    wasOpenRef.current = open
  }, [open])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) {
      errs.title = 'O título da tarefa é obrigatório.'
    }
    if (form.estimatedHours !== '' && (isNaN(Number(form.estimatedHours)) || Number(form.estimatedHours) < 0)) {
      errs.estimatedHours = 'Horas estimadas deve ser um número não negativo.'
    }
    setErrors(errs)
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    const count = Object.keys(errs).length
    if (count > 0) {
      toast.push(
        count === 1 ? 'Corrija o erro destacado no formulário.' : `${count} erros — verifique os campos destacados.`,
        'error'
      )
      return
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      projectId: form.projectId || null,
      categoryId: form.categoryId || null,
      dueDate: form.dueDate || null,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : 0,
      tags: form.tagsText
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      recurrence: form.recurrence === 'none' ? null : form.recurrence
    }
    if (isEdit) {
      dispatch({ type: 'UPDATE_TASK', taskId: task.id, patch: payload })
      toast.success('Tarefa atualizada com sucesso')
    } else {
      dispatch({ type: 'CREATE_TASK', task: payload })
      toast.success('Tarefa criada com sucesso')
    }
    onClose()
  }

  // Detect mobile for fullScreen modal
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  useEffect(() => {
    if (!open) return
    const check = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', check)
    check()
    return () => window.removeEventListener('resize', check)
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar tarefa' : 'Nova tarefa'}
      description={
        isEdit ? 'Atualize as informações da tarefa.' : 'Preencha os dados para criar uma nova tarefa.'
      }
      size="md"
      fullScreen={isMobile}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="task-form" icon={Save}>
            {isEdit ? 'Salvar alterações' : 'Criar tarefa'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Título"
          placeholder="Ex.: Renovar assinatura da academia"
          value={form.title}
          onChange={set('title')}
          error={errors.title}
        />
        <Textarea
          label="Descrição"
          placeholder="Detalhes, links, contexto..."
          value={form.description}
          onChange={set('description')}
          maxLength={500}
          hint={`${form.description.length}/500 caracteres`}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={form.status}
            onChange={set('status')}
            options={Object.values(STATUS)
              .filter((s) => s.key !== 'cancelled' || (isEdit && task?.status === 'cancelled'))
              .map((s) => ({ value: s.key, label: s.label }))}
          />
          <Select
            label="Prioridade"
            value={form.priority}
            onChange={set('priority')}
            options={Object.values(PRIORITY).map((p) => ({ value: p.key, label: p.label }))}
          />
          <Select
            label="Projeto"
            value={form.projectId}
            onChange={set('projectId')}
            placeholder="Sem projeto"
            options={state.projects.map((p) => ({ value: p.id, label: p.name }))}
          />
          <Select
            label="Categoria"
            value={form.categoryId}
            onChange={set('categoryId')}
            placeholder="Sem categoria"
            options={state.categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Field label="Vencimento">
            <Input
              type="date"
              value={form.dueDate}
              onChange={set('dueDate')}
              error={errors.dueDate}
            />
          </Field>
          <Field label="Horas estimadas">
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Ex.: 8"
              value={form.estimatedHours}
              onChange={set('estimatedHours')}
              error={errors.estimatedHours}
            />
          </Field>
          <Field label="Tags">
            <Input
              placeholder="Ex.: casa, urgente"
              value={form.tagsText}
              onChange={set('tagsText')}
            />
          </Field>
          <Select
            label="Repetir"
            value={form.recurrence}
            onChange={set('recurrence')}
            hint={form.recurrence !== 'none' ? 'Ao concluir, a próxima ocorrência é criada automaticamente.' : undefined}
            options={Object.values(RECURRENCE).map((r) => ({ value: r.key, label: r.label }))}
          />
        </div>
      </form>
    </Modal>
  )
}
