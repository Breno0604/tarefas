import { test, expect } from '@playwright/test'

test.describe('TaskFlow CRM', () => {
  test('loads dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Dashboard')
    await expect(page.locator('text=Tarefas ativas')).toBeVisible()
  })

  test('navigates to tasks page', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Tarefas')
    await expect(page.locator('h1')).toContainText('Tarefas')
  })

  test('switches view to Kanban', async ({ page }) => {
    await page.goto('/#/tarefas')
    await page.waitForTimeout(600)
    // Click the view selector dropdown
    await page.click('[aria-label="Alterar visualização"]')
    await page.click('text=Kanban')
    await expect(page.locator('text=Arraste tarefas entre colunas')).toBeVisible()
  })

  test('opens command palette with Ctrl+K', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+k')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('toggles theme with D key', async ({ page }) => {
    await page.goto('/')
    const html = page.locator('html')
    const initialClass = await html.getAttribute('class')
    await page.keyboard.press('d')
    await page.waitForTimeout(100)
    const newClass = await html.getAttribute('class')
    expect(newClass).not.toBe(initialClass)
  })

  test('navigates to settings', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Configurações')
    await expect(page.locator('h1')).toContainText('Configurações')
  })

  test('opens mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.click('[aria-label="Abrir menu"]')
    await expect(page.locator('aside').first()).toBeVisible()
  })
})
