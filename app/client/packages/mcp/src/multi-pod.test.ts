import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  ElicitRequestSchema,
  type ElicitResult,
} from "@modelcontextprotocol/sdk/types.js";
import { createMcpHttpServer, type AppsmithApi } from "./app.js";
import { McpGovernanceCoordinator } from "./governance/coordinator.js";
import type {
  McpChangeRecord,
  McpGovernanceStore,
  PreparedConfirmation,
} from "./governance/store.js";
import { RedisSessionRelay } from "./session/relay.js";
import { RedisSessionStore, hashToken } from "./session/store.js";
import { FakeRedisServer } from "./session/testing.js";

// Scenario 2 waits on a real elicitation round trip (5 s timeout); a relay regression must surface as an
// assertion, not as jest's own default 5 s timeout.
jest.setTimeout(15_000);

// Multi-replica acceptance: TWO independent createMcpHttpServer instances ("pods") share one fake Redis, and a
// REAL @modelcontextprotocol/sdk client talks to them through a router that decides, per HTTP request, which pod
// it reaches — the load balancer with no session affinity that produced the production 404s. Every scenario here
// is red against the pre-change server (in-process sessions, prompts on the standalone GET stream).

const APP_ID = "a".repeat(24);
const PAGE_ID = "b".repeat(24);
const OTHER_PAGE_ID = "c".repeat(24);
const USER = "user@appsmith.com";
const TOKEN = "mcp_multi-pod-token";
const SESSION_TTL_MS = 60_000;

const PAGES_RESPONSE = {
  workspaceId: "ws1",
  application: { id: APP_ID, name: "Orders", slug: "orders" },
  pages: [
    { id: OTHER_PAGE_ID, name: "Home", slug: "home", isDefault: true },
    { id: PAGE_ID, name: "Checkout", slug: "checkout" },
  ],
};

function stubApi(overrides: Partial<AppsmithApi> = {}): AppsmithApi {
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
    triggerDatasource: jest.fn(),
    getApplicationPages: jest.fn(async () => PAGES_RESPONSE),
    getPage: jest.fn(async () => ({})),
    getApplication: jest.fn(async () => ({ id: APP_ID, name: "Orders" })),
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
    deletePage: jest.fn(async () => ({ ok: true })),
    publishApplication: jest.fn(async () => ({})),
    listPlugins: jest.fn(),
    listActionCollections: jest.fn(),
    createActionCollection: jest.fn(),
    updateActionCollection: jest.fn(),
    deleteActionCollection: jest.fn(),
    validateToken: jest.fn(async () => ({
      username: USER,
      isAnonymous: false,
      organizationId: "org-default",
    })),
    ...overrides,
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
  async listChanges(actorId: string): Promise<McpChangeRecord[]> {
    return this.changes.filter((change) => change.actorId === actorId);
  }
  async getAnyChange(id: string): Promise<McpChangeRecord | undefined> {
    return this.changes.find((change) => change.id === id);
  }
  async listAllChanges(): Promise<McpChangeRecord[]> {
    return this.changes;
  }
}

// --- Pods and the router -----------------------------------------------------------------------------------------

interface Pod {
  name: string;
  origin: string;
  close: () => Promise<void>;
}

interface Cluster {
  pods: Pod[];
  redis: FakeRedisServer;
  clock: { now: number };
  events: Array<Record<string, unknown>>;
  close: () => Promise<void>;
}

async function startCluster(
  api: AppsmithApi,
  options: {
    maxSessionsPerUser?: number;
    // Per-bearer API factory, for scenarios where two tokens must resolve to different upstream identities.
    apiFor?: (token: string) => AppsmithApi;
  } = {},
): Promise<Cluster> {
  const clock = { now: 1_700_000_000_000 };
  const now = () => clock.now;
  const redis = new FakeRedisServer(now);
  const governance = new MemoryGovernanceStore();
  const events: Array<Record<string, unknown>> = [];
  const pods: Pod[] = [];

  for (const name of ["pod-a", "pod-b"]) {
    const httpServer = createMcpHttpServer(
      "https://appsmith.example",
      (token) => options.apiFor?.(token) ?? api,
      {
        sessionStore: new RedisSessionStore(redis.client(), now),
        sessionRelay: new RedisSessionRelay(redis.client(), name),
        governance: new McpGovernanceCoordinator(governance),
        now,
        sessionTtlMs: SESSION_TTL_MS,
        maxSessionsPerUser: options.maxSessionsPerUser,
        elicitationTimeoutMs: 5_000,
      },
    );

    await new Promise<void>((resolve) =>
      httpServer.listen(0, "127.0.0.1", resolve),
    );
    const port = (httpServer.address() as AddressInfo).port;

    pods.push({
      name,
      origin: `http://127.0.0.1:${port}`,
      close: async () =>
        new Promise<void>((resolve) => httpServer.close(() => resolve())),
    });
  }

  return {
    pods,
    redis,
    clock,
    events,
    close: async () => {
      for (const pod of pods) await pod.close();
    },
  };
}

