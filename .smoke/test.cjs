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
state = reducer(state, { type: 'DUPLICATE_TASK', taskId: firstTask.id, actorId: 'u1' })
const copies = state.tasks.filter((t) => t.title.includes('(cópia)'))
if (copies.length !== 1) throw new Error('DUPLICATE_TASK não criou cópia')
const copy = copies[0]
if (copy.subtasks.some((s) => s.done)) throw new Error('DUPLICATE_TASK não zerou subtarefas')
if (copy.id === source.id) throw new Error('DUPLICATE_TASK gerou id duplicado')

// 3. DELETE_TASK + RESTORE_TASK
const target = state.tasks.find((t) => t.id === favorite?.id) || state.tasks[1]
state = reducer(state, { type: 'DELETE_TASK', taskId: target.id, actorId: 'u1' })
if (state.tasks.some((t) => t.id === target.id)) throw new Error('DELETE_TASK não removeu')
if (state.trash.length !== 1) throw new Error('trash não populado')
state = reducer(state, { type: 'RESTORE_TASK', taskId: target.id, actorId: 'u1' })
if (!state.tasks.some((t) => t.id === target.id)) throw new Error('RESTORE_TASK não restaurou')
if (state.trash.length !== 0) throw new Error('trash não esvaziado')

// 4. DELETE bulk + RESTORE bulk
const ids = [state.tasks[0].id, state.tasks[1].id]
state = reducer(state, { type: 'DELETE_TASK', taskId: ids[0], actorId: 'u1' })
state = reducer(state, { type: 'DELETE_TASK', taskId: ids[1], actorId: 'u1' })
if (state.trash.length !== 2) throw new Error('trash bulk errado')
state = reducer(state, { type: 'RESTORE_TASK', taskIds: ids, actorId: 'u1' })
if (state.trash.length !== 0) throw new Error('restore bulk não limpou')
if (!state.tasks.some((t) => t.id === ids[0]) || !state.tasks.some((t) => t.id === ids[1]))
  throw new Error('restore bulk não restaurou')

// 5. CREATE_TASK with favorite
state = reducer(state, { type: 'CREATE_TASK', actorId: 'u1', task: { title: 'Nova', favorite: true } })
if (!state.tasks[0].favorite) throw new Error('CREATE_TASK não respeitou favorite')

// 6. mock data has favorites
if (favCount0 === 0) throw new Error('nenhuma tarefa favorita no mock')

// 7. Profiles CRUD
const profileCount0 = state.profiles.length
if (profileCount0 === 0) throw new Error('sem perfis no mock')
if (state.currentProfileId !== 'pr1') throw new Error('currentProfileId padrão errado')

state = reducer(state, {
  type: 'CREATE_PROFILE',
  name: 'Analista Financeiro',
  level: 'member',
  permissions: ['view_tasks', 'create_tasks']
})
const created = state.profiles.find((p) => p.name === 'Analista Financeiro')
if (!created) throw new Error('CREATE_PROFILE não criou perfil')
if (created.createdBy !== 'u1') throw new Error('CREATE_PROFILE criador errado')

state = reducer(state, {
  type: 'UPDATE_ACCESS_PROFILE',
  profileId: created.id,
  patch: { level: 'manager', permissions: ['view_tasks', 'assign_tasks'] }
})
const updated = state.profiles.find((p) => p.id === created.id)
if (updated.level !== 'manager') throw new Error('UPDATE_ACCESS_PROFILE não alterou nível')
if (updated.permissions.length !== 2) throw new Error('UPDATE_ACCESS_PROFILE não alterou permissões')

state = reducer(state, { type: 'SET_CURRENT_PROFILE', profileId: created.id })
if (state.currentProfileId !== created.id) throw new Error('SET_CURRENT_PROFILE falhou')

// deleting the active profile must be a no-op (guard on the page level)
const afterDeleteActive = reducer(state, { type: 'DELETE_PROFILE', profileId: created.id })
if (afterDeleteActive.profiles.some((p) => p.id === created.id) === false)
  throw new Error('DELETE_PROFILE removeu perfil ativo (não deveria no reducer)')

state = reducer(state, { type: 'SET_CURRENT_PROFILE', profileId: 'pr1' })
state = reducer(state, { type: 'DELETE_PROFILE', profileId: created.id })
if (state.profiles.some((p) => p.id === created.id)) throw new Error('DELETE_PROFILE não removeu')
if (state.profiles.length !== profileCount0) throw new Error('DELETE_PROFILE contagem errada')

// ===== Decisões A1/A2/A3 e B4/B5/B7/B8 =====

// perfil membro com editar+excluir para testar gating por responsável (B4)
state = reducer(state, { type: 'CREATE_PROFILE', name: 'Membro editor', level: 'member', permissions: ['view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks', 'assign_tasks'] })
const editorProfile = state.profiles.find((p) => p.name === 'Membro editor')
state = reducer(state, { type: 'SET_CURRENT_USER', userId: 'u2' }) // u2 -> pr3
state = reducer(state, { type: 'SET_CURRENT_PROFILE', profileId: editorProfile.id })
if (state.currentProfileId !== editorProfile.id) throw new Error('perfil editor não ativado')
if (state.currentUserId !== 'u2') throw new Error('SET_CURRENT_USER não trocou usuário')

