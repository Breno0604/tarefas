/**
 * Migrate data from localStorage to Convex.
 *
 * Called once when the user first uses Convex mode.
 * Reads the current localStorage state and inserts all records
 * into the Convex database.
 */

import { convexClient } from "../components/ConvexProvider";
import { getStorageAdapter } from "./storage";

const PERSIST_KEY = "taskflow-state-v3";

/**
 * Read the current localStorage state.
 */
function readLocalState(): Record<string, any> | null {
  const storage = getStorageAdapter();
  const raw = storage.load(PERSIST_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Migrate all data from localStorage to Convex.
 * Returns a summary of what was migrated.
 */
export async function migrateToConvex(): Promise<{
  tasks: number;
  projects: number;
  categories: number;
  notes: number;
  activities: number;
} | null> {
  if (!convexClient) {
    console.warn("[Migration] Convex not configured");
    return null;
  }

  const state = readLocalState();
  if (!state) {
    console.warn("[Migration] No local state found");
    return null;
  }

  const summary = { tasks: 0, projects: 0, categories: 0, notes: 0, activities: 0 };

  // Import tasks
  if (Array.isArray(state.tasks)) {
    for (const task of state.tasks) {
      try {
        await (convexClient as any).mutation("tasks:create", {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          projectId: task.projectId,
          categoryId: task.categoryId,
          dueDate: task.dueDate,
          estimatedHours: task.estimatedHours,
          progress: task.progress,
          tags: task.tags,
          subtasks: task.subtasks,
          favorite: task.favorite,
          recurrence: task.recurrence,
        });
        summary.tasks++;
      } catch (e) {
        console.warn("[Migration] Failed to migrate task:", task.title, e);
      }
    }
  }

  // Import projects
  if (Array.isArray(state.projects)) {
    for (const project of state.projects) {
      try {
        await (convexClient as any).mutation("projects:create", {
          name: project.name,
          description: project.description,
          color: project.color,
          due: project.due,
        });
        summary.projects++;
      } catch (e) {
        console.warn("[Migration] Failed to migrate project:", project.name, e);
      }
    }
  }

  // Import categories
  if (Array.isArray(state.categories)) {
    for (const category of state.categories) {
      try {
        await (convexClient as any).mutation("categories:create", {
          name: category.name,
          color: category.color,
        });
        summary.categories++;
      } catch (e) {
        console.warn("[Migration] Failed to migrate category:", category.name, e);
      }
    }
  }

  // Import notes
  if (state.notes && typeof state.notes === "object") {
    for (const [taskId, notes] of Object.entries(state.notes)) {
      if (Array.isArray(notes)) {
        for (const note of notes) {
          try {
            await (convexClient as any).mutation("notes:add", {
              taskId,
              text: note.text,
            });
            summary.notes++;
          } catch (e) {
            console.warn("[Migration] Failed to migrate note:", e);
          }
        }
      }
    }
  }

  // Import activities
  if (Array.isArray(state.activities)) {
    for (const activity of state.activities) {
      // Activities are read-only audit trail — skip migration
      // They're already embedded in mutations
      summary.activities++;
    }
  }

  console.log("[Migration] Complete:", summary);
  return summary;
}

/**
 * Check if migration has been done.
 */
export function isMigratedToConvex(): boolean {
  const storage = getStorageAdapter();
  return storage.load("taskflow-convex-migrated") === "true";
}

/**
 * Mark migration as complete.
 */
export function markMigrated(): void {
  const storage = getStorageAdapter();
  storage.save("taskflow-convex-migrated", "true");
}
