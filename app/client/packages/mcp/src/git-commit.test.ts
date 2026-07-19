import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  ElicitRequestSchema,
  type ElicitResult,
} from "@modelcontextprotocol/sdk/types.js";
import supertest from "supertest";
import {
  AppsmithApiError,
  GIT_COMMIT_TIMEOUT_MS,
  MCP_COMMIT_MARKER,
  MCP_COMMIT_MAX_ELICITATIONS,
  MCP_COMMIT_MESSAGE_MAX,
  REQUEST_TIMEOUT_MS,
  buildMcpServer,
  commitMessageProblem,
  createAppsmithApi,
  createMcpHttpServer,
  type AppsmithApi,
  type ServerContext,
} from "./app.js";
import { getCapabilities, TOOL_CATALOG } from "./builder/capabilities.js";
import { GUIDES, SERVER_INSTRUCTIONS } from "./builder/instructions.js";
import { McpGovernanceCoordinator } from "./governance/coordinator.js";
import type {
  McpChangeRecord,
  McpGovernanceStore,
  PreparedConfirmation,
} from "./governance/store.js";

// M7-T3 — prepare_commit / confirm_commit: the commit-implies-push ground truth, the mcp/-only load-bearing rule
// (fresh, fail-closed read at prepare AND confirm), message hygiene incl. the rev-2 bidi condition, the one-time
// confirmation bound to the content revision, and the elicitation layer (accept executes; decline/cancel/timeout
// abort WITHOUT consuming; 3-strikes exhaustion; non-elicitation clients fall back to the relay-text posture).

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
    commitGitApplication: jest.fn(async () => "Commit Result : ok"),
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
  ): Promise<McpChangeRecord | undefined> {
    return this.changes.find(
      (change) => change.id === id && change.actorId === actorId,
    );
  }
  async listChanges(
    actorId: string,
    limit: number,
  ): Promise<McpChangeRecord[]> {
    return this.changes
      .filter((change) => change.actorId === actorId)
      .slice(-limit)
      .reverse();
  }
  async getAnyChange(id: string): Promise<McpChangeRecord | undefined> {
    return this.changes.find((change) => change.id === id);
  }
  async listAllChanges(limit: number): Promise<McpChangeRecord[]> {
    return this.changes.slice(-limit).reverse();
  }
}

// A git-connected application checked out on an mcp/ agent branch (the only branch shape the commit path accepts).
const MCP_GIT_APP = {
  id: "app1",
  gitApplicationMetadata: {
    branchName: "mcp/fix-1",
    defaultBranchName: "master",
    remoteUrl: "git@github.com:acme/repo.git",
    defaultApplicationId: "baseApp1",
  },
};

// The same application on a shared (non-mcp/) branch: commits must refuse.
const SHARED_BRANCH_APP = {
  id: "app1",
  gitApplicationMetadata: {
    branchName: "feature/x",
    defaultBranchName: "master",
    remoteUrl: "git@github.com:acme/repo.git",
    defaultApplicationId: "baseApp1",
  },
};

// ApplicationPagesDTO shape: fingerprintPages fingerprints the projected page list, and the application slug +
// default page slug feed the branch-scoped editor URL in the handoff.
const PAGES_RESPONSE = {
  workspaceId: "ws1",
  application: { id: "app1", name: "Orders", slug: "orders" },
  pages: [{ id: "pg1", name: "Home", slug: "home", isDefault: true }],
};

const DRIFTED_PAGES_RESPONSE = {
  workspaceId: "ws1",
  application: { id: "app1", name: "Orders", slug: "orders" },
  pages: [
    { id: "pg1", name: "Home", slug: "home", isDefault: true },
    { id: "pg2", name: "New", slug: "new" },
  ],
};

function commitApi(overrides: Partial<AppsmithApi> = {}): AppsmithApi {
  return {
    ...stubApi(),
    getApplication: jest.fn(async () => MCP_GIT_APP),
    getApplicationPages: jest.fn(async () => PAGES_RESPONSE),
    ...overrides,
  };
}

// --- supertest harness (a NON-elicitation client: initialize declares capabilities: {}) --------------------------

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

async function openSession(server: ReturnType<typeof createMcpHttpServer>) {
  const initialized = await supertest(server)
    .post("/mcp")
    .set("Accept", "application/json, text/event-stream")
    .set("Authorization", "Bearer mcp_user-token")
    .send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    });
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

