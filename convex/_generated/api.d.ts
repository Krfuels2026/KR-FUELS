/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_auth from "../actions/auth.js";
import type * as actions_seed from "../actions/seed.js";
import type * as helpers_auth from "../helpers/auth.js";
import type * as mutations_accounts from "../mutations/accounts.js";
import type * as mutations_bunks from "../mutations/bunks.js";
import type * as mutations_reminders from "../mutations/reminders.js";
import type * as mutations_users from "../mutations/users.js";
import type * as mutations_vouchers from "../mutations/vouchers.js";
import type * as node_modules_bcryptjs_index from "../node_modules/bcryptjs/index.js";
import type * as node_modules_bcryptjs_umd_index from "../node_modules/bcryptjs/umd/index.js";
import type * as queries_accounts from "../queries/accounts.js";
import type * as queries_bunks from "../queries/bunks.js";
import type * as queries_reminders from "../queries/reminders.js";
import type * as queries_users from "../queries/users.js";
import type * as queries_vouchers from "../queries/vouchers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/auth": typeof actions_auth;
  "actions/seed": typeof actions_seed;
  "helpers/auth": typeof helpers_auth;
  "mutations/accounts": typeof mutations_accounts;
  "mutations/bunks": typeof mutations_bunks;
  "mutations/reminders": typeof mutations_reminders;
  "mutations/users": typeof mutations_users;
  "mutations/vouchers": typeof mutations_vouchers;
  "node_modules/bcryptjs/index": typeof node_modules_bcryptjs_index;
  "node_modules/bcryptjs/umd/index": typeof node_modules_bcryptjs_umd_index;
  "queries/accounts": typeof queries_accounts;
  "queries/bunks": typeof queries_bunks;
  "queries/reminders": typeof queries_reminders;
  "queries/users": typeof queries_users;
  "queries/vouchers": typeof queries_vouchers;
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
