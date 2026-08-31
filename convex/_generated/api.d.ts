/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as categories from "../categories.js";
import type * as helpers from "../helpers.js";
import type * as notes from "../notes.js";
import type * as preferences from "../preferences.js";
import type * as profiles from "../profiles.js";
import type * as projects from "../projects.js";
import type * as reminders from "../reminders.js";
import type * as tasks from "../tasks.js";
import type * as trash from "../trash.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  categories: typeof categories;
  helpers: typeof helpers;
  notes: typeof notes;
  preferences: typeof preferences;
  profiles: typeof profiles;
  projects: typeof projects;
  reminders: typeof reminders;
  tasks: typeof tasks;
  trash: typeof trash;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