function governedServer(api: AppsmithApi, store = new MemoryGovernanceStore()) {
  return createMcpHttpServer(API_BASE_URL, () => api, {
    governance: new McpGovernanceCoordinator(store),
  });
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

// --- SDK-seam harness: a REAL @modelcontextprotocol/sdk client over a linked in-memory transport, declaring the
// elicitation capability and answering elicitation/create from a scripted queue. This mocks the human, not the
// protocol — capability detection and elicitInput run through the actual SDK code paths. ------------------------

interface ElicitationSession {
  client: Client;
  prompts: string[];
  close: () => Promise<void>;
}

async function connectElicitationClient(
  api: AppsmithApi,
  store: MemoryGovernanceStore,
  answers: (ElicitResult | (() => Promise<ElicitResult>))[],
  ctx: Partial<ServerContext> = {},
): Promise<ElicitationSession> {
  const mcpServer = buildMcpServer(api, {
    dataEnabled: false,
    jsEnabled: false,
    governance: new McpGovernanceCoordinator(store),
    actorId: "user@appsmith.com",
    ...ctx,
  });
  const client = new Client(
    { name: "elicitation-test", version: "1.0.0" },
    { capabilities: { elicitation: {} } },
  );
  const prompts: string[] = [];

  client.setRequestHandler(ElicitRequestSchema, async (request) => {
    prompts.push(String(request.params.message));

    const answer = answers.shift();

    if (answer === undefined) {
      throw new Error("unexpected elicitation prompt (no scripted answer)");
    }

    return typeof answer === "function" ? answer() : answer;
  });

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await Promise.all([
    mcpServer.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  return {
    client,
    prompts,
    close: async () => {
      await client.close();
    },
  };
}

async function callViaClient(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await client.callTool({ name, arguments: args });
  const text = (res.content as { type: string; text: string }[])[0].text;

  return JSON.parse(text);
}

const ACCEPT: ElicitResult = { action: "accept", content: { confirm: true } };
const DECLINE: ElicitResult = { action: "decline" };
const CANCEL: ElicitResult = { action: "cancel" };

// ------------------------------------------------------------------------------------------------------------------

describe("commitGitApplication — the wire contract", () => {
  it("POSTs the verified controller path with ONLY { message, isAmendCommit: false } — never author/committer", async () => {
    const fetchFn = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit?]
    >(async () =>
      Response.json({ responseMeta: { success: true }, data: "ok" }),
    );
    const api = createAppsmithApi(
      "user-token",
      API_BASE_URL,
      fetchFn as unknown as typeof fetch,
    );

    await api.commitGitApplication("app1", "[mcp] Fix the orders table");

    expect(String(fetchFn.mock.calls[0][0])).toBe(
      `${API_BASE_URL}/api/v1/git/applications/app1/commit`,
    );

    const init = fetchFn.mock.calls[0][1];

    expect(init?.method).toBe("POST");

    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;

    // The EXACT wire body: identity always derives from the session user server-side, amend pinned off.
    expect(body).toEqual({
      message: "[mcp] Fix the orders table",
      isAmendCommit: false,
    });
    expect(Object.keys(body).sort()).toEqual(["isAmendCommit", "message"]);
    expect(body.author).toBeUndefined();
    expect(body.committer).toBeUndefined();
    expect(body.header).toBeUndefined();
  });

  it("gets the longer 120s outbound budget, not the default 30s fetch abort", async () => {
    jest.useFakeTimers();

    try {
      let aborted = false;
      const fetchFn = jest.fn(
        async (_url: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              aborted = true;
              reject(new Error("aborted"));
            });
          }),
      );
      const api = createAppsmithApi(
        "user-token",
        API_BASE_URL,
        fetchFn as unknown as typeof fetch,
      );
      const pending = api
        .commitGitApplication("app1", "[mcp] slow commit")
        .catch((error: unknown) => error);

      // Past the default budget: a commit (export + commit + push) must still be in flight.
      await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS + 1_000);
      expect(aborted).toBe(false);

      // Past the commit budget: aborted.
      await jest.advanceTimersByTimeAsync(GIT_COMMIT_TIMEOUT_MS);
      expect(aborted).toBe(true);
      await pending;
    } finally {
      jest.useRealTimers();
    }
  });

  it("surfaces the Appsmith error code (INVALID_GIT_CONFIGURATION) off a failed commit", async () => {
    const fetchFn = jest.fn(async () =>
      Response.json(
        {
          responseMeta: {
            success: false,
            error: {
              code: "AE-GIT-4031",
              message: "Invalid Git configuration",
            },
          },
          data: null,
        },
        { status: 400 },
      ),
    );
    const api = createAppsmithApi(
      "user-token",
      API_BASE_URL,
      fetchFn as unknown as typeof fetch,
    );

    await expect(
      api.commitGitApplication("app1", "[mcp] x"),
    ).rejects.toMatchObject({
      status: 400,
      errorCode: "AE-GIT-4031",
    });
  });
});

