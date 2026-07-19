import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import supertest from "supertest";
import {
  GIT_GATE_NOT_CONNECTED_TTL_MS,
  GitGateCache,
  createAppsmithApi,
  createMcpHttpServer,
  type AppsmithApi,
} from "./app.js";
import { fingerprintDsl } from "./builder/semantic.js";
import { McpGovernanceCoordinator } from "./governance/coordinator.js";
import type {
  McpChangeRecord,
  McpGovernanceStore,
  PreparedConfirmation,
} from "./governance/store.js";

// M7 T1/T2 — git awareness: the read_git_status projection (no secrets), the fail-closed branch gate on mutating
// tools (with the binding per-session cache rules), and the governed create_branch tool (mcp/ namespace, cap 5,
// push-to-remote honesty, new branched applicationId).

const API_BASE_URL = "https://appsmith.example";

function stubApi(): AppsmithApi {
  return {
    getApplicationContext: jest.fn(),
    importApplicationArtifact: jest.fn(),
    importPartialApplicationArtifact: jest.fn(),
    listApplications: jest.fn(),
    listWorkspaces: jest.fn(),
    updateLayout: jest.fn(),
    listDatasources: jest.fn(),
    createDatasource: jest.fn(),
    getDatasourceStructure: jest.fn(),
    getApplicationPages: jest.fn(async () => ({ workspaceId: "ws1" })),
    getPage: jest.fn(async () => ({})),
    getApplication: jest.fn(async () => ({})),
    getGitStatus: jest.fn(async () => ({})),
    getGitProtectedBranches: jest.fn(async () => []),
    listGitBranches: jest.fn(async () => []),
    createGitBranch: jest.fn(async () => ({})),
    commitGitApplication: jest.fn(async () => ({})),
    listActions: jest.fn(),
    createAction: jest.fn(),
    getAction: jest.fn(),
    updateAction: jest.fn(),
    deleteAction: jest.fn(),
    executeAction: jest.fn(),
    getCurrentTheme: jest.fn(),
    updateTheme: jest.fn(),
    createPage: jest.fn(),
    updatePage: jest.fn(),
    deletePage: jest.fn(),
    publishApplication: jest.fn(),
    listPlugins: jest.fn(),
    listActionCollections: jest.fn(),
    createActionCollection: jest.fn(),
    updateActionCollection: jest.fn(),
    deleteActionCollection: jest.fn(),
    validateToken: jest.fn(async () => ({
      username: "user@appsmith.com",
      isAnonymous: false,
      organizationId: "org-default",
    })),
  };
}

class MemoryGovernanceStore implements McpGovernanceStore {
  readonly changes: McpChangeRecord[] = [];
  readonly confirmations = new Map<string, PreparedConfirmation>();
  private locked = new Set<string>();

  async acquireLock(entityKey: string): Promise<string | undefined> {
    if (this.locked.has(entityKey)) return undefined;

    this.locked.add(entityKey);

    return `lock:${entityKey}`;
  }
  async releaseLock(entityKey: string): Promise<void> {
    this.locked.delete(entityKey);
  }
  async createConfirmation(confirmation: PreparedConfirmation): Promise<void> {
    this.confirmations.set(confirmation.id, confirmation);
  }
  async consumeConfirmation(
    id: string,
  ): Promise<PreparedConfirmation | undefined> {
    const confirmation = this.confirmations.get(id);

    this.confirmations.delete(id);

    return confirmation;
  }
  async peekConfirmation(
    id: string,
  ): Promise<PreparedConfirmation | undefined> {
    return this.confirmations.get(id);
  }
  async saveChange(change: McpChangeRecord): Promise<void> {
    this.changes.push(change);
  }
  async getChange(
    id: string,
    actorId: string,
    organizationId: string,
  ): Promise<McpChangeRecord | undefined> {
    return this.changes.find(
      (change) =>
        change.id === id &&
        change.actorId === actorId &&
        change.organizationId === organizationId,
    );
  }
  async listChanges(
    actorId: string,
    organizationId: string,
    limit: number,
  ): Promise<McpChangeRecord[]> {
    return this.changes
      .filter(
        (change) =>
          change.actorId === actorId &&
          change.organizationId === organizationId,
      )
      .slice(-limit)
      .reverse();
  }
  async getAnyChange(
    id: string,
    organizationId: string,
  ): Promise<McpChangeRecord | undefined> {
    return this.changes.find(
      (change) => change.id === id && change.organizationId === organizationId,
    );
  }
  async listAllChanges(
    organizationId: string,
    limit: number,
  ): Promise<McpChangeRecord[]> {
    return this.changes
      .filter((change) => change.organizationId === organizationId)
      .slice(-limit)
      .reverse();
  }
}

function parseJsonRpc(response: { body?: unknown; text?: string }): {
  result: { tools: { name: string }[]; content: { text: string }[] };
} {
  const body = response.body as { result?: unknown } | undefined;

  if (body && body.result !== undefined) {
    return body as {
      result: { tools: { name: string }[]; content: { text: string }[] };
    };
  }

  const dataLine = (response.text ?? "")
    .split("\n")
    .find((line) => line.startsWith("data:"));

  if (!dataLine) {
    throw new Error(`No JSON-RPC payload in response: ${response.text}`);
  }

  return JSON.parse(dataLine.slice("data:".length).trim());
}

const initializeRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" },
  },
};

async function openSession(server: ReturnType<typeof createMcpHttpServer>) {
  const initialized = await supertest(server)
    .post("/mcp")
    .set("Accept", "application/json, text/event-stream")
    .set("Authorization", "Bearer mcp_user-token")
    .send(initializeRequest);
  const sessionId = initialized.headers["mcp-session-id"] as string;

  await supertest(server)
    .post("/mcp")
    .set("Accept", "application/json, text/event-stream")
    .set("Authorization", "Bearer mcp_user-token")
    .set("mcp-session-id", sessionId)
    .send({ jsonrpc: "2.0", method: "notifications/initialized" });

  return sessionId;
}

