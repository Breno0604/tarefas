import React from 'react'
import { StatusBadge, PriorityBadge, Avatar, Tag } from '../components/ui/Badge'

export default {
  title: 'UI/Badge',
  tags: ['autodocs']
}

export const StatusTodo = {
  render: () => <StatusBadge status="todo" />,
  name: 'Status: A fazer'
}

export const StatusInProgress = {
  render: () => <StatusBadge status="in_progress" />,
  name: 'Status: Em andamento'
}

export const StatusReview = {
  render: () => <StatusBadge status="review" />,
  name: 'Status: Em revisão'
}

export const StatusDone = {
  render: () => <StatusBadge status="done" />,
  name: 'Status: Concluído'
}

export const StatusBlocked = {
  render: () => <StatusBadge status="blocked" />,
  name: 'Status: Bloqueado'
}

export const PriorityLow = {
  render: () => <PriorityBadge priority="low" />,
  name: 'Prioridade: Baixa'
}

export const PriorityMedium = {
  render: () => <PriorityBadge priority="medium" />,
  name: 'Prioridade: Média'
}

export const PriorityHigh = {
  render: () => <PriorityBadge priority="high" />,
  name: 'Prioridade: Alta'
}

export const PriorityUrgent = {
  render: () => <PriorityBadge priority="urgent" />,
  name: 'Prioridade: Urgente'
}

export const AvatarSmall = {
  render: () => <Avatar user={{ id: '1', name: 'Ana Souza', color: '#6366f1' }} size="sm" />,
  name: 'Avatar Small'
}

export const AvatarMedium = {
  render: () => <Avatar user={{ id: '1', name: 'Ana Souza', color: '#6366f1' }} size="md" showStatus />,
  name: 'Avatar Medium (with status)'
}

export const AvatarLarge = {
  render: () => <Avatar user={{ id: '1', name: 'Ana Souza', color: '#6366f1' }} size="lg" />,
  name: 'Avatar Large'
}

export const AvatarFallback = {
  render: () => <Avatar user={null} size="md" />,
  name: 'Avatar Fallback'
}

export const TagDefault = {
  render: () => <Tag>React</Tag>,
  name: 'Tag Default'
}

export const TagColored = {
  render: () => <Tag color="#6366f1">Frontend</Tag>,
  name: 'Tag Colored'
}