describe("commit message hygiene (rev-2 condition 3 included)", () => {
  it("accepts a plain single-line message", () => {
    expect(commitMessageProblem("Fix the orders table")).toBeUndefined();
    expect(
      commitMessageProblem("a".repeat(MCP_COMMIT_MESSAGE_MAX)),
    ).toBeUndefined();
  });

  it("rejects control characters, DEL, and multiline messages", () => {
    expect(commitMessageProblem("evil\u0000msg")).toContain("control");
    expect(commitMessageProblem("evil\u001bmsg")).toContain("control");
    expect(commitMessageProblem("evil\u007fmsg")).toContain("control");
    expect(commitMessageProblem("line one\nline two")).toContain("single line");
    expect(commitMessageProblem("tab\tseparated")).toContain("control");
  });

  it("rejects Unicode bidi/format controls U+202A-U+202E and U+2066-U+2069", () => {
    for (const bidi of [
      "\u202a",
      "\u202b",
      "\u202c",
      "\u202d",
      "\u202e",
      "\u2066",
      "\u2067",
      "\u2068",
      "\u2069",
    ]) {
      expect(commitMessageProblem(`safe${bidi}reordered`)).toContain(
        "bidirectional",
      );
    }
  });

  it("rejects a leading '[' so the [mcp] marker cannot be impersonated or absorbed", () => {
    expect(commitMessageProblem("[mcp] fake marker")).toContain("[");
    expect(commitMessageProblem("[anything")).toContain("[");
    // A '[' NOT at byte 0 is fine.
    expect(commitMessageProblem("fix [orders] table")).toBeUndefined();
  });

  it("rejects over-length and empty messages", () => {
    expect(
      commitMessageProblem("a".repeat(MCP_COMMIT_MESSAGE_MAX + 1)),
    ).toContain(`${MCP_COMMIT_MESSAGE_MAX}`);
    expect(commitMessageProblem("")).toContain("empty");
  });

  it("applies safeText rules (no binding/template syntax or line separators)", () => {
    expect(commitMessageProblem("evil {{binding}}")).toContain("binding");
    expect(commitMessageProblem("evil ${template}")).toContain("binding");
    expect(commitMessageProblem("evil `backtick`")).toContain("binding");
    expect(commitMessageProblem("evil\u2028separator")).toContain("binding");
    expect(commitMessageProblem("evil\u2029separator")).toContain("binding");
  });
});