async function callInSession(
  server: ReturnType<typeof createMcpHttpServer>,
  sessionId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<{ body: Record<string, unknown>; text: string }> {
  const call = await supertest(server)
    .post("/mcp")
    .set("Accept", "application/json, text/event-stream")
    .set("Authorization", "Bearer mcp_user-token")
    .set("mcp-session-id", sessionId)
    .send({
      jsonrpc: "2.0",
      id: 30,
      method: "tools/call",
      params: { name, arguments: args },
    });
  const text = parseJsonRpc(call).result.content[0].text;

  try {
    return { body: JSON.parse(text), text };
  } catch {
    return { body: { error: text }, text };
  }
}

async function callTool(
  server: ReturnType<typeof createMcpHttpServer>,
  name: string,
  args: Record<string, unknown>,
): Promise<{ body: Record<string, unknown>; text: string }> {
  return callInSession(server, await openSession(server), name, args);
}

async function listTools(
  server: ReturnType<typeof createMcpHttpServer>,
): Promise<Set<string>> {
  const sessionId = await openSession(server);
  const listed = await supertest(server)
    .post("/mcp")
    .set("Accept", "application/json, text/event-stream")
    .set("Authorization", "Bearer mcp_user-token")
    .set("mcp-session-id", sessionId)
    .send({ jsonrpc: "2.0", id: 31, method: "tools/list" });

  return new Set(parseJsonRpc(listed).result.tools.map((tool) => tool.name));
}

// A git-connected application document, including secret-adjacent metadata the projections must never forward.
const REMOTE_URL = "git@github.com:acme/secret-repo.git";
const GIT_APP = {
  id: "app1",
  gitApplicationMetadata: {
    branchName: "feature/x",
    defaultBranchName: "master",
    remoteUrl: REMOTE_URL,
    defaultApplicationId: "baseApp1",
    gitAuth: { privateKey: "PRIVATE-KEY-MATERIAL", publicKey: "ssh-rsa AAAA" },
    publicKey: "ssh-rsa AAAA",
    docUrl: "https://docs.example/deploy-key",
  },
};

const GIT_STATUS = {
  isClean: false,
  pagesModified: ["Home"],
  pagesAdded: ["New"],
  pagesRemoved: [],
  queriesModified: ["getUsers"],
  queriesAdded: [],
  queriesRemoved: [],
  jsObjectsModified: [],
  jsObjectsAdded: [],
  jsObjectsRemoved: [],
  datasourcesModified: [],
  datasourcesAdded: [],
  datasourcesRemoved: [],
  jsLibsModified: [],
  jsLibsAdded: [],
  jsLibsRemoved: [],
  modified: ["pages/Home.json"],
  added: [],
  removed: [],
  conflicting: [],
  aheadCount: 1,
  behindCount: 2,
  remoteBranch: "refs/remotes/origin/feature/x",
  discardDocUrl: "https://docs.example/discard",
  migrationMessage: "",
};

const ROOT_DSL = {
  widgetId: "0",
  widgetName: "MainContainer",
  type: "CANVAS_WIDGET",
  topRow: 0,
  bottomRow: 380,
  leftColumn: 0,
  rightColumn: 640,
  children: [
    {
      widgetId: "g",
      widgetName: "Greeting",
      type: "TEXT_WIDGET",
      text: "Hi",
      topRow: 0,
      bottomRow: 4,
      leftColumn: 0,
      rightColumn: 24,
    },
  ],
};

const PATCH_ARGS = {
  applicationId: "app1",
  pageId: "p1",
  layoutId: "l1",
  revision: fingerprintDsl(ROOT_DSL as never),
  patch: {
    operations: [
      { kind: "update", name: "Greeting", props: { text: "Welcome" } },
    ],
  },
};

function layoutApi(overrides: Partial<AppsmithApi> = {}): AppsmithApi {
  return {
    ...stubApi(),
    getApplicationContext: jest.fn(async () => ({
      pages: [],
      page: {},
      layout: { dsl: ROOT_DSL },
    })),
    updateLayout: jest.fn(async () => ({ ok: true })),
    ...overrides,
  };
}

describe("Appsmith API git wrappers hit the verified controller paths", () => {
  it("builds the status/protected-branches/refs/create-ref requests exactly", async () => {
    const fetchFn = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit?]
    >(async () => Response.json({ responseMeta: { success: true }, data: {} }));
    const api = createAppsmithApi(
      "user-token",
      API_BASE_URL,
      fetchFn as unknown as typeof fetch,
    );

    await api.getGitStatus("app1", false);
    await api.getGitStatus("app1", true);
    await api.getGitProtectedBranches("base1");
    await api.listGitBranches("app1");
    await api.createGitBranch("app1", "mcp/fix-1");

    expect(fetchFn.mock.calls.map(([url]) => String(url))).toEqual([
      // compareRemote is ALWAYS explicit: the server-side default is true (remote fetch), so false must be literal.
      `${API_BASE_URL}/api/v1/git/applications/app1/status?compareRemote=false`,
      `${API_BASE_URL}/api/v1/git/applications/app1/status?compareRemote=true`,
      `${API_BASE_URL}/api/v1/git/applications/base1/protected-branches`,
      `${API_BASE_URL}/api/v1/git/applications/app1/refs?refType=branch`,
      `${API_BASE_URL}/api/v1/git/applications/app1/create-ref`,
    ]);

    const createRef = fetchFn.mock.calls[4][1];

    expect(createRef?.method).toBe("POST");
    // RefType enum constants are lowercase on the server.
    expect(JSON.parse(String(createRef?.body))).toEqual({
      refName: "mcp/fix-1",
      refType: "branch",
    });
  });
});

describe("GitGateCache — the binding per-session caching rules", () => {
  it("caches connected+branch for the whole session (branch is immutable per applicationId)", () => {
    let now = 1_000;
    const cache = new GitGateCache(() => now);

    cache.set("app1", { connected: true, branchName: "feature/x" });
    now += 10 * GIT_GATE_NOT_CONNECTED_TTL_MS;

    expect(cache.get("app1")).toEqual({
      connected: true,
      branchName: "feature/x",
    });
  });

  it("caches not-connected only for the short TTL (apps can be git-connected mid-session)", () => {
    let now = 1_000;
    const cache = new GitGateCache(() => now);

    cache.set("app1", { connected: false });
    now += GIT_GATE_NOT_CONNECTED_TTL_MS - 1;
    expect(cache.get("app1")).toEqual({ connected: false });

    now += 1;
    expect(cache.get("app1")).toBeUndefined();
  });

  it("never caches a connected-but-branchless stub", () => {
    const cache = new GitGateCache(() => 1_000);

    cache.set("app1", { connected: true });

    expect(cache.get("app1")).toBeUndefined();
  });
});