const myTask = state.tasks.find((t) => t.assigneeId === 'u2' && t.status !== 'done' && t.status !== 'cancelled')
const otherTask = state.tasks.find((t) => t.assigneeId && t.assigneeId !== 'u2' && t.status !== 'done' && t.status !== 'cancelled')
if (!myTask || !otherTask) throw new Error('falta tarefa própria/outra no mock')

const otherTitle = otherTask.title
state = reducer(state, { type: 'UPDATE_TASK', taskId: otherTask.id, patch: { title: 'HACK' }, actorId: 'u2' })
if (state.tasks.find((t) => t.id === otherTask.id).title !== otherTitle) throw new Error('B4: membro editou tarefa alheia')

const commentsBefore = (state.comments[otherTask.id] || []).length
state = reducer(state, { type: 'ADD_COMMENT', taskId: otherTask.id, userId: 'u2', text: 'hack' })
if ((state.comments[otherTask.id] || []).length !== commentsBefore) throw new Error('B4: membro comentou em tarefa alheia')

state = reducer(state, { type: 'DELETE_TASK', taskId: otherTask.id, actorId: 'u2' })
if (!state.tasks.some((t) => t.id === otherTask.id)) throw new Error('B4: membro excluiu tarefa alheia')

state = reducer(state, { type: 'CANCEL_TASK', taskId: otherTask.id, reason: 'hack', actorId: 'u2' })
if (state.tasks.find((t) => t.id === otherTask.id).status === 'cancelled') throw new Error('B4: membro cancelou tarefa alheia')

// B4: membro edita a própria tarefa
const myTitle = myTask.title
state = reducer(state, { type: 'UPDATE_TASK', taskId: myTask.id, patch: { title: 'Minha edição' }, actorId: 'u2' })
if (state.tasks.find((t) => t.id === myTask.id).title === myTitle) throw new Error('B4: membro não conseguiu editar tarefa própria')

// B5: membro não reatribui (mesmo com assign_tasks no perfil)
const ownAssignee = state.tasks.find((t) => t.id === myTask.id).assigneeId
state = reducer(state, { type: 'UPDATE_TASK', taskId: myTask.id, patch: { assigneeId: 'u4' }, actorId: 'u2' })
if (state.tasks.find((t) => t.id === myTask.id).assigneeId !== ownAssignee) throw new Error('B5: membro reatribuiu tarefa')

// B5: gestor reatribui (perfil pr2 manager)
state = reducer(state, { type: 'SET_CURRENT_USER', userId: 'u1' }) // u1 -> pr1
state = reducer(state, { type: 'SET_CURRENT_PROFILE', profileId: 'pr2' })
if (state.currentProfileId !== 'pr2') throw new Error('falha ao ativar perfil pr2')
const reassignTask = state.tasks.find((t) => t.assigneeId === 'u4' && t.status !== 'done')
if (!reassignTask) throw new Error('falta tarefa de u4 no mock')
state = reducer(state, { type: 'UPDATE_TASK', taskId: reassignTask.id, patch: { assigneeId: 'u6' }, actorId: 'u1' })
if (state.tasks.find((t) => t.id === reassignTask.id).assigneeId !== 'u6') throw new Error('B5: gestor não conseguiu reatribuir')

// A1: cancelar com motivo registra motivo/autor/atividade/notificação
const cancelMe = state.tasks.find((t) => t.status === 'todo' && t.assigneeId)
if (!cancelMe) throw new Error('falta tarefa todo no mock')
const cancelAssignee = cancelMe.assigneeId
state = reducer(state, { type: 'CANCEL_TASK', taskId: cancelMe.id, reason: 'Fora de escopo', actorId: 'u1' })
const cancelled = state.tasks.find((t) => t.id === cancelMe.id)
if (cancelled.status !== 'cancelled') throw new Error('A1: CANCEL_TASK não cancelou')
if (cancelled.cancelReason !== 'Fora de escopo' || cancelled.canceledBy !== 'u1') throw new Error('A1: motivo/autor não registrados')
if (!state.activities.some((a) => a.type === 'cancel' && a.taskId === cancelMe.id)) throw new Error('A1: atividade de cancelamento ausente')
if (!state.notifications.some((n) => n.type === 'cancel' && n.targetUserId === cancelAssignee)) throw new Error('A1: notificação de cancelamento ausente')

// A1: sem motivo -> bloqueado
const noReasonTask = state.tasks.find((t) => t.status === 'todo')
state = reducer(state, { type: 'CANCEL_TASK', taskId: noReasonTask.id, reason: '   ', actorId: 'u1' })
if (state.tasks.find((t) => t.id === noReasonTask.id).status === 'cancelled') throw new Error('A1: cancelou sem motivo')

