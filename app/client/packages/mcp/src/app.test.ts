import supertest from "supertest";
import {
  MAX_ARTIFACT_BYTES,
  createAppsmithApi,
  createMcpHttpServer,
  type AppsmithApi,
} from "./app.js";

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
  it("forwards the user bearer token for read and artifact import requests", async () => {
    const fetchFn = successfulFetch();
    const api = createAppsmithApi(
      "user-token",
      API_BASE_URL,
      fetchFn as unknown as typeof fetch,
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
      `${API_BASE_URL}/api/v1/workspaces`,
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
    getDatasourceStructure: jest.fn(),
    getApplication: jest.fn(async () => ({ workspaceId: "ws1" })),
    listActions: jest.fn(),
    createAction: jest.fn(),
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
    expect(names).not.toContain("get_datasource_structure");
    // The build/authoring tools are still present.
    expect(names).toContain("build_application");
    // Raw artifact-import tools remain absent regardless.
    expect(names).not.toContain("import_application_artifact");
  });

  it("exposes the data tools when the sub-flag is on", async () => {
    const names = await toolNames(true);

    expect(names).toContain("list_datasources");
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

    return JSON.parse(parseJsonRpc(call).result.content[0].text);
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

  it("create_query creates a parameterized query when the datasource is accessible", async () => {
    const createAction = jest.fn<
      Promise<{ id: string }>,
      [Record<string, unknown>]
    >(async () => ({ id: "act1" }));
    const api: AppsmithApi = {
      ...createApi()(),
      listDatasources: jest.fn(async () => [{ id: "ds1", name: "DB" }]),
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

  it("create_query resolves the workspace from the application, not the agent (cross-tenant guard)", async () => {
    const createAction = jest.fn();
    // ds1 exists only in workspace A; the app resolves to workspace B, so the lookup there returns nothing.
    const listDatasources = jest.fn(async (workspaceId: string) =>
      workspaceId === "wsA" ? [{ id: "ds1" }] : [],
    );
    const api: AppsmithApi = {
      ...createApi()(),
      getApplication: jest.fn(async () => ({ workspaceId: "wsB" })),
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
      listDatasources: jest.fn(async () => [{ id: "ds1" }]),
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
