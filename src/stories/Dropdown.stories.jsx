import React from 'react'
import Dropdown from '../components/ui/Dropdown'
import Button from '../components/ui/Button'
import { Settings, User, LogOut, Trash2, Check } from 'lucide-react'

export default {
  title: 'UI/Dropdown',
  component: Dropdown,
  tags: ['autodocs']
}

const sampleItems = [
  { label: 'Profile', icon: User },
  { label: 'Settings', icon: Settings },
  { type: 'divider' },
  { label: 'Delete', icon: Trash2, danger: true }
]

const menuItems = [
  { label: 'Edit', active: false },
  { label: 'Duplicate' },
  { label: 'Archive', disabled: true },
  { type: 'divider' },
  { label: 'Delete', danger: true }
]

const checkItems = [
  { label: 'Status: Todo', active: true, keepOpen: true },
  { label: 'Status: In Progress', active: false, keepOpen: true },
  { label: 'Status: Done', active: false, keepOpen: true },
  { type: 'divider' },
  { label: 'Clear filter' }
]

export const Default = {
  render: () => (
    <Dropdown
      trigger={<Button variant="secondary">Actions ▾</Button>}
      items={sampleItems}
    />
  ),
  name: 'Default'
}

export const MenuStyle = {
  render: () => (
    <Dropdown
      trigger={<Button variant="ghost">Menu ▾</Button>}
      items={menuItems}
    />
  ),
  name: 'Menu style'
}

export const WithCheckboxes = {
  render: () => (
    <Dropdown
      trigger={<Button variant="secondary">Filter ▾</Button>}
      items={checkItems}
    />
  ),
  name: 'With checkboxes'
}

export const RightAligned = {
  render: () => (
    <div className="flex justify-end">
      <Dropdown
        align="right"
        trigger={<Button variant="secondary">Right ▾</Button>}
        items={sampleItems}
      />
    </div>
  ),
  name: 'Right aligned'
}
