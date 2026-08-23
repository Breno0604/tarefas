const { JSDOM } = require('jsdom')

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/',
  pretendToBeVisual: true
})

global.window = dom.window
global.document = dom.window.document
global.navigator = { userAgent: 'node' }
global.HTMLElement = dom.window.HTMLElement
global.Node = dom.window.Node
global.getComputedStyle = dom.window.getComputedStyle
global.requestAnimationFrame = (cb) => setTimeout(cb, 0)
global.cancelAnimationFrame = (id) => clearTimeout(id)
global.localStorage = {
  _s: {},
  getItem(k) { return this._s[k] ?? null },
  setItem(k, v) { this._s[k] = String(v) },
  removeItem(k) { delete this._s[k] }
}
global.window.localStorage = global.localStorage
global.IS_REACT_ACT_ENVIRONMENT = true

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver
global.window.ResizeObserver = ResizeObserver

const errors = []
const origError = console.error
console.error = (...args) => {
  const msg = args.map(String).join(' ')
  if (!msg.includes('Warning:') && !msg.includes('wrap in act')) {
    errors.push(msg)
  }
  origError.apply(console, args)
}

const { resolve } = require('path')
require(resolve(__dirname, 'dist/app.cjs'))

const routes = ['/', '/tarefas', '/equipe', '/projetos', '/categorias', '/atividades', '/configuracoes', '/perfis', '/nao-existe-404', '/configuracoes?tab=preferences', '/tarefas?view=calendar', '/tarefas?view=kanban']

setTimeout(async () => {
  for (const route of routes) {
    const errCount = errors.length
    dom.window.location.hash = route
    await new Promise((r) => setTimeout(r, 250))
    if (errors.length > errCount) {
      console.log(`route ${route} -> ERRORS`)
      errors.slice(errCount).slice(0, 5).forEach((e) => console.log('  ', e))
    }
  }

  const probe = global.window.__probe
  const bodyText = document.body.textContent || ''
  const passed = Boolean(probe) && errors.length === 0
  console.log('=== SMOKE RESULT ===')
  console.log('probe:', JSON.stringify(probe, null, 2))
  console.log('bodyLen:', bodyText.length, '| hasTarefas:', bodyText.includes('Tarefas'), '| hasDashboard:', bodyText.includes('Dashboard'))
  console.log('hasPerfis:', bodyText.includes('Perfis de acesso'), '| hasAdmin:', bodyText.includes('Administrador'), '| hasPermissoes:', bodyText.includes('permissões'))
  console.log('console.errors:', errors.length)
  if (errors.length) {
    console.log('--- first errors ---')
    errors.slice(0, 10).forEach((e) => console.log(e))
  }
  const ok =
    probe &&
    probe.toggle.ok === true &&
    probe.dupCount >= 1 &&
    probe.restore.gone === true &&
    probe.restore.back === true &&
    probe.createFav === true &&
    probe.profileCreated === true &&
    probe.profileSwitched === true &&
    probe.profileDeleted === true &&
    probe.viewerGuard &&
    probe.viewerGuard.countUnchanged === true &&
    probe.viewerGuard.noMutation === true &&
    probe.viewerGuard.commentBlocked === true &&
    errors.length === 0
  console.log(ok ? 'SMOKE OK' : 'SMOKE FAIL')
  process.exit(ok ? 0 : 1)
}, 2500)
