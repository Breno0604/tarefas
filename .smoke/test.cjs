global.localStorage = {
  _s: {},
  getItem(k) { return this._s[k] ?? null },
  setItem(k, v) { this._s[k] = String(v) },
  removeItem(k) { delete this._s[k] }
}

const { resolve } = require('path')
const mod = require(resolve(__dirname, 'dist/store.cjs'))
const { reducer, initialState } = mod

const base = initialState()
base.booted = true

let state = reducer(base, { type: 'BOOT' })

const firstTask = state.tasks[0]
const favCount0 = state.tasks.filter((t) => t.favorite).length
const favorite = state.tasks.find((t) => t.favorite)

// 1. TOGGLE_FAVORITE
state = reducer(state, { type: 'TOGGLE_FAVORITE', taskId: firstTask.id })
const nowFav = state.tasks.find((t) => t.id === firstTask.id)
if (nowFav.favorite !== !firstTask.favorite) throw new Error('TOGGLE_FAVORITE falhou')

// 2. DUPLICATE_TASK
const source = state.tasks.find((t) => t.id === firstTask.id)
state = reducer(state, { type: 'DUPLICATE_TASK', taskId: firstTask.id })
const copies = state.tasks.filter((t) => t.title.includes('(cópia)'))
if (copies.length !== 1) throw new Error('DUPLICATE_TASK não criou cópia')
const copy = copies[0]
if (copy.subtasks.some((s) => s.done)) throw new Error('DUPLICATE_TASK não zerou subtarefas')
if (copy.id === source.id) throw new Error('DUPLICATE_TASK gerou id duplicado')

// 3. DELETE_TASK + RESTORE_TASK preservando notas
state = reducer(state, { type: 'ADD_NOTE', taskId: source.id, text: 'Nota do smoke' })
const notesBefore = (state.notes[source.id] || []).length
state = reducer(state, { type: 'DELETE_TASK', taskId: source.id })
if (state.tasks.some((t) => t.id === source.id)) throw new Error('DELETE_TASK não removeu')
if (state.trash.length !== 1) throw new Error('trash não populado')
if (state.notes[source.id]) throw new Error('DELETE_TASK não removeu as notas')
state = reducer(state, { type: 'RESTORE_TASK', taskId: source.id })
if (!state.tasks.some((t) => t.id === source.id)) throw new Error('RESTORE_TASK não restaurou')
if ((state.notes[source.id] || []).length !== notesBefore) throw new Error('RESTORE_TASK não restaurou notas')
if (state.trash.length !== 0) throw new Error('trash não esvaziado')

// 4. DELETE bulk + RESTORE bulk
const ids = [state.tasks[0].id, state.tasks[1].id]
state = reducer(state, { type: 'DELETE_TASK', taskId: ids[0] })
state = reducer(state, { type: 'DELETE_TASK', taskId: ids[1] })
if (state.trash.length !== 2) throw new Error('trash bulk errado')
state = reducer(state, { type: 'RESTORE_TASK', taskIds: ids })
if (state.trash.length !== 0) throw new Error('restore bulk não limpou')
if (!state.tasks.some((t) => t.id === ids[0]) || !state.tasks.some((t) => t.id === ids[1]))
  throw new Error('restore bulk não restaurou')

// 5. CREATE_TASK with favorite + recurrence
state = reducer(state, { type: 'CREATE_TASK', task: { title: 'Nova', favorite: true, recurrence: 'weekly' } })
if (!state.tasks[0].favorite) throw new Error('CREATE_TASK não respeitou favorite')
if (state.tasks[0].recurrence !== 'weekly') throw new Error('CREATE_TASK não persistiu recorrência')

// 6. mock data has favorites
if (favCount0 === 0) throw new Error('nenhuma tarefa favorita no mock')

// 7. TOGGLE_TASK_DONE conclui e reabre
const openTask = state.tasks.find((t) => t.status === 'todo')
state = reducer(state, { type: 'TOGGLE_TASK_DONE', taskId: openTask.id })
let done = state.tasks.find((t) => t.id === openTask.id)
if (done.status !== 'done' || done.progress !== 100) throw new Error('TOGGLE_TASK_DONE não concluiu')
state = reducer(state, { type: 'TOGGLE_TASK_DONE', taskId: openTask.id })
done = state.tasks.find((t) => t.id === openTask.id)
if (done.status !== 'todo') throw new Error('TOGGLE_TASK_DONE não reabriu')

