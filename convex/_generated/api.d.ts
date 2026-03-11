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
import type * as mutations_accounts from "../mutations/accounts.js";
import type * as mutations_bunks from "../mutations/bunks.js";
import type * as mutations_loginAttempts from "../mutations/loginAttempts.js";
import type * as mutations_reminders from "../mutations/reminders.js";
import type * as mutations_users from "../mutations/users.js";
import type * as mutations_vouchers from "../mutations/vouchers.js";
import type * as node_modules_bcryptjs_index from "../node_modules/bcryptjs/index.js";
import type * as node_modules_bcryptjs_umd_index from "../node_modules/bcryptjs/umd/index.js";
import type * as node_modules_jose_dist_webapi_index from "../node_modules/jose/dist/webapi/index.js";
import type * as node_modules_jose_dist_webapi_jwe_compact_decrypt from "../node_modules/jose/dist/webapi/jwe/compact/decrypt.js";
import type * as node_modules_jose_dist_webapi_jwe_compact_encrypt from "../node_modules/jose/dist/webapi/jwe/compact/encrypt.js";
import type * as node_modules_jose_dist_webapi_jwe_flattened_decrypt from "../node_modules/jose/dist/webapi/jwe/flattened/decrypt.js";
import type * as node_modules_jose_dist_webapi_jwe_flattened_encrypt from "../node_modules/jose/dist/webapi/jwe/flattened/encrypt.js";
import type * as node_modules_jose_dist_webapi_jwe_general_decrypt from "../node_modules/jose/dist/webapi/jwe/general/decrypt.js";
import type * as node_modules_jose_dist_webapi_jwe_general_encrypt from "../node_modules/jose/dist/webapi/jwe/general/encrypt.js";
import type * as node_modules_jose_dist_webapi_jwk_embedded from "../node_modules/jose/dist/webapi/jwk/embedded.js";
import type * as node_modules_jose_dist_webapi_jwk_thumbprint from "../node_modules/jose/dist/webapi/jwk/thumbprint.js";
import type * as node_modules_jose_dist_webapi_jwks_local from "../node_modules/jose/dist/webapi/jwks/local.js";
import type * as node_modules_jose_dist_webapi_jwks_remote from "../node_modules/jose/dist/webapi/jwks/remote.js";
import type * as node_modules_jose_dist_webapi_jws_compact_sign from "../node_modules/jose/dist/webapi/jws/compact/sign.js";
import type * as node_modules_jose_dist_webapi_jws_compact_verify from "../node_modules/jose/dist/webapi/jws/compact/verify.js";
import type * as node_modules_jose_dist_webapi_jws_flattened_sign from "../node_modules/jose/dist/webapi/jws/flattened/sign.js";
import type * as node_modules_jose_dist_webapi_jws_flattened_verify from "../node_modules/jose/dist/webapi/jws/flattened/verify.js";
import type * as node_modules_jose_dist_webapi_jws_general_sign from "../node_modules/jose/dist/webapi/jws/general/sign.js";
import type * as node_modules_jose_dist_webapi_jws_general_verify from "../node_modules/jose/dist/webapi/jws/general/verify.js";
import type * as node_modules_jose_dist_webapi_jwt_decrypt from "../node_modules/jose/dist/webapi/jwt/decrypt.js";
import type * as node_modules_jose_dist_webapi_jwt_encrypt from "../node_modules/jose/dist/webapi/jwt/encrypt.js";
import type * as node_modules_jose_dist_webapi_jwt_sign from "../node_modules/jose/dist/webapi/jwt/sign.js";
import type * as node_modules_jose_dist_webapi_jwt_unsecured from "../node_modules/jose/dist/webapi/jwt/unsecured.js";
import type * as node_modules_jose_dist_webapi_jwt_verify from "../node_modules/jose/dist/webapi/jwt/verify.js";
import type * as node_modules_jose_dist_webapi_key_export from "../node_modules/jose/dist/webapi/key/export.js";
import type * as node_modules_jose_dist_webapi_key_generate_key_pair from "../node_modules/jose/dist/webapi/key/generate_key_pair.js";
import type * as node_modules_jose_dist_webapi_key_generate_secret from "../node_modules/jose/dist/webapi/key/generate_secret.js";
import type * as node_modules_jose_dist_webapi_key_import from "../node_modules/jose/dist/webapi/key/import.js";
import type * as node_modules_jose_dist_webapi_lib_aesgcmkw from "../node_modules/jose/dist/webapi/lib/aesgcmkw.js";
import type * as node_modules_jose_dist_webapi_lib_aeskw from "../node_modules/jose/dist/webapi/lib/aeskw.js";
import type * as node_modules_jose_dist_webapi_lib_asn1 from "../node_modules/jose/dist/webapi/lib/asn1.js";
import type * as node_modules_jose_dist_webapi_lib_base64 from "../node_modules/jose/dist/webapi/lib/base64.js";
import type * as node_modules_jose_dist_webapi_lib_buffer_utils from "../node_modules/jose/dist/webapi/lib/buffer_utils.js";
import type * as node_modules_jose_dist_webapi_lib_check_key_type from "../node_modules/jose/dist/webapi/lib/check_key_type.js";
import type * as node_modules_jose_dist_webapi_lib_content_encryption from "../node_modules/jose/dist/webapi/lib/content_encryption.js";
import type * as node_modules_jose_dist_webapi_lib_crypto_key from "../node_modules/jose/dist/webapi/lib/crypto_key.js";
import type * as node_modules_jose_dist_webapi_lib_deflate from "../node_modules/jose/dist/webapi/lib/deflate.js";
import type * as node_modules_jose_dist_webapi_lib_ecdhes from "../node_modules/jose/dist/webapi/lib/ecdhes.js";
import type * as node_modules_jose_dist_webapi_lib_helpers from "../node_modules/jose/dist/webapi/lib/helpers.js";
import type * as node_modules_jose_dist_webapi_lib_invalid_key_input from "../node_modules/jose/dist/webapi/lib/invalid_key_input.js";
import type * as node_modules_jose_dist_webapi_lib_is_key_like from "../node_modules/jose/dist/webapi/lib/is_key_like.js";
import type * as node_modules_jose_dist_webapi_lib_jwk_to_key from "../node_modules/jose/dist/webapi/lib/jwk_to_key.js";
import type * as node_modules_jose_dist_webapi_lib_jwt_claims_set from "../node_modules/jose/dist/webapi/lib/jwt_claims_set.js";
import type * as node_modules_jose_dist_webapi_lib_key_management from "../node_modules/jose/dist/webapi/lib/key_management.js";
import type * as node_modules_jose_dist_webapi_lib_key_to_jwk from "../node_modules/jose/dist/webapi/lib/key_to_jwk.js";
import type * as node_modules_jose_dist_webapi_lib_normalize_key from "../node_modules/jose/dist/webapi/lib/normalize_key.js";
import type * as node_modules_jose_dist_webapi_lib_pbes2kw from "../node_modules/jose/dist/webapi/lib/pbes2kw.js";
import type * as node_modules_jose_dist_webapi_lib_rsaes from "../node_modules/jose/dist/webapi/lib/rsaes.js";
import type * as node_modules_jose_dist_webapi_lib_signing from "../node_modules/jose/dist/webapi/lib/signing.js";
import type * as node_modules_jose_dist_webapi_lib_type_checks from "../node_modules/jose/dist/webapi/lib/type_checks.js";
import type * as node_modules_jose_dist_webapi_lib_validate_algorithms from "../node_modules/jose/dist/webapi/lib/validate_algorithms.js";
import type * as node_modules_jose_dist_webapi_lib_validate_crit from "../node_modules/jose/dist/webapi/lib/validate_crit.js";
import type * as node_modules_jose_dist_webapi_util_base64url from "../node_modules/jose/dist/webapi/util/base64url.js";
import type * as node_modules_jose_dist_webapi_util_decode_jwt from "../node_modules/jose/dist/webapi/util/decode_jwt.js";
import type * as node_modules_jose_dist_webapi_util_decode_protected_header from "../node_modules/jose/dist/webapi/util/decode_protected_header.js";
import type * as node_modules_jose_dist_webapi_util_errors from "../node_modules/jose/dist/webapi/util/errors.js";
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
  "mutations/accounts": typeof mutations_accounts;
  "mutations/bunks": typeof mutations_bunks;
  "mutations/loginAttempts": typeof mutations_loginAttempts;
  "mutations/reminders": typeof mutations_reminders;
  "mutations/users": typeof mutations_users;
  "mutations/vouchers": typeof mutations_vouchers;
  "node_modules/bcryptjs/index": typeof node_modules_bcryptjs_index;
  "node_modules/bcryptjs/umd/index": typeof node_modules_bcryptjs_umd_index;
  "node_modules/jose/dist/webapi/index": typeof node_modules_jose_dist_webapi_index;
  "node_modules/jose/dist/webapi/jwe/compact/decrypt": typeof node_modules_jose_dist_webapi_jwe_compact_decrypt;
  "node_modules/jose/dist/webapi/jwe/compact/encrypt": typeof node_modules_jose_dist_webapi_jwe_compact_encrypt;
  "node_modules/jose/dist/webapi/jwe/flattened/decrypt": typeof node_modules_jose_dist_webapi_jwe_flattened_decrypt;
  "node_modules/jose/dist/webapi/jwe/flattened/encrypt": typeof node_modules_jose_dist_webapi_jwe_flattened_encrypt;
  "node_modules/jose/dist/webapi/jwe/general/decrypt": typeof node_modules_jose_dist_webapi_jwe_general_decrypt;
  "node_modules/jose/dist/webapi/jwe/general/encrypt": typeof node_modules_jose_dist_webapi_jwe_general_encrypt;
  "node_modules/jose/dist/webapi/jwk/embedded": typeof node_modules_jose_dist_webapi_jwk_embedded;
  "node_modules/jose/dist/webapi/jwk/thumbprint": typeof node_modules_jose_dist_webapi_jwk_thumbprint;
  "node_modules/jose/dist/webapi/jwks/local": typeof node_modules_jose_dist_webapi_jwks_local;
  "node_modules/jose/dist/webapi/jwks/remote": typeof node_modules_jose_dist_webapi_jwks_remote;
  "node_modules/jose/dist/webapi/jws/compact/sign": typeof node_modules_jose_dist_webapi_jws_compact_sign;
  "node_modules/jose/dist/webapi/jws/compact/verify": typeof node_modules_jose_dist_webapi_jws_compact_verify;
  "node_modules/jose/dist/webapi/jws/flattened/sign": typeof node_modules_jose_dist_webapi_jws_flattened_sign;
  "node_modules/jose/dist/webapi/jws/flattened/verify": typeof node_modules_jose_dist_webapi_jws_flattened_verify;
  "node_modules/jose/dist/webapi/jws/general/sign": typeof node_modules_jose_dist_webapi_jws_general_sign;
  "node_modules/jose/dist/webapi/jws/general/verify": typeof node_modules_jose_dist_webapi_jws_general_verify;
  "node_modules/jose/dist/webapi/jwt/decrypt": typeof node_modules_jose_dist_webapi_jwt_decrypt;
  "node_modules/jose/dist/webapi/jwt/encrypt": typeof node_modules_jose_dist_webapi_jwt_encrypt;
  "node_modules/jose/dist/webapi/jwt/sign": typeof node_modules_jose_dist_webapi_jwt_sign;
  "node_modules/jose/dist/webapi/jwt/unsecured": typeof node_modules_jose_dist_webapi_jwt_unsecured;
  "node_modules/jose/dist/webapi/jwt/verify": typeof node_modules_jose_dist_webapi_jwt_verify;
  "node_modules/jose/dist/webapi/key/export": typeof node_modules_jose_dist_webapi_key_export;
  "node_modules/jose/dist/webapi/key/generate_key_pair": typeof node_modules_jose_dist_webapi_key_generate_key_pair;
  "node_modules/jose/dist/webapi/key/generate_secret": typeof node_modules_jose_dist_webapi_key_generate_secret;
  "node_modules/jose/dist/webapi/key/import": typeof node_modules_jose_dist_webapi_key_import;
  "node_modules/jose/dist/webapi/lib/aesgcmkw": typeof node_modules_jose_dist_webapi_lib_aesgcmkw;
  "node_modules/jose/dist/webapi/lib/aeskw": typeof node_modules_jose_dist_webapi_lib_aeskw;
  "node_modules/jose/dist/webapi/lib/asn1": typeof node_modules_jose_dist_webapi_lib_asn1;
  "node_modules/jose/dist/webapi/lib/base64": typeof node_modules_jose_dist_webapi_lib_base64;
  "node_modules/jose/dist/webapi/lib/buffer_utils": typeof node_modules_jose_dist_webapi_lib_buffer_utils;
  "node_modules/jose/dist/webapi/lib/check_key_type": typeof node_modules_jose_dist_webapi_lib_check_key_type;
  "node_modules/jose/dist/webapi/lib/content_encryption": typeof node_modules_jose_dist_webapi_lib_content_encryption;
  "node_modules/jose/dist/webapi/lib/crypto_key": typeof node_modules_jose_dist_webapi_lib_crypto_key;
  "node_modules/jose/dist/webapi/lib/deflate": typeof node_modules_jose_dist_webapi_lib_deflate;
  "node_modules/jose/dist/webapi/lib/ecdhes": typeof node_modules_jose_dist_webapi_lib_ecdhes;
  "node_modules/jose/dist/webapi/lib/helpers": typeof node_modules_jose_dist_webapi_lib_helpers;
  "node_modules/jose/dist/webapi/lib/invalid_key_input": typeof node_modules_jose_dist_webapi_lib_invalid_key_input;
  "node_modules/jose/dist/webapi/lib/is_key_like": typeof node_modules_jose_dist_webapi_lib_is_key_like;
  "node_modules/jose/dist/webapi/lib/jwk_to_key": typeof node_modules_jose_dist_webapi_lib_jwk_to_key;
  "node_modules/jose/dist/webapi/lib/jwt_claims_set": typeof node_modules_jose_dist_webapi_lib_jwt_claims_set;
  "node_modules/jose/dist/webapi/lib/key_management": typeof node_modules_jose_dist_webapi_lib_key_management;
  "node_modules/jose/dist/webapi/lib/key_to_jwk": typeof node_modules_jose_dist_webapi_lib_key_to_jwk;
  "node_modules/jose/dist/webapi/lib/normalize_key": typeof node_modules_jose_dist_webapi_lib_normalize_key;
  "node_modules/jose/dist/webapi/lib/pbes2kw": typeof node_modules_jose_dist_webapi_lib_pbes2kw;
  "node_modules/jose/dist/webapi/lib/rsaes": typeof node_modules_jose_dist_webapi_lib_rsaes;
  "node_modules/jose/dist/webapi/lib/signing": typeof node_modules_jose_dist_webapi_lib_signing;
  "node_modules/jose/dist/webapi/lib/type_checks": typeof node_modules_jose_dist_webapi_lib_type_checks;
  "node_modules/jose/dist/webapi/lib/validate_algorithms": typeof node_modules_jose_dist_webapi_lib_validate_algorithms;
  "node_modules/jose/dist/webapi/lib/validate_crit": typeof node_modules_jose_dist_webapi_lib_validate_crit;
  "node_modules/jose/dist/webapi/util/base64url": typeof node_modules_jose_dist_webapi_util_base64url;
  "node_modules/jose/dist/webapi/util/decode_jwt": typeof node_modules_jose_dist_webapi_util_decode_jwt;
  "node_modules/jose/dist/webapi/util/decode_protected_header": typeof node_modules_jose_dist_webapi_util_decode_protected_header;
  "node_modules/jose/dist/webapi/util/errors": typeof node_modules_jose_dist_webapi_util_errors;
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
