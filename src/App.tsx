import React, { Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import ConvexProvider, { USE_CONVEX } from './components/ConvexProvider'
import { StoreProvider } from './store/store'
import { ConvexStoreProvider } from './components/ConvexStoreProvider'
import { ToastProvider } from './store/toast'
import { ContextMenuProvider } from './components/ui/ContextMenu'
import AppLayout from './components/layout/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'
import { PageSkeleton } from './components/ui/Skeleton'

const TodayPage = React.lazy(() => import('./pages/TodayPage'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const TasksPage = React.lazy(() => import('./pages/TasksPage'))
const ProjectsPage = React.lazy(() => import('./pages/ProjectsPage'))
const CategoriesPage = React.lazy(() => import('./pages/CategoriesPage'))
const ActivitiesPage = React.lazy(() => import('./pages/ActivitiesPage'))
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'))
const TrashPage = React.lazy(() => import('./pages/TrashPage'))
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'))

function PageLoader() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <PageSkeleton />
    </div>
  )
}

/**
 * Error boundary that catches ConvexStoreProvider crashes
 * and falls back to StoreProvider.
 */
class ConvexFallback extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err: Error) { console.warn('[ConvexFallback] ConvexStoreProvider failed, using localStorage:', err.message) }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

/** Wraps children with the correct store provider based on USE_CONVEX flag. */
function DataProvider({ children }: { children: React.ReactNode }) {
  if (USE_CONVEX) {
    return (
      <ConvexFallback fallback={<StoreProvider>{children}</StoreProvider>}>
        <ConvexStoreProvider>{children}</ConvexStoreProvider>
      </ConvexFallback>
    )
  }
  return <StoreProvider>{children}</StoreProvider>
}

export default function App() {
  return (
    <ConvexProvider>
    <ErrorBoundary>
      <DataProvider>
        <ToastProvider>
          <ContextMenuProvider>
            <HashRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<TodayPage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/tarefas" element={<TasksPage />} />
                    <Route path="/projetos" element={<ProjectsPage />} />
                    <Route path="/categorias" element={<CategoriesPage />} />
                    <Route path="/atividades" element={<ActivitiesPage />} />
                    <Route path="/configuracoes" element={<SettingsPage />} />
                    <Route path="/lixeira" element={<TrashPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </Suspense>
            </HashRouter>
          </ContextMenuProvider>
        </ToastProvider>
      </DataProvider>
    </ErrorBoundary>
    </ConvexProvider>
  )
}