describe("read_git_status — whitelist projection", () => {
  it("reports a non-git app as not connected", async () => {
    const api = stubApi();
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const { body } = await callTool(server, "read_git_status", {
      applicationId: "app1",
    });

    expect(body.git).toEqual({ connected: false });
    // The status/protected-branches endpoints are never touched for a non-git app.
    expect(api.getGitStatus).not.toHaveBeenCalled();
    expect(api.getGitProtectedBranches).not.toHaveBeenCalled();
  });

  it("projects branch/dirty/counts/protected-branches and NEVER any secret or the full remote URL", async () => {
    const api: AppsmithApi = {
      ...stubApi(),
      getApplication: jest.fn(async () => GIT_APP),
      getGitStatus: jest.fn(async () => GIT_STATUS),
      getGitProtectedBranches: jest.fn(async () => ["master"]),
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const { body, text } = await callTool(server, "read_git_status", {
      applicationId: "app1",
    });
    const git = body.git as Record<string, unknown>;

    expect(git.connected).toBe(true);
    expect(git.branchName).toBe("feature/x");
    expect(git.defaultBranchName).toBe("master");
    expect(git.isClean).toBe(false);
    expect(git.isDirty).toBe(true);
    expect(git.modifiedEntityCounts).toEqual({
      pages: 2,
      queries: 1,
      jsObjects: 0,
      datasources: 0,
      jsLibs: 0,
    });
    expect(git.protectedBranches).toEqual(["master"]);
    // Remote HOST only.
    expect(git.remoteHost).toBe("github.com");

    // The no-secrets guard: nothing key- or URL-shaped survives the projection.
    expect(text).not.toContain(REMOTE_URL);
    expect(text).not.toContain("secret-repo");
    expect(text).not.toContain("gitAuth");
    expect(text).not.toContain("privateKey");
    expect(text).not.toContain("PRIVATE-KEY-MATERIAL");
    expect(text).not.toContain("publicKey");
    expect(text).not.toContain("ssh-rsa");
    expect(text).not.toContain("docUrl");
    expect(text).not.toContain("discardDocUrl");
    // Entity/file NAME sets are not forwarded either — only counts.
    expect(text).not.toContain("pages/Home.json");
    expect(text).not.toContain("remoteBranch");

    // Protected-branches is read from the BASE application id, not the branched one.
    expect(api.getGitProtectedBranches).toHaveBeenCalledWith("baseApp1");
  });

  it("projects the host from an https remote URL too", async () => {
    const api: AppsmithApi = {
      ...stubApi(),
      getApplication: jest.fn(async () => ({
        id: "app1",
        gitApplicationMetadata: {
          branchName: "main",
          remoteUrl: "https://user:token@gitlab.example.com/acme/repo.git",
        },
      })),
      getGitStatus: jest.fn(async () => ({ isClean: true })),
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const { body, text } = await callTool(server, "read_git_status", {
      applicationId: "app1",
    });

    expect((body.git as Record<string, unknown>).remoteHost).toBe(
      "gitlab.example.com",
    );
    // Embedded credentials in the remote URL never survive.
    expect(text).not.toContain("token");
  });

  it("defaults compareRemote to FALSE and omits ahead/behind unless opted in", async () => {
    const getGitStatus = jest.fn(async () => GIT_STATUS);
    const api: AppsmithApi = {
      ...stubApi(),
      getApplication: jest.fn(async () => GIT_APP),
      getGitStatus,
      getGitProtectedBranches: jest.fn(async () => []),
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);

    const local = await callTool(server, "read_git_status", {
      applicationId: "app1",
    });

    expect(getGitStatus).toHaveBeenCalledWith("app1", false);
    // Even though the DTO carried ahead/behind, they are omitted without the opt-in.
    expect((local.body.git as Record<string, unknown>).aheadCount).toBe(
      undefined,
    );
    expect((local.body.git as Record<string, unknown>).behindCount).toBe(
      undefined,
    );

    const remote = await callTool(server, "read_git_status", {
      applicationId: "app1",
      compareRemote: true,
    });

    expect(getGitStatus).toHaveBeenLastCalledWith("app1", true);
    expect((remote.body.git as Record<string, unknown>).aheadCount).toBe(1);
    expect((remote.body.git as Record<string, unknown>).behindCount).toBe(2);
    // Behind-remote teaching: suggest a pull in Appsmith (MCP cannot pull).
    expect(String(remote.body.note)).toContain("pull");
  });

  it("returns a retryable error when the application read fails", async () => {
    const api: AppsmithApi = {
      ...stubApi(),
      getApplication: jest.fn(async () => {
        throw new Error("network");
      }),
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const { body } = await callTool(server, "read_git_status", {
      applicationId: "app1",
    });

    expect(body.code).toBe("git_state_unknown");
  });

  it("returns a retryable error when the status read fails", async () => {
    const api: AppsmithApi = {
      ...stubApi(),
      getApplication: jest.fn(async () => GIT_APP),
      getGitStatus: jest.fn(async () => {
        throw new Error("git lock");
      }),
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const { body } = await callTool(server, "read_git_status", {
      applicationId: "app1",
    });

    expect(body.code).toBe("git_status_unavailable");
  });
});

describe("the M7 branch gate on mutating tools", () => {
  it("rejects a wrong branch with git_branch_changed carrying the current branch", async () => {
    const api = layoutApi({ getApplication: jest.fn(async () => GIT_APP) });
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const { body } = await callTool(server, "patch_widgets", {
      ...PATCH_ARGS,
      branch: "feature/old",
    });

    expect(body.code).toBe("git_branch_changed");
    expect(body.currentBranch).toBe("feature/x");
    expect(api.updateLayout).not.toHaveBeenCalled();
  });

  it("ignores the branch parameter entirely on a non-git app", async () => {
    const api = layoutApi();
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const { body } = await callTool(server, "patch_widgets", {
      ...PATCH_ARGS,
      branch: "anything-at-all",
    });

    expect(body.code).toBeUndefined();
    expect(body.changes).toBeDefined();
    expect(api.updateLayout).toHaveBeenCalled();
  });

  it("FAILS CLOSED when the gate read errors (unlike the advisory warning)", async () => {
    const api = layoutApi({
      getApplication: jest.fn(async () => {
        throw new Error("network");
      }),
    });
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const { body } = await callTool(server, "patch_widgets", {
      ...PATCH_ARGS,
      branch: "feature/x",
    });

    expect(body.code).toBe("git_state_unknown");
    expect(api.updateLayout).not.toHaveBeenCalled();
  });

  it("FAILS CLOSED when the app read is a 2xx that carries no application object", async () => {
    // The F1 residual edge: getApplication returns undefined (a 200 pages DTO with no `.application` field), so we
    // could not actually read the app's git state. gitStateOf(undefined) is {connected:false}, which alone would let
    // a git-connected app silently bypass the gate — the mutation MUST be refused with git_state_unknown instead.
    const api = layoutApi({ getApplication: jest.fn(async () => undefined) });
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const { body } = await callTool(server, "patch_widgets", {
      ...PATCH_ARGS,
      branch: "feature/x",
    });

    expect(body.code).toBe("git_state_unknown");
    expect(api.updateLayout).not.toHaveBeenCalled();
  });

  it("never caches a gate read ERROR: the next call in the same session re-reads and succeeds", async () => {
    const getApplication = jest
      .fn<Promise<unknown>, []>()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue(GIT_APP);
    const api = layoutApi({ getApplication });
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const sessionId = await openSession(server);

    const first = await callInSession(server, sessionId, "patch_widgets", {
      ...PATCH_ARGS,
      branch: "feature/x",
    });

    expect(first.body.code).toBe("git_state_unknown");

    const second = await callInSession(server, sessionId, "patch_widgets", {
      ...PATCH_ARGS,
      branch: "feature/x",
    });

    expect(second.body.code).toBeUndefined();
    expect(second.body.changes).toBeDefined();
    expect(getApplication).toHaveBeenCalledTimes(2);
  });

  it("caches a connected+branch verdict for the session (one read for many mutations)", async () => {
    const getApplication = jest.fn(async () => GIT_APP);
    const api = layoutApi({ getApplication });
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const sessionId = await openSession(server);

    // The stubbed context returns the same DSL on every read, so the original revision stays current.
    const first = await callInSession(server, sessionId, "patch_widgets", {
      ...PATCH_ARGS,
      branch: "feature/x",
    });
    const second = await callInSession(server, sessionId, "patch_widgets", {
      ...PATCH_ARGS,
      branch: "feature/x",
    });

    expect(first.body.changes).toBeDefined();
    expect(second.body.changes).toBeDefined();
    expect(getApplication).toHaveBeenCalledTimes(1);
  });

  it("gates create_query (action mutations) with git_branch_required, then proceeds with the branch", async () => {
    const createAction = jest.fn(async () => ({ id: "act1" }));
    const api: AppsmithApi = {
      ...stubApi(),
      getApplication: jest.fn(async () => GIT_APP),
      getApplicationPages: jest.fn(async () => ({ workspaceId: "ws1" })),
      listDatasources: jest.fn(async () => [
        { id: "ds1", name: "DB", pluginId: "postgres-plugin" },
      ]),
      listPlugins: jest.fn(async () => [
        { id: "postgres-plugin", packageName: "postgres-plugin" },
      ]),
      listActions: jest.fn(async () => []),
      createAction,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      dataEnabled: true,
    });
    const query = {
      name: "getUsers",
      applicationId: "app1",
      pageId: "p1",
      datasourceId: "ds1",
      operation: "SELECT",
      table: "users",
    };

    const gated = await callTool(server, "create_query", { query });

    expect(gated.body.code).toBe("git_branch_required");
    expect(gated.body.currentBranch).toBe("feature/x");
    expect(createAction).not.toHaveBeenCalled();

    const created = await callTool(server, "create_query", {
      query,
      branch: "feature/x",
    });

    expect(created.body.created).toBe(true);
    expect(createAction).toHaveBeenCalled();
  });

  it("gates update_theme with git_branch_required before any theme read", async () => {
    const getCurrentTheme = jest.fn();
    const api: AppsmithApi = {
      ...stubApi(),
      getApplication: jest.fn(async () => GIT_APP),
      getCurrentTheme,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(new MemoryGovernanceStore()),
    });
    const { body } = await callTool(server, "update_theme", {
      applicationId: "app1",
      revision: "a".repeat(64),
      patch: { primaryColor: "#123456" },
    });

    expect(body.code).toBe("git_branch_required");
    expect(getCurrentTheme).not.toHaveBeenCalled();
  });

  it("gates create_js_object with git_branch_required", async () => {
    const api: AppsmithApi = {
      ...stubApi(),
      getApplication: jest.fn(async () => GIT_APP),
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      jsEnabled: true,
      governance: new McpGovernanceCoordinator(new MemoryGovernanceStore()),
    });
    const { body } = await callTool(server, "create_js_object", {
      spec: {
        applicationId: "app1",
        pageId: "p1",
        name: "Helpers",
        revision: "a".repeat(64),
        functions: [{ name: "load", run: [{ query: "getUsers" }] }],
      },
    });

    expect(body.code).toBe("git_branch_required");
  });

  it("refuses confirm_delete_action on a missing branch WITHOUT consuming the one-time token", async () => {
    const store = new MemoryGovernanceStore();
    const deleteAction = jest.fn(async () => ({}));
    const api: AppsmithApi = {
      ...stubApi(),
      getApplication: jest.fn(async () => GIT_APP),
      getAction: jest.fn(async () => ({
        id: "act1",
        name: "getUsers",
        pageId: "p1",
        updatedAt: "t1",
      })),
      deleteAction,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      dataEnabled: true,
      governance: new McpGovernanceCoordinator(store),
    });
    const readAction = await callTool(server, "get_action", {
      applicationId: "app1",
      actionId: "act1",
    });
    const revision = readAction.body.revision as string;
    const prepared = await callTool(server, "prepare_delete_action", {
      spec: { applicationId: "app1", actionId: "act1", revision },
    });
    const confirmationId = prepared.body.confirmationId as string;
    const spec = { applicationId: "app1", actionId: "act1", revision };

    const gated = await callTool(server, "confirm_delete_action", {
      spec,
      confirmationId,
    });

    expect(gated.body.code).toBe("git_branch_required");
    expect(deleteAction).not.toHaveBeenCalled();
    // The gate ran BEFORE token consumption, so the confirmation survives the refusal…
    expect(store.confirmations.has(confirmationId)).toBe(true);

    // …and the same token deletes the action once the branch is supplied.
    const deleted = await callTool(server, "confirm_delete_action", {
      spec,
      confirmationId,
      branch: "feature/x",
    });

    expect(deleted.body.deleted).toBe(true);
    expect(deleteAction).toHaveBeenCalled();
  });

  it("gates confirm_rollback like any other layout mutation (token preserved on refusal)", async () => {
    const DSL = {
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      rightColumn: 64,
      children: [
        {
          widgetId: "t1",
          widgetName: "Greeting",
          type: "TEXT_WIDGET",
          text: "Hi",
          topRow: 0,
          bottomRow: 4,
          leftColumn: 0,
          rightColumn: 16,
        },
      ],
    };
    let current: Record<string, unknown> = DSL;
    const store = new MemoryGovernanceStore();
    const updateLayout = jest.fn(
      async (
        _app: string,
        _page: string,
        _layout: string,
        dsl: Record<string, unknown>,
      ) => {
        current = dsl;

        return { ok: true };
      },
    );
    const api: AppsmithApi = {
      ...stubApi(),
      getApplication: jest.fn(async () => GIT_APP),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: current },
      })),
      updateLayout,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(store),
    });

    // A governed, branch-gated layout change creates the change record to roll back.
    const patched = await callTool(server, "patch_widgets", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      branch: "feature/x",
      revision: fingerprintDsl(DSL as never),
      patch: {
        operations: [
          { kind: "update", name: "Greeting", props: { text: "Hello" } },
        ],
      },
    });
    const changeId = patched.body.changeId as string;

    expect(changeId).toBeDefined();

    const prepared = await callTool(server, "prepare_rollback", { changeId });
    const confirmationId = prepared.body.confirmationId as string;

    // A rollback re-applies a layout — the gate refuses without the branch, BEFORE consuming the token.
    const gated = await callTool(server, "confirm_rollback", {
      changeId,
      confirmationId,
    });

    expect(gated.body.code).toBe("git_branch_required");
    expect(updateLayout).toHaveBeenCalledTimes(1);
    expect(store.confirmations.has(confirmationId)).toBe(true);

    // The same token rolls back once the branch is supplied.
    const rolled = await callTool(server, "confirm_rollback", {
      changeId,
      confirmationId,
      branch: "feature/x",
    });

    expect(rolled.body.rolledBack).toBe(true);
    expect(updateLayout).toHaveBeenCalledTimes(2);
  });
});

