import React, { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../src/App'
import { StoreProvider, useStore } from '../src/store/store'
import { ToastProvider } from '../src/store/toast'
import { ContextMenuProvider } from '../src/components/ui/ContextMenu'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function Probe() {
  const { state, dispatch } = useStore()
  const results = useRef({})
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const run = async () => {
      const tasks = () => stateRef.current.tasks

      await wait(80)
      const t0 = tasks()[0]
      const before = t0.favorite
      dispatch({ type: 'TOGGLE_FAVORITE', taskId: t0.id })
      await wait(80)
      const after = tasks().find((t) => t.id === t0.id).favorite
      results.current.toggle = { before, after, ok: before !== after }

      dispatch({ type: 'DUPLICATE_TASK', taskId: t0.id, actorId: 'u1' })
      await wait(80)
      results.current.dupCount = tasks().filter((t) => t.title.includes('(cópia)')).length

      const fav = tasks().find((t) => t.favorite)
      dispatch({ type: 'DELETE_TASK', taskId: fav.id, actorId: 'u1' })
      await wait(80)
      const gone = !tasks().some((t) => t.id === fav.id)
      dispatch({ type: 'RESTORE_TASK', taskId: fav.id, actorId: 'u1' })
      await wait(80)
      results.current.restore = { gone, back: tasks().some((t) => t.id === fav.id) }

      dispatch({ type: 'CREATE_TASK', actorId: 'u1', task: { title: 'Smoke Nova', favorite: true } })
      await wait(80)
      results.current.createFav = tasks()[0] && tasks()[0].favorite === true

      const profileCount0 = stateRef.current.profiles.length
      dispatch({
        type: 'CREATE_PROFILE',
        name: 'Smoke Perfil',
        level: 'viewer',
        permissions: ['view_tasks']
      })
      await wait(80)
      const smokeProfile = stateRef.current.profiles.find((p) => p.name === 'Smoke Perfil')
      results.current.profileCreated = Boolean(smokeProfile) && stateRef.current.profiles.length === profileCount0 + 1

      dispatch({ type: 'SET_CURRENT_PROFILE', profileId: smokeProfile ? smokeProfile.id : 'pr1' })
      await wait(80)
      results.current.profileSwitched = stateRef.current.currentProfileId === (smokeProfile ? smokeProfile.id : 'pr1')

      dispatch({ type: 'SET_CURRENT_PROFILE', profileId: 'pr1' })
      if (smokeProfile) {
        dispatch({ type: 'DELETE_PROFILE', profileId: smokeProfile.id })
      }
      await wait(80)
      results.current.profileDeleted = !stateRef.current.profiles.some((p) => p.name === 'Smoke Perfil')

      const taskCountBefore = stateRef.current.tasks.length
      dispatch({ type: 'SET_CURRENT_PROFILE', profileId: 'pr4' })
      await wait(80)
      const viewerId = stateRef.current.currentProfileId
      const target = stateRef.current.tasks[0]
      dispatch({ type: 'CREATE_TASK', actorId: 'u1', task: { title: 'Bloqueada' } })
      dispatch({ type: 'UPDATE_TASK', taskId: target.id, patch: { title: 'Bloqueada Edit' }, actorId: 'u1' })
      dispatch({ type: 'DELETE_TASK', taskId: target.id, actorId: 'u1' })
      dispatch({ type: 'DUPLICATE_TASK', taskId: target.id, actorId: 'u1' })
      dispatch({ type: 'ADD_COMMENT', taskId: target.id, userId: 'u1', text: 'Bloqueada' })
      dispatch({ type: 'TOGGLE_SUBTASK', taskId: target.id, subtaskId: target.subtasks[0]?.id })
      await wait(80)
      results.current.viewerGuard = {
        profile: viewerId,
        countUnchanged: stateRef.current.tasks.length === taskCountBefore,
        noMutation: !stateRef.current.tasks.some(
          (t) => t.title.includes('Bloqueada')
        ),
        commentBlocked: (stateRef.current.comments[target.id] || []).every(
          (c) => c.text !== 'Bloqueada'
        )
      }
      dispatch({ type: 'SET_CURRENT_PROFILE', profileId: 'pr1' })

      window.__probe = results.current
    }
    run()
    return () => {}
  }, [])
  return null
}

function ProbeApp() {
  return (
    <StoreProvider>
      <ToastProvider>
        <ContextMenuProvider>
          <App />
          <Probe />
        </ContextMenuProvider>
      </ToastProvider>
    </StoreProvider>
  )
}

createRoot(document.getElementById('root')).render(<ProbeApp />)
