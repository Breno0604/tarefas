import React, { Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider } from './store/store'
import { ToastProvider } from './store/toast'
import { ContextMenuProvider } from './components/ui/ContextMenu'
import AppLayout from './components/layout/AppLayout'
import RequirePerm from './components/RequirePerm'
import ErrorBoundary from './components/ErrorBoundary'
import { PageSkeleton } from './components/ui/Skeleton'

const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const TasksPage = React.lazy(() => import('./pages/TasksPage'))
const TeamPage = React.lazy(() => import('./pages/TeamPage'))
const ProjectsPage = React.lazy(() => import('./pages/ProjectsPage'))
const CategoriesPage = React.lazy(() => import('./pages/CategoriesPage'))
const ActivitiesPage = React.lazy(() => import('./pages/ActivitiesPage'))
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'))
const ProfilesPage = React.lazy(() => import('./pages/ProfilesPage'))
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'))

function PageLoader() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <PageSkeleton />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <ToastProvider>
          <ContextMenuProvider>
            <HashRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tarefas" element={<TasksPage />} />
                    <Route path="/equipe" element={<RequirePerm perm="manage_team"><TeamPage /></RequirePerm>} />
                    <Route path="/projetos" element={<RequirePerm perm="manage_projects"><ProjectsPage /></RequirePerm>} />
                    <Route path="/categorias" element={<RequirePerm perm="manage_projects"><CategoriesPage /></RequirePerm>} />
                    <Route path="/atividades" element={<ActivitiesPage />} />
                    <Route path="/configuracoes" element={<RequirePerm perm="view_settings"><SettingsPage /></RequirePerm>} />
                    <Route path="/perfis" element={<RequirePerm perm="manage_profiles"><ProfilesPage /></RequirePerm>} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </Suspense>
            </HashRouter>
          </ContextMenuProvider>
        </ToastProvider>
      </StoreProvider>
    </ErrorBoundary>
  )
}
