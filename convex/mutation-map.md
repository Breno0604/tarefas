# Reducer Actions → Convex Mutations Mapping

## Overview

Each `case` in the reducer (`src/store/store.tsx`) maps to a Convex mutation.
The domain functions in `src/domain/` contain the business logic that both
the client reducer and server mutations will use.

## Mapping Table

| # | Reducer Action | Convex Mutation | Notes |
|---|---------------|-----------------|-------|
| 1 | `CREATE_TASK` | `tasks.create` | Uses `createTaskFromPayload` from domain |
| 2 | `UPDATE_TASK` | `tasks.update` | Routes through `completeTask`/`reopenTask` if status changes |
| 3 | `TOGGLE_TASK_DONE` | `tasks.toggleDone` | Calls `completeTask` or `reopenTask` |
| 4 | `COMPLETE_TASK` | `tasks.complete` | Uses `completeTask` domain function |
| 5 | `REOPEN_TASK` | `tasks.reopen` | Uses `reopenTask` domain function |
| 6 | `SET_TASK_STATUS` | `tasks.setStatus` | Routes to complete/reopen or simple status change |
| 7 | `CANCEL_TASK` | `tasks.cancel` | Sets status=cancelled + cancelReason |
| 8 | `DELETE_TASK` | `tasks.delete` | Soft-deletes to trash table |
| 9 | `RESTORE_TASK` | `tasks.restore` | Moves from trash back to tasks |
| 10 | `TOGGLE_FAVORITE` | `tasks.toggleFavorite` | Toggles favorite boolean |
| 11 | `DUPLICATE_TASK` | `tasks.duplicate` | Creates copy with "(cópia)" suffix |
| 12 | `TOGGLE_SUBTASK` | `tasks.toggleSubtask` | Toggles subtask done, recalculates progress |
| 13 | `ADD_NOTE` | `notes.add` | Creates note linked to task |
| 14 | `DELETE_NOTE` | `notes.delete` | Removes note by id |
| 15 | `MARK_REMINDER_READ` | `reminders.markRead` | Marks single reminder as read |
| 16 | `MARK_ALL_REMINDERS_READ` | `reminders.markAllRead` | Marks all as read |
| 17 | `CLEAR_REMINDERS` | `reminders.clear` | Removes all reminders for user |
| 18 | `CREATE_PROJECT` | `projects.create` | Creates project with defaults |
| 19 | `CREATE_CATEGORY` | `categories.create` | Creates category with defaults |
| 20 | `IMPORT_DATA` | `importData.mutate` | Batch import with normalization |
| 21 | `CLEAR_TRASH` | `trash.clear` | Deletes all trash entries for user |
| 22 | `RESET` | `reset.mutate` | Deletes all user data, resets to defaults |

## Client-side only (no Convex mutation needed)

| Action | Reason |
|--------|--------|
| `BOOT` | Client initialization, runs reconciliation |
| `RECONCILE_REMINDERS` | Client-side, recalculates from task state |
| `SET_THEME` | Local preference, stored in localStorage |
| `UPDATE_PREFS` | Local preference |
| `UPDATE_NOTIF_PREFS` | Local preference |
| `UPDATE_APPEARANCE` | Local preference |
| `UPDATE_ME` | Could be Convex, but single-user — keep local for now |

## Migration Strategy

1. Keep the existing reducer working (fallback).
2. Add Convex mutations alongside.
3. Add a feature flag `USE_CONVEX` to toggle between local and Convex.
4. Migrate data from localStorage to Convex on first Convex login.
5. Remove localStorage persistence when Convex is stable.
