import type { AppsmithApi } from "../../app.js";

// Edition extension point for the route-contract test (routeContract.test.ts). Test support only: nothing in the
// server bundle imports it.
//
// Core imports this module through ee/extensions/routeContract.ts, which CE ships as a re-export of this file and EE
// replaces. An edition that adds ExtensionApi methods (ce/extensions/api.ts) must describe them here, or the
// route-contract test's coverage guard fails:
//  - invocations: one entry per extension API method, calling it with `param` for every id-like argument.
//  - controllerFiles: the Java controllers that serve those routes, relative to
//    app/server/appsmith-server/src/main/java/com/appsmith/server.
//  - urlBases: the class-level @RequestMapping(Url.*) constants those controllers use, as absolute paths.
// The MCP-principal allowlist side needs no entry: the test also parses the server's McpAllowlistExtensions.java.

export interface ExtensionRouteContract {
  invocations: (
    api: AppsmithApi,
    param: string,
  ) => Record<string, () => Promise<unknown>>;
  controllerFiles: readonly string[];
  urlBases: Readonly<Record<string, string>>;
}

export const EXTENSION_ROUTE_CONTRACT: ExtensionRouteContract = {
  invocations: () => ({}),
  controllerFiles: [],
  urlBases: {},
};
