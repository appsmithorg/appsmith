import supertest from "supertest";
import {
  MAX_ARTIFACT_BYTES,
  createAppsmithApi,
  createMcpHttpServer,
  hostHeaderName,
  type AppsmithApi,
} from "./app.js";
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
  validateToken = jest.fn(async () => ({
    username: "user@appsmith.com",
    isAnonymous: false,
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
    // Default: a non-git application (no gitApplicationMetadata) so layout-edit tests see no git warning.
    getApplication: jest.fn(async () => ({})),
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

    expect(owner.status).not.toBe(400);
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
      const accepted = responses.filter(
        (r) => r.headers["mcp-session-id"],
      ).length;
      const rejected = responses.filter((r) => r.status === 429).length;

      // The atomic reservation must admit exactly one; the rest hit the per-user cap.
      expect(accepted).toBe(1);
      expect(rejected).toBe(4);
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

    expect(expired).toMatchObject({
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

  it("rejects new sessions when the per-user limit is reached", async () => {
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
        "appsmith://guide/naming",
        "appsmith://guide/placement",
        "appsmith://recipe/crud",
        "appsmith://recipe/form",
        "appsmith://recipe/table-detail",
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
    async saveChange(change: McpChangeRecord): Promise<void> {
      this.changes.push(change);
    }
    async getChange(
      id: string,
      actorId: string,
    ): Promise<McpChangeRecord | undefined> {
      return this.changes.find((c) => c.id === id && c.actorId === actorId);
    }
    async listChanges(
      actorId: string,
      limit: number,
    ): Promise<McpChangeRecord[]> {
      return this.changes
        .filter((c) => c.actorId === actorId)
        .slice(-limit)
        .reverse();
    }
    async getAnyChange(id: string): Promise<McpChangeRecord | undefined> {
      return this.changes.find((c) => c.id === id);
    }
    async listAllChanges(limit: number): Promise<McpChangeRecord[]> {
      return this.changes.slice(-limit).reverse();
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
    const mk = (id: string, actorId: string, ms: number): McpChangeRecord => ({
      id,
      actorId,
      entityKey: "e",
      operation: "op",
      revisionBefore: "",
      revisionAfter: "",
      createdAt: new Date(ms),
      rollback: {},
      summary: {},
    });

    await store.saveChange(mk("c1", "alice@appsmith.com", 1000));
    await store.saveChange(mk("c2", "bob@appsmith.com", 2000));

    // Non-admin (default validateToken has no adminSettingsVisible) -> refused, no records leaked.
    const nonAdmin = createMcpHttpServer(API_BASE_URL, createApi(), {
      governance: new McpGovernanceCoordinator(store),
    });
    const denied = await callTool(nonAdmin, "list_all_changes", {});

    expect(denied.body.code).toBe("admin_required");
    expect(denied.body.changes).toBeUndefined();

    // Admin (validateToken reports isSuperUser: true) -> sees BOTH actors' records.
    const adminServer = createMcpHttpServer(
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
    const all = await callTool(adminServer, "list_all_changes", {});

    expect(all.body.changes.map((c: { id: string }) => c.id).sort()).toEqual([
      "c1",
      "c2",
    ]);
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

    // get_any_change: admin can fetch a specific cross-actor record (attributed); non-admin is refused.
    const anyChange = await callTool(adminServer, "get_any_change", {
      changeId: "c2",
    });

    expect(anyChange.body.change.actorId).toBe("bob@appsmith.com");

    const deniedGet = await callTool(nonAdmin, "get_any_change", {
      changeId: "c2",
    });

    expect(deniedGet.body.code).toBe("admin_required");

    // The admin's own actor-scoped list_changes still sees only its own records (none here).
    const own = await callTool(adminServer, "list_changes", {});

    expect(own.body.changes).toEqual([]);
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
  });

  // M1-T3: a git-connected app edited via MCP produces uncommitted branch changes; the edit proceeds but warns.
  const GIT_APP = {
    id: "app1",
    gitApplicationMetadata: {
      branchName: "feature/x",
      remoteUrl: "git@github.com:acme/app.git",
    },
  };

  it("patch_widgets warns (and still proceeds) on a git-connected app, naming the branch", async () => {
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

    // Proceeds (write happened) but carries a branch-named warning.
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
