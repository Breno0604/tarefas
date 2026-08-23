import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider } from './store/store'
import { ToastProvider } from './store/toast'
import { ContextMenuProvider } from './components/ui/ContextMenu'
import AppLayout from './components/layout/AppLayout'
import RequirePerm from './components/RequirePerm'
import Dashboard from './pages/Dashboard'
import TasksPage from './pages/TasksPage'
import TeamPage from './pages/TeamPage'
import ProjectsPage from './pages/ProjectsPage'
import CategoriesPage from './pages/CategoriesPage'
import ActivitiesPage from './pages/ActivitiesPage'
import SettingsPage from './pages/SettingsPage'
import ProfilesPage from './pages/ProfilesPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <ContextMenuProvider>
          <HashRouter>
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
          </HashRouter>
        </ContextMenuProvider>
      </ToastProvider>
    </StoreProvider>
  )
}