// M7 QA follow-up: the branch gate is PATTERN-COPIED into every mutating tool that is not funnelled through
// commitLayout — one parameterized matrix proves each call site actually wired it (a copy that silently dropped the
// gate would pass every other suite). Each tool is invoked with schema-minimal args against a git-connected app
// WITHOUT a branch; the gate must refuse with git_branch_required BEFORE any mutating API call. The confirm_* rows
// use a bogus confirmationId deliberately: the gate runs before the one-time-token lookup (verified in app.ts), so
// the token is never inspected — reaching a token error instead would itself be a gate-ordering regression.
describe("M7 gate matrix — every pattern-copied gate call site refuses without a branch", () => {
  const APP_ID = "a".repeat(24);
  const PAGE_ID = "b".repeat(24);
  const ENTITY_ID = "c".repeat(24);
  const REVISION = "d".repeat(64);

  const CASES: {
    tool: string;
    args: Record<string, unknown>;
    // The API method(s) this tool would call to mutate — none may run when the gate refuses.
    mutators: (keyof AppsmithApi)[];
  }[] = [
    {
      tool: "create_page",
      args: {
        spec: { applicationId: APP_ID, revision: REVISION, name: "New Page" },
      },
      mutators: ["createPage"],
    },
    {
      tool: "rename_page",
      args: {
        spec: {
          applicationId: APP_ID,
          pageId: PAGE_ID,
          revision: REVISION,
          name: "Renamed",
        },
      },
      mutators: ["updatePage"],
    },
    {
      tool: "confirm_delete_page",
      args: {
        spec: { applicationId: APP_ID, pageId: PAGE_ID, revision: REVISION },
        confirmationId: "bogus-confirmation",
      },
      mutators: ["deletePage"],
    },
    {
      tool: "create_rest_api",
      args: {
        api: {
          name: "GetThing",
          applicationId: APP_ID,
          pageId: PAGE_ID,
          datasourceId: ENTITY_ID,
          method: "GET",
          path: "/things",
        },
      },
      mutators: ["createAction"],
    },
    {
      tool: "create_mongo_query",
      args: {
        query: {
          name: "FindUsers",
          applicationId: APP_ID,
          pageId: PAGE_ID,
          datasourceId: ENTITY_ID,
          collection: "users",
          operation: "FIND",
        },
      },
      mutators: ["createAction"],
    },
    {
      tool: "create_sheets_query",
      args: {
        query: {
          name: "ReadSheet",
          applicationId: APP_ID,
          pageId: PAGE_ID,
          datasourceId: ENTITY_ID,
          operation: "read",
          sheetUrl: "https://docs.google.com/spreadsheets/d/abc123",
          sheetName: "Sheet1",
        },
      },
      mutators: ["createAction"],
    },
    {
      tool: "update_action",
      args: {
        spec: {
          kind: "SQL",
          actionId: ENTITY_ID,
          applicationId: APP_ID,
          revision: REVISION,
          name: "renamedQuery",
        },
      },
      mutators: ["updateAction"],
    },
    {
      tool: "duplicate_action",
      args: {
        spec: {
          kind: "SQL",
          actionId: ENTITY_ID,
          applicationId: APP_ID,
          revision: REVISION,
          name: "copyOfQuery",
        },
      },
      mutators: ["createAction"],
    },
    {
      tool: "update_js_object",
      args: {
        spec: {
          applicationId: APP_ID,
          collectionId: ENTITY_ID,
          revision: REVISION,
          name: "RenamedUtils",
        },
      },
      mutators: ["updateActionCollection"],
    },
    {
      tool: "confirm_delete_js_object",
      args: {
        spec: {
          applicationId: APP_ID,
          collectionId: ENTITY_ID,
          revision: REVISION,
        },
        confirmationId: "bogus-confirmation",
      },
      mutators: ["deleteActionCollection"],
    },
  ];

  // One server + one session for the whole matrix. The gate refusal is deterministic per tool; opening a fresh
  // session per row (via callTool) churned ~10 ephemeral listeners + initializes in rapid succession, and under
  // heavy parallel jest load one initialize occasionally returned without an mcp-session-id header (test-infra
  // flake, not a product bug). Reusing a single session removes that churn while asserting the full matrix.
  it("refuses every pattern-copied gate call site without a branch, calling no mutating API method", async () => {
    const api: AppsmithApi = {
      ...stubApi(),
      getApplication: jest.fn(async () => GIT_APP),
    };
    // All gates on so every tool in the matrix is registered.
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      dataEnabled: true,
      jsEnabled: true,
      governance: new McpGovernanceCoordinator(new MemoryGovernanceStore()),
    });
    const sessionId = await openSession(server);

    for (const { args, mutators, tool } of CASES) {
      const { body } = await callInSession(server, sessionId, tool, args);

      expect(body.code).toBe("git_branch_required");
      expect(body.currentBranch).toBe("feature/x");

      for (const mutator of mutators) {
        expect(api[mutator]).not.toHaveBeenCalled();
      }
    }
  });
});

