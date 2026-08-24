/**
 * Checks if the event target is a text input element
 * (input, textarea, select, or contentEditable)
 */
export function isTypingTarget(e) {
  const el = e.target
  return (
    el &&
    (el.tagName === 'INPUT' ||
      el.tagName === 'TEXTAREA' ||
      el.tagName === 'SELECT' ||
      el.isContentEditable)
  )
}

/**
 * Dispatches DELETE_TASK and shows an undo toast.
 * @param {object} opts - { dispatch, toast, task, actorId }
 */
export function deleteTaskWithUndo({ dispatch, toast, task, actorId }) {
  try {
    dispatch({ type: 'DELETE_TASK', taskId: task.id, actorId })
  } catch (e) {
    console.error('DELETE_TASK dispatch failed:', e)
    return
  }
  try {
    toast.push(`"${task.title}" excluída`, 'success', {
      action: {
        label: 'Desfazer',
        onClick: () => dispatch({ type: 'RESTORE_TASK', taskId: task.id, actorId })
      }
    })
  } catch (e) {
    console.error('Toast failed:', e)
  }
}

/**
 * Dispatches DELETE_TASK for multiple tasks and shows an undo toast.
 * @param {object} opts - { dispatch, toast, taskIds, actorId }
 */
export function bulkDeleteWithUndo({ dispatch, toast, taskIds, actorId }) {
  try {
    taskIds.forEach((id) => dispatch({ type: 'DELETE_TASK', taskId: id, actorId }))
  } catch (e) {
    console.error('Bulk DELETE_TASK dispatch failed:', e)
    return
  }
  try {
    toast.push(`${taskIds.length} tarefa(s) excluída(s)`, 'success', {
      action: {
        label: 'Desfazer',
        onClick: () => dispatch({ type: 'RESTORE_TASK', taskIds, actorId })
      }
    })
  } catch (e) {
    console.error('Toast failed:', e)
  }
}
