// Edition extension point for the Appsmith API client (createAppsmithApi in app.ts).
//
// Core imports this module through ee/extensions/api.ts, which CE ships as a re-export of this file and EE replaces
// with its own implementation — so EE can call edition-only endpoints (e.g. workflows) without editing app.ts, which
// would conflict on every CE→EE sync. CE ships no extension tools, so it adds no API methods.
//
// Contract for an edition that overrides this module:
//  - Every method goes through the `request` it is handed, which carries the caller's bearer token, the trusted
//    internal marker and the request timeout. Never call fetch directly.
//  - Method names must not collide with core AppsmithApi methods; createAppsmithApi refuses a collision.
//  - Every endpoint called must be allowed for MCP principals by the server's McpAllowlistExtensions (otherwise 403),
//    and listed in ce/extensions/routeContract.ts so the route-contract test checks it.

export type ApiRequest = <T>(
  path: string,
  init?: RequestInit,
  opts?: { timeoutMs?: number; extractErrorCode?: boolean },
) => Promise<T>;

// The edition's additional AppsmithApi methods. AppsmithApi is CoreAppsmithApi & ExtensionApi.
export type ExtensionApi = Record<never, never>;

// Typed as a constant so the CE no-op can ignore its argument while EE's implementation receives it.
export const createExtensionApi: (
  request: ApiRequest,
) => ExtensionApi = () => ({});