describe("create_branch — governed agent branches (M7-T2)", () => {
  function gitApi(overrides: Partial<AppsmithApi> = {}): AppsmithApi {
    return {
      ...stubApi(),
      getApplication: jest.fn(async () => GIT_APP),
      listGitBranches: jest.fn(async () => [
        { refName: "master" },
        { refName: "feature/x" },
      ]),
      createGitBranch: jest.fn(async () => ({
        id: "branchedApp1",
        slug: "myapp",
        pages: [{ id: "pg1", slug: "home", isDefault: true }],
      })),
      ...overrides,
    };
  }

  function governedServer(
    api: AppsmithApi,
    store = new MemoryGovernanceStore(),
  ) {
    return createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(store),
    });
  }

  it("is governance-gated: not registered without the governance backend", async () => {
    const ungoverned = createMcpHttpServer(API_BASE_URL, () => stubApi());

    expect((await listTools(ungoverned)).has("create_branch")).toBe(false);

    const governed = governedServer(gitApi());

    expect((await listTools(governed)).has("create_branch")).toBe(true);
  });

  it("enforces the byte-exact mcp/ prefix and remainder charset (no case folding, bare mcp rejected)", async () => {
    const api = gitApi();
    const server = governedServer(api);

    for (const name of [
      "mcp", // bare prefix
      "mcp/", // empty remainder
      "MCP/fix", // no case folding
      "Mcp/fix",
      "xmcp/fix", // prefix must be at byte 0
      " mcp/fix", // no trimming
      "mcp/fix branch", // space
      "mcp/fix/nested", // '/' outside the charset
      "mcp/fíx", // non-ASCII
    ]) {
      const { body } = await callTool(server, "create_branch", {
        applicationId: "app1",
        name,
      });

      expect(body.code).toBe("branch_name_invalid");
    }

    // Over the 60-character remainder cap: rejected at the schema layer (65 > max 64), never our handler.
    const tooLong = await callTool(server, "create_branch", {
      applicationId: "app1",
      name: `mcp/${"a".repeat(61)}`,
    });

    expect(String(tooLong.body.error)).toBeTruthy();
    expect(api.createGitBranch).not.toHaveBeenCalled();
  });

  it("refuses a non-git application", async () => {
    const api = gitApi({ getApplication: jest.fn(async () => ({})) });
    const server = governedServer(api);
    const { body } = await callTool(server, "create_branch", {
      applicationId: "app1",
      name: "mcp/fix-1",
    });

    expect(body.code).toBe("git_not_connected");
    expect(api.createGitBranch).not.toHaveBeenCalled();
  });

  it("fails closed when the git state or branch list cannot be read", async () => {
    const unreadableApp = gitApi({
      getApplication: jest.fn(async () => {
        throw new Error("network");
      }),
    });
    const stateError = await callTool(
      governedServer(unreadableApp),
      "create_branch",
      { applicationId: "app1", name: "mcp/fix-1" },
    );

    expect(stateError.body.code).toBe("git_state_unknown");

    const unreadableRefs = gitApi({
      listGitBranches: jest.fn(async () => {
        throw new Error("network");
      }),
    });
    const refsError = await callTool(
      governedServer(unreadableRefs),
      "create_branch",
      { applicationId: "app1", name: "mcp/fix-1" },
    );

    expect(refsError.body.code).toBe("git_state_unknown");
    expect(unreadableRefs.createGitBranch).not.toHaveBeenCalled();
  });

  it("refuses the 6th mcp/ branch with reuse-steering guidance (cap 5)", async () => {
    const api = gitApi({
      listGitBranches: jest.fn(async () => [
        { refName: "master" },
        { refName: "mcp/a" },
        { refName: "mcp/b" },
        { refName: "mcp/c" },
        { refName: "mcp/d" },
        { refName: "mcp/e" },
      ]),
    });
    const server = governedServer(api);
    const { body } = await callTool(server, "create_branch", {
      applicationId: "app1",
      name: "mcp/f",
    });

    expect(body.code).toBe("mcp_branch_limit");
    expect(String(body.error)).toContain("Reuse");
    expect(String(body.error)).toContain("branch UI");
    expect(body.mcpBranches).toEqual([
      "mcp/a",
      "mcp/b",
      "mcp/c",
      "mcp/d",
      "mcp/e",
    ]);
    expect(api.createGitBranch).not.toHaveBeenCalled();
  });

  it("re-checks the cap INSIDE the governed mutate: a list that grew between check and create refuses (race)", async () => {
    const fourMcp = [
      { refName: "master" },
      { refName: "mcp/a" },
      { refName: "mcp/b" },
      { refName: "mcp/c" },
      { refName: "mcp/d" },
    ];
    // A concurrent create_branch landed the 5th mcp/ ref between our pre-check and our locked mutate.
    const fiveMcp = [...fourMcp, { refName: "mcp/e" }];
    const listGitBranches = jest
      .fn<Promise<unknown>, [string]>()
      .mockResolvedValueOnce(fourMcp) // pre-check: 4 mcp/ branches, below the cap
      .mockResolvedValue(fiveMcp); // mutate-time re-read: at the cap
    const store = new MemoryGovernanceStore();
    const api = gitApi({ listGitBranches });
    const server = governedServer(api, store);
    const { body } = await callTool(server, "create_branch", {
      applicationId: "app1",
      name: "mcp/f",
    });

    expect(body.code).toBe("mcp_branch_limit");
    // The refusal reflects the FRESH list — the customer remote never overshoots the cap.
    expect(body.mcpBranches).toEqual([
      "mcp/a",
      "mcp/b",
      "mcp/c",
      "mcp/d",
      "mcp/e",
    ]);
    expect(listGitBranches).toHaveBeenCalledTimes(2);
    expect(api.createGitBranch).not.toHaveBeenCalled();
    // Nothing executed -> no audit record.
    expect(store.changes).toHaveLength(0);
  });

  it("counts BRANCHES for the cap, not listings (origin/mcp/x dedupes with mcp/x)", async () => {
    const api = gitApi({
      listGitBranches: jest.fn(async () => [
        { refName: "mcp/a" },
        { refName: "origin/mcp/a" },
        { refName: "mcp/b" },
        { refName: "mcp/c" },
        { refName: "mcp/d" },
      ]),
    });
    const server = governedServer(api);
    const { body } = await callTool(server, "create_branch", {
      applicationId: "app1",
      name: "mcp/e",
    });

    // 4 distinct mcp/ branches -> below the cap -> creation proceeds.
    expect(body.created).toBe(true);
    expect(api.createGitBranch).toHaveBeenCalled();
  });

  it("refuses a branch name that already exists", async () => {
    const api = gitApi({
      listGitBranches: jest.fn(async () => [{ refName: "mcp/fix-1" }]),
    });
    const server = governedServer(api);
    const { body } = await callTool(server, "create_branch", {
      applicationId: "app1",
      name: "mcp/fix-1",
    });

    expect(body.code).toBe("branch_exists");
    expect(api.createGitBranch).not.toHaveBeenCalled();
  });

  it("creates the branch, returns the NEW branched applicationId + push honesty, and records the audit", async () => {
    const store = new MemoryGovernanceStore();
    const api = gitApi();
    const server = governedServer(api, store);
    const { body, text } = await callTool(server, "create_branch", {
      applicationId: "app1",
      name: "mcp/fix-1",
    });

    expect(api.createGitBranch).toHaveBeenCalledWith("app1", "mcp/fix-1");
    expect(body.created).toBe(true);
    expect(body.branchName).toBe("mcp/fix-1");
    // Branch-per-application: the result pivots the agent to the NEW id.
    expect(body.applicationId).toBe("branchedApp1");
    expect(String(body.note)).toContain("branchedApp1");
    expect(String(body.note)).toContain("PUSHED");
    // Ground truth: create-ref pushes the ref to the remote.
    expect(body.pushedToRemote).toBe(true);
    // Branch-scoped editor URL from the response slugs (root-relative without a configured origin).
    expect(body.editorUrl).toBe(
      `/app/myapp/home-pg1/edit?branch=${encodeURIComponent("mcp/fix-1")}`,
    );
    // Governed: an audit record with the operation and the new id.
    expect(typeof body.changeId).toBe("string");
    expect(store.changes).toHaveLength(1);
    expect(store.changes[0].operation).toBe("create_branch");
    expect(store.changes[0].summary).toMatchObject({
      sourceApplicationId: "app1",
      branchName: "mcp/fix-1",
      newApplicationId: "branchedApp1",
    });
    // The full application document is not echoed beyond the projection (no raw git metadata leaks).
    expect(text).not.toContain("gitAuth");
  });

  it("omits the editor URL (never guesses) when the response lacks usable slugs", async () => {
    const api = gitApi({
      createGitBranch: jest.fn(async () => ({ id: "branchedApp1" })),
    });
    const server = governedServer(api);
    const { body } = await callTool(server, "create_branch", {
      applicationId: "app1",
      name: "mcp/fix-2",
    });

    expect(body.created).toBe(true);
    expect(body.applicationId).toBe("branchedApp1");
    expect(body.editorUrl).toBeUndefined();
  });
});

