import React, { useState } from 'react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

export default {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl']
    }
  }
}

function ModalDemo({ size = 'md', title = 'Modal Title', description }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} description={description} size={size}>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This is the modal content. It can contain any React components.
        </p>
      </Modal>
    </>
  )
}

export const Small = {
  render: () => <ModalDemo size="sm" title="Small Modal" />,
  name: 'Small'
}

export const Medium = {
  render: () => <ModalDemo size="md" title="Medium Modal" description="This is a description." />,
  name: 'Medium (default)'
}

export const Large = {
  render: () => <ModalDemo size="lg" title="Large Modal" />,
  name: 'Large'
}

export const ExtraLarge = {
  render: () => <ModalDemo size="xl" title="Extra Large Modal" />,
  name: 'Extra Large'
}
