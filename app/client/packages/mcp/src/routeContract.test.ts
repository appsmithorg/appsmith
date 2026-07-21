import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createAppsmithApi, type AppsmithApi } from "./app.js";

// ---------------------------------------------------------------------------
// F5 — Route-contract test (M9 bug-class guard).
//
// The M9 bugs slipped through the unit suite because every API wrapper is
// mocked: a wrapper that encodes a URL the Java server does not serve (e.g.
// getApplication -> GET /api/v1/applications/{id} -> 405) is invisible to a
// mock that shares the same wrong assumption. This test is server-free and
// deterministic. It cross-checks the MCP's REAL outbound calls (captured by
// instrumenting the real createAppsmithApi with a recording fetch — never by
// statically parsing the TS, so it can't drift from the shipped code) against
// the REAL Spring routes parsed out of the Java controllers. It FAILS if any
// wrapper calls a (verb, path) no controller exposes, and PASSES on a tree
// whose wrappers all resolve.
// ---------------------------------------------------------------------------

// A single sentinel stands in for every dynamic path segment the wrappers
// interpolate. Because it is passed for every id-like argument, and because it
// survives encodeURIComponent unchanged (letters + underscore are unreserved),
// each dynamic segment normalizes to the SAME `:id` placeholder used for the
// Java `{pathVar}` segments — so the two sides compare apples to apples.
const PARAM = "__PARAM__";
const API_BASE_URL = "http://server.test";

interface RecordedCall {
  method: string;
  url: string;
}