describe("prepare_commit — the mcp/-only rule, hygiene, and the one-time confirmation", () => {
  it("is governance-gated: neither commit tool is registered without the governance backend", async () => {
    const ungoverned = createMcpHttpServer(API_BASE_URL, () => stubApi());
    const tools = await listTools(ungoverned);

    expect(tools.has("prepare_commit")).toBe(false);
    expect(tools.has("confirm_commit")).toBe(false);

    const governed = governedServer(commitApi());
    const governedTools = await listTools(governed);

    expect(governedTools.has("prepare_commit")).toBe(true);
    expect(governedTools.has("confirm_commit")).toBe(true);
  });

  it("refuses a non-mcp/ branch with git_commit_branch_forbidden naming the branch and steering to create_branch", async () => {
    const api = commitApi({
      getApplication: jest.fn(async () => SHARED_BRANCH_APP),
    });
    const server = governedServer(api);
    const sessionId = await openSession(server);
    const { body } = await callInSession(server, sessionId, "prepare_commit", {
      applicationId: "app1",
      message: "Fix orders",
    });

    expect(body.code).toBe("git_commit_branch_forbidden");
    expect(body.currentBranch).toBe("feature/x");
    expect(String(body.error)).toContain('"feature/x"');
    expect(String(body.error)).toContain("create_branch");
    expect(String(body.error)).toContain("PUSHES");
  });

  it("refuses byte-inexact prefixes (MCP/, mcpX) — only literal mcp/ commits", async () => {
    for (const branchName of ["MCP/fix", "mcpfix", "Mcp/fix", "x/mcp/fix"]) {
      const api = commitApi({
        getApplication: jest.fn(async () => ({
          id: "app1",
          gitApplicationMetadata: {
            branchName,
            remoteUrl: "git@github.com:acme/repo.git",
          },
        })),
      });
      const server = governedServer(api);
      const sessionId = await openSession(server);
      const { body } = await callInSession(
        server,
        sessionId,
        "prepare_commit",
        { applicationId: "app1", message: "Fix orders" },
      );

      expect(body.code).toBe("git_commit_branch_forbidden");
    }
  });

  it("refuses a non-git application and FAILS CLOSED on an unreadable git state (never the cache)", async () => {
    const nonGit = commitApi({ getApplication: jest.fn(async () => ({})) });
    const nonGitServer = governedServer(nonGit);
    const nonGitResult = await callInSession(
      nonGitServer,
      await openSession(nonGitServer),
      "prepare_commit",
      { applicationId: "app1", message: "Fix orders" },
    );

    expect(nonGitResult.body.code).toBe("git_not_connected");

    const unreadable = commitApi({
      getApplication: jest.fn(async () => {
        throw new Error("network");
      }),
    });
    const unreadableServer = governedServer(unreadable);
    const unreadableResult = await callInSession(
      unreadableServer,
      await openSession(unreadableServer),
      "prepare_commit",
      { applicationId: "app1", message: "Fix orders" },
    );

    expect(unreadableResult.body.code).toBe("git_state_unknown");
  });

  it("does NOT satisfy the commit gate from the branch-gate cache: prepare re-reads even after read_git_status", async () => {
    // read_git_status seeds the T1 gate cache with the branch; the commit gate must STILL do its own fresh read.
    const getApplication = jest.fn(async () => MCP_GIT_APP);
    const api = commitApi({ getApplication });
    const server = governedServer(api);
    const sessionId = await openSession(server);

    await callInSession(server, sessionId, "read_git_status", {
      applicationId: "app1",
    });

    const readsAfterStatus = getApplication.mock.calls.length;

    await callInSession(server, sessionId, "prepare_commit", {
      applicationId: "app1",
      message: "Fix orders",
    });

    expect(getApplication.mock.calls.length).toBe(readsAfterStatus + 1);
  });

  it("rejects unhygienic messages with commit_message_invalid before any git read", async () => {
    const getApplication = jest.fn(async () => MCP_GIT_APP);
    const api = commitApi({ getApplication });
    const server = governedServer(api);
    const sessionId = await openSession(server);

    for (const message of [
      "multi\nline",
      "control\u0001char",
      "bidi\u202eattack",
      "[mcp] impersonation",
      "a".repeat(MCP_COMMIT_MESSAGE_MAX + 1),
      "binding {{evil}}",
    ]) {
      const { body } = await callInSession(
        server,
        sessionId,
        "prepare_commit",
        { applicationId: "app1", message },
      );

      expect(body.code).toBe("commit_message_invalid");
    }

    // Hygiene runs first: none of the rejected messages triggered a git read.
    expect(getApplication).not.toHaveBeenCalled();
  });

  it("returns the one-time confirmation with the marked message and relay text carrying the load-bearing facts", async () => {
    const store = new MemoryGovernanceStore();
    const server = governedServer(commitApi(), store);
    const sessionId = await openSession(server);
    const { body } = await callInSession(server, sessionId, "prepare_commit", {
      applicationId: "app1",
      message: "Fix the orders table",
    });

    expect(typeof body.confirmationId).toBe("string");
    expect(body.operation).toBe("commit");
    expect(body.branch).toBe("mcp/fix-1");
    expect(body.commitMessage).toBe(`${MCP_COMMIT_MARKER}Fix the orders table`);

    // Relay text for non-elicitation clients: facts OUTSIDE the quoted agent text; "ALL current changes",
    // never an itemized claim [rev-2 condition 4].
    const relay = String(body.relay);

    expect(relay).toContain("ALL current changes");
    expect(relay).toContain('branch "mcp/fix-1"');
    expect(relay).toContain('"Orders"');
    expect(relay).toContain("PUSH");
    expect(relay).toContain(`"${MCP_COMMIT_MARKER}Fix the orders table"`);
    expect(relay).toContain("approval");

    // The stored confirmation binds operation commit + the content revision.
    const stored = [...store.confirmations.values()][0];

    expect(stored.operation).toBe("commit");
    expect(stored.entityKey).toBe("application:app1");
    expect(stored.revision).toMatch(/^[a-f0-9]{64}$/);
  });

  it("sanitizes hostile app names and quotes out of the approval/relay text (promptSafe)", async () => {
    // An app can be RENAMED outside MCP with bidi controls, newlines, and quotes — the human-facing prompt must
    // not let a name visually escape its quoted slot or reorder the load-bearing facts (M7 security review).
    const api = commitApi();

    (api.getApplicationPages as jest.Mock).mockResolvedValue({
      workspaceId: "ws1",
      application: {
        name: 'Orders" and DISCARD — ‮really‬\nnext',
        pages: [{ id: "pg1", slug: "home", isDefault: true }],
        slug: "orders",
      },
    });
    const server = governedServer(api, new MemoryGovernanceStore());
    const sessionId = await openSession(server);
    const { body } = await callInSession(server, sessionId, "prepare_commit", {
      applicationId: "app1",
      message: "Fix the orders table",
    });
    const relay = String(body.relay);

    expect(relay).not.toContain("‮");
    expect(relay).not.toContain("\n");
    expect(relay).not.toContain('Orders" and');
    expect(relay).toContain("Orders' and DISCARD");
  });
});