interface RoutedRequest {
  httpMethod: string;
  // JSON-RPC method of a POSTed request/notification; undefined for a GET, or for a POSTed RESPONSE.
  rpcMethod?: string;
  isResponse: boolean;
  // For tools/call: the page a page-scoped tool targets (spec.pageId), so a route can pin one page's confirm to
  // one pod and another page's to the other.
  pageId?: string;
}

type Route = (request: RoutedRequest) => Pod;

// The load balancer: every fetch the SDK client makes is re-targeted at whichever pod `route` picks.
function routedFetch(route: Route, hits: string[]): typeof fetch {
  return async (input, init) => {
    let rpcMethod: string | undefined;
    let isResponse = false;
    let pageId: string | undefined;

    if (typeof init?.body === "string") {
      try {
        const body = JSON.parse(init.body) as {
          method?: string;
          result?: unknown;
          error?: unknown;
          params?: { arguments?: { spec?: { pageId?: string } } };
        };

        rpcMethod = body.method;
        isResponse =
          body.method === undefined && ("result" in body || "error" in body);
        pageId = body.params?.arguments?.spec?.pageId;
      } catch {
        // not JSON
      }
    }

    const httpMethod = init?.method ?? "GET";
    const pod = route({ httpMethod, rpcMethod, isResponse, pageId });
    const target = new URL(String(input));
    const podUrl = new URL(pod.origin);

    target.protocol = podUrl.protocol;
    target.host = podUrl.host;
    hits.push(
      `${pod.name} ${httpMethod} ${isResponse ? "<response>" : rpcMethod ?? "-"}`,
    );

    return fetch(target, init);
  };
}

async function connectClient(
  route: Route,
  hits: string[],
  answers?: ElicitResult[],
): Promise<{
  client: Client;
  transport: StreamableHTTPClientTransport;
  prompts: string[];
}> {
  const client = new Client(
    { name: "multi-pod", version: "1.0.0" },
    { capabilities: answers !== undefined ? { elicitation: {} } : {} },
  );
  const prompts: string[] = [];

  if (answers !== undefined) {
    client.setRequestHandler(ElicitRequestSchema, async (request) => {
      prompts.push(String(request.params.message));

      const answer = answers.shift();

      if (answer === undefined) {
        throw new Error("unexpected elicitation prompt (no scripted answer)");
      }

      return answer;
    });
  }

  const transport = new StreamableHTTPClientTransport(
    new URL("http://router.invalid/mcp"),
    {
      fetch: routedFetch(route, hits),
      requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } },
    },
  );

  await client.connect(transport);

  return { client, transport, prompts };
}

async function callTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await client.callTool({ name, arguments: args });
  const text = (res.content as { type: string; text: string }[])[0].text;

  return JSON.parse(text);
}