// 8. Recorrência: concluir gera próxima ocorrência com subtarefas zeradas
const recurring = state.tasks.find((t) => t.recurrence && t.recurrence !== 'none')
if (!recurring) throw new Error('falta tarefa recorrente no mock')
state = reducer(state, { type: 'TOGGLE_TASK_DONE', taskId: recurring.id })
const spawned = state.tasks.find((t) => t.title === recurring.title && t.id !== recurring.id)
if (!spawned) throw new Error('recorrência não gerou próxima ocorrência')
if (spawned.status !== 'todo' || spawned.progress !== 0) throw new Error('ocorrência não veio limpa')
if (spawned.recurrence !== recurring.recurrence) throw new Error('ocorrência perdeu a recorrência')
if ((recurring.subtasks || []).some((s) => s.done) && spawned.subtasks.some((s) => s.done))
  throw new Error('ocorrência não zerou subtarefas')
if (recurring.dueDate && spawned.dueDate && !(new Date(spawned.dueDate) > new Date(recurring.dueDate)))
  throw new Error('ocorrência não avançou o prazo')

// 9. Notas: ADD_NOTE cria atividade; DELETE_NOTE remove
const noteTarget = state.tasks[0]
state = reducer(state, { type: 'ADD_NOTE', taskId: noteTarget.id, text: 'Progresso registrado' })
if (!(state.notes[noteTarget.id] || []).some((n) => n.text === 'Progresso registrado'))
  throw new Error('ADD_NOTE não adicionou nota')
if (!state.activities.some((a) => a.type === 'note' && a.taskId === noteTarget.id))
  throw new Error('ADD_NOTE não criou atividade')
const addedNote = state.notes[noteTarget.id].find((n) => n.text === 'Progresso registrado')
state = reducer(state, { type: 'DELETE_NOTE', taskId: noteTarget.id, noteId: addedNote.id })
if ((state.notes[noteTarget.id] || []).some((n) => n.id === addedNote.id))
  throw new Error('DELETE_NOTE não removeu')

// 10. CANCEL_TASK: motivo opcional; bloqueado em done/cancelled
const cancelMe = state.tasks.find((t) => t.status === 'todo')
state = reducer(state, { type: 'CANCEL_TASK', taskId: cancelMe.id, reason: null })
if (state.tasks.find((t) => t.id === cancelMe.id).status !== 'cancelled')
  throw new Error('CANCEL_TASK não cancelou sem motivo (motivo é opcional)')
const cancelled = state.tasks.find((t) => t.id === cancelMe.id)
if (cancelled.cancelReason) throw new Error('CANCEL_TASK registrou motivo inexistente')
if (!state.activities.some((a) => a.type === 'cancel')) throw new Error('A1: atividade de cancelamento ausente')
const doneTask = state.tasks.find((t) => t.status === 'done')
const afterDoneCancel = reducer(state, { type: 'CANCEL_TASK', taskId: doneTask.id, reason: 'x' })
if (afterDoneCancel.tasks.find((t) => t.id === doneTask.id).status !== 'done')
  throw new Error('A1: cancelou tarefa concluída')

// 11. Atividades em primeira pessoa (sem actor)
const statusAct = state.activities.find((a) => a.type === 'cancel')
if (!statusAct || !statusAct.text.startsWith('Você')) throw new Error('atividades não estão em primeira pessoa')
if ('actorId' in statusAct) throw new Error('atividade ainda tem actorId')

// 12. Lembretes no BOOT: dedup por tarefa e apenas tarefas abertas
if (!state.reminders.every((r) => r.type === 'due')) throw new Error('lembrete de tipo inesperado')

// 13. UPDATE_ME
state = reducer(state, { type: 'UPDATE_ME', patch: { name: 'Dono do app' } })
if (state.me.name !== 'Dono do app') throw new Error('UPDATE_ME falhou')

// 14. Prefs/appearance merge
state = reducer(state, { type: 'UPDATE_PREFS', prefs: { compactMode: true } })
if (state.prefs.compactMode !== true || state.prefs.soundAlerts !== false)
  throw new Error('UPDATE_PREFS merge errado')
state = reducer(state, { type: 'UPDATE_APPEARANCE', appearance: { firstDay: 'monday' } })
if (state.appearance.firstDay !== 'monday') throw new Error('UPDATE_APPEARANCE falhou')

// 15. Projetos sem membros
state = reducer(state, { type: 'CREATE_PROJECT', name: 'Projeto Smoke' })
const proj = state.projects.find((p) => p.name === 'Projeto Smoke')
if (!proj || 'members' in proj) throw new Error('CREATE_PROJECT deveria criar projeto sem membros')

console.log('SMOKE OK — todos os actions do store pessoal funcionam')