describe("confirm_commit — fallback (non-elicitation) client posture", () => {
  it("re-checks the branch FRESH at confirm time: a branch gone off-mcp between prepare and confirm refuses without consuming", async () => {
    const store = new MemoryGovernanceStore();
    const getApplication = jest
      .fn<Promise<unknown>, []>()
      .mockResolvedValueOnce(MCP_GIT_APP) // prepare
      .mockResolvedValue(SHARED_BRANCH_APP); // confirm re-read
    const api = commitApi({ getApplication });
    const server = governedServer(api, store);
    const sessionId = await openSession(server);
    const prepared = await callInSession(server, sessionId, "prepare_commit", {
      applicationId: "app1",
      message: "Fix orders",
    });
    const confirmationId = prepared.body.confirmationId as string;
    const { body } = await callInSession(server, sessionId, "confirm_commit", {
      applicationId: "app1",
      confirmationId,
    });

    expect(body.code).toBe("git_commit_branch_forbidden");
    expect(body.currentBranch).toBe("feature/x");
    expect(api.commitGitApplication).not.toHaveBeenCalled();
    // Refused BEFORE consumption: the one-time token survives.
    expect(store.confirmations.has(confirmationId)).toBe(true);
  });

  it("FAILS CLOSED at confirm when the fresh read errors, without consuming the token", async () => {
    const store = new MemoryGovernanceStore();
    const getApplication = jest
      .fn<Promise<unknown>, []>()
      .mockResolvedValueOnce(MCP_GIT_APP)
      .mockRejectedValue(new Error("network"));
    const api = commitApi({ getApplication });
    const server = governedServer(api, store);
    const sessionId = await openSession(server);
    const prepared = await callInSession(server, sessionId, "prepare_commit", {
      applicationId: "app1",
      message: "Fix orders",
    });
    const confirmationId = prepared.body.confirmationId as string;
    const { body } = await callInSession(server, sessionId, "confirm_commit", {
      applicationId: "app1",
      confirmationId,
    });

    expect(body.code).toBe("git_state_unknown");
    expect(api.commitGitApplication).not.toHaveBeenCalled();
    expect(store.confirmations.has(confirmationId)).toBe(true);
  });

  it("rejects content drift between prepare and confirm (the digest binds the content revision)", async () => {
    const store = new MemoryGovernanceStore();
    const getApplicationPages = jest
      .fn<Promise<unknown>, []>()
      .mockResolvedValueOnce(PAGES_RESPONSE) // prepare fingerprint
      .mockResolvedValue(DRIFTED_PAGES_RESPONSE); // confirm re-read
    const api = commitApi({ getApplicationPages });
    const server = governedServer(api, store);
    const sessionId = await openSession(server);
    const prepared = await callInSession(server, sessionId, "prepare_commit", {
      applicationId: "app1",
      message: "Fix orders",
    });
    const { body } = await callInSession(server, sessionId, "confirm_commit", {
      applicationId: "app1",
      confirmationId: prepared.body.confirmationId as string,
    });

    expect(body.code).toBe("revision_conflict");
    expect(api.commitGitApplication).not.toHaveBeenCalled();
  });

  it("refuses an unknown confirmation and a confirmation for a different application", async () => {
    const server = governedServer(commitApi());
    const sessionId = await openSession(server);

    const unknown = await callInSession(server, sessionId, "confirm_commit", {
      applicationId: "app1",
      confirmationId: "nope",
    });

    expect(unknown.body.code).toBe("confirmation_invalid");

    const prepared = await callInSession(server, sessionId, "prepare_commit", {
      applicationId: "app1",
      message: "Fix orders",
    });
    const wrongApp = await callInSession(server, sessionId, "confirm_commit", {
      applicationId: "otherApp",
      confirmationId: prepared.body.confirmationId as string,
    });

    expect(wrongApp.body.code).toBe("confirmation_invalid");
  });

  it("a non-elicitation client skips the prompt: commits with the [mcp] marker, audits, and hands off the branch URL", async () => {
    const store = new MemoryGovernanceStore();
    const api = commitApi();
    const server = governedServer(api, store);
    const sessionId = await openSession(server);
    const prepared = await callInSession(server, sessionId, "prepare_commit", {
      applicationId: "app1",
      message: "Fix the orders table",
    });
    const confirmationId = prepared.body.confirmationId as string;
    const { body } = await callInSession(server, sessionId, "confirm_commit", {
      applicationId: "app1",
      confirmationId,
    });

    expect(body.committed).toBe(true);
    // Ground truth stated in the result: the commit was pushed.
    expect(body.pushedToRemote).toBe(true);
    expect(body.branch).toBe("mcp/fix-1");

    // The server prepends the non-strippable marker on the wire.
    expect(api.commitGitApplication).toHaveBeenCalledWith(
      "app1",
      `${MCP_COMMIT_MARKER}Fix the orders table`,
    );

    // Handoff: branch-scoped editor URL (root-relative without a configured origin) + next steps.
    expect(body.editorUrl).toBe(
      `/app/orders/home-pg1/edit?branch=${encodeURIComponent("mcp/fix-1")}`,
    );
    expect(String(body.nextSteps)).toContain("branch UI");
    expect(String(body.nextSteps)).toContain("pull request");
    expect(String(body.nextSteps)).toContain("delete the mcp/ branch");
    expect(String(body.nextSteps)).not.toContain("viewerUrl is");

    // Audited via gov.execute: operation commit, summary carries branch + message, never rollback-able.
    expect(typeof body.changeId).toBe("string");
    expect(store.changes).toHaveLength(1);
    expect(store.changes[0].operation).toBe("commit");
    expect(store.changes[0].summary).toMatchObject({
      applicationId: "app1",
      branch: "mcp/fix-1",
      message: `${MCP_COMMIT_MARKER}Fix the orders table`,
    });
    expect(store.changes[0].rollback).toEqual({});

    // The one-time token is spent: a replay fails.
    const replay = await callInSession(server, sessionId, "confirm_commit", {
      applicationId: "app1",
      confirmationId,
    });

    expect(replay.body.code).toBe("confirmation_invalid");
    expect(api.commitGitApplication).toHaveBeenCalledTimes(1);
  });

  it("omits the editor URL (never guesses) when the pages read lacks usable slugs", async () => {
    const bareSlugs = {
      workspaceId: "ws1",
      application: { id: "app1", name: "Orders" },
      pages: [{ id: "pg1", name: "Home", isDefault: true }],
    };
    const api = commitApi({
      getApplicationPages: jest.fn(async () => bareSlugs),
    });
    const server = governedServer(api);
    const sessionId = await openSession(server);
    const prepared = await callInSession(server, sessionId, "prepare_commit", {
      applicationId: "app1",
      message: "Fix orders",
    });
    const { body } = await callInSession(server, sessionId, "confirm_commit", {
      applicationId: "app1",
      confirmationId: prepared.body.confirmationId as string,
    });

    expect(body.committed).toBe(true);
    expect(body.editorUrl).toBeUndefined();
  });

  it("maps INVALID_GIT_CONFIGURATION to the agent-legible git-author-profile error", async () => {
    const api = commitApi({
      commitGitApplication: jest.fn(async () => {
        throw new AppsmithApiError(400, "AE-GIT-4031");
      }),
    });
    const server = governedServer(api);
    const sessionId = await openSession(server);
    const prepared = await callInSession(server, sessionId, "prepare_commit", {
      applicationId: "app1",
      message: "Fix orders",
    });
    const { body } = await callInSession(server, sessionId, "confirm_commit", {
      applicationId: "app1",
      confirmationId: prepared.body.confirmationId as string,
    });

    expect(body.code).toBe("invalid_git_configuration");
    expect(String(body.error)).toContain("git author profile");
    expect(String(body.error)).toContain("Appsmith");
  });
});