// A bare request straight at one pod, bypassing the SDK client: for asserting HTTP statuses (404/401) that the
// SDK client would otherwise translate into reconnects or thrown errors.
async function rawPost(
  pod: Pod,
  body: unknown,
  headers: Record<string, string>,
): Promise<Response> {
  return fetch(`${pod.origin}/mcp`, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const TOOLS_LIST = { jsonrpc: "2.0", id: 99, method: "tools/list" };
const ACCEPT: ElicitResult = { action: "accept", content: { confirm: true } };

// --- Telemetry capture -------------------------------------------------------------------------------------------

let events: Array<Record<string, unknown>> = [];
let stderrSpy: jest.SpyInstance | undefined;

beforeEach(() => {
  events = [];
  stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(((
    chunk: unknown,
  ) => {
    try {
      const parsed = JSON.parse(String(chunk)) as Record<string, unknown>;

      if (typeof parsed.event === "string") events.push(parsed);
    } catch {
      // non-JSON operator log line
    }

    return true;
  }) as never);
});

afterEach(() => {
  stderrSpy?.mockRestore();
});

function eventNames(): string[] {
  return events.map((event) => String(event.event));
}

// --- Scenarios ---------------------------------------------------------------------------------------------------

describe("MCP sessions across two pods sharing a Redis session store", () => {
  it("serves a session on a pod that never saw its initialize (the production 404)", async () => {
    const cluster = await startCluster(stubApi());
    const [podA, podB] = cluster.pods;
    const hits: string[] = [];
    let current = podA;
    const session = await connectClient(() => current, hits);

    try {
      // Everything so far (initialize, notifications/initialized, the GET stream) went to pod A.
      expect(hits.every((hit) => hit.startsWith("pod-a"))).toBe(true);

      current = podB;

      const tools = await session.client.listTools();

      expect(tools.tools.map((tool) => tool.name)).toContain(
        "build_application",
      );
      expect(hits).toContain("pod-b POST tools/list");
      // Pod B rebuilt the session from the shared record rather than answering 404.
      expect(eventNames()).toContain("appsmith_mcp_session_hydrated");

      // And pod A still serves it too: one session, two live copies, one record.
      current = podA;
      expect((await session.client.listTools()).tools.length).toBeGreaterThan(
        0,
      );
      expect(
        eventNames().filter((e) => e === "appsmith_mcp_session_hydrated"),
      ).toHaveLength(1);
    } finally {
      await session.client.close();
      await cluster.close();
    }
  });

  it("approves a destructive confirm when the prompt is sent from one pod and the human's answer lands on the other", async () => {
    const api = stubApi();
    const cluster = await startCluster(api);
    const [podA, podB] = cluster.pods;
    const hits: string[] = [];
    // The GET (standalone SSE) stream and every RESPONSE go to pod B; every tool call goes to pod A. So the prompt
    // can only reach the client on the tool call's own POST stream (not the GET stream, which is on the other
    // pod), and the answer can only reach pod A's pending promise through the relay.
    const route: Route = (request) => {
      if (request.rpcMethod === "initialize") return podA;

      if (request.httpMethod === "GET" || request.isResponse) return podB;

      if (request.rpcMethod === "tools/call") return podA;

      return podB;
    };
    const session = await connectClient(route, hits, [ACCEPT]);

    try {
      const read = await callTool(session.client, "read_pages", {
        applicationId: APP_ID,
      });
      const revision = read.revision as string;
      const prepared = await callTool(session.client, "prepare_delete_page", {
        spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
      });
      const confirmationId = prepared.confirmationId as string;

      expect(typeof confirmationId).toBe("string");

      const confirmed = await callTool(session.client, "confirm_delete_page", {
        spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
        confirmationId,
      });

      expect(confirmed.error).toBeUndefined();
      expect(session.prompts).toHaveLength(1);
      expect(session.prompts[0]).toContain("Checkout");
      expect(api.deletePage).toHaveBeenCalledTimes(1);

      // The answer crossed pods: pod B forwarded it, pod A delivered it into the waiting transport.
      expect(hits).toContain("pod-b POST <response>");
      expect(eventNames()).toContain("appsmith_mcp_relay_forwarded");
      expect(eventNames()).toContain("appsmith_mcp_relay_delivered");
    } finally {
      await session.client.close();
      await cluster.close();
    }
  });

  it("confirms a commit prepared on the other pod: the confirm context travels with the one-time token, not the pod", async () => {
    const api = stubApi({
      getApplication: jest.fn(async () => ({
        id: APP_ID,
        gitApplicationMetadata: {
          branchName: "mcp/fix-1",
          defaultBranchName: "master",
          remoteUrl: "git@github.com:acme/repo.git",
          defaultApplicationId: "baseApp1",
        },
      })),
    });
    const cluster = await startCluster(api);
    const [podA, podB] = cluster.pods;
    let current = podA;
    // A NON-elicitation client: the documented relay posture, so the confirm needs no prompt round-trip and the
    // only cross-pod state in play is the prepare's commit context.
    const session = await connectClient(() => current, []);

    try {
      const prepared = await callTool(session.client, "prepare_commit", {
        applicationId: APP_ID,
        message: "Fix orders",
      });
      const confirmationId = prepared.confirmationId as string;

      expect(typeof confirmationId).toBe("string");

      current = podB;

      const confirmed = await callTool(session.client, "confirm_commit", {
        applicationId: APP_ID,
        confirmationId,
      });

      expect(confirmed.error).toBeUndefined();
      const commitMock = api.commitGitApplication as jest.Mock;

      expect(commitMock).toHaveBeenCalledTimes(1);
      expect(String(commitMock.mock.calls[0][1])).toContain("Fix orders");
    } finally {
      await session.client.close();
      await cluster.close();
    }
  });

  it("a DELETE handled by one pod ends the session on every pod", async () => {
    const cluster = await startCluster(stubApi());
    const [podA, podB] = cluster.pods;
    const hits: string[] = [];
    let current = podA;
    const session = await connectClient(() => current, hits);
    const sessionId = session.transport.sessionId as string;

    try {
      expect(sessionId).toBeTruthy();

      current = podB;
      await session.transport.terminateSession();
      expect(hits).toContain("pod-b DELETE -");

      for (const pod of [podA, podB]) {
        const response = await rawPost(pod, TOOLS_LIST, {
          authorization: `Bearer ${TOKEN}`,
          "mcp-session-id": sessionId,
        });

        expect(response.status).toBe(404);
      }
    } finally {
      await session.client.close();
      await cluster.close();
    }
  });

  it("binds the shared session to its bearer: another token is refused on the foreign pod without hydrating", async () => {
    const cluster = await startCluster(stubApi());
    const [podA, podB] = cluster.pods;
    const session = await connectClient(() => podA, []);
    const sessionId = session.transport.sessionId as string;

    try {
      const response = await rawPost(podB, TOOLS_LIST, {
        authorization: "Bearer mcp_someone-else",
        "mcp-session-id": sessionId,
      });

      expect(response.status).toBe(401);
      expect(eventNames()).not.toContain("appsmith_mcp_session_hydrated");

      // The rightful owner is still served everywhere.
      const owner = await rawPost(podB, TOOLS_LIST, {
        authorization: `Bearer ${TOKEN}`,
        "mcp-session-id": sessionId,
      });

      expect(owner.status).toBe(200);
    } finally {
      await session.client.close();
      await cluster.close();
    }
  });

  it("enforces the per-user cap across pods: a new session on pod B evicts the user's oldest one from pod A", async () => {
    const cluster = await startCluster(stubApi(), { maxSessionsPerUser: 1 });
    const [podA, podB] = cluster.pods;
    const first = await connectClient(() => podA, []);
    const firstId = first.transport.sessionId as string;

    try {
      // Prove pod A serves the first session before the eviction.
      expect(
        (
          await rawPost(podA, TOOLS_LIST, {
            authorization: `Bearer ${TOKEN}`,
            "mcp-session-id": firstId,
          })
        ).status,
      ).toBe(200);

      const second = await connectClient(() => podB, []);

      try {
        expect(eventNames()).toContain("appsmith_mcp_session_evicted");

        // Pod A's local copy is invalidated by the shared store, not by its own memory.
        const evicted = await rawPost(podA, TOOLS_LIST, {
          authorization: `Bearer ${TOKEN}`,
          "mcp-session-id": firstId,
        });

        expect(evicted.status).toBe(404);
      } finally {
        await second.client.close();
      }
    } finally {
      await first.client.close();
      await cluster.close();
    }
  });

  it("expires an idle session everywhere once its shared TTL lapses", async () => {
    const cluster = await startCluster(stubApi());
    const [podA, podB] = cluster.pods;
    const session = await connectClient(() => podA, []);
    const sessionId = session.transport.sessionId as string;

    try {
      // Hydrate pod B first so both pods hold a live copy.
      expect(
        (
          await rawPost(podB, TOOLS_LIST, {
            authorization: `Bearer ${TOKEN}`,
            "mcp-session-id": sessionId,
          })
        ).status,
      ).toBe(200);

      cluster.clock.now += SESSION_TTL_MS + 1;

      for (const pod of [podA, podB]) {
        const response = await rawPost(pod, TOOLS_LIST, {
          authorization: `Bearer ${TOKEN}`,
          "mcp-session-id": sessionId,
        });

        expect(response.status).toBe(404);
      }
    } finally {
      await session.client.close();
      await cluster.close();
    }
  });
});

describe("MCP multi-pod hardening", () => {
  it("hydrates a foreign session exactly once when its first requests arrive together (single-flight)", async () => {
    // Realistic upstream-auth latency: without single-flight, every concurrent first-sight request rebuilt its
    // own server and transport (measured 8 of 8 under 20 ms auth latency).
    const api = stubApi({
      validateToken: jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));

        return {
          username: USER,
          isAnonymous: false,
          organizationId: "org-default",
        };
      }),
    });
    const cluster = await startCluster(api);
    const [podA, podB] = cluster.pods;
    const session = await connectClient(() => podA, []);
    const sessionId = session.transport.sessionId as string;

    try {
      const responses = await Promise.all(
        Array.from({ length: 6 }, async () =>
          rawPost(podB, TOOLS_LIST, {
            authorization: `Bearer ${TOKEN}`,
            "mcp-session-id": sessionId,
          }),
        ),
      );

      expect(responses.map((response) => response.status)).toEqual(
        Array.from({ length: 6 }, () => 200),
      );
      expect(
        eventNames().filter((e) => e === "appsmith_mcp_session_hydrated"),
      ).toHaveLength(1);
    } finally {
      await session.client.close();
      await cluster.close();
    }
  });

  it("refuses a bearer whose live identity is not the record's owner, even when the stored hash matches", async () => {
    // Simulates a tampered record (or a token reassigned to another principal): the bearer hashes to what the
    // record holds, but the upstream says it belongs to someone else.
    const apiFor = (token: string): AppsmithApi =>
      stubApi({
        validateToken: jest.fn(async () => ({
          username: token === TOKEN ? USER : "intruder@appsmith.com",
          isAnonymous: false,
          organizationId: "org-default",
        })),
      });
    const cluster = await startCluster(stubApi(), { apiFor });
    const [podA, podB] = cluster.pods;
    const session = await connectClient(() => podA, []);
    const sessionId = session.transport.sessionId as string;

    try {
      const key = `appsmith:mcp:session:${sessionId}`;
      const stored = JSON.parse(cluster.redis.get(key) as string) as Record<
        string,
        unknown
      >;

      cluster.redis.set(
        key,
        JSON.stringify({ ...stored, tokenHash: hashToken("mcp_intruder") }),
        { PX: SESSION_TTL_MS },
      );

      const response = await rawPost(podB, TOOLS_LIST, {
        authorization: "Bearer mcp_intruder",
        "mcp-session-id": sessionId,
      });

      expect(response.status).toBe(401);
      expect(eventNames()).not.toContain("appsmith_mcp_session_hydrated");
    } finally {
      await session.client.close();
      await cluster.close();
    }
  });

  it("a pod whose relay cannot start answers 503 on /mcp AND /health instead of serving silently", async () => {
    const clock = { now: 1_700_000_000_000 };
    const now = () => clock.now;
    const redis = new FakeRedisServer(now);
    const client = redis.client();
    const subscriber = client.duplicate();

    subscriber.connectError = new Error("NOAUTH");
    jest.spyOn(client, "duplicate").mockReturnValue(subscriber);

    const httpServer = createMcpHttpServer(
      "https://appsmith.example",
      () => stubApi(),
      {
        sessionStore: new RedisSessionStore(redis.client(), now),
        sessionRelay: new RedisSessionRelay(client, "pod-x", () => {}),
        now,
        logSink: () => {},
      },
    );

    await new Promise<void>((resolve) =>
      httpServer.listen(0, "127.0.0.1", resolve),
    );
    const origin = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;

    try {
      const health = await fetch(`${origin}/health`);

      expect(health.status).toBe(503);
      expect(((await health.json()) as { status: string }).status).toBe(
        "degraded",
      );

      const mcp = await fetch(`${origin}/mcp`, {
        method: "POST",
        headers: {
          accept: "application/json, text/event-stream",
          "content-type": "application/json",
          authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-03-26",
            capabilities: {},
            clientInfo: { name: "x", version: "1" },
          },
        }),
      });

      expect(mcp.status).toBe(503);
    } finally {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  });

  it("stores only a bounded projection of oversized initialize params", async () => {
    const cluster = await startCluster(stubApi());
    const [podA, podB] = cluster.pods;
    const huge = "x".repeat(64 * 1024);
    const client = new Client(
      { name: "bloated", version: "9.9.9" },
      {
        capabilities: { elicitation: {}, experimental: { blob: { huge } } },
      },
    );
    const hits: string[] = [];
    let current = podA;
    const transport = new StreamableHTTPClientTransport(
      new URL("http://router.invalid/mcp"),
      {
        fetch: routedFetch(() => current, hits),
        requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } },
      },
    );

    await client.connect(transport);

    try {
      const sessionId = transport.sessionId as string;
      const raw = cluster.redis.get(
        `appsmith:mcp:session:${sessionId}`,
      ) as string;

      expect(raw.length).toBeLessThan(4 * 1024);
      expect(raw).not.toContain(huge);

      const stored = JSON.parse(raw) as {
        initialize: {
          capabilities: Record<string, unknown>;
          clientInfo: Record<string, unknown>;
        };
      };

      // The facts that matter for hydration survive: elicitation support and the client identity.
      expect(stored.initialize.capabilities).toEqual({ elicitation: {} });
      expect(stored.initialize.clientInfo).toEqual({
        name: "bloated",
        version: "9.9.9",
      });

      // ...and the foreign pod still hydrates and serves it.
      current = podB;
      expect((await client.listTools()).tools.length).toBeGreaterThan(0);
      expect(eventNames()).toContain("appsmith_mcp_session_hydrated");
    } finally {
      await client.close();
      await cluster.close();
    }
  });
});