// A recording fetch: captures { method, url } for every outbound request and
// returns a benign, well-formed 200 envelope so request() unwraps `.data`
// without throwing before the call is recorded. (Some wrappers still throw
// AFTER fetch — e.g. getAction filters an empty list — which is fine: the
// fetch was already recorded, and each invocation is wrapped in try/catch.)
function recordingFetch(calls: RecordedCall[]): typeof fetch {
  const fn = async (
    url: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    calls.push({
      method: (init?.method ?? "GET").toUpperCase(),
      url: String(url),
    });

    return new Response(
      JSON.stringify({
        responseMeta: { status: 200, success: true },
        data: {},
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  return fn as unknown as typeof fetch;
}

// Canonical (verb-independent) path form, shared by BOTH sides so the compare
// is exact: strip the query string, collapse every dynamic segment to `:id`
// (the MCP sentinel and the Java `{pathVar}`), squeeze duplicate slashes, drop
// a trailing slash.
function normalizePath(path: string): string {
  const noQuery = path.split("?")[0];

  return (
    noQuery
      .replace(new RegExp(PARAM, "g"), ":id") // MCP dynamic segments
      .replace(/\{[^}]+\}/g, ":id") // Java @PathVariable segments
      .replace(/\/{2,}/g, "/")
      .replace(/\/+$/, "") || "/"
  );
}

function routeKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${normalizePath(path)}`;
}

// --- MCP side: enumerate every wrapper's outbound (verb, path) --------------

// Every method on the AppsmithApi surface, invoked with placeholder args so the
// real wrapper builds its real request. Keyed by method name so we can assert
// (below) that EVERY wrapper the factory returns is exercised — a new wrapper
// added without a matching entry here fails the coverage assertion rather than
// slipping through uncovered.
function apiInvocations(
  api: AppsmithApi,
): Record<string, () => Promise<unknown>> {
  const body: Record<string, unknown> = { placeholder: 1 };
  const artifact: Record<string, unknown> = { name: "placeholder" };

  return {
    listWorkspaces: async () => api.listWorkspaces(),
    listApplications: async () => api.listApplications(PARAM),
    getApplicationContext: async () =>
      api.getApplicationContext(PARAM, PARAM, PARAM),
    importApplicationArtifact: async () =>
      api.importApplicationArtifact(PARAM, artifact),
    importPartialApplicationArtifact: async () =>
      api.importPartialApplicationArtifact(PARAM, PARAM, PARAM, artifact),
    updateLayout: async () => api.updateLayout(PARAM, PARAM, PARAM, {}),
    listDatasources: async () => api.listDatasources(PARAM),
    createDatasource: async () => api.createDatasource(body),
    getDatasourceStructure: async () => api.getDatasourceStructure(PARAM),
    triggerDatasource: async () => api.triggerDatasource(PARAM, body),
    getApplicationPages: async () => api.getApplicationPages(PARAM),
    getPage: async () => api.getPage(PARAM),
    getApplication: async () => api.getApplication(PARAM),
    getGitStatus: async () => api.getGitStatus(PARAM, false),
    getGitProtectedBranches: async () => api.getGitProtectedBranches(PARAM),
    listGitBranches: async () => api.listGitBranches(PARAM),
    createGitBranch: async () => api.createGitBranch(PARAM, "branch-x"),
    commitGitApplication: async () =>
      api.commitGitApplication(PARAM, "message-x"),
    listActions: async () => api.listActions(PARAM),
    createAction: async () => api.createAction(body),
    getAction: async () => api.getAction(PARAM, PARAM),
    updateAction: async () => api.updateAction(PARAM, body),
    deleteAction: async () => api.deleteAction(PARAM),
    executeAction: async () => api.executeAction(PARAM),
    getCurrentTheme: async () => api.getCurrentTheme(PARAM),
    updateTheme: async () => api.updateTheme(PARAM, body),
    createPage: async () => api.createPage(body),
    updatePage: async () => api.updatePage(PARAM, body),
    deletePage: async () => api.deletePage(PARAM),
    publishApplication: async () => api.publishApplication(PARAM),
    listPlugins: async () => api.listPlugins(PARAM),
    listActionCollections: async () => api.listActionCollections(PARAM),
    createActionCollection: async () => api.createActionCollection(body),
    updateActionCollection: async () => api.updateActionCollection(PARAM, body),
    deleteActionCollection: async () => api.deleteActionCollection(PARAM),
    validateToken: async () => api.validateToken(),
  };
}

async function collectMcpRoutes(): Promise<{
  routes: Set<string>;
  coveredWrappers: Set<string>;
}> {
  const calls: RecordedCall[] = [];
  const api = createAppsmithApi("token", API_BASE_URL, recordingFetch(calls));
  const invocations = apiInvocations(api);
  const coveredWrappers = new Set<string>();

  for (const [name, invoke] of Object.entries(invocations)) {
    coveredWrappers.add(name);

    try {
      await invoke();
    } catch {
      // Post-fetch processing may throw (e.g. getAction not finding its id in
      // the empty benign body). The outbound call is already recorded — that
      // is all this contract test cares about.
    }
  }

  const routes = new Set<string>();

  for (const call of calls) {
    const path = call.url.startsWith(API_BASE_URL)
      ? call.url.slice(API_BASE_URL.length)
      : call.url;

    routes.add(routeKey(call.method, path));
  }

  return { routes, coveredWrappers };
}

// --- Server side: parse the served (verb, path) set from the Java controllers -

// Class-level @RequestMapping(Url.*) base paths. Resolving the Java constants at
// runtime is infeasible without a Spring/Java parser, so — per the F5 design's
// explicit allowance — the handful of base constants the MCP touches are
// hardcoded here (verified against constants/ce/UrlCE.java + constants/Entity.java:
// APPLICATIONS="applications", PAGES="pages"). The goal is catching verb/path
// drift, not being a perfect Spring parser. An @RequestMapping whose Url.* name
// is NOT in this map throws (so a newly-touched controller is noticed, never
// silently skipped).
const URL_BASE: Record<string, string> = {
  APPLICATION_URL: "/api/v1/applications",
  PAGE_URL: "/api/v1/pages",
  LAYOUT_URL: "/api/v1/layouts",
  ACTION_URL: "/api/v1/actions",
  ACTION_COLLECTION_URL: "/api/v1/collections/actions",
  DATASOURCE_URL: "/api/v1/datasources",
  WORKSPACE_URL: "/api/v1/workspaces",
  THEME_URL: "/api/v1/themes",
  USER_URL: "/api/v1/users",
  PLUGIN_URL: "/api/v1/plugins",
  GIT_APPLICATION_URL: "/api/v1/git/applications",
};

// The controllers the MCP actually calls into (CE layer + the git controller).
// Relative to the repo root.
const CONTROLLER_FILES = [
  "controllers/ce/ApplicationControllerCE.java",
  "controllers/ce/PageControllerCE.java",
  "controllers/ce/LayoutControllerCE.java",
  "controllers/ce/ActionControllerCE.java",
  "controllers/ce/ActionCollectionControllerCE.java",
  "controllers/ce/DatasourceControllerCE.java",
  "controllers/ce/WorkspaceControllerCE.java",
  "controllers/ce/ThemeControllerCE.java",
  "controllers/ce/UserControllerCE.java",
  "controllers/ce/PluginControllerCE.java",
  "git/controllers/GitApplicationControllerCE.java",
];

const HTTP_VERB_BY_ANNOTATION: Record<string, string> = {
  Get: "GET",
  Post: "POST",
  Put: "PUT",
  Delete: "DELETE",
  Patch: "PATCH",
};

function findRepoRoot(): string {
  let dir = process.cwd();

  for (let i = 0; i < 12; i += 1) {
    if (existsSync(join(dir, "app/server/appsmith-server"))) return dir;

    const parent = dirname(dir);

    if (parent === dir) break;

    dir = parent;
  }

  throw new Error(
    "route-contract test could not locate the repo root (app/server/appsmith-server)",
  );
}

// The path piece of a mapping annotation's argument list. Prefer an explicit
// `value = "..."` / `path = "..."`, else the first bare string literal, else ""
// (base path — e.g. @PostMapping with only `consumes = ...`, or @GetMapping("")).
// A Url.* constant arg (not a string literal) also yields "" -> base path; those
// are routes the MCP never calls, so mapping them to the base is harmless (a
// spurious served route can never cause a false FAIL, only never be matched).
function pathFromAnnotationArgs(args: string | undefined): string {
  if (args === undefined) return "";

  const named = /(?:value|path)\s*=\s*"([^"]*)"/.exec(args);

  if (named) return named[1];

  const bare = /"([^"]*)"/.exec(args);

  return bare ? bare[1] : "";
}

function joinRoute(base: string, sub: string): string {
  return normalizePath(`${base}/${sub}`);
}

function servedRoutesFromController(source: string): string[] {
  const baseMatch = /@RequestMapping\(\s*Url\.([A-Z_]+)\s*\)/.exec(source);

  if (!baseMatch) {
    throw new Error("controller has no class-level @RequestMapping(Url.*)");
  }

  const base = URL_BASE[baseMatch[1]];

  if (base === undefined) {
    throw new Error(
      `unmapped class base Url.${baseMatch[1]} — add it to URL_BASE`,
    );
  }

  // Match every method-level shortcut mapping, tolerating multi-line arg lists
  // (e.g. @PostMapping(\n value = "...",\n consumes = ...)) and a bare
  // annotation with no parens (@GetMapping). These annotation arg lists contain
  // no nested parens, so a lazy match to the first ')' is safe.
  const mappingRe =
    /@(Get|Post|Put|Delete|Patch)Mapping\b\s*(?:\(([\s\S]*?)\))?/g;
  const routes: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = mappingRe.exec(source)) !== null) {
    const verb = HTTP_VERB_BY_ANNOTATION[match[1]];
    const sub = pathFromAnnotationArgs(match[2]);

    routes.push(routeKey(verb, joinRoute(base, sub)));
  }

  return routes;
}

function collectServedRoutes(): Set<string> {
  const controllersDir = join(
    findRepoRoot(),
    "app/server/appsmith-server/src/main/java/com/appsmith/server",
  );
  const served = new Set<string>();

  for (const relative of CONTROLLER_FILES) {
    const source = readFileSync(join(controllersDir, relative), "utf8");

    for (const route of servedRoutesFromController(source)) {
      served.add(route);
    }
  }

  return served;
}

// A tiny, DOCUMENTED allowlist for MCP routes deliberately excluded from the
// served-set check. Intentionally EMPTY: after F1 (getApplication -> GET /pages)
// and the updateActionCollection PUT->PATCH alignment, every wrapper resolves to
// a real controller route. Add an entry here ONLY for a route whose controller
// genuinely cannot be parsed, with a comment saying why.
const ALLOWLIST = new Set<string>();

describe("MCP <-> Spring route contract (F5)", () => {
  it("every wrapper hits a route the Java controllers actually serve", async () => {
    const { coveredWrappers, routes: mcpRoutes } = await collectMcpRoutes();
    const servedRoutes = collectServedRoutes();

    // Coverage guard: every wrapper the factory returns must be invoked above,
    // so no wrapper escapes the contract check unnoticed. (Object.keys, not
    // objectKeys from '@appsmith/utils': this is a standalone esbuild-bundled
    // package with no dependency on the client's util packages.)
    // eslint-disable-next-line @appsmith/object-keys
    const wrapperNames = Object.keys(
      createAppsmithApi("t", API_BASE_URL, recordingFetch([])),
    ).sort();

    expect([...coveredWrappers].sort()).toEqual(wrapperNames);

    // Sanity: both sides produced meaningful sets (guards against a silently
    // empty parse making the whole assertion vacuous).
    expect(mcpRoutes.size).toBeGreaterThan(20);
    expect(servedRoutes.size).toBeGreaterThan(40);

    const offenders = [...mcpRoutes].filter(
      (route) => !servedRoutes.has(route) && !ALLOWLIST.has(route),
    );

    // Explicit, readable failure naming the offending wrapper call(s).
    expect({ offendingMcpRoutes: offenders }).toEqual({
      offendingMcpRoutes: [],
    });
  });

  it("has teeth: it would have caught the pre-M9 getApplication 405", async () => {
    const { routes: mcpRoutes } = await collectMcpRoutes();
    const servedRoutes = collectServedRoutes();

    // The pre-M9 wrapper did GET /api/v1/applications/{id}. Proof of detection:
    // no controller serves that GET, so had the wrapper still used it, the
    // primary assertion above would have flagged it as an offender.
    expect(servedRoutes.has("GET /api/v1/applications/:id")).toBe(false);

    // And the fixed (F1) wrapper no longer emits that dead route — it now reads
    // the pages DTO, which IS served.
    expect(mcpRoutes.has("GET /api/v1/applications/:id")).toBe(false);
    expect(mcpRoutes.has("GET /api/v1/pages")).toBe(true);
    expect(servedRoutes.has("GET /api/v1/pages")).toBe(true);

    // Parser smoke check: a couple of known-served routes are present, proving
    // the Java parse produced real routes (not an empty set that would make the
    // negative check above pass vacuously).
    expect(servedRoutes.has("GET /api/v1/applications/home")).toBe(true);
    expect(servedRoutes.has("POST /api/v1/applications/publish/:id")).toBe(
      true,
    );
    expect(servedRoutes.has("PATCH /api/v1/collections/actions/:id")).toBe(
      true,
    );
  });
});