describe("M7 docs — README release notes carry the operator-facing truths", () => {
  const readme = readFileSync(resolve(__dirname, "../README.md"), "utf8");

  it("calls the branch gate a BREAKING change and names the recovery error codes", () => {
    expect(readme).toContain("BREAKING");
    expect(readme).toContain("git_branch_required");
    expect(readme).toContain("git_branch_changed");
    expect(readme).toContain("fails closed");
  });

  it("tells operators create_branch pushes refs under the deploy key and can trigger remote CI", () => {
    expect(readme).toContain("PUSHES");
    expect(readme).toContain("deploy key");
    expect(readme).toContain("CI");
    expect(readme).toContain("mcp/");
  });
});

// M9-F1 — the getApplication wrapper is redefined to source the Application from the pages DTO's `.application`
// SUB-OBJECT (there is NO GET /api/v1/applications/{id}; it 405s). These tests exercise the REAL wrapper through the
// live fetch layer with a realistically NESTED pages-DTO fixture — the exact integration the mocks (which stub the
// wrapper output directly) never covered — and assert at the real gate / read_git_status sites, not just gitStateOf.
describe("M9-F1 — getApplication sourced from the pages DTO's .application sub-object", () => {
  // A fetch that routes by URL to the shapes the real wrappers expect. `appDoc` becomes the pages DTO's `.application`
  // sub-object (what getApplication must return). pagesStatus>=400 makes the pages route fail (a throwing source).
  function routingFetch(
    appDoc: unknown,
    opts: {
      pagesStatus?: number;
      gitStatus?: unknown;
      protectedBranches?: unknown;
    } = {},
  ) {
    return jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>(
      async (url, init) => {
        const target = String(url);
        const json = (data: unknown, status = 200) =>
          Response.json(
            { responseMeta: { success: status < 400 }, data },
            { status },
          );

        if (target.includes("/api/v1/users/me")) {
          return json({ username: "user@appsmith.com", isAnonymous: false });
        }

        // getApplication (and getApplicationPages) both read the pages LIST route with mode=EDIT. This is the ONLY
        // source of git metadata now — its `.application` is what the wrapper returns.
        if (target.includes("/api/v1/pages?applicationId=app1&mode=EDIT")) {
          if (opts.pagesStatus !== undefined && opts.pagesStatus >= 400) {
            return json(null, opts.pagesStatus);
          }

          return json({
            application: appDoc,
            pages: [{ id: "p1", slug: "home", isDefault: true }],
          });
        }

        // getApplicationContext's page-list read (no mode).
        if (target.includes("/api/v1/pages?applicationId=app1")) {
          return json({ pages: [{ id: "p1" }], application: appDoc });
        }

        if (
          target.includes("/api/v1/layouts/l1/pages/p1") &&
          init?.method === "PUT"
        ) {
          return json({ ok: true });
        }

        if (target.includes("/api/v1/layouts/l1/pages/p1")) {
          return json({ dsl: ROOT_DSL });
        }

        if (target.includes("/api/v1/pages/p1")) {
          return json({ id: "p1", layouts: [{ id: "l1" }] });
        }

        if (target.includes("/status?compareRemote=")) {
          return json(opts.gitStatus ?? { isClean: true });
        }

        if (target.includes("/protected-branches")) {
          return json(opts.protectedBranches ?? []);
        }

        return json({});
      },
    );
  }

  function buildApi(fetchFn: ReturnType<typeof routingFetch>): AppsmithApi {
    return createAppsmithApi(
      "user-token",
      API_BASE_URL,
      fetchFn as unknown as typeof fetch,
    );
  }

  it("reads the pages route (not the dead GET /applications/{id}) and returns the .application SUB-OBJECT", async () => {
    const fetchFn = routingFetch(GIT_APP);
    const app = await buildApi(fetchFn).getApplication("app1");

    // The working route — never GET /api/v1/applications/app1 (which 405s).
    expect(String(fetchFn.mock.calls[0][0])).toBe(
      `${API_BASE_URL}/api/v1/pages?applicationId=app1&mode=EDIT`,
    );
    // The `.application` sub-object, carrying gitApplicationMetadata — NOT the whole ApplicationPagesDTO (which would
    // leave gitApplicationMetadata undefined and silently read every git app as "not connected").
    expect(app).toEqual(GIT_APP);
    expect(
      (app as { gitApplicationMetadata?: unknown }).gitApplicationMetadata,
    ).toBeDefined();
    expect((app as { pages?: unknown }).pages).toBeUndefined();
  });

  it("(i) git DTO -> read_git_status connected+branch, and the gate ENGAGES to refuse a wrong branch", async () => {
    const fetchFn = routingFetch(GIT_APP, {
      gitStatus: GIT_STATUS,
      protectedBranches: ["master"],
    });
    const api = buildApi(fetchFn);
    const server = createMcpHttpServer(API_BASE_URL, () => api);

    const status = await callTool(server, "read_git_status", {
      applicationId: "app1",
    });
    const git = status.body.git as Record<string, unknown>;

    expect(git.connected).toBe(true);
    expect(git.branchName).toBe("feature/x");
    // Only the host survives — never the full remote URL or its embedded credentials.
    expect(git.remoteHost).toBe("github.com");
    expect(status.text).not.toContain(REMOTE_URL);
    expect(status.text).not.toContain("PRIVATE-KEY-MATERIAL");

    // The actual branch gate refuses a mutation whose branch does not match the app's real branch.
    const gated = await callTool(server, "patch_widgets", {
      ...PATCH_ARGS,
      branch: "feature/old",
    });

    expect(gated.body.code).toBe("git_branch_changed");
    expect(gated.body.currentBranch).toBe("feature/x");
  });

  it("(ii) non-git DTO -> read_git_status returns {connected:false} (NOT an error) and a mutation SUCCEEDS", async () => {
    const fetchFn = routingFetch({ id: "app1", name: "Plain", slug: "plain" });
    const api = buildApi(fetchFn);
    const server = createMcpHttpServer(API_BASE_URL, () => api);

    const status = await callTool(server, "read_git_status", {
      applicationId: "app1",
    });

    expect(status.body.git).toEqual({ connected: false });
    expect(status.body.code).toBeUndefined();

    // The branch gate PASSES for a non-git app — the previously-broken 405 made this fail closed with
    // git_state_unknown for every app, git or not.
    const patched = await callTool(server, "patch_widgets", {
      ...PATCH_ARGS,
      branch: "anything-at-all",
    });

    expect(patched.body.code).toBeUndefined();
    expect(patched.body.changes).toBeDefined();
  });

  it("(iii) a throwing source -> a gated mutation refuses with git_state_unknown (fail closed)", async () => {
    const fetchFn = routingFetch(GIT_APP, { pagesStatus: 500 });
    const api = buildApi(fetchFn);
    const server = createMcpHttpServer(API_BASE_URL, () => api);

    const patched = await callTool(server, "patch_widgets", {
      ...PATCH_ARGS,
      branch: "feature/x",
    });

    expect(patched.body.code).toBe("git_state_unknown");
  });

  it("(iv) a user:token@host remoteUrl surfaces ONLY the host, never the credentials or full URL", async () => {
    const CREDS_URL = "https://user:token@gitlab.example.com/acme/repo.git";
    const fetchFn = routingFetch(
      {
        id: "app1",
        gitApplicationMetadata: {
          branchName: "main",
          remoteUrl: CREDS_URL,
        },
      },
      { gitStatus: { isClean: true } },
    );
    const api = buildApi(fetchFn);
    const server = createMcpHttpServer(API_BASE_URL, () => api);

    const status = await callTool(server, "read_git_status", {
      applicationId: "app1",
    });

    expect((status.body.git as Record<string, unknown>).remoteHost).toBe(
      "gitlab.example.com",
    );
    expect(status.text).not.toContain(CREDS_URL);
    expect(status.text).not.toContain("user:token");
  });
});
