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

    await expect(
      fullArtifact.text(),
    ).resolves.toBe(
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
    validateToken,
  });
}

// The Streamable HTTP transport (MCP SDK 1.29+) returns request responses as an
// SSE stream when the client accepts text/event-stream, so the JSON-RPC payload
// arrives on a `data:` line rather than as a parsed JSON body. Handle both shapes.
function parseJsonRpc(response: { body?: unknown; text?: string }): {
  result: { tools: { name: string }[] };
} {
  const body = response.body as { result?: unknown } | undefined;

  if (body && body.result !== undefined) {
    return body as { result: { tools: { name: string }[] } };
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
        "import_application_artifact",
        "import_partial_application_artifact",
      ]),
    );
    expect(names).not.toEqual(
      expect.arrayContaining(["create_application", "update_layout"]),
    );
  });

  it("fails safely when session token revalidation fails", async () => {
    const validateToken = jest
      .fn<Promise<{ username: string; isAnonymous: boolean }>, []>()
      .mockResolvedValueOnce({ username: "user@appsmith.com", isAnonymous: false })
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