// A1: não cancela done/cancelled
const doneTask = state.tasks.find((t) => t.status === 'done')
state = reducer(state, { type: 'CANCEL_TASK', taskId: doneTask.id, reason: 'x', actorId: 'u1' })
if (state.tasks.find((t) => t.id === doneTask.id).status === 'cancelled') throw new Error('A1: cancelou tarefa concluída')

// A2: status pausada
const pauseMe = state.tasks.find((t) => t.status === 'todo')
state = reducer(state, { type: 'UPDATE_TASK', taskId: pauseMe.id, patch: { status: 'paused' }, actorId: 'u1' })
if (state.tasks.find((t) => t.id === pauseMe.id).status !== 'paused') throw new Error('A2: não conseguiu pausar tarefa')

// A3: aprovar tarefa em review
const reviewApprove = state.tasks.find((t) => t.status === 'review')
if (!reviewApprove) throw new Error('falta tarefa review no mock')
const reviewAssignee = reviewApprove.assigneeId
state = reducer(state, { type: 'APPROVE_TASK', taskId: reviewApprove.id, actorId: 'u1' })
const approved = state.tasks.find((t) => t.id === reviewApprove.id)
if (approved.status !== 'done') throw new Error('A3: APPROVE_TASK não concluiu')
if (!state.activities.some((a) => a.type === 'approve' && a.taskId === reviewApprove.id)) throw new Error('A3: atividade de aprovação ausente')
if (reviewAssignee && !state.notifications.some((n) => n.type === 'approve' && n.targetUserId === reviewAssignee)) throw new Error('A3: notificação de aprovação ausente')

// A3: aprovar fora de review -> bloqueado
const notReviewTask = state.tasks.find((t) => t.status === 'in_progress')
state = reducer(state, { type: 'APPROVE_TASK', taskId: notReviewTask.id, actorId: 'u1' })
if (state.tasks.find((t) => t.id === notReviewTask.id).status === 'done') throw new Error('A3: aprovou tarefa fora de review')

// A3: devolver com motivo
const reviewReturn = state.tasks.find((t) => t.status === 'review')
if (!reviewReturn) throw new Error('falta 2ª tarefa review no mock')
const returnAssignee = reviewReturn.assigneeId
state = reducer(state, { type: 'RETURN_TASK', taskId: reviewReturn.id, reason: 'Ajustar acessibilidade', actorId: 'u1' })
const returned = state.tasks.find((t) => t.id === reviewReturn.id)
if (returned.status !== 'in_progress') throw new Error('A3: RETURN_TASK não devolveu')
if (!state.activities.some((a) => a.type === 'return' && a.taskId === reviewReturn.id)) throw new Error('A3: atividade de devolução ausente')
if (returnAssignee && !state.notifications.some((n) => n.type === 'return' && n.targetUserId === returnAssignee)) throw new Error('A3: notificação de devolução ausente')

// A3: devolver sem motivo -> bloqueado
const reviewNoReason = state.tasks.find((t) => t.status === 'review')
state = reducer(state, { type: 'RETURN_TASK', taskId: reviewNoReason.id, reason: undefined, actorId: 'u1' })
if (state.tasks.find((t) => t.id === reviewNoReason.id).status !== 'review') throw new Error('A3: devolveu sem motivo')

// B8: aviso de atraso ao responsável e ao gestor
if (!state.notifications.some((n) => n.type === 'due' && n.targetUserId === 'u7')) throw new Error('B8: sem aviso de atraso ao responsável')
if (!state.notifications.some((n) => n.type === 'due' && n.targetUserId === 'u1')) throw new Error('B8: sem aviso de atraso ao gestor')

// B7: mudança de status notifica o responsável
const statusNTask = state.tasks.find((t) => t.assigneeId === 'u3' && t.status !== 'done' && t.status !== 'cancelled' && t.status !== 'blocked')
if (!statusNTask) throw new Error('falta tarefa de u3')
state = reducer(state, { type: 'UPDATE_TASK', taskId: statusNTask.id, patch: { status: 'blocked' }, actorId: 'u1' })
if (!state.notifications.some((n) => n.type === 'status' && n.targetUserId === 'u3' && n.taskId === statusNTask.id)) throw new Error('B7: sem notificação de mudança de status')

// B7: menção em comentário gera notificação
const mentionTask = state.tasks.find((t) => t.status === 'todo')
state = reducer(state, { type: 'ADD_COMMENT', taskId: mentionTask.id, userId: 'u1', text: '@Elisa Cardoso revise isto' })
if (!state.notifications.some((n) => n.type === 'mention' && n.targetUserId === 'u5')) throw new Error('B7: menção não gerou notificação')

// limpeza: remove perfil auxiliar criado no teste
state = reducer(state, { type: 'SET_CURRENT_USER', userId: 'u1' })
state = reducer(state, { type: 'SET_CURRENT_PROFILE', profileId: 'pr1' })
state = reducer(state, { type: 'DELETE_PROFILE', profileId: editorProfile.id })

console.log('SMOKE OK — todos os novos actions do store funcionam')
