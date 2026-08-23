import React, { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Input, Textarea, Select, Field } from '../ui/Inputs'
import { useStore, useCan } from '../../store/store'
import { STATUS, PRIORITY } from '../../lib/constants'
import { useToast } from '../../store/toast'

export default function TaskFormModal({ open, onClose, task, defaults = {} }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const can = useCan()
  const isEdit = Boolean(task)
  const canAssign = can('assign_tasks')
  const canSave = isEdit ? can('edit_tasks') : can('create_tasks')

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigneeId: '',
    projectId: '',
    categoryId: 'c1',
    dueDate: '',
    estimatedHours: '',
    tagsText: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      if (task) {
        setForm({
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId || '',
          projectId: task.projectId || '',
          categoryId: task.categoryId || 'c1',
          dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
          estimatedHours: task.estimatedHours ? String(task.estimatedHours) : '',
          tagsText: (task.tags || []).join(', ')
        })
      } else {
        setForm({
          title: '',
          description: '',
          status: defaults.status || 'todo',
          priority: defaults.priority || 'medium',
          assigneeId: defaults.assigneeId || '',
          projectId: defaults.projectId || '',
          categoryId: defaults.categoryId || 'c1',
          dueDate: '',
          estimatedHours: '',
          tagsText: ''
        })
      }
      setErrors({})
    }
  }, [open, task, defaults])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) {
      errs.title = 'O título da tarefa é obrigatório.'
    }
    if (form.dueDate) {
      const due = new Date(form.dueDate + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (due < today) {
        errs.dueDate = 'A data de vencimento não pode ser retroativa.'
      }
    }
    if (form.estimatedHours !== '' && (isNaN(Number(form.estimatedHours)) || Number(form.estimatedHours) < 0)) {
      errs.estimatedHours = 'Horas estimadas deve ser um número não negativo.'
    }
    setErrors(errs)
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSave) {
      toast.error(isEdit ? 'Seu perfil não tem permissão para editar tarefas.' : 'Seu perfil não tem permissão para criar tarefas.')
      return
    }
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
      assigneeId: form.assigneeId || null,
      projectId: form.projectId || null,
      categoryId: form.categoryId,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : 0,
      tags: form.tagsText
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    }
    const actorId = state.currentUserId
    if (isEdit) {
      dispatch({ type: 'UPDATE_TASK', taskId: task.id, patch: payload, actorId })
      toast.success('Tarefa atualizada com sucesso')
    } else {
      dispatch({ type: 'CREATE_TASK', task: payload, actorId })
      toast.success('Tarefa criada com sucesso')
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar tarefa' : 'Nova tarefa'}
      description={
        isEdit ? 'Atualize as informações da tarefa.' : 'Preencha os dados para criar uma nova tarefa.'
      }
      size="lg"
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
          placeholder="Ex.: Implementar tela de relatórios"
          value={form.title}
          onChange={set('title')}
          error={errors.title}
          autoFocus
        />
        <Textarea
          label="Descrição"
          placeholder="Descreva o objetivo, contexto e critérios de aceite da tarefa..."
          value={form.description}
          onChange={set('description')}
          hint={`${form.description.length}/500 caracteres`}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={form.status}
            onChange={set('status')}
            options={Object.values(STATUS)
              .filter((s) => s.key !== 'cancelled')
              .map((s) => ({ value: s.key, label: s.label }))}
          />
          <Select
            label="Prioridade"
            value={form.priority}
            onChange={set('priority')}
            options={Object.values(PRIORITY).map((p) => ({ value: p.key, label: p.label }))}
          />
          <Select
            label="Responsável"
            value={form.assigneeId}
            onChange={set('assigneeId')}
            placeholder="Não atribuída"
            disabled={!canAssign}
            options={state.users.map((u) => ({ value: u.id, label: `${u.name} — ${u.role}` }))}
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
              placeholder="Ex.: frontend, urgente"
              value={form.tagsText}
              onChange={set('tagsText')}
            />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
