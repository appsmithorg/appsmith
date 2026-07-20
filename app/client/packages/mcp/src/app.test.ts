import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import supertest from "supertest";
import {
  MAX_ARTIFACT_BYTES,
  MCP_BUILD_INFO,
  READ_PAGES_LAYOUT_CONCURRENCY,
  createAppsmithApi,
  createMcpHttpServer,
  hostHeaderName,
  sessionOriginFromHeaders,
  type AppsmithApi,
} from "./app.js";
import { INSTRUCTION_DOCS } from "./builder/instructions.js";
import { fingerprintDsl } from "./builder/semantic.js";
import { McpGovernanceCoordinator } from "./governance/coordinator.js";
import type {
  McpChangeRecord,
  McpGovernanceStore,
  PreparedConfirmation,
} from "./governance/store.js";

const API_BASE_URL = "https://appsmith.example";

function successfulFetch() {
  return jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>(
    async () => {
      return new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
      });
    },
  );
}

describe("Appsmith API client", () => {
  it("forwards bearer and correlation headers for read and artifact import requests", async () => {
    const fetchFn = successfulFetch();
    const api = createAppsmithApi(
      "user-token",
      API_BASE_URL,
      fetchFn as unknown as typeof fetch,
      {
        "X-Appsmith-Request-Id": "internal-request-id",
        "X-Request-Id": "client-request-id",
      },
    );

    await api.listWorkspaces();
    await api.listApplications("workspace-1");
    await api.getApplicationContext("application-1", "page-1", "layout-1");
    await api.importApplicationArtifact("workspace-1", {
      application: { name: "New application" },
    });
    await api.importPartialApplicationArtifact(
      "workspace-1",
      "application-1",
      "page-1",
      { widgets: {} },
    );

    expect(fetchFn.mock.calls.map(([url]) => String(url))).toEqual([
      `${API_BASE_URL}/api/v1/workspaces/home`,
      `${API_BASE_URL}/api/v1/applications/home?workspaceId=workspace-1`,
      `${API_BASE_URL}/api/v1/pages?applicationId=application-1`,
      `${API_BASE_URL}/api/v1/pages/page-1`,
      `${API_BASE_URL}/api/v1/layouts/layout-1/pages/page-1`,
      `${API_BASE_URL}/api/v1/applications/import/workspace-1`,
      `${API_BASE_URL}/api/v1/applications/import/partial/workspace-1/application-1?pageId=page-1`,
    ]);
    expect(
      fetchFn.mock.calls.every(
        ([, init]) =>
          new Headers(init?.headers).get("Authorization") ===
          "Bearer user-token",
      ),
    ).toBe(true);
    // Every upstream call carries the CSRF-exemption header so multipart (import) POSTs aren't denied.
    expect(
      fetchFn.mock.calls.every(
        ([, init]) =>
          new Headers(init?.headers).get("X-Requested-By") === "Appsmith",
      ),
    ).toBe(true);
    expect(
      fetchFn.mock.calls.every(
        ([, init]) =>
          new Headers(init?.headers).get("X-Appsmith-Request-Id") ===
            "internal-request-id" &&
          new Headers(init?.headers).get("X-Request-Id") ===
            "client-request-id",
      ),
    ).toBe(true);

    for (const callIndex of [5, 6]) {
      const init = fetchFn.mock.calls[callIndex][1];
      const formData = init?.body as FormData;
      const file = formData.get("file") as File;

      expect(init?.method).toBe("POST");
      expect(new Headers(init?.headers).get("Content-Type")).toBeNull();
      expect(file.name).toBe("appsmith-artifact.json");
      expect(file.type).toBe("application/json");
    }

    const fullArtifact = (fetchFn.mock.calls[5][1]?.body as FormData).get(
      "file",
    ) as File;
    const partialArtifact = (fetchFn.mock.calls[6][1]?.body as FormData).get(
      "file",
    ) as File;

    await expect(fullArtifact.text()).resolves.toBe(
      JSON.stringify({ application: { name: "New application" } }),
    );
    await expect(partialArtifact.text()).resolves.toBe(
      JSON.stringify({ widgets: {} }),
    );
  });

  it("stamps the internal marker header when APPSMITH_MCP_INTERNAL_SECRET is set", async () => {
    const previous = process.env.APPSMITH_MCP_INTERNAL_SECRET;

    process.env.APPSMITH_MCP_INTERNAL_SECRET = "internal-marker-secret";
    try {
      const fetchFn = successfulFetch();
      const api = createAppsmithApi(
        "user-token",
        API_BASE_URL,
        fetchFn as unknown as typeof fetch,
      );

      await api.listWorkspaces();

      expect(
        new Headers(fetchFn.mock.calls[0][1]?.headers).get(
          "X-Appsmith-Mcp-Internal",
        ),
      ).toBe("internal-marker-secret");
    } finally {
      if (previous === undefined) {
        delete process.env.APPSMITH_MCP_INTERNAL_SECRET;
      } else {
        process.env.APPSMITH_MCP_INTERNAL_SECRET = previous;
      }
    }
  });

  it("omits the internal marker header when APPSMITH_MCP_INTERNAL_SECRET is unset", async () => {
    const previous = process.env.APPSMITH_MCP_INTERNAL_SECRET;

    delete process.env.APPSMITH_MCP_INTERNAL_SECRET;
    try {
      const fetchFn = successfulFetch();
      const api = createAppsmithApi(
        "user-token",
        API_BASE_URL,
        fetchFn as unknown as typeof fetch,
      );

      await api.listWorkspaces();

      expect(
        new Headers(fetchFn.mock.calls[0][1]?.headers).has(
          "X-Appsmith-Mcp-Internal",
        ),
      ).toBe(false);
    } finally {
      if (previous !== undefined) {
        process.env.APPSMITH_MCP_INTERNAL_SECRET = previous;
      }
    }
  });

  it("sends exactly the env marker value on a body-carrying request (never a caller-influenced value)", async () => {
    // Constraint 3: the marker is sourced ONLY from this process's env and is spread LAST in the header object, so no
    // request body/shape or internal call site can override or inject it. Exercise the multipart/body path (createAction).
    const previous = process.env.APPSMITH_MCP_INTERNAL_SECRET;

    process.env.APPSMITH_MCP_INTERNAL_SECRET = "env-only-secret";
    try {
      const fetchFn = successfulFetch();
      const api = createAppsmithApi(
        "user-token",
        API_BASE_URL,
        fetchFn as unknown as typeof fetch,
      );

      await api.createAction({ name: "q1", pageId: "p1" });

      expect(
        new Headers(fetchFn.mock.calls[0][1]?.headers).get(
          "X-Appsmith-Mcp-Internal",
        ),
      ).toBe("env-only-secret");
    } finally {
      if (previous === undefined) {
        delete process.env.APPSMITH_MCP_INTERNAL_SECRET;
      } else {
        process.env.APPSMITH_MCP_INTERNAL_SECRET = previous;
      }
    }
  });

  it("getAction fetches by applicationId and selects the action by id (no GET /actions/{id})", async () => {
    const fetchFn = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit?]
    >(async () =>
      Response.json({
        responseMeta: { success: true },
        data: [
          { id: "other", name: "Other" },
          { id: "act1", name: "Target" },
        ],
      }),
    );
    const api = createAppsmithApi(
      "user-token",
      API_BASE_URL,
      fetchFn as unknown as typeof fetch,
    );

    const action = (await api.getAction("app1", "act1")) as { name: string };

    // It lists the application's actions (the single-action GET does not exist) and filters by id.
    expect(String(fetchFn.mock.calls[0][0])).toBe(
      `${API_BASE_URL}/api/v1/actions?applicationId=app1`,
    );
    expect(action.name).toBe("Target");
  });

  it("getAction throws a clear error when the action is not in the application", async () => {
    const fetchFn = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit?]
    >(async () =>
      Response.json({
        responseMeta: { success: true },
        data: [{ id: "other" }],
      }),
    );
    const api = createAppsmithApi(
      "user-token",
      API_BASE_URL,
      fetchFn as unknown as typeof fetch,
    );

    await expect(api.getAction("app1", "missing")).rejects.toThrow(
      /action missing was not found in application app1/,
    );
  });

  it("surfaces Appsmith API errors without obscuring their status", async () => {
    const fetchFn = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit?]
    >(async () => {
      return new Response("forbidden", { status: 403 });
    });
    const api = createAppsmithApi(
      "user-token",
      API_BASE_URL,
      fetchFn as unknown as typeof fetch,
    );

    await expect(api.listWorkspaces()).rejects.toThrow(
      "Appsmith API request failed (403)",
    );
  });

  it("rejects oversized artifacts before issuing an API request", async () => {
    const fetchFn = successfulFetch();
    const api = createAppsmithApi(
      "user-token",
      API_BASE_URL,
      fetchFn as unknown as typeof fetch,
    );

    await expect(
      api.importApplicationArtifact("workspace-1", {
        content: "x".repeat(MAX_ARTIFACT_BYTES),
      }),
    ).rejects.toThrow("Artifact must not exceed");
    await expect(
      api.importApplicationArtifact(
        "workspace-1",
        [] as unknown as Record<string, unknown>,
      ),
    ).rejects.toThrow();
    await expect(
      api.importApplicationArtifact("workspace-1", {}),
    ).rejects.toThrow("Artifact must not be empty");
    await expect(
      api.importApplicationArtifact("workspace-1", {
        invalid: new Date(),
      }),
    ).rejects.toThrow("Artifact must contain only plain JSON objects");
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

function createApi(
  // Typed as the real wrapper (() => Promise<unknown>) so a test can pass a custom profile mock without every
  // field — the default carries a realistic organizationId so governed audit reads are tenant-scoped.
  validateToken: AppsmithApi["validateToken"] = jest.fn(async () => ({
    username: "user@appsmith.com",
    isAnonymous: false,
    organizationId: "org-default",
  })),
) {
  return (): AppsmithApi => ({
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
    // Default: no layouts, so F3 layoutId surfacing degrades to undefined unless a test overrides it.
    getPage: jest.fn(async () => ({})),
    // Default: a non-git application (no gitApplicationMetadata) so layout-edit tests see no git warning and the
    // M7 branch gate passes without a branch parameter.
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
    validateToken,
  });
}

// The Streamable HTTP transport (MCP SDK 1.29+) returns request responses as an
// SSE stream when the client accepts text/event-stream, so the JSON-RPC payload
// arrives on a `data:` line rather than as a parsed JSON body. Handle both shapes.
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

describe("MCP HTTP server", () => {
  it("rejects MCP requests without a bearer token", async () => {
    const response = await supertest(createMcpHttpServer(API_BASE_URL))
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .send({});

    expect(response.status).toBe(401);
    expect(response.headers["www-authenticate"]).toBe("Bearer");
  });

  it("/health carries the build identity (package.json version), unauthenticated", async () => {
    const response = await supertest(createMcpHttpServer(API_BASE_URL)).get(
      "/health",
    );

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    // Read once at startup from package.json — the answer to "which build is this instance running".
    expect(response.body.version).toBe(MCP_BUILD_INFO.version);
    expect(response.body.version).toBe(
      // Independent read so the assertion is not a tautology against the same constant.
      JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8"))
        .version,
    );
  });

  it("returns a safe response for malformed JSON and oversized requests", async () => {
    const server = createMcpHttpServer(API_BASE_URL, createApi());

    const malformed = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("Content-Type", "application/json")
      .send("{not-json");
    const oversized = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("Content-Type", "application/json")
      .send(`{"content":"${"x".repeat(2 * 1024 * 1024)}"}`);

    expect(malformed).toMatchObject({
      status: 400,
      body: { error: "invalid JSON request body" },
    });
    expect(oversized).toMatchObject({
      status: 413,
      body: { error: "request body too large" },
    });
  });

  // M4-T4 adoption telemetry: the structured request event must carry the coarse success/error CLASS and the
  // gate state, while still never leaking the bearer token, tool arguments, or request bodies.
  it("emits a request telemetry event with statusClass + gates and no token/args", async () => {
    const events: Record<string, unknown>[] = [];
    const stderrSpy = jest
      .spyOn(process.stderr, "write")
      .mockImplementation((chunk: string | Uint8Array) => {
        const line = typeof chunk === "string" ? chunk : chunk.toString();

        try {
          events.push(JSON.parse(line));
        } catch {
          // Non-JSON writes are irrelevant to this assertion.
        }

        return true;
      });

    try {
      const server = createMcpHttpServer(API_BASE_URL, createApi(), {
        dataEnabled: true,
        jsEnabled: true,
      });

      // A malformed body deterministically yields a 4xx without needing a full session; the telemetry event
      // is still emitted on response finish.
      await supertest(server)
        .post("/mcp")
        .set("Accept", "application/json, text/event-stream")
        .set("Authorization", "Bearer mcp_user-secret-token")
        .set("Content-Type", "application/json")
        .send("{not-json");

      const requestEvent = events.find(
        (event) => event.event === "appsmith_mcp_request",
      );

      expect(requestEvent).toBeDefined();
      expect(requestEvent).toMatchObject({
        statusClass: "client_error",
        gates: "data,js",
      });

      // Proof no secret/args/body leak: the serialized event must not contain the token secret or request body,
      // and must expose no argument/body-bearing fields.
      const serialized = JSON.stringify(requestEvent);

      expect(serialized).not.toContain("user-secret-token");
      expect(serialized).not.toContain("not-json");
      expect(requestEvent).not.toHaveProperty("arguments");
      expect(requestEvent).not.toHaveProperty("args");
      expect(requestEvent).not.toHaveProperty("body");
      expect(requestEvent).not.toHaveProperty("params");
      // The caller's identity is only ever recorded as a hash, never in plaintext.
      expect(requestEvent).not.toHaveProperty("username");
    } finally {
      stderrSpy.mockRestore();
    }
  });

  // The telemetry event must correlate per user WITHOUT logging the user's email in plaintext: the username is
  // recorded only as a stable SHA-256 hash (matching the server-side DigestUtils.sha256Hex posture).
  it("records the caller's username as a SHA-256 hash, never in plaintext", async () => {
    const email = "user@appsmith.com";
    const events: Record<string, unknown>[] = [];
    const stderrSpy = jest
      .spyOn(process.stderr, "write")
      .mockImplementation((chunk: string | Uint8Array) => {
        const line = typeof chunk === "string" ? chunk : chunk.toString();

        try {
          events.push(JSON.parse(line));
        } catch {
          // Non-JSON writes are irrelevant to this assertion.
        }

        return true;
      });

    try {
      const validateToken = jest.fn(async () => ({
        username: email,
        isAnonymous: false,
      }));
      const server = createMcpHttpServer(
        API_BASE_URL,
        createApi(validateToken),
      );

      await supertest(server)
        .post("/mcp")
        .set("Accept", "application/json, text/event-stream")
        .set("Authorization", "Bearer mcp_user-token")
        .send(initializeRequest);

      const requestEvent = events.find(
        (event) =>
          event.event === "appsmith_mcp_request" &&
          event.usernameHash !== undefined,
      );

      expect(requestEvent).toBeDefined();
      expect(requestEvent?.usernameHash).toBe(
        createHash("sha256").update(email).digest("hex"),
      );
      // The plaintext email must never appear anywhere in the serialized event.
      expect(JSON.stringify(requestEvent)).not.toContain(email);
    } finally {
      stderrSpy.mockRestore();
    }
  });

  it("binds sessions to the bearer token and revalidates reuse", async () => {
    const validateToken = jest.fn(async () => ({
      username: "user@appsmith.com",
      isAnonymous: false,
    }));
    const server = createMcpHttpServer(API_BASE_URL, createApi(validateToken));

    const initialized = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);
    const sessionId = initialized.headers["mcp-session-id"] as string;

    expect(initialized.status).toBe(200);
    expect(sessionId).toBeTruthy();
    expect(validateToken).toHaveBeenCalledTimes(1);

    const mismatchedToken = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_other-token")
      .set("mcp-session-id", sessionId)
      .send({ jsonrpc: "2.0", method: "notifications/initialized" });

    expect(mismatchedToken).toMatchObject({
      status: 401,
      body: { error: "invalid MCP session" },
    });
    expect(validateToken).toHaveBeenCalledTimes(1);
  });

  it("exposes only bounded artifact write tools", async () => {
    const server = createMcpHttpServer(API_BASE_URL, createApi());
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
    const tools = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const payload = parseJsonRpc(tools);
    const names = payload.result.tools.map(
      (tool: { name: string }) => tool.name,
    );

    expect(names).toEqual(
      expect.arrayContaining([
        "list_workspaces",
        "list_applications",
        "get_application_context",
        "get_capabilities",
        "list_presets",
        "get_preset",
        "validate_app_spec",
        "build_application",
        "edit_page",
      ]),
    );

    // The raw artifact-import tools and the removed raw-DSL tools must not be exposed.
    // Check each individually: not.arrayContaining passes if even one is absent, so it
    // would miss a case where some (but not all) excluded tools leaked back in.
    for (const excluded of [
      "create_application",
      "update_layout",
      "import_application_artifact",
      "import_partial_application_artifact",
    ]) {
      expect(names).not.toContain(excluded);
    }
  });

  it("build_application compiles a page spec and imports the artifact", async () => {
    const importApplicationArtifact = jest.fn<
      Promise<{ id: string }>,
      [string, Record<string, unknown>]
    >(async () => ({ id: "app-1" }));
    const api: AppsmithApi = {
      ...createApi()(),
      importApplicationArtifact,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
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
    const call = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "build_application",
          arguments: {
            workspaceId: "ws1",
            app: {
              name: "Demo",
              pages: [
                { name: "Home", widgets: [{ type: "text", text: "Hi" }] },
              ],
            },
          },
        },
      });

    expect(importApplicationArtifact).toHaveBeenCalledTimes(1);
    const [workspaceId, artifact] = importApplicationArtifact.mock.calls[0];

    expect(workspaceId).toBe("ws1");
    expect(artifact.clientSchemaVersion).toBe(2);
    expect(artifact.actionList).toEqual([]);
    expect(artifact.pageList).toHaveLength(1);

    // Structural diagnostics are returned inline so the agent gets feedback without a second call.
    const body = JSON.parse(parseJsonRpc(call).result.content[0].text);

    expect(body.diagnostics).toEqual({
      errors: 0,
      warnings: 0,
      pages: expect.any(Object),
    });
  });

  it("inspect_page lints a live page read-back and reports structural issues", async () => {
    // A page whose two widgets overlap on the same canvas — the lint must surface it.
    const overlappingDsl = {
      widgetId: "0",
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      topRow: 0,
      bottomRow: 380,
      leftColumn: 0,
      rightColumn: 640,
      children: [
        {
          widgetId: "a",
          widgetName: "A",
          type: "INPUT_WIDGET_V2",
          topRow: 0,
          bottomRow: 10,
          leftColumn: 0,
          rightColumn: 30,
        },
        {
          widgetId: "b",
          widgetName: "B",
          type: "INPUT_WIDGET_V2",
          topRow: 5,
          bottomRow: 15,
          leftColumn: 10,
          rightColumn: 40,
        },
      ],
    };
    const getApplicationContext = jest.fn(async () => ({
      pages: [],
      page: {},
      layout: { dsl: overlappingDsl },
    }));
    const updateLayout = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext,
      updateLayout,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
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
    const call = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: {
          name: "inspect_page",
          arguments: { applicationId: "app1", pageId: "p1", layoutId: "l1" },
        },
      });

    // Read-only: inspecting must never write the layout back.
    expect(updateLayout).not.toHaveBeenCalled();
    expect(getApplicationContext).toHaveBeenCalledTimes(1);
    const body = JSON.parse(parseJsonRpc(call).result.content[0].text);

    expect(body.diagnostics.warnings).toBeGreaterThan(0);
    expect(
      body.diagnostics.issues.map((i: { rule: string }) => i.rule),
    ).toContain("overlap");
  });

  it("build_application rejects an invalid spec without importing", async () => {
    const importApplicationArtifact = jest.fn<
      Promise<{ id: string }>,
      [string, Record<string, unknown>]
    >(async () => ({ id: "app-1" }));
    const api: AppsmithApi = {
      ...createApi()(),
      importApplicationArtifact,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
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
    const call = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "build_application",
          arguments: {
            workspaceId: "ws1",
            app: { name: "Bad", pages: [{ name: "P", widgets: [] }] },
          },
        },
      });
    const text = parseJsonRpc(call).result.content[0].text;

    expect(importApplicationArtifact).not.toHaveBeenCalled();
    expect(text).toContain('"valid": false');
  });

  const existingPageDsl = {
    widgetId: "0",
    widgetName: "MainContainer",
    type: "CANVAS_WIDGET",
    topRow: 0,
    bottomRow: 380,
    leftColumn: 0,
    rightColumn: 640,
    children: [
      {
        widgetId: "email1",
        widgetName: "Email",
        type: "INPUT_WIDGET_V2",
        topRow: 0,
        bottomRow: 7,
        leftColumn: 0,
        rightColumn: 24,
      },
    ],
  };

  async function initSession(server: ReturnType<typeof createMcpHttpServer>) {
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

  it("edit_page appends to the existing DSL and writes it back", async () => {
    const getApplicationContext = jest.fn(async () => ({
      pages: [],
      page: {},
      layout: { dsl: existingPageDsl },
    }));
    const updateLayout = jest.fn<
      Promise<{ ok: boolean }>,
      [string, string, string, Record<string, unknown>]
    >(async () => ({ ok: true }));
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext,
      updateLayout,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const sessionId = await initSession(server);

    const call = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: {
          name: "edit_page",
          arguments: {
            applicationId: "app1",
            pageId: "p1",
            layoutId: "l1",
            edit: { add: [{ type: "button", text: "Save" }] },
          },
        },
      });

    expect(parseJsonRpc(call).result.content[0].text).not.toContain(
      '"valid": false',
    );
    expect(updateLayout).toHaveBeenCalledTimes(1);
    const [, , , writtenDsl] = updateLayout.mock.calls[0];
    const children = writtenDsl.children as { widgetName: string }[];

    expect(children).toHaveLength(2);
    expect(children.map((c) => c.widgetName)).toContain("Email");

    // edit_page returns structural diagnostics inline, same as build_application.
    const body = JSON.parse(parseJsonRpc(call).result.content[0].text);

    expect(body.diagnostics).toEqual({
      errors: 0,
      warnings: 0,
      issues: [],
    });
  });

  it("edit_page reports a read failure without writing when the layout is missing", async () => {
    const getApplicationContext = jest.fn(async () => ({
      pages: [],
      page: {},
      layout: {},
    }));
    const updateLayout = jest.fn(async () => ({ ok: true }));
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext,
      updateLayout,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const sessionId = await initSession(server);

    const call = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({
        jsonrpc: "2.0",
        id: 6,
        method: "tools/call",
        params: {
          name: "edit_page",
          arguments: {
            applicationId: "app1",
            pageId: "p1",
            layoutId: "l1",
            edit: { add: [{ type: "button", text: "Save" }] },
          },
        },
      });

    expect(updateLayout).not.toHaveBeenCalled();
    expect(parseJsonRpc(call).result.content[0].text).toContain(
      "could not read the current page layout",
    );
  });

  it("does not evict a session when a mismatched token is presented", async () => {
    const server = createMcpHttpServer(API_BASE_URL, createApi());
    const sessionId = await initSession(server);

    const attacker = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_attacker-token")
      .set("mcp-session-id", sessionId)
      .send({ jsonrpc: "2.0", method: "notifications/initialized" });

    expect(attacker.status).toBe(401);

    // The real owner's session must survive the mismatch — otherwise a leaked session id is a targeted DoS.
    const owner = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({ jsonrpc: "2.0", method: "notifications/initialized" });

    expect(owner.status).not.toBe(404);
  });

  it("enforces the per-user session cap under concurrent initialize requests", async () => {
    const server = createMcpHttpServer(API_BASE_URL, createApi(), {
      maxSessionsPerUser: 1,
    });

    // Listen once so concurrent requests share one address (supertest otherwise re-listens per call).
    await new Promise<void>((resolve) => server.listen(0, resolve));

    try {
      const fire = () =>
        supertest(server)
          .post("/mcp")
          .set("Accept", "application/json, text/event-stream")
          .set("Authorization", "Bearer mcp_user-token")
          .send(initializeRequest);
      const responses = await Promise.all([
        fire(),
        fire(),
        fire(),
        fire(),
        fire(),
      ]);
      const acceptedIds = responses
        .map((r) => r.headers["mcp-session-id"] as string | undefined)
        .filter((id): id is string => Boolean(id));
      const rejected = responses.filter((r) => r.status === 429).length;

      // Every request either gets a session or hits the cap — nothing slips through unaccounted. An initialize
      // that lands while another is still a pending reservation is rejected (reservations are not evictable);
      // one that lands after a session registered evicts it and takes its place. Timing decides the split, so
      // assert the invariants rather than an exact count.
      expect(acceptedIds.length).toBeGreaterThanOrEqual(1);
      expect(acceptedIds.length + rejected).toBe(5);

      // The cap itself is the hard invariant: at most one of the issued sessions is still alive afterwards.
      const probes = await Promise.all(
        acceptedIds.map((id) =>
          supertest(server)
            .post("/mcp")
            .set("Accept", "application/json, text/event-stream")
            .set("Authorization", "Bearer mcp_user-token")
            .set("mcp-session-id", id)
            .send({ jsonrpc: "2.0", method: "notifications/initialized" }),
        ),
      );
      const alive = probes.filter((probe) => probe.status !== 404).length;

      expect(alive).toBe(1);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("fails safely when session token revalidation fails", async () => {
    const validateToken = jest
      .fn<Promise<{ username: string; isAnonymous: boolean }>, []>()
      .mockResolvedValueOnce({
        username: "user@appsmith.com",
        isAnonymous: false,
      })
      .mockRejectedValueOnce(new Error("token must not leak"));
    const server = createMcpHttpServer(API_BASE_URL, createApi(validateToken));
    const initialized = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);
    const sessionId = initialized.headers["mcp-session-id"] as string;

    const reused = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({ jsonrpc: "2.0", method: "notifications/initialized" });

    expect(reused).toMatchObject({
      status: 401,
      body: { error: "invalid bearer token" },
    });
  });

  it("removes expired sessions before dispatching a request", async () => {
    let time = 0;
    const server = createMcpHttpServer(API_BASE_URL, createApi(), {
      now: () => time,
      sessionTtlMs: 1,
    });
    const initialized = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);
    const sessionId = initialized.headers["mcp-session-id"] as string;

    time = 1;
    const expired = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({ jsonrpc: "2.0", method: "notifications/initialized" });

    // 404, not 400: the spec-defined signal on which a compliant client re-initializes transparently.
    expect(expired).toMatchObject({
      status: 404,
      body: { error: "session not found; initialize a new MCP session" },
    });
  });

  it("answers 400 only when NO session id accompanies a non-initialize request", async () => {
    const server = createMcpHttpServer(API_BASE_URL, createApi());
    const response = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .send({ jsonrpc: "2.0", method: "notifications/initialized" });

    expect(response).toMatchObject({
      status: 400,
      body: { error: "initialize the MCP session first" },
    });
  });

  it("rejects new sessions when the configured session limit is reached", async () => {
    const server = createMcpHttpServer(API_BASE_URL, createApi(), {
      maxSessions: 0,
    });

    const response = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);

    expect(response).toMatchObject({
      status: 503,
      body: { error: "MCP session limit reached" },
    });
  });

  it("rejects bearer tokens that are not MCP tokens", async () => {
    const server = createMcpHttpServer(API_BASE_URL, createApi());

    const response = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer not-an-mcp-token")
      .send(initializeRequest);

    expect(response.status).toBe(401);
    expect(response.headers["www-authenticate"]).toBe("Bearer");
  });

  it("rejects cross-origin requests", async () => {
    const response = await supertest(
      createMcpHttpServer(API_BASE_URL, createApi()),
    )
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Origin", "https://evil.example")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);

    expect(response).toMatchObject({
      status: 403,
      body: { error: "cross-origin requests are not allowed" },
    });
  });

  it("rejects a Host not in the configured allowlist before any session/auth work", async () => {
    const validateToken = jest.fn();
    const server = createMcpHttpServer(API_BASE_URL, createApi(validateToken), {
      allowedHosts: ["127.0.0.1", "localhost"],
    });
    const rejected = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Host", "attacker.example")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);

    expect(rejected).toMatchObject({
      status: 403,
      body: { error: "host not allowed" },
    });
    // Rejected before authentication — no session is created and the token is never validated.
    expect(validateToken).not.toHaveBeenCalled();

    // A loopback Host (what supertest and Caddy-to-loopback send) is allowed through to normal processing.
    const allowed = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Host", "127.0.0.1")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);

    expect(allowed.status).not.toBe(403);
  });

  it("leaves the Host header unchecked when no allowlist is configured (default)", async () => {
    const server = createMcpHttpServer(API_BASE_URL, createApi());
    const response = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Host", "any-public-domain.example")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);

    // No allowlist -> Host is not a rejection reason (Caddy-fronted deployments preserve the public Host).
    expect(response.status).not.toBe(403);
  });

  it("allows a listed host that arrives with a port (loopback deployments send host:port)", async () => {
    const server = createMcpHttpServer(API_BASE_URL, createApi(), {
      allowedHosts: ["127.0.0.1"],
    });
    const response = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Host", "127.0.0.1:9000")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);

    // The port is stripped before the allowlist check, so 127.0.0.1:9000 matches "127.0.0.1".
    expect(response.status).not.toBe(403);
  });

  describe("hostHeaderName", () => {
    it("extracts the lowercased hostname without the port", () => {
      expect(hostHeaderName("127.0.0.1")).toBe("127.0.0.1");
      expect(hostHeaderName("127.0.0.1:8092")).toBe("127.0.0.1");
      expect(hostHeaderName("LocalHost:8092")).toBe("localhost");
      expect(hostHeaderName("  Example.COM:443  ")).toBe("example.com");
      // Bracketed IPv6 keeps the address and drops the port.
      expect(hostHeaderName("[::1]:8092")).toBe("::1");
      expect(hostHeaderName("[::1]")).toBe("::1");
    });

    it("returns an empty string for a missing or non-string header (fails closed)", () => {
      expect(hostHeaderName(undefined)).toBe("");
      expect(hostHeaderName("")).toBe("");
      expect(hostHeaderName(["127.0.0.1"])).toBe("");
      // A malformed bracket does not silently become a loopback match.
      expect(hostHeaderName("[::1")).not.toBe("::1");
    });
  });

  // M5 — the session-scoped origin for build_application's URLs, derived from the initialize request's headers.
  describe("sessionOriginFromHeaders", () => {
    it("builds an origin only from an exact http/https proto and a charset-clean host", () => {
      expect(
        sessionOriginFromHeaders(
          { "x-forwarded-proto": "https", host: "Apps.Example.Com:8443" },
          new Set(),
        ),
      ).toBe("https://apps.example.com:8443");
      expect(
        sessionOriginFromHeaders(
          { "x-forwarded-proto": "http", host: "localhost:8080" },
          new Set(),
        ),
      ).toBe("http://localhost:8080");
    });

    it("fails closed on a forged/missing/duplicated proto or a hostile host", () => {
      const noAllowlist = new Set<string>();

      expect(
        sessionOriginFromHeaders({ host: "apps.example.com" }, noAllowlist),
      ).toBeUndefined();
      expect(
        sessionOriginFromHeaders(
          { "x-forwarded-proto": "javascript", host: "apps.example.com" },
          noAllowlist,
        ),
      ).toBeUndefined();
      // Node joins duplicated X-Forwarded-Proto headers with a comma; the literal comparison rejects that too.
      expect(
        sessionOriginFromHeaders(
          { "x-forwarded-proto": "https, http", host: "apps.example.com" },
          noAllowlist,
        ),
      ).toBeUndefined();
      expect(
        sessionOriginFromHeaders(
          { "x-forwarded-proto": ["https"], host: "apps.example.com" },
          noAllowlist,
        ),
      ).toBeUndefined();
      expect(
        sessionOriginFromHeaders(
          { "x-forwarded-proto": "https", host: "evil.com<script>" },
          noAllowlist,
        ),
      ).toBeUndefined();
      expect(
        sessionOriginFromHeaders(
          { "x-forwarded-proto": "https", host: "" },
          noAllowlist,
        ),
      ).toBeUndefined();
      expect(
        sessionOriginFromHeaders({ "x-forwarded-proto": "https" }, noAllowlist),
      ).toBeUndefined();
    });

    it("enforces the configured Host allowlist (hostname compared, port ignored)", () => {
      const allowed = new Set(["apps.example.com"]);

      expect(
        sessionOriginFromHeaders(
          { "x-forwarded-proto": "https", host: "apps.example.com:443" },
          allowed,
        ),
      ).toBe("https://apps.example.com:443");
      expect(
        sessionOriginFromHeaders(
          { "x-forwarded-proto": "https", host: "other.example.com" },
          allowed,
        ),
      ).toBeUndefined();
    });
  });

  it("rejects tokens that resolve to an anonymous session", async () => {
    const validateToken = jest.fn(async () => ({
      isAnonymous: true,
      username: "anonymousUser",
    }));
    const server = createMcpHttpServer(API_BASE_URL, createApi(validateToken));

    const response = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_anon-token")
      .send(initializeRequest);

    expect(response).toMatchObject({
      status: 401,
      body: { error: "invalid bearer token" },
    });
  });

  it("rejects a new session when the per-user cap leaves nothing to evict", async () => {
    // A zero cap means no registered session can ever exist to evict, so the 429 path still fires.
    const server = createMcpHttpServer(API_BASE_URL, createApi(), {
      maxSessionsPerUser: 0,
    });

    const response = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);

    expect(response).toMatchObject({
      status: 429,
      body: { error: "MCP session limit reached for this user" },
    });
  });

  it("evicts the user's own oldest session instead of rejecting at the per-user cap", async () => {
    const server = createMcpHttpServer(API_BASE_URL, createApi(), {
      maxSessionsPerUser: 1,
    });
    const firstId = await initSession(server);

    // The second initialize succeeds — the stale first session is displaced rather than the client seeing a 429.
    const second = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);
    const secondId = second.headers["mcp-session-id"] as string;

    expect(second.status).not.toBe(429);
    expect(secondId).toBeDefined();

    const evicted = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", firstId)
      .send({ jsonrpc: "2.0", method: "notifications/initialized" });

    // 404 per spec: the evicted session's client re-initializes transparently instead of stranding.
    expect(evicted).toMatchObject({
      status: 404,
      body: { error: "session not found; initialize a new MCP session" },
    });

    const survivor = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", secondId)
      .send({ jsonrpc: "2.0", method: "notifications/initialized" });

    expect(survivor.status).not.toBe(404);
  });

  it("evicts the least-recently-active session, not the most recent one", async () => {
    let time = 0;
    const server = createMcpHttpServer(API_BASE_URL, createApi(), {
      maxSessionsPerUser: 2,
      now: () => time,
    });
    const touchedId = await initSession(server);

    time = 1000;
    const idleId = await initSession(server);

    // Touch the first session at t=2000, making the second one the least recently active of the two.
    time = 2000;
    await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", touchedId)
      .send({ jsonrpc: "2.0", method: "notifications/initialized" });

    time = 3000;
    const third = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);

    expect(third.headers["mcp-session-id"]).toBeDefined();

    // The idle session was the oldest by last activity and is the one displaced — creation order is irrelevant.
    const displaced = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", idleId)
      .send({ jsonrpc: "2.0", method: "notifications/initialized" });

    expect(displaced.status).toBe(404);

    const survivor = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", touchedId)
      .send({ jsonrpc: "2.0", method: "notifications/initialized" });

    expect(survivor.status).not.toBe(404);
  });

  it("admits a capped user at global saturation when their own eviction frees the slot", async () => {
    // Eviction candidates count against the global cap check: displacing the user's own session is net-zero
    // for the instance, so a full instance must not 503 a user who is only displacing themselves.
    const server = createMcpHttpServer(API_BASE_URL, createApi(), {
      maxSessions: 1,
      maxSessionsPerUser: 1,
    });

    await initSession(server);

    const second = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);

    expect(second.status).not.toBe(503);
    expect(second.headers["mcp-session-id"]).toBeDefined();
  });

  it("never evicts another user's session at the per-user cap", async () => {
    // Username derives from the token so two bearer tokens act as two distinct users.
    const apiForToken = (token: string): AppsmithApi => ({
      ...createApi()(),
      validateToken: jest.fn(async () => ({
        username: token.includes("alice") ? "alice" : "bob",
        isAnonymous: false,
      })),
    });
    const server = createMcpHttpServer(API_BASE_URL, apiForToken, {
      maxSessionsPerUser: 1,
    });
    const init = (token: string) =>
      supertest(server)
        .post("/mcp")
        .set("Accept", "application/json, text/event-stream")
        .set("Authorization", `Bearer ${token}`)
        .send(initializeRequest);
    const aliceFirst = await init("mcp_alice-token");
    const bobSession = await init("mcp_bob-token");
    const aliceSecond = await init("mcp_alice-token");

    const aliceFirstId = aliceFirst.headers["mcp-session-id"] as string;
    const bobSessionId = bobSession.headers["mcp-session-id"] as string;

    expect(aliceSecond.headers["mcp-session-id"]).toBeDefined();

    // Alice's churn displaced only her own session; Bob's is untouched.
    const aliceEvicted = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_alice-token")
      .set("mcp-session-id", aliceFirstId)
      .send({ jsonrpc: "2.0", method: "notifications/initialized" });

    expect(aliceEvicted.status).toBe(404);

    const bobAlive = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_bob-token")
      .set("mcp-session-id", bobSessionId)
      .send({ jsonrpc: "2.0", method: "notifications/initialized" });

    expect(bobAlive.status).not.toBe(404);
  });
});

