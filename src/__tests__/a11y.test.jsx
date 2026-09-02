import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import axe, { configureAxe } from 'jest-axe'

const axeConfig = configureAxe({
  rules: {
    'color-contrast': { enabled: false }, // Tailwind dark mode needs runtime theme
    region: { enabled: false } // App doesn't use landmark regions everywhere
  }
})

function wrapper({ children } = {}) {
  return <MemoryRouter>{children}</MemoryRouter>
}

/* ─── Mock store ─── */
vi.mock('../store/store', () => ({
  useStore: () => ({
    state: {
      tasks: [{ id: 't1', title: 'Test task', status: 'todo', priority: 'medium', projectId: null, tags: [], subtasks: [], recurrence: null }],
      me: { id: 'me', name: 'Você', bio: '' },
      projects: [],
      reminders: [],
      notes: {},
      activities: [],
      theme: 'light',
      booted: true
    },
    dispatch: vi.fn()
  }),
  useMe: () => ({ id: 'me', name: 'Você', bio: '' }),
  useTaskById: () => null,
  useTaskNotes: () => []
}))

vi.mock('../store/toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), push: vi.fn() }),
  ToastProvider: ({ children }) => children
}))

/* ─── Tests ─── */
describe('a11y', () => {
  it('Sidebar has no critical violations', async () => {
    const { default: Sidebar } = await import('../components/layout/Sidebar')
    const { container } = render(<Sidebar mobileOpen={false} onClose={() => {}} />, { wrapper })
    const results = await axeConfig(container)
    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(critical).toEqual([])
  })

  it('Button component has no violations', async () => {
    const { default: Button } = await import('../components/ui/Button')
    const { container } = render(
      <Button iconOnly aria-label="Test button">X</Button>,
      { wrapper }
    )
    const results = await axeConfig(container)
    expect(results.violations).toEqual([])
  })

  it('Modal has no violations', async () => {
    const { default: Modal } = await import('../components/ui/Modal')
    const { container } = render(
      <Modal open={true} onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>,
      { wrapper }
    )
    const results = await axeConfig(container)
    expect(results.violations).toEqual([])
  })

  it('ErrorBoundary has no violations', async () => {
    const { default: ErrorBoundary } = await import('../components/ErrorBoundary')
    const { container } = render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )
    const results = await axeConfig(container)
    expect(results.violations).toEqual([])
  })

  it('ActivityFeed has no violations', async () => {
    const { default: ActivityFeed } = await import('../components/ActivityFeed')
    const { container } = render(
      <ActivityFeed items={[{ id: 'a1', type: 'create', text: 'Você criou a tarefa "X"', createdAt: new Date().toISOString() }]} />,
      { wrapper }
    )
    const results = await axeConfig(container)
    expect(results.violations).toEqual([])
  })
})