describe("MCP multi-pod prompt identity", () => {
  it("two pods prompting on one session each get their own answer: a decline on pod A never approves pod B", async () => {
    // Each pod's SDK server numbers its prompts from 0. Without per-pod tagging both prompts would register the
    // pending key (session, 0), the later registration would win, and the human's DECLINE of one delete could
    // resolve (approve) the other. Both prompts are held open until both have arrived, so the collision is
    // deterministic rather than a race.
    const THIRD_PAGE_ID = "d".repeat(24);
    const api = stubApi({
      getApplicationPages: jest.fn(async () => ({
        ...PAGES_RESPONSE,
        pages: [
          ...PAGES_RESPONSE.pages,
          { id: THIRD_PAGE_ID, name: "Archive", slug: "archive" },
        ],
      })),
    });
    const cluster = await startCluster(api);
    const [podA, podB] = cluster.pods;
    const hits: string[] = [];
    const route: Route = (request) => {
      if (request.rpcMethod === "tools/call" && request.pageId === PAGE_ID) {
        return podA;
      }

      return podB;
    };
    const client = new Client(
      { name: "multi-pod", version: "1.0.0" },
      { capabilities: { elicitation: {} } },
    );
    const prompts: string[] = [];
    let releasePrompts = () => {};
    const bothPrompted = new Promise<void>((resolve) => {
      releasePrompts = resolve;
    });

    client.setRequestHandler(ElicitRequestSchema, async (request) => {
      const message = String(request.params.message);

      prompts.push(message);

      if (prompts.length === 2) releasePrompts();

      await bothPrompted;

      // Decline the Checkout delete (served by pod A); accept the Archive delete (served by pod B).
      return message.includes("Checkout") ? { action: "decline" } : ACCEPT;
    });

    const transport = new StreamableHTTPClientTransport(
      new URL("http://router.invalid/mcp"),
      {
        fetch: routedFetch(route, hits),
        requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } },
      },
    );

    await client.connect(transport);

    try {
      const read = await callTool(client, "read_pages", {
        applicationId: APP_ID,
      });
      const revision = read.revision as string;
      const [preparedA, preparedB] = await Promise.all([
        callTool(client, "prepare_delete_page", {
          spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
        }),
        callTool(client, "prepare_delete_page", {
          spec: { applicationId: APP_ID, pageId: THIRD_PAGE_ID, revision },
        }),
      ]);
      const [confirmedA, confirmedB] = await Promise.all([
        callTool(client, "confirm_delete_page", {
          spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
          confirmationId: preparedA.confirmationId,
        }),
        callTool(client, "confirm_delete_page", {
          spec: { applicationId: APP_ID, pageId: THIRD_PAGE_ID, revision },
          confirmationId: preparedB.confirmationId,
        }),
      ]);

      expect(prompts).toHaveLength(2);
      expect(hits).toContain("pod-a POST tools/call");
      expect(confirmedA.code).toBe("delete_page_not_confirmed");
      expect(confirmedB.error).toBeUndefined();

      const deleted = (api.deletePage as jest.Mock).mock.calls.map(
        (args) => args[0],
      );

      expect(deleted).toEqual([THIRD_PAGE_ID]);
    } finally {
      await client.close();
      await cluster.close();
    }
  });
});
