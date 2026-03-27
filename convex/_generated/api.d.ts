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
import type * as actions_authMiddleware from "../actions/authMiddleware.js";
import type * as actions_data from "../actions/data.js";
import type * as mutations_accounts from "../mutations/accounts.js";
import type * as mutations_bunks from "../mutations/bunks.js";
import type * as mutations_loginAttempts from "../mutations/loginAttempts.js";
import type * as mutations_reminders from "../mutations/reminders.js";
import type * as mutations_users from "../mutations/users.js";
import type * as mutations_vouchers from "../mutations/vouchers.js";
import type * as queries_accounts from "../queries/accounts.js";
import type * as queries_bunks from "../queries/bunks.js";
import type * as queries_loginAttempts from "../queries/loginAttempts.js";
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
  "actions/authMiddleware": typeof actions_authMiddleware;
  "actions/data": typeof actions_data;
  "mutations/accounts": typeof mutations_accounts;
  "mutations/bunks": typeof mutations_bunks;
  "mutations/loginAttempts": typeof mutations_loginAttempts;
  "mutations/reminders": typeof mutations_reminders;
  "mutations/users": typeof mutations_users;
  "mutations/vouchers": typeof mutations_vouchers;
  "queries/accounts": typeof queries_accounts;
  "queries/bunks": typeof queries_bunks;
  "queries/loginAttempts": typeof queries_loginAttempts;
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