describe("confirm_commit — the elicitation layer (real SDK client over a linked transport)", () => {
  async function prepareViaClient(
    client: Client,
  ): Promise<{ confirmationId: string }> {
    const prepared = await callViaClient(client, "prepare_commit", {
      applicationId: "app1",
      message: "Fix the orders table",
    });

    expect(typeof prepared.confirmationId).toBe("string");

    return { confirmationId: prepared.confirmationId as string };
  }

  it("prompts with the load-bearing facts OUTSIDE the quoted agent text and executes on accept", async () => {
    const store = new MemoryGovernanceStore();
    const api = commitApi();
    const session = await connectElicitationClient(api, store, [ACCEPT]);

    try {
      const { confirmationId } = await prepareViaClient(session.client);
      const body = await callViaClient(session.client, "confirm_commit", {
        applicationId: "app1",
        confirmationId,
      });

      expect(session.prompts).toHaveLength(1);
      const prompt = session.prompts[0];

      // The commit-ALL wording [rev-2 condition 4] + branch + app + PUSH outside the quoted message.
      expect(prompt).toContain("Commit ALL current changes");
      expect(prompt).toContain('branch "mcp/fix-1"');
      expect(prompt).toContain('"Orders"');
      expect(prompt).toContain("PUSH to the remote");
      expect(prompt).toContain('Message: "Fix the orders table"');

      expect(body.committed).toBe(true);
      expect(body.pushedToRemote).toBe(true);
      expect(api.commitGitApplication).toHaveBeenCalledWith(
        "app1",
        `${MCP_COMMIT_MARKER}Fix the orders table`,
      );
      // Consumed on accept: the token is gone.
      expect(store.confirmations.size).toBe(0);
      expect(store.changes).toHaveLength(1);
    } finally {
      await session.close();
    }
  });

  it("decline aborts WITHOUT consuming: the same token then succeeds on a later accept", async () => {
    const store = new MemoryGovernanceStore();
    const api = commitApi();
    const session = await connectElicitationClient(api, store, [
      DECLINE,
      ACCEPT,
    ]);

    try {
      const { confirmationId } = await prepareViaClient(session.client);
      const declined = await callViaClient(session.client, "confirm_commit", {
        applicationId: "app1",
        confirmationId,
      });

      expect(declined.code).toBe("commit_not_confirmed");
      expect(declined.attemptsRemaining).toBe(MCP_COMMIT_MAX_ELICITATIONS - 1);
      expect(api.commitGitApplication).not.toHaveBeenCalled();
      // NOT consumed: the one-time token survives a decline.
      expect(store.confirmations.has(confirmationId)).toBe(true);

      const accepted = await callViaClient(session.client, "confirm_commit", {
        applicationId: "app1",
        confirmationId,
      });

      expect(accepted.committed).toBe(true);
      expect(api.commitGitApplication).toHaveBeenCalledTimes(1);
    } finally {
      await session.close();
    }
  });

  it("cancel aborts without consuming, and an accept with an EXPLICIT confirm=false never counts as approval", async () => {
    const store = new MemoryGovernanceStore();
    const api = commitApi();
    const session = await connectElicitationClient(api, store, [
      CANCEL,
      { action: "accept", content: { confirm: false } },
    ]);

    try {
      const { confirmationId } = await prepareViaClient(session.client);
      const cancelled = await callViaClient(session.client, "confirm_commit", {
        applicationId: "app1",
        confirmationId,
      });

      expect(cancelled.code).toBe("commit_not_confirmed");

      const notConfirmed = await callViaClient(
        session.client,
        "confirm_commit",
        { applicationId: "app1", confirmationId },
      );

      expect(notConfirmed.code).toBe("commit_not_confirmed");
      expect(api.commitGitApplication).not.toHaveBeenCalled();
      expect(store.confirmations.has(confirmationId)).toBe(true);
    } finally {
      await session.close();
    }
  });

  it("elicitation timeout aborts without consuming (explicit timeout on the wait)", async () => {
    const store = new MemoryGovernanceStore();
    const api = commitApi();
    const session = await connectElicitationClient(
      api,
      store,
      [
        // The human never answers: a promise that never settles. Deliberately NOT a wall-clock timer — a late
        // resolve after the server-side timeout raced client.close() and could fire on a closed transport,
        // failing an unrelated test under load (the 1-in-N flake the M7 QA review root-caused).
        async () => new Promise<ElicitResult>(() => {}),
      ],
      { commitElicitationTimeoutMs: 50 },
    );

    try {
      const { confirmationId } = await prepareViaClient(session.client);
      const body = await callViaClient(session.client, "confirm_commit", {
        applicationId: "app1",
        confirmationId,
      });

      expect(body.code).toBe("commit_not_confirmed");
      expect(String(body.error)).toContain(
        "did not answer the approval prompt in time",
      );
      expect(body.reason).toBe("timeout");
      expect(api.commitGitApplication).not.toHaveBeenCalled();
      expect(store.confirmations.has(confirmationId)).toBe(true);
    } finally {
      await session.close();
    }
  });

  it("the neutral elicitationTimeoutMs wins when BOTH it and the deprecated commitElicitationTimeoutMs alias are set", async () => {
    const store = new MemoryGovernanceStore();
    const api = commitApi();
    // Precedence by construction: the neutral option (50ms) forces the never-answered wait to time out promptly,
    // while the deprecated alias alone (10 minutes) would keep waiting far beyond this test. If the alias ever won
    // the resolution, the tool call would hang on the never-settling answer and fail on the jest timeout.
    const session = await connectElicitationClient(
      api,
      store,
      [async () => new Promise<ElicitResult>(() => {})],
      { elicitationTimeoutMs: 50, commitElicitationTimeoutMs: 600_000 },
    );

    try {
      const { confirmationId } = await prepareViaClient(session.client);
      const body = await callViaClient(session.client, "confirm_commit", {
        applicationId: "app1",
        confirmationId,
      });

      expect(body.code).toBe("commit_not_confirmed");
      expect(api.commitGitApplication).not.toHaveBeenCalled();
      // A timeout is a non-accept: the one-time token survives, exactly as with the alias alone.
      expect(store.confirmations.has(confirmationId)).toBe(true);
    } finally {
      await session.close();
    }
  });

  it("invalidates the token after 3 non-accepts (confirmation_exhausted) — prompt-fatigue guard", async () => {
    const store = new MemoryGovernanceStore();
    const api = commitApi();
    const session = await connectElicitationClient(api, store, [
      DECLINE,
      DECLINE,
      DECLINE,
    ]);

    try {
      const { confirmationId } = await prepareViaClient(session.client);

      const first = await callViaClient(session.client, "confirm_commit", {
        applicationId: "app1",
        confirmationId,
      });

      expect(first.code).toBe("commit_not_confirmed");

      const second = await callViaClient(session.client, "confirm_commit", {
        applicationId: "app1",
        confirmationId,
      });

      expect(second.code).toBe("commit_not_confirmed");
      expect(second.attemptsRemaining).toBe(1);

      const third = await callViaClient(session.client, "confirm_commit", {
        applicationId: "app1",
        confirmationId,
      });

      expect(third.code).toBe("confirmation_exhausted");
      // The token is dead: removed from the governance store, and a further confirm refuses.
      expect(store.confirmations.has(confirmationId)).toBe(false);

      const fourth = await callViaClient(session.client, "confirm_commit", {
        applicationId: "app1",
        confirmationId,
      });

      expect(fourth.code).toBe("confirmation_invalid");
      expect(api.commitGitApplication).not.toHaveBeenCalled();
      expect(session.prompts).toHaveLength(3);
    } finally {
      await session.close();
    }
  });

  it("re-checks content drift after the human accepts (deliberation window) and aborts on drift", async () => {
    const store = new MemoryGovernanceStore();
    // Same content at prepare and at the pre-prompt check; drifted by the time the human accepted.
    const getApplicationPages = jest
      .fn<Promise<unknown>, []>()
      .mockResolvedValueOnce(PAGES_RESPONSE)
      .mockResolvedValueOnce(PAGES_RESPONSE)
      .mockResolvedValue(DRIFTED_PAGES_RESPONSE);
    const api = commitApi({ getApplicationPages });
    const session = await connectElicitationClient(api, store, [ACCEPT]);

    try {
      const { confirmationId } = await prepareViaClient(session.client);
      const body = await callViaClient(session.client, "confirm_commit", {
        applicationId: "app1",
        confirmationId,
      });

      expect(body.code).toBe("revision_conflict");
      expect(api.commitGitApplication).not.toHaveBeenCalled();
    } finally {
      await session.close();
    }
  });
});

