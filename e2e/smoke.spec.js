import { test, expect } from '@playwright/test'

test.describe('TaskFlow – Tarefas pessoais', () => {
  test('loads dashboard', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.locator('h1')).toContainText('Dashboard')
    await expect(page.locator('text=Tarefas ativas')).toBeVisible()
  })

  test('navigates to tasks page', async ({ page }) => {
    await page.goto('/#/')
    await page.click('nav a[href="#/tarefas"]')
    await expect(page.locator('h1')).toContainText('Tarefas')
  })

  test('switches view to Kanban', async ({ page }) => {
    await page.goto('/#/tarefas')
    await page.waitForTimeout(600)
    await page.click('[aria-label="Alterar visualização"]')
    await page.click('text=Kanban')
    await expect(page.locator('text=Arraste tarefas entre colunas')).toBeVisible()
  })

  test('opens command palette with Ctrl+K', async ({ page }) => {
    await page.goto('/#/')
    await page.waitForTimeout(800) // aguarda o boot do app registrar os atalhos
    await page.keyboard.press('Control+k')
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('toggles theme with D key', async ({ page }) => {
    await page.goto('/#/')
    const html = page.locator('html')
    const initialClass = await html.getAttribute('class')
    await page.keyboard.press('d')
    await page.waitForTimeout(100)
    const newClass = await html.getAttribute('class')
    expect(newClass).not.toBe(initialClass)
  })

  test('navigates to settings', async ({ page }) => {
    await page.goto('/#/')
    await page.click('nav a[href="#/configuracoes"]')
    await expect(page.locator('h1')).toContainText('Configurações')
  })

  test('opens mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/#/')
    await page.waitForTimeout(300)
    await page.click('[aria-label="Abrir menu"]')
    await page.waitForTimeout(300)
    // The mobile sidebar overlay + aside appear in a fixed container
    const sidebar = page.locator('.fixed.inset-0.z-50 aside')
    await expect(sidebar).toBeVisible({ timeout: 3000 })
  })
})