describe("MCP instruction surface (M2)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function session(): Promise<{ server: any; sessionId: string }> {
    const server = createMcpHttpServer(API_BASE_URL, createApi());
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

    return { server, sessionId };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function rpc(method: string, params?: unknown): Promise<any> {
    const { server, sessionId } = await session();
    const response = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({ jsonrpc: "2.0", id: 9, method, params });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (parseJsonRpc(response) as any).result;
  }

  it("exposes exactly the intended instruction resources", async () => {
    const result = await rpc("resources/list");
    const uris = (result.resources as { uri: string }[])
      .map((r) => r.uri)
      .sort();

    expect(uris).toEqual(
      [
        "appsmith://guide/bindings",
        "appsmith://guide/git",
        "appsmith://guide/naming",
        "appsmith://guide/placement",
        "appsmith://recipe/crud",
        "appsmith://recipe/form",
        "appsmith://recipe/table-detail",
        "appsmith://recipe/zip-lookup",
        "appsmith://reference/widgets",
      ].sort(),
    );
  });

  it("reads a resource and returns markdown content", async () => {
    const result = await rpc("resources/read", {
      uri: "appsmith://reference/widgets",
    });
    const [content] = result.contents as { text: string; mimeType: string }[];

    expect(content.mimeType).toBe("text/markdown");
    expect(content.text).toContain("# Widget reference");
  });

  it("exposes the guided-workflow prompts", async () => {
    const result = await rpc("prompts/list");
    const names = (result.prompts as { name: string }[]).map((p) => p.name);

    expect(names).toContain("scaffold_crud");
    expect(names).toContain("scaffold_form");
  });

  it("renders a scaffold prompt as a user message referencing real tools", async () => {
    const result = await rpc("prompts/get", {
      name: "scaffold_crud",
      arguments: { entity: "Customer", fields: "email:EMAIL" },
    });
    const [message] = result.messages as {
      role: string;
      content: { type: string; text: string };
    }[];

    expect(message.role).toBe("user");
    expect(message.content.text).toContain("CustomerTable");
    expect(message.content.text).toContain("build_application");
    expect(message.content.text).not.toContain("create_query");
  });

  // The always-on tool mirror of the resources above: tools-only clients (e.g. ChatGPT) cannot read MCP
  // resources, so the same InstructionDoc registry must be reachable through get_guide — no forked content.
  describe("get_guide — the tool mirror of the instruction resources", () => {
    async function callGuide(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      server: any,
      sessionId: string,
      slug: string,
    ): Promise<Record<string, unknown>> {
      const response = await supertest(server)
        .post("/mcp")
        .set("Accept", "application/json, text/event-stream")
        .set("Authorization", "Bearer mcp_user-token")
        .set("mcp-session-id", sessionId)
        .send({
          jsonrpc: "2.0",
          id: 12,
          method: "tools/call",
          params: { name: "get_guide", arguments: { slug } },
        });

      return JSON.parse(parseJsonRpc(response).result.content[0].text);
    }

    it("returns the SAME rendered markdown as the resource for every registry slug", async () => {
      const { server, sessionId } = await session();

      for (const doc of INSTRUCTION_DOCS) {
        const body = await callGuide(server, sessionId, doc.slug);

        expect(body.slug).toBe(doc.slug);
        expect(body.title).toBe(doc.title);
        // Byte-identical to the resource content: one registry, no forked copy.
        expect(body.markdown).toBe(doc.render());
      }
    });

    it("rejects an unknown slug with the full slug list", async () => {
      const { server, sessionId } = await session();
      const body = await callGuide(server, sessionId, "no-such-guide");

      expect(String(body.error)).toContain("unknown guide");
      expect(body.available).toEqual(INSTRUCTION_DOCS.map((doc) => doc.slug));
    });

    it("enumerates every registry slug in the tool description (drift guard)", async () => {
      const { server, sessionId } = await session();
      const listed = await supertest(server)
        .post("/mcp")
        .set("Accept", "application/json, text/event-stream")
        .set("Authorization", "Bearer mcp_user-token")
        .set("mcp-session-id", sessionId)
        .send({ jsonrpc: "2.0", id: 14, method: "tools/list" });
      const tools = parseJsonRpc(listed).result.tools as unknown as {
        name: string;
        description?: string;
      }[];
      const guideTool = tools.find((tool) => tool.name === "get_guide");

      expect(guideTool).toBeDefined();

      for (const doc of INSTRUCTION_DOCS) {
        expect(guideTool?.description).toContain(doc.slug);
      }
    });
  });
});