describe("M7-T3 docs — catalog, instructions, guide, and README stay in sync", () => {
  it("lists both commit tools in TOOL_CATALOG under the governance gate with the load-bearing copy", () => {
    const prepare = TOOL_CATALOG.find(
      (tool) => tool.name === "prepare_commit",
    )!;
    const confirm = TOOL_CATALOG.find(
      (tool) => tool.name === "confirm_commit",
    )!;

    expect(prepare.gate).toBe("governance");
    expect(confirm.gate).toBe("governance");
    expect(prepare.summary).toContain("mcp/");
    expect(prepare.summary).toContain("PUSHES");
    expect(confirm.summary).toContain("PUSH");
    expect(confirm.summary).toContain("elicitation");
  });

  it("get_capabilities gitSync + governance copy teach the commit flow and the branch-is-the-deliverable rule", () => {
    const caps = getCapabilities({ data: true, js: true, governance: true });
    const gitSync = caps.gitSync as { note: string };

    expect(gitSync.note).toContain("prepare_commit");
    expect(gitSync.note).toContain("confirm_commit");
    expect(gitSync.note).toContain("mcp/");
    expect(gitSync.note).toContain("elicitation");
    expect(gitSync.note).toContain("review URL");

    // Governance-off: the disabled-group copy advertises commits among what governance provides.
    const off = getCapabilities({ data: true, js: true, governance: false });
    const governanceGroup = off.disabledCapabilities.groups.find((group) =>
      group.tools.includes("confirm_commit"),
    )!;

    expect(governanceGroup.provides).toContain("prepare_commit/confirm_commit");
  });

  it("SERVER_INSTRUCTIONS teach the commit flow and the git-app carve-out for step 7", () => {
    expect(SERVER_INSTRUCTIONS).toContain("prepare_commit");
    expect(SERVER_INSTRUCTIONS).toContain("confirm_commit");
    // The carve-out: for git apps the deliverable is the branch + review URL, NOT a viewerUrl.
    expect(SERVER_INSTRUCTIONS).toContain("GIT-APP CARVE-OUT");
    expect(SERVER_INSTRUCTIONS).toContain("NOT a viewerUrl");
    expect(SERVER_INSTRUCTIONS).toContain("publish refuses git apps");
    // Commit-implies-push + mcp/-only, taught up front.
    expect(SERVER_INSTRUCTIONS).toContain("always PUSHES");
    expect(SERVER_INSTRUCTIONS).toContain("ONLY on mcp/ branches");
  });

  it("the git guide walks status -> branch -> edit -> commit -> handoff with the marker and approval rules", () => {
    const guide = GUIDES.find((doc) => doc.slug === "git")!;
    const body = guide.render();

    expect(body).toContain("prepare_commit");
    expect(body).toContain("confirm_commit");
    expect(body).toContain("git_commit_branch_forbidden");
    expect(body).toContain("[mcp] ");
    expect(body).toContain("elicitation");
    expect(body).toContain("relay");
    expect(body).toContain("branch-scoped editor URL");
    expect(body).toContain("pull request");
  });

  it("README states commit-implies-push, the mcp/-only rule, and the honest elicitation fallback", () => {
    const readme = readFileSync(resolve(__dirname, "../README.md"), "utf8");

    expect(readme).toContain("commit implies push");
    expect(readme).toContain("always pushes");
    expect(readme).toContain("only on `mcp/` agent branches");
    expect(readme).toContain("git_commit_branch_forbidden");
    expect(readme).toContain("`[mcp] `");
    // Elicitation behavior + the honest fallback statement, naming that client support varies.
    expect(readme).toContain("elicitation");
    expect(readme).toContain("without an elicitation-capable client");
    expect(readme).toContain("depends on the agent relaying it");
    expect(readme).toContain("Client support for elicitation");
    // Deploy-key egress honesty for operators.
    expect(readme).toContain("deploy key");
  });
});
