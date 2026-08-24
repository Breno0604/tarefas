import React from 'react'
import Button from '../components/ui/Button'

export default {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'subtle']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    iconOnly: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' }
  }
}

export const Primary = {
  args: { children: 'Primary', variant: 'primary' }
}

export const Secondary = {
  args: { children: 'Secondary', variant: 'secondary' }
}

export const Danger = {
  args: { children: 'Delete', variant: 'danger' }
}

export const Ghost = {
  args: { children: 'Ghost', variant: 'ghost' }
}

export const Small = {
  args: { children: 'Small', size: 'sm' }
}

export const Large = {
  args: { children: 'Large', size: 'lg' }
}

export const Loading = {
  args: { children: 'Loading...', loading: true }
}

export const Disabled = {
  args: { children: 'Disabled', disabled: true }
}