describe("M4 data layer — sub-flag gates the data tools", () => {
  async function toolNames(dataEnabled: boolean): Promise<string[]> {
    const server = createMcpHttpServer(API_BASE_URL, createApi(), {
      dataEnabled,
    });
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
    const listed = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({ jsonrpc: "2.0", id: 7, method: "tools/list" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = parseJsonRpc(listed).result as any;

    return (result.tools as { name: string }[]).map((t) => t.name);
  }

  it("hides the data tools when the sub-flag is off (default)", async () => {
    const names = await toolNames(false);

    expect(names).not.toContain("list_datasources");
    expect(names).not.toContain("create_datasource");
    expect(names).not.toContain("get_datasource_structure");
    // The build/authoring tools are still present.
    expect(names).toContain("build_application");
    // Raw artifact-import tools remain absent regardless.
    expect(names).not.toContain("import_application_artifact");
  });

  it("exposes the data tools when the sub-flag is on", async () => {
    const names = await toolNames(true);

    expect(names).toContain("list_datasources");
    expect(names).toContain("create_datasource");
    expect(names).toContain("get_datasource_structure");
    expect(names).not.toContain("import_application_artifact");
  });

  // Spin a data-enabled server with a custom api, handshake, call a tool, return the parsed result body.
  async function callTool(
    api: AppsmithApi,
    name: string,
    args: unknown,
  ): Promise<Record<string, unknown>> {
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      dataEnabled: true,
    });
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
    const call = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({
        jsonrpc: "2.0",
        id: 11,
        method: "tools/call",
        params: { name, arguments: args },
      });

    const text = parseJsonRpc(call).result.content[0].text;

    // Tools with typed input schemas are rejected by the SDK BEFORE the handler runs; surface that protocol-level
    // rejection ("MCP error -32602: Invalid arguments...") as an error body so tests can assert on it.
    try {
      return JSON.parse(text);
    } catch {
      return { error: text };
    }
  }

  const validQuery = {
    name: "getUsers",
    applicationId: "app1",
    pageId: "p1",
    datasourceId: "ds1",
    operation: "SELECT",
    table: "users",
  };

  it("create_query appears only when the sub-flag is on", async () => {
    expect(await toolNames(false)).not.toContain("create_query");
    expect(await toolNames(true)).toContain("create_query");
  });

  it("inspect_page reports bindings to queries that do not exist", async () => {
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: {
          dsl: {
            widgetId: "0",
            widgetName: "MainContainer",
            type: "CANVAS_WIDGET",
            topRow: 0,
            bottomRow: 380,
            leftColumn: 0,
            rightColumn: 640,
            children: [
              {
                widgetId: "table1",
                widgetName: "OrdersTable",
                type: "TABLE_WIDGET_V2",
                topRow: 0,
                bottomRow: 20,
                leftColumn: 0,
                rightColumn: 64,
                tableData: "{{ missingQuery.data }}",
              },
            ],
          },
        },
      })),
      listActions: jest.fn(async () => [{ name: "getOrders", pageId: "p1" }]),
    };

    const body = await callTool(api, "inspect_page", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
    });

    expect(
      (body.diagnostics as { issues: { rule: string }[] }).issues.map(
        (issue) => issue.rule,
      ),
    ).toContain("dangling-binding");
  });

  it("create_query creates a parameterized query when the datasource is accessible", async () => {
    const createAction = jest.fn<
      Promise<{ id: string }>,
      [Record<string, unknown>]
    >(async () => ({ id: "act1" }));
    const api: AppsmithApi = {
      ...createApi()(),
      listDatasources: jest.fn(async () => [
        { id: "ds1", name: "DB", pluginId: "postgres-plugin" },
      ]),
      listActions: jest.fn(async () => []),
      createAction,
    };
    const body = await callTool(api, "create_query", {
      query: {
        ...validQuery,
        filters: [{ column: "id", op: "eq", value: { literal: 1 } }],
      },
    });

    expect(body.created).toBe(true);
    expect(body.body).toBe("SELECT * FROM users WHERE id = {{ 1 }};");
    expect(createAction).toHaveBeenCalledTimes(1);
    const dto = createAction.mock.calls[0][0] as { datasource: { id: string } };

    expect(dto.datasource).toEqual({ id: "ds1" });
  });

  it("create_query refuses a datasource the caller cannot access (IDOR guard)", async () => {
    const createAction = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      // The caller's accessible datasources do NOT include ds1.
      listDatasources: jest.fn(async () => [{ id: "other", name: "X" }]),
      listActions: jest.fn(async () => []),
      createAction,
    };
    const body = await callTool(api, "create_query", { query: validQuery });

    expect(body.error).toMatch(/not accessible/);
    expect(createAction).not.toHaveBeenCalled();
  });

  it("create_query refuses non-SQL datasources", async () => {
    const createAction = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      listDatasources: jest.fn(async () => [
        { id: "ds1", name: "Users API", pluginId: "rest-api-plugin" },
      ]),
      listActions: jest.fn(async () => []),
      createAction,
    };
    const body = await callTool(api, "create_query", { query: validQuery });

    expect(body.error).toMatch(/supports only/i);
    expect(createAction).not.toHaveBeenCalled();
  });

  it("create_query resolves the workspace from the application, not the agent (cross-tenant guard)", async () => {
    const createAction = jest.fn();
    // ds1 exists only in workspace A; the app resolves to workspace B, so the lookup there returns nothing.
    const listDatasources = jest.fn(async (workspaceId: string) =>
      workspaceId === "wsA" ? [{ id: "ds1" }] : [],
    );
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationPages: jest.fn(async () => ({ workspaceId: "wsB" })),
      listDatasources,
      listActions: jest.fn(async () => []),
      createAction,
    };
    const body = await callTool(api, "create_query", { query: validQuery });

    // Datasource is looked up in the app's OWN workspace (wsB), where ds1 is absent → refused, no POST.
    expect(listDatasources).toHaveBeenCalledWith("wsB");
    expect(body.error).toMatch(/not accessible/);
    expect(createAction).not.toHaveBeenCalled();
  });

  it("create_query is idempotent: returns the existing query instead of duplicating", async () => {
    const createAction = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      listDatasources: jest.fn(async () => [
        { id: "ds1", pluginId: "postgres-plugin" },
      ]),
      listActions: jest.fn(async () => [{ name: "getUsers", pageId: "p1" }]),
      createAction,
    };
    const body = await callTool(api, "create_query", { query: validQuery });

    expect(body.created).toBe(false);
    expect(createAction).not.toHaveBeenCalled();
  });

  it("create_query rejects a spec that could inject before any API call", async () => {
    const listDatasources = jest.fn(async () => [{ id: "ds1" }]);
    const createAction = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      listDatasources,
      listActions: jest.fn(async () => []),
      createAction,
    };
    const body = await callTool(api, "create_query", {
      query: { ...validQuery, table: "users; DROP TABLE users" },
    });

    expect(body.valid).toBe(false);
    expect(createAction).not.toHaveBeenCalled();
  });

  it("create_query resolves plugin DOCUMENT ids through the workspace plugin list", async () => {
    // Real servers return the plugin's Mongo id on the datasource, not the packageName; the family check must
    // resolve it via listPlugins(workspaceId).
    const createAction = jest.fn(async () => ({ id: "act1" }));
    const listPlugins = jest.fn(async () => [
      { id: "656f00000000000000000001", packageName: "postgres-plugin" },
    ]);
    const api: AppsmithApi = {
      ...createApi()(),
      listDatasources: jest.fn(async () => [
        { id: "ds1", name: "DB", pluginId: "656f00000000000000000001" },
      ]),
      listPlugins,
      listActions: jest.fn(async () => []),
      createAction,
    };
    const body = await callTool(api, "create_query", { query: validQuery });

    expect(body.created).toBe(true);
    expect(listPlugins).toHaveBeenCalledWith("ws1");
    expect(createAction).toHaveBeenCalledTimes(1);
  });

  const mongoQuery = {
    name: "getOrders",
    applicationId: "app1",
    pageId: "p1",
    datasourceId: "ds1",
    collection: "orders",
    operation: "FIND",
    filter: [{ field: "status", value: { literal: "open" } }],
  };

  it("create_mongo_query creates a Mongo find action against a Mongo datasource", async () => {
    const createAction = jest.fn<
      Promise<{ id: string }>,
      [Record<string, unknown>]
    >(async () => ({ id: "act-m" }));
    const api: AppsmithApi = {
      ...createApi()(),
      listDatasources: jest.fn(async () => [
        { id: "ds1", name: "Mongo", pluginId: "656f00000000000000000009" },
      ]),
      listPlugins: jest.fn(async () => [
        { id: "656f00000000000000000009", packageName: "mongo-plugin" },
      ]),
      listActions: jest.fn(async () => []),
      createAction,
    };
    const body = await callTool(api, "create_mongo_query", {
      query: mongoQuery,
    });

    expect(body.created).toBe(true);
    expect(body.command).toBe("FIND");
    expect(createAction).toHaveBeenCalledTimes(1);

    const dto = createAction.mock.calls[0][0] as {
      actionConfiguration: {
        formData: {
          command: { data: string };
          find: { query: { data: string } };
          smartSubstitution: { data: boolean };
        };
      };
    };

    expect(dto.actionConfiguration.formData.command.data).toBe("FIND");
    expect(dto.actionConfiguration.formData.find.query.data).toBe(
      '{ "status": "open" }',
    );
    expect(dto.actionConfiguration.formData.smartSubstitution.data).toBe(true);
  });

  it("create_mongo_query refuses a non-Mongo (SQL) datasource", async () => {
    const createAction = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      listDatasources: jest.fn(async () => [
        { id: "ds1", name: "PG", pluginId: "postgres-plugin" },
      ]),
      listPlugins: jest.fn(async () => [
        { id: "postgres-plugin", packageName: "postgres-plugin" },
      ]),
      listActions: jest.fn(async () => []),
      createAction,
    };
    const body = await callTool(api, "create_mongo_query", {
      query: mongoQuery,
    });

    expect(String(body.error)).toMatch(/requires an existing MongoDB/);
    expect(createAction).not.toHaveBeenCalled();
  });

  it("create_mongo_query rejects an injecting collection/field before any write", async () => {
    const createAction = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      listDatasources: jest.fn(async () => [{ id: "ds1" }]),
      listActions: jest.fn(async () => []),
      createAction,
    };
    const body = await callTool(api, "create_mongo_query", {
      query: { ...mongoQuery, collection: "orders; drop" },
    });

    expect(body.valid).toBe(false);
    expect(createAction).not.toHaveBeenCalled();
  });

  const sheetsAppend = {
    name: "addRow",
    applicationId: "app1",
    pageId: "p1",
    datasourceId: "ds1",
    sheetUrl: "https://docs.google.com/spreadsheets/d/1AbC_dEf-123/edit",
    sheetName: "Sheet1",
    operation: "append",
    row: [{ column: "name", value: { widget: "NameInput", property: "text" } }],
  };

  it("create_sheets_query appends a row to an authorized Sheets datasource", async () => {
    const createAction = jest.fn<
      Promise<{ id: string }>,
      [Record<string, unknown>]
    >(async () => ({ id: "act-s" }));
    const api: AppsmithApi = {
      ...createApi()(),
      listDatasources: jest.fn(async () => [
        { id: "ds1", name: "Sheet", pluginId: "656f00000000000000000010" },
      ]),
      listPlugins: jest.fn(async () => [
        { id: "656f00000000000000000010", packageName: "google-sheets-plugin" },
      ]),
      listActions: jest.fn(async () => []),
      createAction,
    };
    const body = await callTool(api, "create_sheets_query", {
      query: sheetsAppend,
    });

    expect(body.created).toBe(true);
    expect(body.command).toBe("INSERT_ONE");

    const dto = createAction.mock.calls[0][0] as {
      actionConfiguration: {
        formData: { rowObjects: { data: string }; command: { data: string } };
      };
    };

    expect(dto.actionConfiguration.formData.command.data).toBe("INSERT_ONE");
    expect(dto.actionConfiguration.formData.rowObjects.data).toBe(
      '{ "name": {{ NameInput.text }} }',
    );
  });

  it("create_sheets_query refuses a non-Sheets datasource", async () => {
    const createAction = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      listDatasources: jest.fn(async () => [
        { id: "ds1", name: "PG", pluginId: "postgres-plugin" },
      ]),
      listPlugins: jest.fn(async () => [
        { id: "postgres-plugin", packageName: "postgres-plugin" },
      ]),
      listActions: jest.fn(async () => []),
      createAction,
    };
    const body = await callTool(api, "create_sheets_query", {
      query: sheetsAppend,
    });

    expect(String(body.error)).toMatch(/Google Sheets datasource/);
    expect(createAction).not.toHaveBeenCalled();
  });

  it("create_mongo_query and create_sheets_query appear only when the data flag is on", async () => {
    const off = await toolNames(false);
    const on = await toolNames(true);

    expect(off).not.toContain("create_mongo_query");
    expect(off).not.toContain("create_sheets_query");
    expect(on).toContain("create_mongo_query");
    expect(on).toContain("create_sheets_query");
  });

  it("create_datasource creates an UNCONFIGURED datasource with no credential fields", async () => {
    const createDatasource = jest.fn<
      Promise<Record<string, unknown>>,
      [Record<string, unknown>]
    >(async () => ({
      id: "ds9",
      name: "My Postgres",
      pluginId: "656f00000000000000000001",
      workspaceId: "ws1",
    }));
    const api: AppsmithApi = {
      ...createApi()(),
      listPlugins: jest.fn(async () => [
        { id: "656f00000000000000000001", packageName: "postgres-plugin" },
      ]),
      listDatasources: jest.fn(async () => []),
      createDatasource,
    };
    const body = await callTool(api, "create_datasource", {
      workspaceId: "ws1",
      name: "My Postgres",
      plugin: "postgresql",
      connection: {
        host: "db.internal",
        databaseName: "appdb",
        username: "app_user",
      },
    });

    expect(body.created).toBe(true);
    expect(body.needsCredentials).toBe(true);
    expect(typeof body.nextStep).toBe("string");
    expect(createDatasource).toHaveBeenCalledTimes(1);

    const dto = createDatasource.mock.calls[0][0] as unknown as {
      pluginId: string;
      datasourceStorages: Record<
        string,
        {
          isConfigured: boolean;
          datasourceConfiguration: {
            endpoints: { host: string; port: number }[];
            authentication: Record<string, unknown>;
          };
        }
      >;
    };

    // Plugin document id resolved from the packageName; storage keyed by the fixed CE environment.
    expect(dto.pluginId).toBe("656f00000000000000000001");
    const storage = dto.datasourceStorages.unused_env;

    expect(storage.isConfigured).toBe(false);
    expect(storage.datasourceConfiguration.endpoints).toEqual([
      { host: "db.internal", port: 5432 },
    ]);
    // The credential invariant: no password anywhere in the outbound DTO.
    expect(JSON.stringify(dto)).not.toContain("password");
    expect(storage.datasourceConfiguration.authentication).toEqual({
      authenticationType: "dbAuth",
      databaseName: "appdb",
      username: "app_user",
    });
  });

  it("create_datasource maps family default ports, explicit overrides, and omits an absent username", async () => {
    const createDatasource = jest.fn<
      Promise<Record<string, unknown>>,
      [Record<string, unknown>]
    >(async () => ({ id: "ds9" }));
    const api: AppsmithApi = {
      ...createApi()(),
      listPlugins: jest.fn(async () => [
        { id: "p-mysql", packageName: "mysql-plugin" },
        { id: "p-mssql", packageName: "mssql-plugin" },
      ]),
      listDatasources: jest.fn(async () => []),
      createDatasource,
    };

    // mysql defaults to 3306, and with no username the key is absent (not null/empty).
    await callTool(api, "create_datasource", {
      workspaceId: "ws1",
      name: "MySQL DB",
      plugin: "mysql",
      connection: { host: "db", databaseName: "appdb" },
    });

    const mysqlConfig = (
      createDatasource.mock.calls[0][0] as {
        datasourceStorages: Record<
          string,
          {
            datasourceConfiguration: {
              endpoints: unknown;
              authentication: Record<string, unknown>;
            };
          }
        >;
      }
    ).datasourceStorages.unused_env.datasourceConfiguration;

    expect(mysqlConfig.endpoints).toEqual([{ host: "db", port: 3306 }]);
    expect(mysqlConfig.authentication).toEqual({
      authenticationType: "dbAuth",
      databaseName: "appdb",
    });
    expect("username" in mysqlConfig.authentication).toBe(false);

    // mssql with an explicit port override wins over the family default (1433).
    await callTool(api, "create_datasource", {
      workspaceId: "ws1",
      name: "MSSQL DB",
      plugin: "mssql",
      connection: { host: "sqlserver", port: 14330, databaseName: "appdb" },
    });

    const mssqlConfig = (
      createDatasource.mock.calls[1][0] as {
        datasourceStorages: Record<
          string,
          { datasourceConfiguration: { endpoints: unknown } }
        >;
      }
    ).datasourceStorages.unused_env.datasourceConfiguration;

    expect(mssqlConfig.endpoints).toEqual([{ host: "sqlserver", port: 14330 }]);
  });

  it("create_datasource provisions oracle and redshift on the shared host/port/dbAuth shape (D1)", async () => {
    const createDatasource = jest.fn<
      Promise<Record<string, unknown>>,
      [Record<string, unknown>]
    >(async () => ({ id: "ds-sql" }));
    const api: AppsmithApi = {
      ...createApi()(),
      listPlugins: jest.fn(async () => [
        { id: "p-oracle", packageName: "oracle-plugin" },
        { id: "p-redshift", packageName: "redshift-plugin" },
      ]),
      listDatasources: jest.fn(async () => []),
      createDatasource,
    };

    // oracle -> its plugin id + default port 1521, same dbAuth shape as the other databases.
    const oracle = await callTool(api, "create_datasource", {
      workspaceId: "ws1",
      name: "Oracle DB",
      plugin: "oracle",
      connection: {
        host: "oracle-host",
        databaseName: "ORCL",
        username: "app",
      },
    });

    expect(oracle).toMatchObject({ needsCredentials: true });
    const oracleCall = createDatasource.mock.calls[0][0] as {
      pluginId: string;
      datasourceStorages: Record<
        string,
        {
          isConfigured: boolean;
          datasourceConfiguration: {
            endpoints: unknown;
            authentication: Record<string, unknown>;
          };
        }
      >;
    };

    expect(oracleCall.pluginId).toBe("p-oracle");
    const oracleConfig =
      oracleCall.datasourceStorages.unused_env.datasourceConfiguration;

    expect(oracleConfig.endpoints).toEqual([
      { host: "oracle-host", port: 1521 },
    ]);
    expect(oracleConfig.authentication).toEqual({
      authenticationType: "dbAuth",
      databaseName: "ORCL",
      username: "app",
    });
    // Databases are created UNCONFIGURED — the password is completed in the UI.
    expect(oracleCall.datasourceStorages.unused_env.isConfigured).toBe(false);

    // redshift -> default port 5439.
    await callTool(api, "create_datasource", {
      workspaceId: "ws1",
      name: "Redshift DB",
      plugin: "redshift",
      connection: { host: "rs-host", databaseName: "dev" },
    });

    const redshiftConfig = (
      createDatasource.mock.calls[1][0] as {
        pluginId: string;
        datasourceStorages: Record<
          string,
          { datasourceConfiguration: { endpoints: unknown } }
        >;
      }
    ).datasourceStorages.unused_env.datasourceConfiguration;

    expect(redshiftConfig.endpoints).toEqual([{ host: "rs-host", port: 5439 }]);
  });

  it("create_datasource rejects credential/injection input at the schema", async () => {
    const createDatasource = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      listPlugins: jest.fn(async () => [
        { id: "p1", packageName: "postgres-plugin" },
      ]),
      listDatasources: jest.fn(async () => []),
      createDatasource,
    };

    // Strict schema: a password (or any unknown key) is rejected outright, never forwarded.
    const withPassword = await callTool(api, "create_datasource", {
      workspaceId: "ws1",
      name: "DB",
      plugin: "postgresql",
      connection: {
        host: "db",
        databaseName: "appdb",
        password: "hunter2",
      },
    });

    expect(JSON.stringify(withPassword)).toMatch(/error|invalid/i);

    const badHost = await callTool(api, "create_datasource", {
      workspaceId: "ws1",
      name: "DB",
      plugin: "postgresql",
      connection: { host: "db/../{{evil}}", databaseName: "appdb" },
    });

    expect(JSON.stringify(badHost)).toMatch(/error|invalid/i);
    expect(createDatasource).not.toHaveBeenCalled();
  });

  it("create_datasource is idempotent by workspace + name", async () => {
    const createDatasource = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      listPlugins: jest.fn(async () => [
        { id: "p1", packageName: "postgres-plugin" },
      ]),
      listDatasources: jest.fn(async () => [
        { id: "ds1", name: "My Postgres", pluginId: "p1", workspaceId: "ws1" },
      ]),
      createDatasource,
    };
    const body = await callTool(api, "create_datasource", {
      workspaceId: "ws1",
      name: "My Postgres",
      plugin: "postgresql",
      connection: { host: "db", databaseName: "appdb" },
    });

    expect(body.created).toBe(false);
    expect(createDatasource).not.toHaveBeenCalled();
  });

  it("create_datasource errors clearly when the plugin is not installed", async () => {
    const createDatasource = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      listPlugins: jest.fn(async () => [
        { id: "p1", packageName: "restapi-plugin" },
      ]),
      listDatasources: jest.fn(async () => []),
      createDatasource,
    };
    const body = await callTool(api, "create_datasource", {
      workspaceId: "ws1",
      name: "DB",
      plugin: "mssql",
      connection: { host: "db", databaseName: "appdb" },
    });

    expect(body.error).toMatch(/not installed/);
    expect(createDatasource).not.toHaveBeenCalled();
  });

  it("create_datasource provisions an UNCONFIGURED Mongo datasource from non-secret fields", async () => {
    const createDatasource = jest.fn<
      Promise<Record<string, unknown>>,
      [Record<string, unknown>]
    >(async () => ({ id: "ds-mongo", name: "Orders", pluginId: "p-mongo" }));
    const api: AppsmithApi = {
      ...createApi()(),
      listPlugins: jest.fn(async () => [
        { id: "p-mongo", packageName: "mongo-plugin" },
      ]),
      listDatasources: jest.fn(async () => []),
      createDatasource,
    };
    const body = await callTool(api, "create_datasource", {
      workspaceId: "ws1",
      name: "Orders",
      plugin: "mongodb",
      connection: { host: "mongo.internal", databaseName: "orders" },
    });

    expect(body.created).toBe(true);
    expect(body.needsCredentials).toBe(true);
    expect(createDatasource).toHaveBeenCalledTimes(1);

    const dto = createDatasource.mock.calls[0][0] as unknown as {
      pluginId: string;
      datasourceStorages: Record<
        string,
        {
          isConfigured: boolean;
          datasourceConfiguration: {
            endpoints: { host: string; port: number }[];
            authentication: Record<string, unknown>;
          };
        }
      >;
    };

    expect(dto.pluginId).toBe("p-mongo");
    const storage = dto.datasourceStorages.unused_env;

    // Created unconfigured (password completed in the UI), Mongo's default port, and NO credential in the DTO.
    expect(storage.isConfigured).toBe(false);
    expect(storage.datasourceConfiguration.endpoints).toEqual([
      { host: "mongo.internal", port: 27017 },
    ]);
    expect(storage.datasourceConfiguration.authentication).toEqual({
      authenticationType: "dbAuth",
      databaseName: "orders",
    });
    expect(JSON.stringify(dto)).not.toMatch(/password/i);
  });

  it("create_datasource rejects a credential field on a Mongo datasource at the schema", async () => {
    const createDatasource = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      listPlugins: jest.fn(async () => [
        { id: "p-mongo", packageName: "mongo-plugin" },
      ]),
      listDatasources: jest.fn(async () => []),
      createDatasource,
    };
    const withPassword = await callTool(api, "create_datasource", {
      workspaceId: "ws1",
      name: "Orders",
      plugin: "mongodb",
      connection: {
        host: "mongo.internal",
        databaseName: "orders",
        password: "hunter2",
      },
    });

    expect(JSON.stringify(withPassword)).toMatch(/error|invalid/i);
    expect(createDatasource).not.toHaveBeenCalled();
  });

  it("create_datasource refuses Google Sheets and hands the user off to the UI OAuth flow", async () => {
    const createDatasource = jest.fn();
    const listPlugins = jest.fn(async () => [
      { id: "p-sheets", packageName: "google-sheets-plugin" },
    ]);
    const api: AppsmithApi = {
      ...createApi()(),
      listPlugins,
      listDatasources: jest.fn(async () => []),
      createDatasource,
    };
    const body = await callTool(api, "create_datasource", {
      workspaceId: "ws1",
      name: "My Sheet",
      plugin: "googlesheets",
    });

    expect(body.code).toBe("needs_ui_oauth");
    expect(String(body.error)).toMatch(/OAuth/i);
    expect(String(body.error)).toMatch(/create_sheets_query/);
    // Rejected before touching any datasource/plugin API — no credential path is even reachable.
    expect(createDatasource).not.toHaveBeenCalled();
    expect(listPlugins).not.toHaveBeenCalled();
  });

  it("create_datasource creates a CONFIGURED, ready-to-use REST datasource from a base URL", async () => {
    const createDatasource = jest.fn<
      Promise<Record<string, unknown>>,
      [Record<string, unknown>]
    >(async () => ({ id: "ds-rest", name: "Zippopotam", pluginId: "p-rest" }));
    const api: AppsmithApi = {
      ...createApi()(),
      listPlugins: jest.fn(async () => [
        { id: "p-rest", packageName: "restapi-plugin" },
      ]),
      listDatasources: jest.fn(async () => []),
      createDatasource,
    };
    const body = await callTool(api, "create_datasource", {
      workspaceId: "ws1",
      name: "Zippopotam",
      plugin: "rest",
      url: "https://api.zippopotam.us",
    });

    expect(body.created).toBe(true);
    // A no-auth REST datasource is complete — no credential hand-off.
    expect(body.needsCredentials).toBe(false);
    expect(createDatasource).toHaveBeenCalledTimes(1);

    const dto = createDatasource.mock.calls[0][0] as unknown as {
      pluginId: string;
      datasourceStorages: Record<
        string,
        {
          isConfigured: boolean;
          datasourceConfiguration: { url?: string; endpoints?: unknown };
        }
      >;
    };

    expect(dto.pluginId).toBe("p-rest");
    const storage = dto.datasourceStorages.unused_env;

    // REST is created configured (usable immediately), carries the base URL, and has no DB endpoints/auth.
    expect(storage.isConfigured).toBe(true);
    expect(storage.datasourceConfiguration.url).toBe(
      "https://api.zippopotam.us",
    );
    expect(storage.datasourceConfiguration.endpoints).toBeUndefined();
    expect(JSON.stringify(dto)).not.toContain("dbAuth");
  });

  it("create_datasource enforces url-vs-connection per plugin family and rejects unsafe URLs", async () => {
    const createDatasource = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      listPlugins: jest.fn(async () => [
        { id: "p-rest", packageName: "restapi-plugin" },
        { id: "p-pg", packageName: "postgres-plugin" },
      ]),
      listDatasources: jest.fn(async () => []),
      createDatasource,
    };

    // REST without a url.
    expect(
      JSON.stringify(
        await callTool(api, "create_datasource", {
          workspaceId: "ws1",
          name: "R",
          plugin: "rest",
        }),
      ),
    ).toMatch(/requires 'url'/);

    // REST with a database-style connection.
    expect(
      JSON.stringify(
        await callTool(api, "create_datasource", {
          workspaceId: "ws1",
          name: "R",
          plugin: "rest",
          url: "https://api.example.com",
          connection: { host: "db", databaseName: "x" },
        }),
      ),
    ).toMatch(/'connection' is only for database/);

    // Database with a url instead of a connection.
    expect(
      JSON.stringify(
        await callTool(api, "create_datasource", {
          workspaceId: "ws1",
          name: "D",
          plugin: "postgresql",
          url: "https://api.example.com",
        }),
      ),
    ).toMatch(/'url' is only for REST/);

    // Unsafe URLs rejected at the schema (non-http scheme, whitespace, template syntax).
    for (const url of [
      "ftp://api.example.com",
      "https://api.example.com/{{evil}}",
      "https://api example.com",
      "javascript:alert(1)",
    ]) {
      expect(
        JSON.stringify(
          await callTool(api, "create_datasource", {
            workspaceId: "ws1",
            name: "R",
            plugin: "rest",
            url,
          }),
        ),
      ).toMatch(/error|invalid|url must be/i);
    }

    expect(createDatasource).not.toHaveBeenCalled();
  });

  it("list_datasources projects to non-secret fields only, even if upstream leaks", async () => {
    // Simulate a (hypothetical) upstream response that carries credential material — the tool must strip it.
    const listDatasources = jest.fn(async () => [
      {
        id: "ds1",
        name: "Prod DB",
        pluginId: "postgres",
        workspaceId: "ws1",
        datasourceStorages: {
          default: {
            datasourceConfiguration: {
              authentication: { password: "hunter2", token: "secret-oauth" },
            },
          },
        },
      },
    ]);
    const api: AppsmithApi = { ...createApi()(), listDatasources };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      dataEnabled: true,
    });
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
    const call = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({
        jsonrpc: "2.0",
        id: 8,
        method: "tools/call",
        params: { name: "list_datasources", arguments: { workspaceId: "ws1" } },
      });
    const text = parseJsonRpc(call).result.content[0].text;

    expect(text).toContain("Prod DB");
    expect(text).not.toContain("hunter2");
    expect(text).not.toContain("secret-oauth");
    expect(text).not.toContain("password");
    expect(text).not.toContain("datasourceStorages");
  });
});

describe("governance-wrapped layout mutations", () => {
  class MemoryGovernanceStore implements McpGovernanceStore {
    readonly changes: McpChangeRecord[] = [];
    readonly confirmations = new Map<string, PreparedConfirmation>();
    locked = new Set<string>();

    async acquireLock(entityKey: string): Promise<string | undefined> {
      if (this.locked.has(entityKey)) return undefined;

      this.locked.add(entityKey);

      return `lock:${entityKey}`;
    }
    async releaseLock(entityKey: string): Promise<void> {
      this.locked.delete(entityKey);
    }
    async createConfirmation(c: PreparedConfirmation): Promise<void> {
      this.confirmations.set(c.id, c);
    }
    async consumeConfirmation(
      id: string,
    ): Promise<PreparedConfirmation | undefined> {
      const c = this.confirmations.get(id);

      this.confirmations.delete(id);

      return c;
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
        (c) =>
          c.id === id &&
          c.actorId === actorId &&
          c.organizationId === organizationId,
      );
    }
    async listChanges(
      actorId: string,
      organizationId: string,
      limit: number,
    ): Promise<McpChangeRecord[]> {
      return this.changes
        .filter(
          (c) => c.actorId === actorId && c.organizationId === organizationId,
        )
        .slice(-limit)
        .reverse();
    }
    async getAnyChange(
      id: string,
      organizationId: string,
    ): Promise<McpChangeRecord | undefined> {
      return this.changes.find(
        (c) => c.id === id && c.organizationId === organizationId,
      );
    }
    async listAllChanges(
      organizationId: string,
      limit: number,
    ): Promise<McpChangeRecord[]> {
      return this.changes
        .filter((c) => c.organizationId === organizationId)
        .slice(-limit)
        .reverse();
    }
  }

  const ROOT_DSL = {
    widgetId: "0",
    widgetName: "MainContainer",
    type: "CANVAS_WIDGET",
    topRow: 0,
    bottomRow: 380,
    leftColumn: 0,
    rightColumn: 640,
    children: [],
  };

  async function initSession(server: ReturnType<typeof createMcpHttpServer>) {
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

  function makeServer(store: McpGovernanceStore) {
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: ROOT_DSL },
      })),
      updateLayout: jest.fn(async () => ({ ok: true })),
    };

    return createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(store, {
        now: () => new Date("2026-07-12T00:00:00.000Z"),
      }),
    });
  }

  async function editPage(
    server: ReturnType<typeof createMcpHttpServer>,
    args: Record<string, unknown>,
  ) {
    const sessionId = await initSession(server);
    const call = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({
        jsonrpc: "2.0",
        id: 12,
        method: "tools/call",
        params: { name: "edit_page", arguments: args },
      });

    return JSON.parse(parseJsonRpc(call).result.content[0].text);
  }

  const baseArgs = {
    applicationId: "app1",
    pageId: "p1",
    layoutId: "l1",
    edit: { add: [{ type: "button", text: "Go" }] },
  };

  it("requires a revision when governance is enabled", async () => {
    const store = new MemoryGovernanceStore();
    const body = await editPage(makeServer(store), baseArgs);

    expect(body.code).toBe("revision_required");
    expect(store.changes).toHaveLength(0);
  });

  it("commits a governed edit, returns a changeId, and records an audit change", async () => {
    const store = new MemoryGovernanceStore();
    const revision = fingerprintDsl(ROOT_DSL as never);
    const body = await editPage(makeServer(store), { ...baseArgs, revision });

    expect(typeof body.changeId).toBe("string");
    expect(body.revision).toMatch(/^[a-f0-9]{64}$/);
    expect(store.changes).toHaveLength(1);
    expect(store.changes[0].operation).toBe("edit_page");
    expect(store.changes[0].actorId).toBe("user@appsmith.com");
    // Rollback snapshot captures the prior DSL.
    expect(store.changes[0].rollback).toHaveProperty("dsl");
  });

  it("rejects a stale revision with a revision_conflict code", async () => {
    const store = new MemoryGovernanceStore();
    const body = await editPage(makeServer(store), {
      ...baseArgs,
      revision: "0".repeat(64),
    });

    expect(body.code).toBe("revision_conflict");
    expect(store.changes).toHaveLength(0);
  });

  const THEME = {
    config: { colorMode: "LIGHT" },
    stylesheet: { BUTTON_WIDGET: {} },
    properties: {
      colors: { primaryColor: "#553DE9" },
      borderRadius: { appBorderRadius: "0.375rem" },
      fontFamily: { appFont: "Nunito Sans" },
    },
  };

  async function callTool(
    server: ReturnType<typeof createMcpHttpServer>,
    name: string,
    args: Record<string, unknown>,
  ) {
    const sessionId = await initSession(server);
    const call = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({
        jsonrpc: "2.0",
        id: 13,
        method: "tools/call",
        params: { name, arguments: args },
      });
    const text = parseJsonRpc(call).result.content[0].text;

    return { body: JSON.parse(text), text };
  }

  const RAW_WORKSPACES = [
    { id: "ws1", name: "Marketing", email: "x@y.com", plan: "free" },
    { id: "ws2", name: "Marketing Ops", userPermissions: ["read"] },
    { id: "ws3", name: "Engineering" },
  ];

  it("list_workspaces returns only { id, name } pairs (no other org metadata)", async () => {
    const server = createMcpHttpServer(API_BASE_URL, () => ({
      ...createApi()(),
      listWorkspaces: jest.fn(async () => RAW_WORKSPACES),
    }));
    const { body, text } = await callTool(server, "list_workspaces", {});

    expect(body.workspaces).toEqual([
      { id: "ws1", name: "Marketing" },
      { id: "ws2", name: "Marketing Ops" },
      { id: "ws3", name: "Engineering" },
    ]);
    // Other workspace fields are not surfaced.
    expect(text).not.toContain("plan");
    expect(text).not.toContain("userPermissions");
  });

  it("resolve_workspace matches by exact name, else partial, else empty", async () => {
    const server = createMcpHttpServer(API_BASE_URL, () => ({
      ...createApi()(),
      listWorkspaces: jest.fn(async () => RAW_WORKSPACES),
    }));

    // Exact (case-insensitive) match wins even though a partial one also exists.
    const exact = await callTool(server, "resolve_workspace", {
      name: "marketing",
    });

    expect(exact.body.matches).toEqual([{ id: "ws1", name: "Marketing" }]);

    // No exact match -> partial (substring) matches.
    const partial = await callTool(server, "resolve_workspace", {
      name: "market",
    });

    expect(partial.body.matches).toEqual([
      { id: "ws1", name: "Marketing" },
      { id: "ws2", name: "Marketing Ops" },
    ]);

    // No match -> empty list (the agent should show candidates, not guess).
    const none = await callTool(server, "resolve_workspace", { name: "Sales" });

    expect(none.body.matches).toEqual([]);
  });

  it("resolve_workspace returns all candidates when several share an exact name", async () => {
    const dupServer = createMcpHttpServer(API_BASE_URL, () => ({
      ...createApi()(),
      listWorkspaces: jest.fn(async () => [
        { id: "a", name: "Support" },
        { id: "b", name: "support" },
        { id: "c", name: "Sales" },
      ]),
    }));

    const dup = await callTool(dupServer, "resolve_workspace", {
      name: "Support",
    });

    expect(dup.body.matches).toEqual([
      { id: "a", name: "Support" },
      { id: "b", name: "support" },
    ]);
  });

  it("workspace tools degrade to empty when the API returns a non-array", async () => {
    const badServer = createMcpHttpServer(API_BASE_URL, () => ({
      ...createApi()(),
      listWorkspaces: jest.fn(async () => ({ unexpected: "shape" })),
    }));

    const list = await callTool(badServer, "list_workspaces", {});

    expect(list.body.workspaces).toEqual([]);

    const resolved = await callTool(badServer, "resolve_workspace", {
      name: "anything",
    });

    expect(resolved.body.matches).toEqual([]);
  });

  it("read_theme returns only safe tokens and a revision (no stylesheet/config)", async () => {
    const api: AppsmithApi = {
      ...createApi()(),
      getCurrentTheme: jest.fn(async () => THEME),
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const { body, text } = await callTool(server, "read_theme", {
      applicationId: "app1",
    });

    expect(body.theme.primaryColor).toBe("#553DE9");
    expect(body.theme.fontFamily).toBe("Nunito Sans");
    expect(body.theme.revision).toMatch(/^[a-f0-9]{64}$/);
    expect(text).not.toContain("stylesheet");
    expect(text).not.toContain("colorMode");
  });

  it("update_theme commits a governed token change and records an audit", async () => {
    const store = new MemoryGovernanceStore();
    const updateTheme = jest.fn<
      Promise<unknown>,
      [string, Record<string, unknown>]
    >(async () => ({
      ...THEME,
      properties: {
        ...THEME.properties,
        colors: { primaryColor: "#0A66C2" },
      },
    }));
    const api: AppsmithApi = {
      ...createApi()(),
      getCurrentTheme: jest.fn(async () => THEME),
      updateTheme,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(store),
    });
    // Discover the current revision first (as an agent would via read_theme).
    const read = await callTool(server, "read_theme", {
      applicationId: "app1",
    });
    const update = await callTool(server, "update_theme", {
      applicationId: "app1",
      revision: read.body.theme.revision,
      patch: { primaryColor: "#0A66C2" },
    });

    expect(updateTheme).toHaveBeenCalledTimes(1);
    expect(update.body.theme.primaryColor).toBe("#0A66C2");
    expect(typeof update.body.changeId).toBe("string");
    expect(store.changes).toHaveLength(1);
    expect(store.changes[0].operation).toBe("update_theme");
    // The safe update payload must never smuggle stylesheet edits from the agent.
    const sentBody = updateTheme.mock.calls[0][1];

    expect(sentBody).toHaveProperty("properties");
  });

  it("update_theme is unavailable when governance is not configured", async () => {
    const api: AppsmithApi = {
      ...createApi()(),
      getCurrentTheme: jest.fn(async () => THEME),
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const sessionId = await initSession(server);
    const listed = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({ jsonrpc: "2.0", id: 14, method: "tools/list" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const names = (parseJsonRpc(listed).result as any).tools.map(
      (t: { name: string }) => t.name,
    );

    expect(names).toContain("read_theme");
    expect(names).not.toContain("update_theme");
  });

  const APP_ID = "a".repeat(24);
  const PAGE_ID = "b".repeat(24);
  const PAGES = { pages: [{ id: PAGE_ID, name: "Extra", slug: "extra" }] };

  function pageServer(store: McpGovernanceStore, deletePage = jest.fn()) {
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationPages: jest.fn(async () => PAGES),
      deletePage,
    };

    return createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(store),
    });
  }

  it("prepare_delete_page then confirm_delete_page deletes with a bound one-time token", async () => {
    const store = new MemoryGovernanceStore();
    const deletePage = jest.fn(async () => ({ ok: true }));
    const server = pageServer(store, deletePage);

    const read = await callTool(server, "read_pages", {
      applicationId: APP_ID,
    });
    const revision = read.body.revision;

    const prepared = await callTool(server, "prepare_delete_page", {
      spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
    });

    expect(typeof prepared.body.confirmationId).toBe("string");

    const confirmed = await callTool(server, "confirm_delete_page", {
      spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
      confirmationId: prepared.body.confirmationId,
    });

    expect(confirmed.body.deleted).toBe(true);
    expect(deletePage).toHaveBeenCalledWith(PAGE_ID);
    expect(typeof confirmed.body.changeId).toBe("string");
    expect(store.changes.some((c) => c.operation === "delete_page")).toBe(true);

    // Replay: the one-time token cannot be used again.
    const replay = await callTool(server, "confirm_delete_page", {
      spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
      confirmationId: prepared.body.confirmationId,
    });

    expect(replay.body.code).toBe("confirmation_invalid");
    expect(deletePage).toHaveBeenCalledTimes(1);
  });

  it("confirm_delete_page rejects a token that was never prepared (and replay)", async () => {
    const store = new MemoryGovernanceStore();
    const deletePage = jest.fn();
    const server = pageServer(store, deletePage);
    const read = await callTool(server, "read_pages", {
      applicationId: APP_ID,
    });

    const confirmed = await callTool(server, "confirm_delete_page", {
      spec: {
        applicationId: APP_ID,
        pageId: PAGE_ID,
        revision: read.body.revision,
      },
      confirmationId: "unprepared-token",
    });

    expect(confirmed.body.code).toBe("confirmation_invalid");
    expect(deletePage).not.toHaveBeenCalled();
  });

  it("page CRUD tools are unavailable without governance", async () => {
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationPages: jest.fn(async () => PAGES),
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const sessionId = await initSession(server);
    const listed = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({ jsonrpc: "2.0", id: 15, method: "tools/list" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const names = (parseJsonRpc(listed).result as any).tools.map(
      (t: { name: string }) => t.name,
    );

    expect(names).toContain("read_pages");

    for (const tool of [
      "create_page",
      "rename_page",
      "prepare_delete_page",
      "confirm_delete_page",
    ]) {
      expect(names).not.toContain(tool);
    }
  });

  it("F3: read_pages includes each page's layoutId (per-page GET /pages/{pageId}, N+1)", async () => {
    const getPage = jest.fn(async (pageId: string) => ({
      id: pageId,
      layouts: [{ id: `layout-${pageId}` }],
    }));
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationPages: jest.fn(async () => PAGES),
      getPage: getPage as never,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const read = await callTool(server, "read_pages", {
      applicationId: APP_ID,
    });

    // One page fetch per listed page (the N+1 the pages-LIST DTO forces), and the layoutId is surfaced per page.
    expect(getPage).toHaveBeenCalledWith(PAGE_ID);
    expect(read.body.pages).toEqual([
      {
        id: PAGE_ID,
        name: "Extra",
        slug: "extra",
        layoutId: `layout-${PAGE_ID}`,
      },
    ]);
  });

  it("F3: read_pages omits layoutId (never fails) when a page fetch throws", async () => {
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationPages: jest.fn(async () => PAGES),
      getPage: jest.fn(async () => {
        throw new Error("network");
      }) as never,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const read = await callTool(server, "read_pages", {
      applicationId: APP_ID,
    });

    expect(read.body.pages).toEqual([
      { id: PAGE_ID, name: "Extra", slug: "extra" },
    ]);
  });

  it("F3: read_pages fans out one bounded getPage per page and does not cross-contaminate layoutIds", async () => {
    // Multi-page fixture (the single-page N+1 test above can't prove per-page mapping): each page must receive its
    // OWN layoutId, one getPage call per page, even when more pages exist than the bounded-concurrency pool size.
    const pageCount = READ_PAGES_LAYOUT_CONCURRENCY + 3;
    const manyPages = {
      pages: Array.from({ length: pageCount }, (_unused, index) => ({
        id: `page-${index}`,
        name: `Page ${index}`,
        slug: `page-${index}`,
      })),
    };
    let inFlight = 0;
    let peakInFlight = 0;
    const getPage = jest.fn(async (pageId: string) => {
      inFlight += 1;
      peakInFlight = Math.max(peakInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;

      return { id: pageId, layouts: [{ id: `layout-for-${pageId}` }] };
    });
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationPages: jest.fn(async () => manyPages),
      getPage: getPage as never,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const read = await callTool(server, "read_pages", {
      applicationId: APP_ID,
    });

    expect(getPage).toHaveBeenCalledTimes(pageCount);
    // Each page carries its own layoutId (no cross-contamination across the fan-out).
    expect(read.body.pages).toEqual(
      manyPages.pages.map((page) => ({
        ...page,
        layoutId: `layout-for-${page.id}`,
      })),
    );
    // The fan-out is bounded — never more than the pool size in flight at once, despite more pages than the pool.
    expect(peakInFlight).toBeGreaterThan(0);
    expect(peakInFlight).toBeLessThanOrEqual(READ_PAGES_LAYOUT_CONCURRENCY);
  });

  const STORED_ACTION = {
    id: "act1",
    name: "OldName",
    pageId: "p1",
    pluginType: "DB",
    updatedAt: "2026-07-12T00:00:00.000Z",
    datasource: { id: "ds1", pluginId: "postgres" },
  };

  it("get_action returns safe metadata + revision, and update_action commits a governed rename", async () => {
    const store = new MemoryGovernanceStore();
    const updateAction = jest.fn<
      Promise<unknown>,
      [string, Record<string, unknown>]
    >(async () => ({ ...STORED_ACTION, name: "NewName" }));
    const api: AppsmithApi = {
      ...createApi()(),
      getAction: jest.fn(async () => STORED_ACTION),
      updateAction,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      dataEnabled: true,
      governance: new McpGovernanceCoordinator(store),
    });

    const read = await callTool(server, "get_action", {
      applicationId: "app1",
      actionId: "act1",
    });

    expect(read.body.action.name).toBe("OldName");
    expect(read.text).not.toContain("actionConfiguration");
    expect(read.body.revision).toMatch(/^[a-f0-9]{64}$/);

    const updated = await callTool(server, "update_action", {
      spec: {
        kind: "SQL",
        actionId: "act1",
        applicationId: "app1",
        revision: read.body.revision,
        name: "NewName",
      },
    });

    expect(updated.body.updated).toBe(true);
    expect(updateAction).toHaveBeenCalledTimes(1);
    // The DTO sent to the server carries only id + safe fields, never a raw body from the caller.
    expect(updateAction.mock.calls[0][1]).toEqual({
      id: "act1",
      name: "NewName",
    });
    expect(typeof updated.body.changeId).toBe("string");
    expect(store.changes.some((c) => c.operation === "update_action")).toBe(
      true,
    );
  });

  it("records an audit change and rolls a layout edit back to its prior snapshot", async () => {
    const store = new MemoryGovernanceStore();
    let current: Record<string, unknown> = ROOT_DSL;
    const updateLayout = jest.fn<
      Promise<{ ok: boolean }>,
      [string, string, string, Record<string, unknown>]
    >(async (_app, _page, _layout, dsl) => {
      current = dsl;

      return { ok: true };
    });
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: current },
      })),
      updateLayout: updateLayout as never,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(store),
    });

    const before = fingerprintDsl(ROOT_DSL as never);
    const edited = await callTool(server, "edit_page", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: before,
      edit: { add: [{ type: "button", text: "Go" }] },
    });

    expect(edited.body.changeId).toBeDefined();
    expect(current).not.toBe(ROOT_DSL); // an edit was applied

    const list = await callTool(server, "list_changes", {});
    const change = list.body.changes.find(
      (c: { operation: string }) => c.operation === "edit_page",
    );

    expect(change.rollbackAvailable).toBe(true);
    // History never leaks the snapshot DSL.
    expect(list.text).not.toContain("MainContainer");

    const prepared = await callTool(server, "prepare_rollback", {
      changeId: change.id,
    });
    const rolled = await callTool(server, "confirm_rollback", {
      changeId: change.id,
      confirmationId: prepared.body.confirmationId,
    });

    expect(rolled.body.rolledBack).toBe(true);
    expect(rolled.body.revision).toBe(before); // restored to the original snapshot
  });

  it("list_all_changes: an admin sees cross-actor records; a non-admin is refused (M2-T2)", async () => {
    const store = new MemoryGovernanceStore();
    const mk = (
      id: string,
      actorId: string,
      organizationId: string,
      ms: number,
    ): McpChangeRecord => ({
      id,
      actorId,
      organizationId,
      entityKey: "e",
      operation: "op",
      revisionBefore: "",
      revisionAfter: "",
      createdAt: new Date(ms),
      rollback: {},
      summary: {},
    });

    // Two records in org "acme" and one in a DIFFERENT tenant "globex" — the acme admin must never see globex.
    await store.saveChange(mk("c1", "alice@appsmith.com", "acme", 1000));
    await store.saveChange(mk("c2", "bob@appsmith.com", "acme", 2000));
    await store.saveChange(mk("c3", "carol@globex.com", "globex", 3000));

    // Non-admin (default validateToken reports no isSuperUser) -> refused, no records leaked.
    const nonAdmin = createMcpHttpServer(API_BASE_URL, createApi(), {
      governance: new McpGovernanceCoordinator(store),
    });
    const denied = await callTool(nonAdmin, "list_all_changes", {});

    expect(denied.body.code).toBe("admin_required");
    expect(denied.body.changes).toBeUndefined();

    // Admin of org "acme" (isSuperUser is a PER-ORG signal in EE) -> sees acme's cross-actor records ONLY.
    const adminServer = createMcpHttpServer(
      API_BASE_URL,
      createApi(
        jest.fn(async () => ({
          username: "admin@appsmith.com",
          isAnonymous: false,
          isSuperUser: true,
          organizationId: "acme",
        })),
      ),
      { governance: new McpGovernanceCoordinator(store) },
    );
    const all = await callTool(adminServer, "list_all_changes", {});

    expect(all.body.changes.map((c: { id: string }) => c.id).sort()).toEqual([
      "c1",
      "c2",
    ]);
    // Cross-tenant isolation: globex's record is NEVER returned to the acme admin (the reported vulnerability).
    expect(all.body.changes.some((c: { id: string }) => c.id === "c3")).toBe(
      false,
    );
    // Cross-actor audit MUST attribute each record to its actor.
    const byId = Object.fromEntries(
      all.body.changes.map((c: { id: string; actorId: string }) => [
        c.id,
        c.actorId,
      ]),
    );

    expect(byId.c1).toBe("alice@appsmith.com");
    expect(byId.c2).toBe("bob@appsmith.com");
    // The rollback SNAPSHOT object is never exposed even to an admin (only the rollbackAvailable boolean is).
    expect(all.body.changes[0].rollback).toBeUndefined();

    // get_any_change: acme admin can fetch an acme record but NOT globex's, even knowing its id.
    const anyChange = await callTool(adminServer, "get_any_change", {
      changeId: "c2",
    });

    expect(anyChange.body.change.actorId).toBe("bob@appsmith.com");

    const crossTenant = await callTool(adminServer, "get_any_change", {
      changeId: "c3",
    });

    expect(crossTenant.body.change).toBeUndefined();
    expect(crossTenant.body.error).toBe("change not found");

    const deniedGet = await callTool(nonAdmin, "get_any_change", {
      changeId: "c2",
    });

    expect(deniedGet.body.code).toBe("admin_required");

    // The admin's own actor-scoped list_changes still sees only its own records (none here).
    const own = await callTool(adminServer, "list_changes", {});

    expect(own.body.changes).toEqual([]);
  });

  it("list_all_changes / get_any_change fail closed when the caller's organization is unknown (M2-T2 tenant isolation)", async () => {
    const store = new MemoryGovernanceStore();

    await store.saveChange({
      id: "c1",
      actorId: "alice@appsmith.com",
      organizationId: "acme",
      entityKey: "e",
      operation: "op",
      revisionBefore: "",
      revisionAfter: "",
      createdAt: new Date(1000),
      rollback: {},
      summary: {},
    });

    // Admin WITHOUT an organization on the profile (e.g. an older server that does not report it). The audit read
    // cannot be tenant-scoped, so it must refuse rather than run an unscoped cross-tenant query.
    const adminNoOrg = createMcpHttpServer(
      API_BASE_URL,
      createApi(
        jest.fn(async () => ({
          username: "admin@appsmith.com",
          isAnonymous: false,
          isSuperUser: true,
        })),
      ),
      { governance: new McpGovernanceCoordinator(store) },
    );

    const listed = await callTool(adminNoOrg, "list_all_changes", {});

    expect(listed.body.code).toBe("organization_scope_unavailable");
    expect(listed.body.changes).toBeUndefined();

    const fetched = await callTool(adminNoOrg, "get_any_change", {
      changeId: "c1",
    });

    expect(fetched.body.code).toBe("organization_scope_unavailable");
    expect(fetched.body.change).toBeUndefined();

    // The ACTOR-scoped reads fail closed too: without an org they cannot be tenant-bounded, so two tenants could
    // otherwise alias on the empty-org sentinel (colliding email is only per-org unique).
    const noOrg = createMcpHttpServer(
      API_BASE_URL,
      createApi(
        jest.fn(async () => ({
          username: "alice@appsmith.com",
          isAnonymous: false,
        })),
      ),
      { governance: new McpGovernanceCoordinator(store) },
    );

    const ownList = await callTool(noOrg, "list_changes", {});

    expect(ownList.body.code).toBe("organization_scope_unavailable");
    expect(ownList.body.changes).toBeUndefined();

    const ownGet = await callTool(noOrg, "get_change", { changeId: "c1" });

    expect(ownGet.body.code).toBe("organization_scope_unavailable");
  });

  it("get_capabilities advertises EXACTLY the registered tools (no drift), under all gates", async () => {
    for (const gate of [
      { dataEnabled: false, governed: false, js: false },
      { dataEnabled: true, governed: false, js: false },
      { dataEnabled: true, governed: true, js: false },
      { dataEnabled: true, governed: true, js: true },
      { dataEnabled: false, governed: true, js: true },
    ]) {
      const server = createMcpHttpServer(API_BASE_URL, () => createApi()(), {
        dataEnabled: gate.dataEnabled,
        jsEnabled: gate.js,
        governance: gate.governed
          ? new McpGovernanceCoordinator(new MemoryGovernanceStore())
          : undefined,
      });
      const sessionId = await initSession(server);
      const listed = await supertest(server)
        .post("/mcp")
        .set("Accept", "application/json, text/event-stream")
        .set("Authorization", "Bearer mcp_user-token")
        .set("mcp-session-id", sessionId)
        .send({ jsonrpc: "2.0", id: 20, method: "tools/list" });
      const registered = new Set<string>(
        parseJsonRpc(listed).result.tools.map((t) => t.name),
      );

      const caps = await callTool(server, "get_capabilities", {});
      const advertised = new Set<string>(
        (caps.body.tools as string[]).map((line) => line.split(" — ")[0]),
      );

      expect([...advertised].sort()).toEqual([...registered].sort());
    }
  });

  it("get_capabilities carries the build identity (version), matching /health", async () => {
    const server = createMcpHttpServer(API_BASE_URL, () => createApi()());
    const caps = await callTool(server, "get_capabilities", {});
    const build = caps.body.build as { version: string; buildTime?: string };

    expect(build.version).toBe(MCP_BUILD_INFO.version);

    const health = await supertest(server).get("/health");

    // Both surfaces answer "which build is this instance running" identically.
    expect(health.body.version).toBe(build.version);
  });

  it("documents the patch vocabulary (tableData vs source) and exposes real schemas for patch/wire tools", async () => {
    const server = createMcpHttpServer(API_BASE_URL, () => createApi()());
    const caps = await callTool(server, "get_capabilities", {});
    const patchSpec = caps.body.patchSpec as {
      updateProps: Record<string, string>;
    };

    // The one naming trap that broke real agents: a table's data binding is `tableData` on the patch path,
    // while `source` there means a selected-row ref. Both must be documented, distinctly.
    expect(patchSpec.updateProps.tableData).toContain("query");
    expect(patchSpec.updateProps.source).toContain("selected-row");

    // The machine-readable inputSchema must expose real structure, not an opaque record.
    const sessionId = await initSession(server);
    const listed = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({ jsonrpc: "2.0", id: 21, method: "tools/list" });
    const tools = parseJsonRpc(listed).result.tools as unknown as {
      name: string;
      inputSchema: {
        properties?: Record<string, { properties?: Record<string, unknown> }>;
      };
    }[];
    const patchTool = tools.find((tool) => tool.name === "patch_widgets");
    const wireTool = tools.find((tool) => tool.name === "wire_event");

    expect(
      patchTool?.inputSchema.properties?.patch?.properties?.operations,
    ).toBeDefined();
    expect(
      wireTool?.inputSchema.properties?.spec?.properties?.event,
    ).toBeDefined();
  });

  it("get_capabilities advertises disabled capability groups with how to enable them", async () => {
    // Data + JS off: the agent must still SEE those capabilities and the setting that unlocks them.
    const offServer = createMcpHttpServer(API_BASE_URL, () => createApi()(), {
      dataEnabled: false,
      jsEnabled: false,
    });
    const off = await callTool(offServer, "get_capabilities", {});
    const groups = off.body.disabledCapabilities.groups as {
      requires: string;
      provides: string;
      tools: string[];
    }[];

    // Every enablement instruction is phrased for a human (not a bare env var) and names the real setting.
    expect(
      groups.every((group) =>
        group.requires.startsWith("ask your Appsmith administrator"),
      ),
    ).toBe(true);
    expect(
      groups.some((group) =>
        group.requires.includes("APPSMITH_MCP_DATA_ENABLED"),
      ),
    ).toBe(true);
    expect(
      groups.some((group) =>
        group.requires.includes("APPSMITH_MCP_JS_ENABLED"),
      ),
    ).toBe(true);

    // The data group names the real tools it would add.
    const dataGroup = groups.find((group) =>
      group.tools.includes("create_query"),
    );

    expect(dataGroup?.requires).toContain("APPSMITH_MCP_DATA_ENABLED");

    // Everything on -> nothing disabled.
    const onServer = createMcpHttpServer(API_BASE_URL, () => createApi()(), {
      dataEnabled: true,
      jsEnabled: true,
      governance: new McpGovernanceCoordinator(new MemoryGovernanceStore()),
    });
    const on = await callTool(onServer, "get_capabilities", {});

    expect(on.body.disabledCapabilities.groups).toEqual([]);
  });

  it("returns server instructions in the initialize response (visible to every client)", async () => {
    const server = createMcpHttpServer(API_BASE_URL, createApi());
    const initialized = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .send(initializeRequest);
    const { instructions } = parseJsonRpc(initialized).result as {
      instructions?: string;
    };

    expect(typeof instructions).toBe("string");
    // The instructions steer the agent to discover capabilities and resolve workspaces by name.
    expect(instructions).toContain("get_capabilities");
    expect(instructions).toContain("resolve_workspace");
  });

  it("wire_event binds a widget event via the closed vocabulary and is governed", async () => {
    const store = new MemoryGovernanceStore();
    const DSL = {
      ...ROOT_DSL,
      children: [
        {
          widgetId: "b",
          widgetName: "SaveBtn",
          type: "BUTTON_WIDGET",
          topRow: 0,
          bottomRow: 4,
          leftColumn: 0,
          rightColumn: 16,
        },
        {
          widgetId: "m",
          widgetName: "EditModal",
          type: "MODAL_WIDGET",
          topRow: 5,
          bottomRow: 20,
          leftColumn: 0,
          rightColumn: 32,
        },
      ],
    };
    let current: Record<string, unknown> = DSL;
    const updateLayout = jest.fn<
      Promise<{ ok: boolean }>,
      [string, string, string, Record<string, unknown>]
    >(async (_app, _page, _layout, dsl) => {
      current = dsl;

      return { ok: true };
    });
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: current },
      })),
      updateLayout: updateLayout as never,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(store),
    });

    const wired = await callTool(server, "wire_event", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(DSL as never),
      spec: {
        widget: "SaveBtn",
        event: "onClick",
        action: { showModal: "EditModal" },
      },
    });

    expect(wired.body.changeId).toBeDefined();
    const written = updateLayout.mock.calls[0][3] as {
      children: { widgetName: string; onClick?: string }[];
    };
    const button = written.children.find((w) => w.widgetName === "SaveBtn");

    expect(button?.onClick).toBe("{{ showModal('EditModal') }}");
  });

  it("wire_event wires a select's onOptionChange end-to-end (new event vocabulary)", async () => {
    const store = new MemoryGovernanceStore();
    const DSL = {
      ...ROOT_DSL,
      children: [
        {
          widgetId: "s",
          widgetName: "Region",
          type: "SELECT_WIDGET",
          topRow: 0,
          bottomRow: 7,
          leftColumn: 0,
          rightColumn: 24,
        },
      ],
    };
    let current: Record<string, unknown> = DSL;
    const updateLayout = jest.fn<
      Promise<{ ok: boolean }>,
      [string, string, string, Record<string, unknown>]
    >(async (_app, _page, _layout, dsl) => {
      current = dsl;

      return { ok: true };
    });
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: current },
      })),
      updateLayout: updateLayout as never,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(store),
    });

    const wired = await callTool(server, "wire_event", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(DSL as never),
      spec: {
        widget: "Region",
        event: "onOptionChange",
        action: { run: "getCities" },
      },
    });

    expect(wired.body.changeId).toBeDefined();
    const written = updateLayout.mock.calls[0][3] as {
      children: {
        widgetName: string;
        onOptionChange?: string;
        dynamicTriggerPathList?: { key: string }[];
      }[];
    };
    const select = written.children.find((w) => w.widgetName === "Region");

    expect(select?.onOptionChange).toBe("{{ getCities.run() }}");
    expect(select?.dynamicTriggerPathList).toEqual([{ key: "onOptionChange" }]);
  });

  it("wire_event rejects an action targeting a missing modal", async () => {
    const store = new MemoryGovernanceStore();
    const DSL = {
      ...ROOT_DSL,
      children: [
        {
          widgetId: "b",
          widgetName: "SaveBtn",
          type: "BUTTON_WIDGET",
          topRow: 0,
          bottomRow: 4,
          leftColumn: 0,
          rightColumn: 16,
        },
      ],
    };
    const updateLayout = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: DSL },
      })),
      updateLayout: updateLayout as never,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(store),
    });

    const wired = await callTool(server, "wire_event", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(DSL as never),
      spec: {
        widget: "SaveBtn",
        event: "onClick",
        action: { showModal: "Ghost" },
      },
    });

    expect(wired.body.error).toMatch(/was not found/);
    expect(updateLayout).not.toHaveBeenCalled();
  });

  it("wire_event writes a primary showAlert action (no entity references to validate)", async () => {
    const store = new MemoryGovernanceStore();
    const DSL = {
      ...ROOT_DSL,
      children: [
        {
          widgetId: "b",
          widgetName: "InfoBtn",
          type: "BUTTON_WIDGET",
          topRow: 0,
          bottomRow: 4,
          leftColumn: 0,
          rightColumn: 16,
        },
      ],
    };
    let current: Record<string, unknown> = DSL;
    const updateLayout = jest.fn<
      Promise<{ ok: boolean }>,
      [string, string, string, Record<string, unknown>]
    >(async (_app, _page, _layout, dsl) => {
      current = dsl;

      return { ok: true };
    });
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: current },
      })),
      // No queries exist anywhere — a showAlert action needs no entity to resolve against.
      listActions: jest.fn(async () => []),
      updateLayout: updateLayout as never,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      dataEnabled: true,
      governance: new McpGovernanceCoordinator(store),
    });

    const wired = await callTool(server, "wire_event", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(DSL as never),
      spec: {
        widget: "InfoBtn",
        event: "onClick",
        action: { showAlert: "Heads up", style: "warning" },
      },
    });

    expect(wired.body.changeId).toBeDefined();
    const written = updateLayout.mock.calls[0][3] as {
      children: { widgetName: string; onClick?: string }[];
    };

    expect(written.children[0].onClick).toBe(
      "{{ showAlert('Heads up', 'warning') }}",
    );
  });

  it("wire_event validates and compiles a chained onSuccess follow-up (refresh + close + alert)", async () => {
    const store = new MemoryGovernanceStore();
    const DSL = {
      ...ROOT_DSL,
      children: [
        {
          widgetId: "b",
          widgetName: "SaveBtn",
          type: "BUTTON_WIDGET",
          topRow: 0,
          bottomRow: 4,
          leftColumn: 0,
          rightColumn: 16,
        },
        {
          widgetId: "m",
          widgetName: "AddUserModal",
          type: "MODAL_WIDGET",
          topRow: 5,
          bottomRow: 20,
          leftColumn: 0,
          rightColumn: 32,
        },
      ],
    };
    let current: Record<string, unknown> = DSL;
    const updateLayout = jest.fn<
      Promise<{ ok: boolean }>,
      [string, string, string, Record<string, unknown>]
    >(async (_app, _page, _layout, dsl) => {
      current = dsl;

      return { ok: true };
    });
    const listActions = jest.fn(async () => [
      { name: "insertUser", pageId: "p1" },
      { name: "getUsers", pageId: "p1" },
    ]);
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: current },
      })),
      listActions,
      updateLayout: updateLayout as never,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      dataEnabled: true,
      governance: new McpGovernanceCoordinator(store),
    });

    // A follow-up referencing an unknown query is rejected before any write.
    const dangling = await callTool(server, "wire_event", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(DSL as never),
      spec: {
        widget: "SaveBtn",
        event: "onClick",
        action: { run: "insertUser", onSuccess: [{ run: "ghostQuery" }] },
      },
    });

    expect(dangling.body.error).toMatch(/"ghostQuery" was not found/);
    expect(updateLayout).not.toHaveBeenCalled();

    const wired = await callTool(server, "wire_event", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(DSL as never),
      spec: {
        widget: "SaveBtn",
        event: "onClick",
        action: {
          run: "insertUser",
          onSuccess: [
            { run: "getUsers" },
            { closeModal: "AddUserModal" },
            { showAlert: "Saved", style: "success" },
          ],
        },
      },
    });

    expect(wired.body.changeId).toBeDefined();
    const written = updateLayout.mock.calls[0][3] as {
      children: { widgetName: string; onClick?: string }[];
    };
    const button = written.children.find((w) => w.widgetName === "SaveBtn");

    expect(button?.onClick).toBe(
      "{{ insertUser.run().then(() => { getUsers.run(); closeModal('AddUserModal'); showAlert('Saved', 'success'); }) }}",
    );
  });

  it("commitLayout's overlap gate rejects when repair cannot escape (M6 backstop)", async () => {
    // A corrupt-tall obstacle extends past MAX_ROW, so pushdown clamps into a still-colliding position — the
    // one legitimate in-vocabulary way to reach the gate's rejection envelope, which otherwise only backstops
    // the repair logic.
    const DSL = {
      ...ROOT_DSL,
      children: [
        {
          widgetId: "tall",
          widgetName: "TallCorrupt",
          type: "CONTAINER_WIDGET",
          topRow: 100,
          bottomRow: 6000,
          leftColumn: 0,
          rightColumn: 20,
        },
        {
          widgetId: "mv",
          widgetName: "Mover",
          type: "TEXT_WIDGET",
          text: "hi",
          topRow: 0,
          bottomRow: 10,
          leftColumn: 0,
          rightColumn: 10,
        },
      ],
    };
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: DSL },
      })),
      updateLayout: jest.fn(async () => ({ ok: true })),
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const rejected = await callTool(server, "patch_widgets", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(DSL as never),
      patch: {
        operations: [
          {
            kind: "move",
            name: "Mover",
            position: { topRow: 200, leftColumn: 0 },
          },
        ],
      },
    });

    expect(rejected.body.code).toBe("overlap_introduced");
    expect(JSON.stringify(rejected.body.pairs)).toContain("TallCorrupt");
    // The rejection carries a ready-to-apply repair payload of closed patch operations.
    expect(rejected.body.suggestedFix.tool).toBe("patch_widgets");
    expect(Array.isArray(rejected.body.suggestedFix.operations)).toBe(true);
    // Nothing was written.
    expect(api.updateLayout).not.toHaveBeenCalled();
  });

  it("wire_event polices modal stacking: depth 2 warns, depth 3 rejects, wizard transitions pass (M6)", async () => {
    const modalNode = (
      id: string,
      name: string,
      buttons: { id: string; name: string; onClick?: string }[],
    ) => ({
      widgetId: id,
      widgetName: name,
      type: "MODAL_WIDGET",
      detachFromLayout: true,
      topRow: 0,
      bottomRow: 24,
      leftColumn: 0,
      rightColumn: 24,
      children: [
        {
          widgetId: `${id}c`,
          widgetName: `${name}Canvas`,
          type: "CANVAS_WIDGET",
          topRow: 0,
          bottomRow: 24,
          leftColumn: 0,
          rightColumn: 24,
          children: buttons.map((b, i) => ({
            widgetId: b.id,
            widgetName: b.name,
            type: "BUTTON_WIDGET",
            topRow: i * 5,
            bottomRow: i * 5 + 4,
            leftColumn: 0,
            rightColumn: 16,
            ...(b.onClick
              ? {
                  onClick: b.onClick,
                  dynamicTriggerPathList: [{ key: "onClick" }],
                }
              : {}),
          })),
        },
      ],
    });
    const DSL = {
      ...ROOT_DSL,
      children: [
        modalNode("m1", "EditModal", [
          {
            id: "d",
            name: "DeleteBtn",
            onClick: "{{ showModal('ConfirmModal') }}",
          },
        ]),
        modalNode("m2", "ConfirmModal", [{ id: "r", name: "ReallyBtn" }]),
        modalNode("m3", "ThirdModal", [{ id: "w", name: "WizNext" }]),
      ],
    };
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: DSL },
      })),
      updateLayout: jest.fn(async () => ({ ok: true })),
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const revision = fingerprintDsl(DSL as never);
    const base = {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision,
    };

    // Depth 3: page -> EditModal -> ConfirmModal -> ThirdModal. Rejected with the chain.
    const rejected = await callTool(server, "wire_event", {
      ...base,
      spec: {
        widget: "ReallyBtn",
        event: "onClick",
        action: { showModal: "ThirdModal" },
      },
    });

    expect(rejected.body.code).toBe("modal_stack");
    expect(rejected.body.error).toContain("stacks 3 modals");

    // Depth 2 (page -> EditModal already wired; ConfirmModal over it when opened from EditModal) — here we wire
    // a SECOND stacking edge whose resulting depth is 2: allowed, with a warning in the result.
    const warned = await callTool(server, "wire_event", {
      ...base,
      spec: {
        widget: "WizNext",
        event: "onClick",
        action: { showModal: "ConfirmModal" },
      },
    });

    expect(warned.body.error).toBeUndefined();
    expect(warned.body.modalWarning).toContain("depth 2");

    // Wizard transition: close the host in the same action — passes with no warning.
    const wizard = await callTool(server, "wire_event", {
      ...base,
      spec: {
        widget: "ReallyBtn",
        event: "onClick",
        action: [{ closeModal: "ConfirmModal" }, { showModal: "ThirdModal" }],
      },
    });

    expect(wizard.body.error).toBeUndefined();
    expect(wizard.body.modalWarning).toBeUndefined();
  });

  it("wire_event builds the ZIP-lookup accumulation wiring (M5: appendToStore fields + clearStoreKey/reset list)", async () => {
    const store = new MemoryGovernanceStore();
    const DSL = {
      ...ROOT_DSL,
      children: [
        {
          widgetId: "in",
          widgetName: "ZipInput",
          type: "INPUT_WIDGET_V2",
          topRow: 0,
          bottomRow: 7,
          leftColumn: 0,
          rightColumn: 24,
        },
        {
          widgetId: "b1",
          widgetName: "LookupButton",
          type: "BUTTON_WIDGET",
          topRow: 8,
          bottomRow: 12,
          leftColumn: 0,
          rightColumn: 16,
        },
        {
          widgetId: "b2",
          widgetName: "ClearButton",
          type: "BUTTON_WIDGET",
          topRow: 8,
          bottomRow: 12,
          leftColumn: 16,
          rightColumn: 32,
        },
        {
          widgetId: "t",
          widgetName: "ZipResults",
          type: "TABLE_WIDGET_V2",
          topRow: 13,
          bottomRow: 40,
          leftColumn: 0,
          rightColumn: 40,
          tableData: "{{ appsmith.store.zipResults ?? [] }}",
          dynamicBindingPathList: [{ key: "tableData" }],
        },
      ],
    };
    let current: Record<string, unknown> = DSL;
    const updateLayout = jest.fn<
      Promise<{ ok: boolean }>,
      [string, string, string, Record<string, unknown>]
    >(async (_app, _page, _layout, dsl) => {
      current = dsl;

      return { ok: true };
    });
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: current },
      })),
      listActions: jest.fn(async () => [{ name: "LookupZip", pageId: "p1" }]),
      updateLayout: updateLayout as never,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      dataEnabled: true,
      governance: new McpGovernanceCoordinator(store),
    });

    // An appendToStore whose query doesn't exist is rejected before any write (dangling-reference guard).
    const dangling = await callTool(server, "wire_event", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(DSL as never),
      spec: {
        widget: "LookupButton",
        event: "onClick",
        action: {
          run: "LookupZip",
          onSuccess: [
            { appendToStore: { key: "zipResults", query: "GhostZip" } },
          ],
        },
      },
    });

    expect(dangling.body.error).toMatch(/"GhostZip" was not found/);
    expect(updateLayout).not.toHaveBeenCalled();

    // The Lookup button: run the query, then append ONE projected row per lookup (space-keyed + indexed paths).
    const lookup = await callTool(server, "wire_event", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(DSL as never),
      spec: {
        widget: "LookupButton",
        event: "onClick",
        action: {
          run: "LookupZip",
          onSuccess: [
            {
              appendToStore: {
                key: "zipResults",
                query: "LookupZip",
                fields: [
                  { as: "zip", path: ["post code"] },
                  { as: "city", path: ["places", 0, "place name"] },
                  { as: "state", path: ["places", 0, "state"] },
                ],
              },
            },
          ],
        },
      },
    });

    expect(lookup.body.changeId).toBeDefined();
    // M5 telemetry: the audit/changes payload carries the statement verb kinds.
    expect(lookup.body.actionKinds).toEqual(["run", "appendToStore"]);
    const afterLookup = updateLayout.mock.calls[0][3] as {
      children: { widgetName: string; onClick?: string }[];
    };

    expect(
      afterLookup.children.find((w) => w.widgetName === "LookupButton")
        ?.onClick,
    ).toBe(
      "{{ LookupZip.run().then(() => { storeValue('zipResults', [].concat(appsmith.store.zipResults ?? [], " +
        '{ zip: LookupZip.data?.["post code"], city: LookupZip.data?.["places"]?.[0]?.["place name"], state: LookupZip.data?.["places"]?.[0]?.["state"] }' +
        " ?? []), false); }) }}",
    );

    // The Clear button: a statement LIST that empties the store key and resets the input in one click.
    const clear = await callTool(server, "wire_event", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(current as never),
      spec: {
        widget: "ClearButton",
        event: "onClick",
        action: [
          { clearStoreKey: { key: "zipResults" } },
          { reset: "ZipInput" },
        ],
      },
    });

    expect(clear.body.changeId).toBeDefined();
    expect(clear.body.actionKinds).toEqual(["clearStoreKey", "reset"]);
    const afterClear = updateLayout.mock.calls[1][3] as {
      children: { widgetName: string; onClick?: string; tableData?: string }[];
    };

    expect(
      afterClear.children.find((w) => w.widgetName === "ClearButton")?.onClick,
    ).toBe(
      "{{ storeValue('zipResults', [], false); resetWidget('ZipInput', true) }}",
    );
    // The store-bound table rides along untouched, and the page now has a writer for its key.
    expect(
      afterClear.children.find((w) => w.widgetName === "ZipResults")?.tableData,
    ).toBe("{{ appsmith.store.zipResults ?? [] }}");
  });

  it("create_js_object resolves plugin/workspace and commits a governed, restricted JS object", async () => {
    const store = new MemoryGovernanceStore();
    const APP = "a".repeat(24);
    const createActionCollection = jest.fn<
      Promise<unknown>,
      [Record<string, unknown>]
    >(async () => ({ id: "coll1", name: "Helpers" }));
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationPages: jest.fn(async () => ({
        workspaceId: "w".repeat(24),
      })),
      listPlugins: jest.fn(async () => [
        { id: "p".repeat(24), type: "JS", packageName: "js-plugin" },
      ]),
      listActionCollections: jest.fn(async () => []),
      createActionCollection,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      jsEnabled: true,
      governance: new McpGovernanceCoordinator(store),
    });

    const read = await callTool(server, "read_js_object", {
      applicationId: APP,
    });
    const created = await callTool(server, "create_js_object", {
      spec: {
        applicationId: APP,
        pageId: "b".repeat(24),
        name: "Helpers",
        revision: read.body.revision,
        functions: [{ name: "loadUsers", run: [{ query: "getUsers" }] }],
      },
    });

    expect(created.body.created).toBe(true);
    expect(createActionCollection).toHaveBeenCalledTimes(1);
    // The compiled JS body is emitted by the compiler (async fn running a named query), not raw agent input.
    const body = createActionCollection.mock.calls[0][0] as { body?: string };

    expect(body.body).toContain("await getUsers.run();");
    expect(body.body).not.toMatch(/\$\{|`/);
    expect(typeof created.body.changeId).toBe("string");
  });

  it("JS-object tools are unavailable without the JS gate", async () => {
    const server = createMcpHttpServer(API_BASE_URL, () => createApi()(), {
      governance: new McpGovernanceCoordinator(new MemoryGovernanceStore()),
    });
    const sessionId = await initSession(server);
    const listed = await supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId)
      .send({ jsonrpc: "2.0", id: 22, method: "tools/list" });
    const names = new Set(parseJsonRpc(listed).result.tools.map((t) => t.name));

    for (const tool of [
      "read_js_object",
      "create_js_object",
      "update_js_object",
      "prepare_delete_js_object",
      "confirm_delete_js_object",
    ]) {
      expect(names.has(tool)).toBe(false);
    }
  });

  // Item K.2 — tool-level coverage for the always-on read/patch and data-layer reads.
  const TEXT_DSL = {
    ...ROOT_DSL,
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

  function textServer(
    updateLayout: AppsmithApi["updateLayout"] = jest.fn(async () => ({
      ok: true,
    })),
  ) {
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: TEXT_DSL },
      })),
      updateLayout,
    };

    return createMcpHttpServer(API_BASE_URL, () => api);
  }

  it("read_semantic_page returns a safe projection and a revision", async () => {
    const read = await callTool(textServer(), "read_semantic_page", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
    });

    expect(read.body.revision).toBe(fingerprintDsl(TEXT_DSL as never));
    expect(JSON.stringify(read.body.page)).toContain("Greeting");
  });

  it("patch_widgets updates an allowlisted property and writes it back", async () => {
    const updateLayout = jest.fn<
      Promise<{ ok: boolean }>,
      [string, string, string, Record<string, unknown>]
    >(async () => ({ ok: true }));
    const patched = await callTool(textServer(updateLayout), "patch_widgets", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(TEXT_DSL as never),
      patch: {
        operations: [
          { kind: "update", name: "Greeting", props: { text: "Welcome" } },
        ],
      },
    });

    expect(patched.body.changes).toBeDefined();
    const written = updateLayout.mock.calls[0][3] as {
      children: { widgetName: string; text?: string }[];
    };

    expect(
      written.children.find((w) => w.widgetName === "Greeting")?.text,
    ).toBe("Welcome");
    // Non-git app: no git warning.
    expect(patched.body.gitWarning).toBeUndefined();
    // Every layout mutation says the deployed app is stale — ungoverned wording points at the editor's Deploy
    // button, since re-publish via MCP is unavailable without governance.
    expect(patched.body.deployNote).toContain("edit copy");
    expect(patched.body.deployNote).toContain("click Deploy");
    expect(patched.body.deployNote).toContain("requires governance");
  });

  // M6 — the occupancy-aware move surfaces its repair end-to-end: requestedPosition vs position in changes, a
  // top-level note, and a written DSL that is overlap-free (so the commitLayout delta gate passes).
  it("patch_widgets repairs a colliding move, reports notes, and writes an overlap-free layout", async () => {
    const STACKED_DSL = {
      ...ROOT_DSL,
      children: [
        {
          widgetId: "a",
          widgetName: "Upper",
          type: "TEXT_WIDGET",
          topRow: 0,
          bottomRow: 10,
          leftColumn: 0,
          rightColumn: 24,
        },
        {
          widgetId: "b",
          widgetName: "Lower",
          type: "TEXT_WIDGET",
          topRow: 12,
          bottomRow: 20,
          leftColumn: 0,
          rightColumn: 24,
        },
      ],
    };
    const updateLayout = jest.fn<
      Promise<{ ok: boolean }>,
      [string, string, string, Record<string, unknown>]
    >(async () => ({ ok: true }));
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: STACKED_DSL },
      })),
      updateLayout,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const patched = await callTool(server, "patch_widgets", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(STACKED_DSL as never),
      patch: {
        operations: [
          {
            kind: "move",
            name: "Lower",
            position: { topRow: 2, leftColumn: 0 },
          },
        ],
      },
    });

    // Not gated (the repair produced an overlap-free result), and the repair is fully reported.
    expect(patched.body.code).toBeUndefined();
    expect(patched.body.changes[0]).toMatchObject({
      widgetName: "Lower",
      requestedPosition: { topRow: 2, leftColumn: 0 },
      position: { topRow: 11, leftColumn: 0 },
    });
    expect(String(patched.body.notes)).toContain("placed at");

    const written = updateLayout.mock.calls[0][3] as {
      children: { widgetName: string; topRow: number }[];
    };

    expect(written.children.find((w) => w.widgetName === "Lower")?.topRow).toBe(
      11,
    );
    // The post-write diagnostics carry no overlap warning.
    const diagnostics = patched.body.diagnostics as {
      issues: { rule: string }[];
    };

    expect(diagnostics.issues.map((issue) => issue.rule)).not.toContain(
      "overlap",
    );
  });

  it("layout mutations on a governed deployment steer the agent to re-publish (deployNote)", async () => {
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: TEXT_DSL },
      })),
      updateLayout: jest.fn(async () => ({ ok: true })),
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(new MemoryGovernanceStore()),
    });
    const patched = await callTool(server, "patch_widgets", {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(TEXT_DSL as never),
      patch: {
        operations: [
          { kind: "update", name: "Greeting", props: { text: "Welcome" } },
        ],
      },
    });

    expect(patched.body.deployNote).toContain("edit copy");
    expect(patched.body.deployNote).toContain(
      "prepare_publish -> confirm_publish",
    );
  });

  // M1-T3: a git-connected app edited via MCP produces uncommitted branch changes; the edit proceeds but warns.
  const GIT_APP = {
    id: "app1",
    gitApplicationMetadata: {
      branchName: "feature/x",
      remoteUrl: "git@github.com:acme/app.git",
    },
  };

  it("patch_widgets on a git-connected app requires the branch parameter (M7 gate) and then proceeds with the warning", async () => {
    const updateLayout = jest.fn<
      Promise<{ ok: boolean }>,
      [string, string, string, Record<string, unknown>]
    >(async () => ({ ok: true }));
    const api: AppsmithApi = {
      ...createApi()(),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: TEXT_DSL },
      })),
      getApplication: jest.fn(async () => GIT_APP),
      updateLayout,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const args = {
      applicationId: "app1",
      pageId: "p1",
      layoutId: "l1",
      revision: fingerprintDsl(TEXT_DSL as never),
      patch: {
        operations: [
          { kind: "update", name: "Greeting", props: { text: "Welcome" } },
        ],
      },
    };

    // M7 BREAKING behavior: without a branch the mutation is refused, carrying the current branch for retry.
    const gated = await callTool(server, "patch_widgets", args);

    expect(gated.body.code).toBe("git_branch_required");
    expect(gated.body.currentBranch).toBe("feature/x");
    expect(updateLayout).not.toHaveBeenCalled();

    // With the matching branch it proceeds (write happened) and still carries the branch-named warning.
    const patched = await callTool(server, "patch_widgets", {
      ...args,
      branch: "feature/x",
    });

    expect(updateLayout).toHaveBeenCalled();
    expect(patched.body.changes).toBeDefined();
    expect(patched.body.gitWarning).toContain("feature/x");
    expect(patched.body.gitWarning).toContain("UNCOMMITTED");
  });

  it("confirm_publish refuses a git-connected app and never deploys", async () => {
    const publishApplication = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      getApplication: jest.fn(async () => GIT_APP),
      publishApplication,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(new MemoryGovernanceStore()),
    });

    const res = await callTool(server, "confirm_publish", {
      applicationId: "app1",
      confirmationId: "conf1",
      revision: "a".repeat(64),
    });

    expect(res.body.code).toBe("git_connected");
    expect(res.body.published).toBe(false);
    expect(res.body.error).toContain("feature/x");
    expect(publishApplication).not.toHaveBeenCalled();
  });

  it("confirm_publish fails CLOSED when git state cannot be read (refuses, never deploys)", async () => {
    // The publish gate is hard: if getApplication throws, we cannot rule out a git connection, so refuse rather than
    // risk deploying uncommitted git state. (The advisory edit warning fails open; this gate does not.)
    const publishApplication = jest.fn();
    const api: AppsmithApi = {
      ...createApi()(),
      getApplication: jest.fn(async () => {
        throw new Error("network");
      }),
      publishApplication,
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(new MemoryGovernanceStore()),
    });

    const res = await callTool(server, "confirm_publish", {
      applicationId: "app1",
      confirmationId: "conf1",
      revision: "a".repeat(64),
    });

    expect(res.body.code).toBe("git_state_unknown");
    expect(res.body.published).toBe(false);
    expect(publishApplication).not.toHaveBeenCalled();
  });

  it("list_actions returns safe metadata only (no bodies, headers, or credentials)", async () => {
    const api: AppsmithApi = {
      ...createApi()(),
      listActions: jest.fn(async () => [
        {
          id: "act1",
          name: "getUsers",
          pageId: "p1",
          pluginType: "DB",
          actionConfiguration: {
            body: "SELECT secret_col FROM t",
            headers: [{ key: "Authorization", value: "Bearer xyz" }],
          },
          datasource: { id: "ds1", pluginId: "postgres" },
        },
      ]),
    };
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      dataEnabled: true,
    });
    const { body, text } = await callTool(server, "list_actions", {
      applicationId: "app1",
    });

    expect(JSON.stringify(body)).toContain("getUsers");
    expect(text).not.toContain("SELECT secret_col");
    expect(text).not.toContain("Bearer xyz");
    expect(text).not.toContain("actionConfiguration");
  });

  // Item E — run_action / prepare_run_action / confirm_run_action.
  // Read-only means a PROTOCOL-level guarantee: a REST GET/HEAD. DB/SQL query text is never trusted as read-only.
  const READ_ONLY_ACTION = {
    id: "act1",
    name: "getUsers",
    pageId: "p1",
    pluginType: "API",
    updatedAt: "2026-07-12T00:00:00.000Z",
    actionConfiguration: { httpMethod: "GET" },
    datasource: { id: "ds1", pluginId: "restapi" },
  };
  const WRITE_ACTION = {
    id: "act1",
    name: "insertUser",
    pageId: "p1",
    pluginType: "DB",
    updatedAt: "2026-07-12T00:00:00.000Z",
    actionConfiguration: { body: "INSERT INTO users (name) VALUES ({{x}});" },
    datasource: { id: "ds1", pluginId: "postgres" },
  };

  it("run_action requires confirmation for a REST GET (external egress) and refuses a DB write", async () => {
    // M1-T2: a REST/API action can egress to any external host, so even a GET must NOT auto-run — it could exfiltrate
    // query-bound data to an attacker-chosen URL with no human in the loop. It now routes through prepare/confirm.
    const roExecute = jest.fn();
    const roServer = createMcpHttpServer(
      API_BASE_URL,
      () => ({
        ...createApi()(),
        getAction: jest.fn(async () => READ_ONLY_ACTION),
        executeAction: roExecute,
      }),
      { dataEnabled: true },
    );
    const ro = await callTool(roServer, "run_action", {
      applicationId: "app1",
      actionId: "act1",
    });

    expect(ro.body.code).toBe("confirmation_required");
    expect(roExecute).not.toHaveBeenCalled();

    const rwExecute = jest.fn();
    const rwServer = createMcpHttpServer(
      API_BASE_URL,
      () => ({
        ...createApi()(),
        getAction: jest.fn(async () => WRITE_ACTION),
        executeAction: rwExecute,
      }),
      { dataEnabled: true },
    );
    const rw = await callTool(rwServer, "run_action", {
      applicationId: "app1",
      actionId: "act1",
    });

    expect(rw.body.code).toBe("confirmation_required");
    expect(rwExecute).not.toHaveBeenCalled();
  });

  it("run_action auto-runs ONLY a protocol-read-only action on a host-restricted datasource", async () => {
    // The auto-run door requires BOTH guarantees: a GET/HEAD method AND a host-restricted (non-external) plugin. No
    // real plugin family provides both today, so this exercises the predicate with a synthetic host-restricted
    // read-only action to prove the positive branch still works (and stays the ONLY thing that skips confirmation).
    const executeAction = jest.fn(async () => ({ isExecutionSuccess: true }));
    const server = createMcpHttpServer(
      API_BASE_URL,
      () => ({
        ...createApi()(),
        getAction: jest.fn(async () => ({
          ...READ_ONLY_ACTION,
          pluginType: "DB", // host-restricted egress
          actionConfiguration: { httpMethod: "GET" }, // protocol read-only
        })),
        executeAction,
      }),
      { dataEnabled: true },
    );
    const res = await callTool(server, "run_action", {
      applicationId: "app1",
      actionId: "act1",
    });

    expect(res.body.executed).toBe(true);
    expect(executeAction).toHaveBeenCalledWith("act1");
  });

  it("run_action refuses DB queries whose text looks read-only but can mutate (no confirmation bypass)", async () => {
    // Each body starts with a keyword the old prefix check treated as read-only, yet each can mutate: a CTE that
    // DELETEs, a mutating function call, EXPLAIN ANALYZE (which executes the plan), and a plain SELECT (which can
    // call mutating functions). None may run via run_action without prepare/confirm.
    const dangerousBodies = [
      "WITH deleted AS (DELETE FROM logs WHERE level = 'DEBUG' RETURNING *) SELECT * FROM deleted;",
      "SELECT delete_old_records();",
      "EXPLAIN ANALYZE DELETE FROM users WHERE id = 1;",
      "SHOW tables; DROP TABLE users;",
      "SELECT * FROM users;",
    ];

    for (const body of dangerousBodies) {
      const executeAction = jest.fn();
      const server = createMcpHttpServer(
        API_BASE_URL,
        () => ({
          ...createApi()(),
          getAction: jest.fn(async () => ({
            ...WRITE_ACTION,
            actionConfiguration: { body },
          })),
          executeAction,
        }),
        { dataEnabled: true },
      );
      const res = await callTool(server, "run_action", {
        applicationId: "app1",
        actionId: "act1",
      });

      expect(res.body.code).toBe("confirmation_required");
      expect(res.body.executed).toBeUndefined();
      expect(executeAction).not.toHaveBeenCalled();
    }
  });

  it("refuses a REST HEAD (external egress) and a REST write (non-GET/HEAD) without confirmation", async () => {
    // M1-T2: HEAD is a safe HTTP method, but a REST/API datasource can egress externally, so it no longer auto-runs.
    const headExecute = jest.fn();
    const headServer = createMcpHttpServer(
      API_BASE_URL,
      () => ({
        ...createApi()(),
        getAction: jest.fn(async () => ({
          ...READ_ONLY_ACTION,
          actionConfiguration: { httpMethod: "HEAD" },
        })),
        executeAction: headExecute,
      }),
      { dataEnabled: true },
    );
    const head = await callTool(headServer, "run_action", {
      applicationId: "app1",
      actionId: "act1",
    });

    expect(head.body.code).toBe("confirmation_required");
    expect(headExecute).not.toHaveBeenCalled();

    // A REST write (POST) is not a safe method -> refused, no execution.
    const postExecute = jest.fn();
    const postServer = createMcpHttpServer(
      API_BASE_URL,
      () => ({
        ...createApi()(),
        getAction: jest.fn(async () => ({
          ...READ_ONLY_ACTION,
          actionConfiguration: { httpMethod: "POST" },
        })),
        executeAction: postExecute,
      }),
      { dataEnabled: true },
    );
    const post = await callTool(postServer, "run_action", {
      applicationId: "app1",
      actionId: "act1",
    });

    expect(post.body.code).toBe("confirmation_required");
    expect(postExecute).not.toHaveBeenCalled();
  });

  it("prepare_run_action + confirm_run_action runs a non-read-only action with a token", async () => {
    const store = new MemoryGovernanceStore();
    const executeAction = jest.fn(async () => ({ isExecutionSuccess: true }));
    const server = createMcpHttpServer(
      API_BASE_URL,
      () => ({
        ...createApi()(),
        getAction: jest.fn(async () => WRITE_ACTION),
        executeAction,
      }),
      { dataEnabled: true, governance: new McpGovernanceCoordinator(store) },
    );

    const read = await callTool(server, "get_action", {
      applicationId: "app1",
      actionId: "act1",
    });
    const prepared = await callTool(server, "prepare_run_action", {
      applicationId: "app1",
      actionId: "act1",
      revision: read.body.revision,
    });

    expect(prepared.body.readOnly).toBe(false);

    const confirmed = await callTool(server, "confirm_run_action", {
      applicationId: "app1",
      actionId: "act1",
      revision: read.body.revision,
      confirmationId: prepared.body.confirmationId,
    });

    expect(confirmed.body.executed).toBe(true);
    expect(executeAction).toHaveBeenCalledWith("act1");
    expect(typeof confirmed.body.changeId).toBe("string");
    expect(store.changes.some((c) => c.operation === "run_action")).toBe(true);
  });
});

// M5 — build_application returns editor/viewer URLs for the default page and AUTO-PUBLISHES the app it just
// created (governed: change record; ungoverned: structured telemetry event; failure: warning, never a failed create).
describe("M5 — build_application URLs + auto-publish", () => {
  const IMPORT_RESPONSE = {
    application: {
      id: "app123",
      slug: "demo-app",
      pages: [
        { id: "page2", slug: "other", isDefault: false },
        { id: "page1", slug: "home", isDefault: true },
      ],
    },
    isPartialImport: false,
  };

  // M9-F2: build_application now sources page slugs for the URLs from the pages DTO (getApplicationPages), not the
  // import response — the live import response's pages carry no slugs. This is the realistic 200 pages-DTO shape.
  const PAGES_DTO = {
    application: { id: "app123", slug: "demo-app" },
    pages: [
      { id: "page2", slug: "other", isDefault: false },
      { id: "page1", slug: "home", isDefault: true },
    ],
  };

  const APP_SPEC = {
    name: "Demo",
    pages: [{ name: "Home", widgets: [{ type: "text", text: "Hi" }] }],
  };

  function makeApi(overrides: Partial<AppsmithApi> = {}): AppsmithApi {
    return {
      ...createApi()(),
      importApplicationArtifact: jest.fn(async () => IMPORT_RESPONSE),
      getApplicationPages: jest.fn(async () => PAGES_DTO),
      ...overrides,
    };
  }

  // The origin is captured ONCE per session from the initialize request, so header-derivation tests set the
  // forged/forwarded headers on the initialize call only.
  async function initSession(
    server: ReturnType<typeof createMcpHttpServer>,
    headers: Record<string, string> = {},
  ) {
    let request = supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token");

    for (const [name, value] of Object.entries(headers)) {
      request = request.set(name, value);
    }

    const initialized = await request.send(initializeRequest);
    const sessionId = initialized.headers["mcp-session-id"] as string;

    let follow = supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId);

    // A configured Host allowlist applies to EVERY request, so the follow-up must carry the same Host.
    for (const [name, value] of Object.entries(headers)) {
      follow = follow.set(name, value);
    }

    await follow.send({ jsonrpc: "2.0", method: "notifications/initialized" });

    return sessionId;
  }

  async function buildApplication(
    server: ReturnType<typeof createMcpHttpServer>,
    sessionId: string,
    headers: Record<string, string> = {},
  ) {
    let request = supertest(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Authorization", "Bearer mcp_user-token")
      .set("mcp-session-id", sessionId);

    for (const [name, value] of Object.entries(headers)) {
      request = request.set(name, value);
    }

    const call = await request.send({
      jsonrpc: "2.0",
      id: 30,
      method: "tools/call",
      params: {
        name: "build_application",
        arguments: { workspaceId: "ws1", app: APP_SPEC },
      },
    });

    return JSON.parse(parseJsonRpc(call).result.content[0].text);
  }

  it("returns root-relative URLs for the default page and publishes the new app", async () => {
    const api = makeApi();
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const body = await buildApplication(server, await initSession(server));

    expect(body.applicationId).toBe("app123");
    expect(body.pages).toEqual([
      { id: "page2", slug: "other", isDefault: false },
      { id: "page1", slug: "home", isDefault: true },
    ]);
    // No configured or derivable origin -> root-relative URLs (never a guessed absolute origin), built from the
    // DEFAULT page even when it is not first in the list.
    expect(body.editorUrl).toBe("/app/demo-app/home-page1/edit");
    expect(body.viewerUrl).toBe("/app/demo-app/home-page1");
    expect(body.warnings).toBeUndefined();
    expect(body.diagnostics).toBeDefined();
    expect(api.publishApplication).toHaveBeenCalledWith("app123");
  });

  it("F3: attaches the default page's layoutId (from GET /pages/{pageId}) to that page in the result", async () => {
    const getPage = jest.fn(async () => ({
      id: "page1",
      layouts: [{ id: "layout-page1" }],
    }));
    const api = makeApi({ getPage });
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const body = await buildApplication(server, await initSession(server));

    // The layoutId is fetched for the DEFAULT page (page1) and attached ONLY to it.
    expect(getPage).toHaveBeenCalledWith("page1");
    expect(body.pages).toEqual([
      { id: "page2", slug: "other", isDefault: false },
      { id: "page1", slug: "home", isDefault: true, layoutId: "layout-page1" },
    ]);
  });

  it("F3: omits layoutId (never fails the build) when the page fetch has no layouts", async () => {
    const api = makeApi({ getPage: jest.fn(async () => ({ id: "page1" })) });
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const body = await buildApplication(server, await initSession(server));

    expect(body.pages).toEqual([
      { id: "page2", slug: "other", isDefault: false },
      { id: "page1", slug: "home", isDefault: true },
    ]);
  });

  it("builds absolute URLs from the configured public origin", async () => {
    const api = makeApi();
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      publicOrigin: "https://apps.example.com",
    });
    const body = await buildApplication(server, await initSession(server));

    expect(body.editorUrl).toBe(
      "https://apps.example.com/app/demo-app/home-page1/edit",
    );
    expect(body.viewerUrl).toBe(
      "https://apps.example.com/app/demo-app/home-page1",
    );
  });

  it("derives the origin from validated X-Forwarded-Proto + Host at initialize", async () => {
    const api = makeApi();
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const sessionId = await initSession(server, {
      "X-Forwarded-Proto": "https",
      Host: "apps.example.com",
    });
    const body = await buildApplication(server, sessionId);

    expect(body.viewerUrl).toBe(
      "https://apps.example.com/app/demo-app/home-page1",
    );
  });

  it("falls back to root-relative URLs on a forged proto or hostile Host", async () => {
    const api = makeApi();
    const server = createMcpHttpServer(API_BASE_URL, () => api);

    const forgedProto = await buildApplication(
      server,
      await initSession(server, {
        "X-Forwarded-Proto": "javascript",
        Host: "apps.example.com",
      }),
    );

    expect(forgedProto.editorUrl).toBe("/app/demo-app/home-page1/edit");

    // A Host that fails the hostname charset (underscore) — header-legal, so it reaches the derivation and is
    // refused there; the harsher injection shapes ("<script>", brackets) are unit-tested on sessionOriginFromHeaders.
    const hostileHost = await buildApplication(
      server,
      await initSession(server, {
        "X-Forwarded-Proto": "https",
        Host: "evil_example.com",
      }),
    );

    expect(hostileHost.viewerUrl).toBe("/app/demo-app/home-page1");
  });

  it("honors the Host allowlist when deriving the origin from headers", async () => {
    const api = makeApi();
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      allowedHosts: ["apps.example.com"],
    });
    const allowedHeaders = {
      "X-Forwarded-Proto": "https",
      Host: "apps.example.com",
    };
    const body = await buildApplication(
      server,
      await initSession(server, allowedHeaders),
      allowedHeaders,
    );

    // An allowlisted host still derives an absolute origin; a non-member host is rejected at the HTTP layer
    // (403) before any session exists, and sessionOriginFromHeaders additionally refuses it (unit-tested above).
    expect(body.viewerUrl).toBe(
      "https://apps.example.com/app/demo-app/home-page1",
    );
  });

  it("omits the URLs (but keeps ids) when the pages DTO lacks slugs", async () => {
    const api = makeApi({
      importApplicationArtifact: jest.fn(async () => ({
        application: {
          id: "app123",
          pages: [{ id: "page1", isDefault: true }],
        },
      })),
      // The URL slugs come from the pages DTO now (F2); a slug-less DTO must omit the URLs.
      getApplicationPages: jest.fn(async () => ({
        application: { id: "app123" },
        pages: [{ id: "page1", isDefault: true }],
      })),
    });
    // Even with an origin configured, a missing slug must omit the URLs rather than construct a broken path.
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      publicOrigin: "https://apps.example.com",
    });
    const body = await buildApplication(server, await initSession(server));

    expect(body.applicationId).toBe("app123");
    expect(body.pages).toEqual([{ id: "page1", isDefault: true }]);
    expect(body.editorUrl).toBeUndefined();
    expect(body.viewerUrl).toBeUndefined();
    expect(api.publishApplication).toHaveBeenCalledWith("app123");
  });

  it("degrades a publish failure to a coarse warning while the create still succeeds", async () => {
    const api = makeApi({
      publishApplication: jest.fn(async () => {
        throw new Error("Appsmith API request failed (503)");
      }),
    });
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const body = await buildApplication(server, await initSession(server));

    expect(body.applicationId).toBe("app123");
    expect(body.editorUrl).toBe("/app/demo-app/home-page1/edit");
    expect(body.warnings).toEqual(["created but not deployed: server_error"]);
    // Only the coarse class survives — never the raw upstream error text.
    expect(JSON.stringify(body)).not.toContain("Appsmith API request failed");
  });

  it("emits the auto-publish telemetry event on ungoverned deployments (hashed actor, coarse class)", async () => {
    const events: Record<string, unknown>[] = [];
    const stderrSpy = jest
      .spyOn(process.stderr, "write")
      .mockImplementation((chunk: string | Uint8Array) => {
        const line = typeof chunk === "string" ? chunk : chunk.toString();

        try {
          events.push(JSON.parse(line));
        } catch {
          // Non-JSON writes are irrelevant to this assertion.
        }

        return true;
      });

    try {
      const api = makeApi();
      const server = createMcpHttpServer(API_BASE_URL, () => api);

      await buildApplication(server, await initSession(server));

      const event = events.find(
        (entry) => entry.event === "appsmith_mcp_auto_publish",
      );

      expect(event).toMatchObject({
        statusClass: "success",
        usernameHash: createHash("sha256")
          .update("user@appsmith.com")
          .digest("hex"),
      });
      // The caller's identity is only ever recorded as a hash, never in plaintext.
      expect(JSON.stringify(event)).not.toContain("user@appsmith.com");
    } finally {
      stderrSpy.mockRestore();
    }
  });

  class MemoryStore implements McpGovernanceStore {
    readonly changes: McpChangeRecord[] = [];
    readonly confirmations = new Map<string, PreparedConfirmation>();
    locked = new Set<string>();

    async acquireLock(entityKey: string): Promise<string | undefined> {
      if (this.locked.has(entityKey)) return undefined;

      this.locked.add(entityKey);

      return `lock:${entityKey}`;
    }
    async releaseLock(entityKey: string): Promise<void> {
      this.locked.delete(entityKey);
    }
    async createConfirmation(c: PreparedConfirmation): Promise<void> {
      this.confirmations.set(c.id, c);
    }
    async consumeConfirmation(
      id: string,
    ): Promise<PreparedConfirmation | undefined> {
      const c = this.confirmations.get(id);

      this.confirmations.delete(id);

      return c;
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
        (c) =>
          c.id === id &&
          c.actorId === actorId &&
          c.organizationId === organizationId,
      );
    }
    async listChanges(
      actorId: string,
      organizationId: string,
      limit: number,
    ): Promise<McpChangeRecord[]> {
      return this.changes
        .filter(
          (c) => c.actorId === actorId && c.organizationId === organizationId,
        )
        .slice(-limit)
        .reverse();
    }
    async getAnyChange(
      id: string,
      organizationId: string,
    ): Promise<McpChangeRecord | undefined> {
      return this.changes.find(
        (c) => c.id === id && c.organizationId === organizationId,
      );
    }
    async listAllChanges(
      organizationId: string,
      limit: number,
    ): Promise<McpChangeRecord[]> {
      return this.changes
        .filter((c) => c.organizationId === organizationId)
        .slice(-limit)
        .reverse();
    }
  }

  it("records the governed auto-publish as an auto_publish change record", async () => {
    const store = new MemoryStore();
    // The governed path reuses this single pages read for BOTH the revision fingerprint and the F2 URLs, so it must
    // carry the app slug + page slugs (the realistic pages DTO), not a bare page list.
    const api = makeApi({
      getApplicationPages: jest.fn(async () => ({
        application: { id: "app123", slug: "demo-app" },
        pages: [{ id: "page1", name: "Home", slug: "home", isDefault: true }],
      })),
    });
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(store),
    });
    const body = await buildApplication(server, await initSession(server));

    expect(api.publishApplication).toHaveBeenCalledWith("app123");
    expect(body.warnings).toBeUndefined();
    expect(body.editorUrl).toBe("/app/demo-app/home-page1/edit");

    // The deploy is never silent under governance: it leaves an attributed change record, like confirm_publish.
    const change = store.changes.find(
      (entry) => entry.operation === "auto_publish",
    );

    expect(change).toBeDefined();
    expect(change?.actorId).toBe("user@appsmith.com");
    expect(change?.entityKey).toBe("application:app123");
    expect(change?.summary).toMatchObject({ applicationId: "app123" });
  });

  it("degrades a GOVERNED auto-publish failure to the same coarse warning (create succeeds, no change record)", async () => {
    const store = new MemoryStore();
    const api = makeApi({
      publishApplication: jest.fn(async () => {
        throw new Error("Appsmith API request failed (503)");
      }),
    });
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      governance: new McpGovernanceCoordinator(store),
    });
    const body = await buildApplication(server, await initSession(server));

    // The create still succeeds with its URLs; only the deploy degrades to the coarse warning.
    expect(body.applicationId).toBe("app123");
    expect(body.editorUrl).toBe("/app/demo-app/home-page1/edit");
    expect(body.warnings).toEqual(["created but not deployed: server_error"]);
    expect(JSON.stringify(body)).not.toContain("Appsmith API request failed");
    // A FAILED governed deploy leaves no auto_publish change record — nothing was executed.
    expect(
      store.changes.find((entry) => entry.operation === "auto_publish"),
    ).toBeUndefined();
  });

  it("classifies a 4xx publish failure as client_error and a non-HTTP failure as the 'error' fallback", async () => {
    const clientError = makeApi({
      publishApplication: jest.fn(async () => {
        throw new Error("Appsmith API request failed (403)");
      }),
    });
    const clientServer = createMcpHttpServer(API_BASE_URL, () => clientError);
    const clientBody = await buildApplication(
      clientServer,
      await initSession(clientServer),
    );

    expect(clientBody.warnings).toEqual([
      "created but not deployed: client_error",
    ]);

    // A non-HTTP failure (no "(NNN)" status in the message) falls back to the coarse "error" class —
    // and the raw message still never leaks.
    const nonHttp = makeApi({
      publishApplication: jest.fn(async () => {
        throw new Error("socket hang up");
      }),
    });
    const nonHttpServer = createMcpHttpServer(API_BASE_URL, () => nonHttp);
    const nonHttpBody = await buildApplication(
      nonHttpServer,
      await initSession(nonHttpServer),
    );

    expect(nonHttpBody.warnings).toEqual(["created but not deployed: error"]);
    expect(JSON.stringify(nonHttpBody)).not.toContain("socket hang up");
  });

  it("projects ids and URLs from a bare (non-DTO-wrapped) import response", async () => {
    const api = makeApi({
      // Older import shapes return the application object directly, not { application, isPartialImport }.
      importApplicationArtifact: jest.fn(async () => ({
        id: "app123",
        slug: "demo-app",
        pages: [{ id: "page1", slug: "home", isDefault: true }],
      })),
    });
    const server = createMcpHttpServer(API_BASE_URL, () => api);
    const body = await buildApplication(server, await initSession(server));

    expect(body.applicationId).toBe("app123");
    expect(body.editorUrl).toBe("/app/demo-app/home-page1/edit");
    expect(body.viewerUrl).toBe("/app/demo-app/home-page1");
    expect(api.publishApplication).toHaveBeenCalledWith("app123");
  });

  // The M5 acceptance-test seam, closed: ONE continuous pipeline from build (store-bound table) through wiring
  // both buttons against the DSL the build actually imported — no per-step fixture resets.
  it("pipeline: build a store-bound table, then wire lookup (appendToStore fields) and clear (clearStoreKey + reset)", async () => {
    const STORE_APP_SPEC = {
      name: "ZipLookup",
      pages: [
        {
          name: "Home",
          widgets: [
            {
              type: "input",
              name: "ZipInput",
              label: "Zip",
              validation: { format: "zipcode" },
            },
            { type: "button", name: "LookupButton", text: "Lookup" },
            { type: "button", name: "ClearButton", text: "Clear" },
            {
              type: "table",
              name: "ZipResults",
              source: { store: "zipResults" },
            },
          ],
        },
      ],
    };

    // The DSL the build imported IS the DSL the wiring edits: captured from the import call, then kept current
    // through updateLayout, exactly like the live server would serve it back.
    let currentDsl: Record<string, unknown> | undefined;
    const api = makeApi({
      importApplicationArtifact: jest.fn(
        async (_workspaceId: string, artifact: Record<string, unknown>) => {
          const pageList = artifact.pageList as {
            unpublishedPage: { layouts: { dsl: Record<string, unknown> }[] };
          }[];

          currentDsl = pageList[0].unpublishedPage.layouts[0].dsl;

          return IMPORT_RESPONSE;
        },
      ),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: currentDsl },
      })),
      updateLayout: jest.fn(
        async (
          _app: string,
          _page: string,
          _layout: string,
          dsl: Record<string, unknown>,
        ) => {
          currentDsl = dsl;

          return { ok: true };
        },
      ) as never,
      listActions: jest.fn(async () => [
        { id: "act1", name: "LookupZip", pageId: "page1" },
      ]),
    });
    const server = createMcpHttpServer(API_BASE_URL, () => api, {
      dataEnabled: true,
    });
    const sessionId = await initSession(server);

    async function call(
      name: string,
      args: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
      const response = await supertest(server)
        .post("/mcp")
        .set("Accept", "application/json, text/event-stream")
        .set("Authorization", "Bearer mcp_user-token")
        .set("mcp-session-id", sessionId)
        .send({
          jsonrpc: "2.0",
          id: 31,
          method: "tools/call",
          params: { name, arguments: args },
        });

      return JSON.parse(parseJsonRpc(response).result.content[0].text);
    }

    const built = await call("build_application", {
      workspaceId: "ws1",
      app: STORE_APP_SPEC,
    });

    // Result URLs present, deploy clean.
    expect(built.applicationId).toBe("app123");
    expect(built.editorUrl).toBe("/app/demo-app/home-page1/edit");
    expect(built.viewerUrl).toBe("/app/demo-app/home-page1");
    expect(built.warnings).toBeUndefined();

    // The imported DSL carries the store-bound table.
    const widgets = (currentDsl as { children: Record<string, unknown>[] })
      .children;
    const table = widgets.find((w) => w.widgetName === "ZipResults");

    expect(table?.tableData).toBe("{{ appsmith.store.zipResults ?? [] }}");

    // Lookup button: run the query, then append ONE projected row per run (the fields projection).
    const lookupWired = await call("wire_event", {
      applicationId: "app123",
      pageId: "page1",
      layoutId: "l1",
      revision: fingerprintDsl(currentDsl as never),
      spec: {
        widget: "LookupButton",
        event: "onClick",
        action: {
          run: "LookupZip",
          onSuccess: [
            {
              appendToStore: {
                key: "zipResults",
                query: "LookupZip",
                fields: [
                  { as: "zip", path: ["post code"] },
                  { as: "state", path: ["places", 0, "state"] },
                ],
              },
            },
          ],
        },
      },
    });

    expect(lookupWired.error).toBeUndefined();
    expect(lookupWired.revision).toBeDefined();

    // Clear button: a statement LIST — empty the store key AND reset the input in one click.
    const clearWired = await call("wire_event", {
      applicationId: "app123",
      pageId: "page1",
      layoutId: "l1",
      revision: fingerprintDsl(currentDsl as never),
      spec: {
        widget: "ClearButton",
        event: "onClick",
        action: [
          { clearStoreKey: { key: "zipResults" } },
          { reset: "ZipInput" },
        ],
      },
    });

    expect(clearWired.error).toBeUndefined();

    // The final DSL carries both compiled triggers, wired onto the SAME imported layout.
    const finalWidgets = (currentDsl as { children: Record<string, unknown>[] })
      .children;
    const lookup = finalWidgets.find((w) => w.widgetName === "LookupButton");
    const clear = finalWidgets.find((w) => w.widgetName === "ClearButton");

    expect(String(lookup?.onClick)).toContain("LookupZip.run(");
    expect(String(lookup?.onClick)).toContain("storeValue(");
    expect(String(lookup?.onClick)).toContain("zipResults");
    expect(String(clear?.onClick)).toContain("storeValue(");
    expect(String(clear?.onClick)).toContain("resetWidget('ZipInput'");
  });
});
