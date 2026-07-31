import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  ElicitRequestSchema,
  type ElicitResult,
} from "@modelcontextprotocol/sdk/types.js";
import {
  MCP_MAX_ELICITATIONS,
  MCP_SESSION_MAX_ELICITATIONS,
  buildMcpServer,
  type AppsmithApi,
  type ServerContext,
} from "./app.js";
import { getCapabilities, TOOL_CATALOG } from "./builder/capabilities.js";
import { fingerprintDsl } from "./builder/semantic.js";
import { McpGovernanceCoordinator } from "./governance/coordinator.js";
import type {
  McpChangeRecord,
  McpGovernanceStore,
  PreparedConfirmation,
} from "./governance/store.js";

// The shared destructive-approval elicitation layer (generalized from confirm_commit's M7 machinery): every
// destructive confirm tool prompts on elicitation-capable clients AFTER its refusal gates and BEFORE token
// consumption — accept executes and consumes; decline/cancel/timeout abort WITHOUT consuming (the same token
// succeeds later); MCP_MAX_ELICITATIONS non-accepts invalidate the token; non-elicitation clients keep the
// relay-text fallback posture unchanged; and every interpolated label is promptSafe-sanitized.

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
    triggerDatasource: jest.fn(),
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

// --- SDK-seam harness: a REAL @modelcontextprotocol/sdk client over a linked in-memory transport. `answers`
// scripted => the client declares the elicitation capability and answers elicitation/create from the queue
// (mocking the human, not the protocol); `answers` undefined => a NON-elicitation client (capabilities: {}). ------

interface Session {
  client: Client;
  prompts: string[];
  // Every raw notifications/progress seen on the wire (the SDK client only routes progress to a per-request
  // onprogress callback, so ping tests observe the transport directly).
  progressNotifications: unknown[];
  close: () => Promise<void>;
}

async function connectClient(
  api: AppsmithApi,
  store: MemoryGovernanceStore,
  answers?: (ElicitResult | (() => Promise<ElicitResult>))[],
  ctx: Partial<ServerContext> = {},
): Promise<Session> {
  const mcpServer = buildMcpServer(api, {
    dataEnabled: true,
    jsEnabled: true,
    governance: new McpGovernanceCoordinator(store),
    actorId: "user@appsmith.com",
    organizationId: "org-default",
    ...ctx,
  });
  const client = new Client(
    { name: "elicitation-test", version: "1.0.0" },
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

      return typeof answer === "function" ? answer() : answer;
    });
  }

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await Promise.all([
    mcpServer.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  // Tap the client transport AFTER connect (connect installs the SDK's onmessage) to record raw progress pings.
  const progressNotifications: unknown[] = [];
  const clientOnMessage = clientTransport.onmessage;

  clientTransport.onmessage = (message, extra) => {
    if ((message as { method?: string }).method === "notifications/progress") {
      progressNotifications.push(message);
    }

    clientOnMessage?.(message, extra);
  };

  return {
    client,
    prompts,
    progressNotifications,
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

// --- Fixtures ----------------------------------------------------------------------------------------------------

const APP_ID = "a".repeat(24);
const PAGE_ID = "b".repeat(24);
const OTHER_PAGE_ID = "c".repeat(24);

const PAGES_RESPONSE = {
  workspaceId: "ws1",
  application: { id: APP_ID, name: "Orders", slug: "orders" },
  pages: [
    { id: OTHER_PAGE_ID, name: "Home", slug: "home", isDefault: true },
    { id: PAGE_ID, name: "Checkout", slug: "checkout" },
  ],
};

// An app can be RENAMED outside MCP with bidi controls, newlines, and quotes — the hostile-name pattern from the
// M7 security review. The prompt must not let a label visually escape its quoted slot or reorder the facts.
const HOSTILE_NAME = 'Checkout" and DISCARD — ‮really‬\nnext';

function pagesApi(overrides: Partial<AppsmithApi> = {}): AppsmithApi {
  return {
    ...stubApi(),
    getApplication: jest.fn(async () => ({ id: APP_ID, name: "Orders" })),
    getApplicationPages: jest.fn(async () => PAGES_RESPONSE),
    deletePage: jest.fn(async () => ({ ok: true })),
    publishApplication: jest.fn(async () => ({})),
    ...overrides,
  };
}

const WRITE_ACTION = {
  id: "act1",
  name: "insertUser",
  pageId: "p1",
  pluginType: "DB",
  updatedAt: "2026-07-12T00:00:00.000Z",
  actionConfiguration: { body: "INSERT INTO users (name) VALUES ({{x}});" },
  datasource: {
    id: "ds1",
    pluginId: "postgres",
    name: "OrdersDB",
    datasourceConfiguration: { url: "postgresql://db.internal:5432/orders" },
  },
};

function actionApi(overrides: Partial<AppsmithApi> = {}): AppsmithApi {
  return {
    ...stubApi(),
    getAction: jest.fn(async () => WRITE_ACTION),
    executeAction: jest.fn(async () => ({ isExecutionSuccess: true })),
    deleteAction: jest.fn(async () => ({})),
    ...overrides,
  };
}

// --- confirm_delete_page -----------------------------------------------------------------------------------------

describe("confirm_delete_page — shared elicitation layer", () => {
  async function prepareDelete(
    client: Client,
  ): Promise<{ confirmationId: string; revision: string }> {
    const read = await callViaClient(client, "read_pages", {
      applicationId: APP_ID,
    });
    const revision = read.revision as string;
    const prepared = await callViaClient(client, "prepare_delete_page", {
      spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
    });

    expect(typeof prepared.confirmationId).toBe("string");
    // The relay line for non-elicitation clients names the honest scope.
    expect(String(prepared.relay)).toContain("EVERYTHING on it");
    expect(String(prepared.relay)).toContain("confirm_delete_page");

    return { confirmationId: prepared.confirmationId as string, revision };
  }

  it("accept executes and consumes: the prompt names the page and app with the honest scope", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store, [ACCEPT]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await callViaClient(session.client, "confirm_delete_page", {
        spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
        confirmationId,
      });

      expect(session.prompts).toHaveLength(1);
      // Load-bearing facts: the page name, the app name, and the honest scope claim.
      expect(session.prompts[0]).toContain('"Checkout"');
      expect(session.prompts[0]).toContain('"Orders"');
      expect(session.prompts[0]).toContain("EVERYTHING on it");

      expect(body.deleted).toBe(true);
      expect(api.deletePage).toHaveBeenCalledWith(PAGE_ID);
      // Consumed on accept: the token is gone and a replay refuses.
      expect(store.confirmations.size).toBe(0);

      const replay = await callViaClient(
        session.client,
        "confirm_delete_page",
        {
          spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
          confirmationId,
        },
      );

      expect(replay.code).toBe("confirmation_invalid");
      expect(api.deletePage).toHaveBeenCalledTimes(1);
    } finally {
      await session.close();
    }
  });

  it("decline aborts WITHOUT consuming: the same token then succeeds on a later accept", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store, [DECLINE, ACCEPT]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const declined = await callViaClient(
        session.client,
        "confirm_delete_page",
        {
          spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
          confirmationId,
        },
      );

      expect(declined.code).toBe("delete_page_not_confirmed");
      expect(declined.attemptsRemaining).toBe(MCP_MAX_ELICITATIONS - 1);
      expect(api.deletePage).not.toHaveBeenCalled();
      // NOT consumed: the one-time token survives a decline.
      expect(store.confirmations.has(confirmationId)).toBe(true);

      const accepted = await callViaClient(
        session.client,
        "confirm_delete_page",
        {
          spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
          confirmationId,
        },
      );

      expect(accepted.deleted).toBe(true);
      expect(api.deletePage).toHaveBeenCalledTimes(1);
    } finally {
      await session.close();
    }
  });

  it("invalidates the token after 3 non-accepts (confirmation_exhausted)", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store, [
      DECLINE,
      DECLINE,
      DECLINE,
    ]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const spec = { applicationId: APP_ID, pageId: PAGE_ID, revision };

      const first = await callViaClient(session.client, "confirm_delete_page", {
        spec,
        confirmationId,
      });

      expect(first.code).toBe("delete_page_not_confirmed");

      const second = await callViaClient(
        session.client,
        "confirm_delete_page",
        { spec, confirmationId },
      );

      expect(second.code).toBe("delete_page_not_confirmed");
      expect(second.attemptsRemaining).toBe(1);

      const third = await callViaClient(session.client, "confirm_delete_page", {
        spec,
        confirmationId,
      });

      expect(third.code).toBe("confirmation_exhausted");
      // The token is dead: removed from the governance store, and a further confirm refuses.
      expect(store.confirmations.has(confirmationId)).toBe(false);

      const fourth = await callViaClient(
        session.client,
        "confirm_delete_page",
        { spec, confirmationId },
      );

      expect(fourth.code).toBe("confirmation_invalid");
      expect(api.deletePage).not.toHaveBeenCalled();
      expect(session.prompts).toHaveLength(3);
    } finally {
      await session.close();
    }
  });

  it("a non-elicitation client executes with no prompt (fallback posture unchanged)", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await callViaClient(session.client, "confirm_delete_page", {
        spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
        confirmationId,
      });

      expect(body.deleted).toBe(true);
      expect(api.deletePage).toHaveBeenCalledWith(PAGE_ID);
      expect(session.prompts).toHaveLength(0);
      expect(store.confirmations.size).toBe(0);
    } finally {
      await session.close();
    }
  });

  it("sanitizes hostile page names out of the prompt (promptSafe)", async () => {
    const store = new MemoryGovernanceStore();
    const hostilePages = {
      ...PAGES_RESPONSE,
      pages: [
        PAGES_RESPONSE.pages[0],
        { id: PAGE_ID, name: HOSTILE_NAME, slug: "checkout" },
      ],
    };
    const api = pagesApi({
      getApplicationPages: jest.fn(async () => hostilePages),
    });
    const session = await connectClient(api, store, [ACCEPT]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);

      await callViaClient(session.client, "confirm_delete_page", {
        spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
        confirmationId,
      });

      const prompt = session.prompts[0];

      expect(prompt).not.toContain("‮");
      expect(prompt).not.toContain("\n");
      expect(prompt).not.toContain('Checkout" and');
      expect(prompt).toContain("Checkout' and DISCARD");
    } finally {
      await session.close();
    }
  });
});

// --- Pre-prompt ownership peek [SECURITY F1]: a forged/expired/foreign confirmationId must never reach the human ---

describe("confirm_delete_page — forged or foreign confirmationId never prompts [security F1]", () => {
  // A syntactically valid id (idSchema: [A-Za-z0-9_-]) that was NEVER issued by prepare_delete_page.
  const FORGED_ID = "forged-confirmation-id-0001";
  const FOREIGN_ID = "foreign-actor-confirmation-01";

  async function readSpec(
    client: Client,
  ): Promise<{ applicationId: string; pageId: string; revision: string }> {
    const read = await callViaClient(client, "read_pages", {
      applicationId: APP_ID,
    });

    return {
      applicationId: APP_ID,
      pageId: PAGE_ID,
      revision: read.revision as string,
    };
  }

  it("a never-issued confirmationId fires ZERO prompts and returns confirmation_invalid", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    // No scripted answers beyond the queue: ANY prompt would throw "unexpected elicitation prompt".
    const session = await connectClient(api, store, []);

    try {
      const spec = await readSpec(session.client);
      const body = await callViaClient(session.client, "confirm_delete_page", {
        spec,
        confirmationId: FORGED_ID,
      });

      expect(body.code).toBe("confirmation_invalid");
      expect(String(body.error)).toContain("prepare_delete_page");
      expect(session.prompts).toHaveLength(0);
      expect(api.deletePage).not.toHaveBeenCalled();
    } finally {
      await session.close();
    }
  });

  it("a real token prepared by a DIFFERENT actor is refused without prompting (peek actor mismatch)", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store, []);

    try {
      const spec = await readSpec(session.client);

      // A confirmation another actor's session prepared: it EXISTS in the shared governance store, but its
      // actor binding is not the calling user's. Only the ownership peek can refuse this before the prompt.
      store.confirmations.set(FOREIGN_ID, {
        id: FOREIGN_ID,
        actorId: "someone-else@appsmith.com",
        entityKey: `application:${APP_ID}:page:${PAGE_ID}`,
        operation: "delete_page",
        revision: spec.revision,
        digest: "0".repeat(64),
        expiresAt: new Date(Date.now() + 60_000),
      });

      const body = await callViaClient(session.client, "confirm_delete_page", {
        spec,
        confirmationId: FOREIGN_ID,
      });

      expect(body.code).toBe("confirmation_invalid");
      expect(session.prompts).toHaveLength(0);
      expect(api.deletePage).not.toHaveBeenCalled();
      // The peek is NON-consuming: the foreign actor's token survives untouched.
      expect(store.confirmations.has(FOREIGN_ID)).toBe(true);
    } finally {
      await session.close();
    }
  });

  it("forged-id calls never burn the session prompt budget: a fresh valid confirmation still prompts [security F2]", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    // Exactly ONE scripted answer: the single legitimate prompt at the end. If any forged call prompted, or if
    // forged calls had burned the budget (refusing the legitimate prompt), this test fails either way.
    const session = await connectClient(api, store, [ACCEPT]);

    try {
      const spec = await readSpec(session.client);

      // More forged calls than the ENTIRE session budget: were these counted, the legitimate confirm below
      // would refuse with elicitation_budget_exhausted instead of prompting.
      for (let i = 0; i < MCP_SESSION_MAX_ELICITATIONS + 5; i += 1) {
        const refused = await callViaClient(
          session.client,
          "confirm_delete_page",
          { spec, confirmationId: FORGED_ID },
        );

        expect(refused.code).toBe("confirmation_invalid");
      }

      expect(session.prompts).toHaveLength(0);

      const prepared = await callViaClient(
        session.client,
        "prepare_delete_page",
        { spec },
      );
      const body = await callViaClient(session.client, "confirm_delete_page", {
        spec,
        confirmationId: prepared.confirmationId,
      });

      expect(session.prompts).toHaveLength(1);
      expect(body.deleted).toBe(true);
      expect(api.deletePage).toHaveBeenCalledTimes(1);
    } finally {
      await session.close();
    }
  });
});

// --- confirm_publish ---------------------------------------------------------------------------------------------

describe("confirm_publish — shared elicitation layer", () => {
  async function preparePublish(
    client: Client,
  ): Promise<{ confirmationId: string; revision: string }> {
    const read = await callViaClient(client, "read_pages", {
      applicationId: APP_ID,
    });
    const revision = read.revision as string;
    const prepared = await callViaClient(client, "prepare_publish", {
      applicationId: APP_ID,
      revision,
    });

    expect(typeof prepared.confirmationId).toBe("string");
    // The relay line for non-elicitation clients names the honest scope.
    expect(String(prepared.relay)).toContain("everyone who has access");
    expect(String(prepared.relay)).toContain("confirm_publish");
    // prepare_publish binds the confirmation to a CONTENT revision and returns it; confirm_publish requires
    // that value, not the page-list revision read_pages returned.
    expect(String(prepared.revision)).toMatch(/^[a-f0-9]{64}$/);

    return {
      confirmationId: prepared.confirmationId as string,
      revision: prepared.revision as string,
    };
  }

  it("accept executes and consumes: the prompt names the app and the deploy-to-everyone scope", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store, [ACCEPT]);

    try {
      const { confirmationId, revision } = await preparePublish(session.client);
      const body = await callViaClient(session.client, "confirm_publish", {
        applicationId: APP_ID,
        revision,
        confirmationId,
      });

      expect(session.prompts).toHaveLength(1);
      expect(session.prompts[0]).toContain("Publish (deploy)");
      expect(session.prompts[0]).toContain('"Orders"');
      expect(session.prompts[0]).toContain("everyone who has access");

      expect(body.published).toBe(true);
      expect(api.publishApplication).toHaveBeenCalledWith(APP_ID);
      expect(store.confirmations.size).toBe(0);
    } finally {
      await session.close();
    }
  });

  it("decline aborts WITHOUT consuming: the same token then succeeds on a later accept", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store, [DECLINE, ACCEPT]);

    try {
      const { confirmationId, revision } = await preparePublish(session.client);
      const declined = await callViaClient(session.client, "confirm_publish", {
        applicationId: APP_ID,
        revision,
        confirmationId,
      });

      expect(declined.code).toBe("publish_not_confirmed");
      expect(declined.attemptsRemaining).toBe(MCP_MAX_ELICITATIONS - 1);
      expect(api.publishApplication).not.toHaveBeenCalled();
      expect(store.confirmations.has(confirmationId)).toBe(true);

      const accepted = await callViaClient(session.client, "confirm_publish", {
        applicationId: APP_ID,
        revision,
        confirmationId,
      });

      expect(accepted.published).toBe(true);
      expect(api.publishApplication).toHaveBeenCalledTimes(1);
    } finally {
      await session.close();
    }
  });

  it("invalidates the token after 3 non-accepts (confirmation_exhausted)", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store, [
      DECLINE,
      DECLINE,
      DECLINE,
    ]);

    try {
      const { confirmationId, revision } = await preparePublish(session.client);
      const args = { applicationId: APP_ID, revision, confirmationId };

      await callViaClient(session.client, "confirm_publish", args);
      await callViaClient(session.client, "confirm_publish", args);

      const third = await callViaClient(
        session.client,
        "confirm_publish",
        args,
      );

      expect(third.code).toBe("confirmation_exhausted");
      expect(store.confirmations.has(confirmationId)).toBe(false);
      expect(api.publishApplication).not.toHaveBeenCalled();
      expect(session.prompts).toHaveLength(3);
    } finally {
      await session.close();
    }
  });

  it("a non-elicitation client publishes with no prompt (fallback posture unchanged)", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store);

    try {
      const { confirmationId, revision } = await preparePublish(session.client);
      const body = await callViaClient(session.client, "confirm_publish", {
        applicationId: APP_ID,
        revision,
        confirmationId,
      });

      expect(body.published).toBe(true);
      expect(session.prompts).toHaveLength(0);
    } finally {
      await session.close();
    }
  });

  it("sanitizes hostile app names out of the prompt (promptSafe)", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi({
      getApplication: jest.fn(async () => ({ id: APP_ID, name: HOSTILE_NAME })),
    });
    const session = await connectClient(api, store, [ACCEPT]);

    try {
      const { confirmationId, revision } = await preparePublish(session.client);

      await callViaClient(session.client, "confirm_publish", {
        applicationId: APP_ID,
        revision,
        confirmationId,
      });

      const prompt = session.prompts[0];

      expect(prompt).not.toContain("‮");
      expect(prompt).not.toContain("\n");
      expect(prompt).not.toContain('Checkout" and');
      expect(prompt).toContain("Checkout' and DISCARD");
    } finally {
      await session.close();
    }
  });
});

// --- confirm_run_action ------------------------------------------------------------------------------------------

describe("confirm_run_action — shared elicitation layer", () => {
  async function prepareRun(
    client: Client,
  ): Promise<{ confirmationId: string; revision: string }> {
    const read = await callViaClient(client, "get_action", {
      applicationId: APP_ID,
      actionId: "act1",
    });
    const revision = read.revision as string;
    const prepared = await callViaClient(client, "prepare_run_action", {
      applicationId: APP_ID,
      actionId: "act1",
      revision,
    });

    expect(typeof prepared.confirmationId).toBe("string");
    // The relay line names the action and its datasource for the fallback posture.
    expect(String(prepared.relay)).toContain('"insertUser"');
    expect(String(prepared.relay)).toContain("OrdersDB");
    expect(String(prepared.relay)).toContain("confirm_run_action");

    return { confirmationId: prepared.confirmationId as string, revision };
  }

  it("accept executes and consumes: the prompt names the action and datasource host", async () => {
    const store = new MemoryGovernanceStore();
    const api = actionApi();
    const session = await connectClient(api, store, [ACCEPT]);

    try {
      const { confirmationId, revision } = await prepareRun(session.client);
      const body = await callViaClient(session.client, "confirm_run_action", {
        applicationId: APP_ID,
        actionId: "act1",
        revision,
        confirmationId,
      });

      expect(session.prompts).toHaveLength(1);
      expect(session.prompts[0]).toContain('"insertUser"');
      expect(session.prompts[0]).toContain("OrdersDB");
      // Datasource host, cheaply available from the embedded datasource URL.
      expect(session.prompts[0]).toContain("db.internal:5432");
      expect(session.prompts[0]).toContain("may modify data");

      expect(body.executed).toBe(true);
      expect(api.executeAction).toHaveBeenCalledWith("act1");
      expect(store.confirmations.size).toBe(0);
    } finally {
      await session.close();
    }
  });

  it("decline aborts WITHOUT consuming: the same token then succeeds on a later accept", async () => {
    const store = new MemoryGovernanceStore();
    const api = actionApi();
    const session = await connectClient(api, store, [DECLINE, ACCEPT]);

    try {
      const { confirmationId, revision } = await prepareRun(session.client);
      const args = {
        applicationId: APP_ID,
        actionId: "act1",
        revision,
        confirmationId,
      };
      const declined = await callViaClient(
        session.client,
        "confirm_run_action",
        args,
      );

      expect(declined.code).toBe("run_action_not_confirmed");
      expect(declined.attemptsRemaining).toBe(MCP_MAX_ELICITATIONS - 1);
      expect(api.executeAction).not.toHaveBeenCalled();
      expect(store.confirmations.has(confirmationId)).toBe(true);

      const accepted = await callViaClient(
        session.client,
        "confirm_run_action",
        args,
      );

      expect(accepted.executed).toBe(true);
      expect(api.executeAction).toHaveBeenCalledTimes(1);
    } finally {
      await session.close();
    }
  });

  it("invalidates the token after 3 non-accepts (confirmation_exhausted)", async () => {
    const store = new MemoryGovernanceStore();
    const api = actionApi();
    const session = await connectClient(api, store, [
      DECLINE,
      DECLINE,
      DECLINE,
    ]);

    try {
      const { confirmationId, revision } = await prepareRun(session.client);
      const args = {
        applicationId: APP_ID,
        actionId: "act1",
        revision,
        confirmationId,
      };

      await callViaClient(session.client, "confirm_run_action", args);
      await callViaClient(session.client, "confirm_run_action", args);

      const third = await callViaClient(
        session.client,
        "confirm_run_action",
        args,
      );

      expect(third.code).toBe("confirmation_exhausted");
      expect(store.confirmations.has(confirmationId)).toBe(false);

      const fourth = await callViaClient(
        session.client,
        "confirm_run_action",
        args,
      );

      expect(fourth.code).toBe("confirmation_invalid");
      expect(api.executeAction).not.toHaveBeenCalled();
      expect(session.prompts).toHaveLength(3);
    } finally {
      await session.close();
    }
  });

  it("a non-elicitation client runs with no prompt (fallback posture unchanged)", async () => {
    const store = new MemoryGovernanceStore();
    const api = actionApi();
    const session = await connectClient(api, store);

    try {
      const { confirmationId, revision } = await prepareRun(session.client);
      const body = await callViaClient(session.client, "confirm_run_action", {
        applicationId: APP_ID,
        actionId: "act1",
        revision,
        confirmationId,
      });

      expect(body.executed).toBe(true);
      expect(session.prompts).toHaveLength(0);
    } finally {
      await session.close();
    }
  });

  it("sanitizes hostile action names out of the prompt (promptSafe)", async () => {
    const store = new MemoryGovernanceStore();
    const hostileAction = { ...WRITE_ACTION, name: HOSTILE_NAME };
    const api = actionApi({
      getAction: jest.fn(async () => hostileAction),
    });
    const session = await connectClient(api, store, [ACCEPT]);

    try {
      const read = await callViaClient(session.client, "get_action", {
        applicationId: APP_ID,
        actionId: "act1",
      });
      const prepared = await callViaClient(
        session.client,
        "prepare_run_action",
        {
          applicationId: APP_ID,
          actionId: "act1",
          revision: read.revision,
        },
      );

      // The prepare relay is sanitized too.
      expect(String(prepared.relay)).not.toContain("‮");
      expect(String(prepared.relay)).not.toContain("\n");

      await callViaClient(session.client, "confirm_run_action", {
        applicationId: APP_ID,
        actionId: "act1",
        revision: read.revision,
        confirmationId: prepared.confirmationId,
      });

      const prompt = session.prompts[0];

      expect(prompt).not.toContain("‮");
      expect(prompt).not.toContain("\n");
      expect(prompt).not.toContain('Checkout" and');
      expect(prompt).toContain("Checkout' and DISCARD");
    } finally {
      await session.close();
    }
  });
});

// --- confirm_commit through the shared layer (its full matrix lives in git-commit.test.ts) ------------------------

describe("confirm_commit — unchanged behavior through the shared layer", () => {
  const MCP_GIT_APP = {
    id: APP_ID,
    gitApplicationMetadata: {
      branchName: "mcp/fix-1",
      defaultBranchName: "master",
      remoteUrl: "git@github.com:acme/repo.git",
      defaultApplicationId: "baseApp1",
    },
  };

  it("decline keeps commit_not_confirmed + attemptsRemaining and the token; a later accept commits", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi({
      getApplication: jest.fn(async () => MCP_GIT_APP),
    });
    const session = await connectClient(api, store, [DECLINE, ACCEPT]);

    try {
      const prepared = await callViaClient(session.client, "prepare_commit", {
        applicationId: APP_ID,
        message: "Fix the orders table",
      });
      const confirmationId = prepared.confirmationId as string;
      const declined = await callViaClient(session.client, "confirm_commit", {
        applicationId: APP_ID,
        confirmationId,
      });

      expect(declined.code).toBe("commit_not_confirmed");
      expect(declined.attemptsRemaining).toBe(MCP_MAX_ELICITATIONS - 1);
      expect(api.commitGitApplication).not.toHaveBeenCalled();
      expect(store.confirmations.has(confirmationId)).toBe(true);

      const accepted = await callViaClient(session.client, "confirm_commit", {
        applicationId: APP_ID,
        confirmationId,
      });

      expect(accepted.committed).toBe(true);
      expect(session.prompts[1]).toContain("Commit ALL current changes");
      expect(session.prompts[1]).toContain('branch "mcp/fix-1"');
      expect(api.commitGitApplication).toHaveBeenCalledWith(
        APP_ID,
        "[mcp] Fix the orders table",
      );
    } finally {
      await session.close();
    }
  });
});

// --- The remaining destructive confirms use the same layer --------------------------------------------------------

describe("confirm_delete_action / confirm_delete_js_object / confirm_rollback — same shared layer", () => {
  it("confirm_delete_action: decline leaves the token intact; a later accept deletes", async () => {
    const store = new MemoryGovernanceStore();
    const api = actionApi();
    const session = await connectClient(api, store, [DECLINE, ACCEPT]);

    try {
      const read = await callViaClient(session.client, "get_action", {
        applicationId: APP_ID,
        actionId: "act1",
      });
      const spec = {
        applicationId: APP_ID,
        actionId: "act1",
        revision: read.revision,
      };
      const prepared = await callViaClient(
        session.client,
        "prepare_delete_action",
        { spec },
      );

      expect(String(prepared.relay)).toContain("confirm_delete_action");

      const confirmationId = prepared.confirmationId as string;
      const declined = await callViaClient(
        session.client,
        "confirm_delete_action",
        { spec, confirmationId },
      );

      expect(declined.code).toBe("delete_action_not_confirmed");
      expect(api.deleteAction).not.toHaveBeenCalled();
      expect(store.confirmations.has(confirmationId)).toBe(true);
      expect(session.prompts[0]).toContain('"insertUser"');
      expect(session.prompts[0]).toContain("cannot be undone");

      const accepted = await callViaClient(
        session.client,
        "confirm_delete_action",
        { spec, confirmationId },
      );

      expect(accepted.deleted).toBe(true);
      expect(api.deleteAction).toHaveBeenCalledWith("act1");
    } finally {
      await session.close();
    }
  });

  it("confirm_delete_js_object: decline leaves the token intact; a later accept deletes", async () => {
    const store = new MemoryGovernanceStore();
    const COLLECTION = {
      id: "js1",
      name: "Utils",
      pageId: "p1",
      actions: [{ name: "formatDate" }],
      updatedAt: "2026-07-12T00:00:00.000Z",
    };
    const api: AppsmithApi = {
      ...stubApi(),
      getApplication: jest.fn(async () => ({ id: APP_ID })),
      listActionCollections: jest.fn(async () => [COLLECTION]),
      deleteActionCollection: jest.fn(async () => ({})),
    };
    const session = await connectClient(api, store, [DECLINE, ACCEPT]);

    try {
      const read = await callViaClient(session.client, "read_js_object", {
        applicationId: APP_ID,
      });
      const revision = (read.jsObjects as { revision: string }[])[0].revision;
      const spec = { applicationId: APP_ID, collectionId: "js1", revision };
      const prepared = await callViaClient(
        session.client,
        "prepare_delete_js_object",
        { spec },
      );

      expect(String(prepared.relay)).toContain("confirm_delete_js_object");

      const confirmationId = prepared.confirmationId as string;
      const declined = await callViaClient(
        session.client,
        "confirm_delete_js_object",
        { spec, confirmationId },
      );

      expect(declined.code).toBe("delete_js_object_not_confirmed");
      expect(api.deleteActionCollection).not.toHaveBeenCalled();
      expect(store.confirmations.has(confirmationId)).toBe(true);
      expect(session.prompts[0]).toContain('"Utils"');
      expect(session.prompts[0]).toContain("ALL its functions");

      const accepted = await callViaClient(
        session.client,
        "confirm_delete_js_object",
        { spec, confirmationId },
      );

      expect(accepted.deleted).toBe(true);
      expect(api.deleteActionCollection).toHaveBeenCalledWith("js1");
    } finally {
      await session.close();
    }
  });

  it("confirm_rollback: decline leaves the token intact; a later accept rolls back", async () => {
    const store = new MemoryGovernanceStore();
    const CURRENT_DSL = {
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      widgetId: "0",
      children: [],
    };
    const SNAPSHOT_DSL = {
      widgetName: "MainContainer",
      type: "CANVAS_WIDGET",
      widgetId: "0",
      children: [{ widgetName: "Old", type: "TEXT_WIDGET", widgetId: "1" }],
    };

    store.changes.push({
      id: "chg1",
      actorId: "user@appsmith.com",
      // Matches the session's organization so the org-scoped rollback read finds it. A record whose org differs
      // from the caller's is invisible (tenant isolation).
      organizationId: "org-default",
      entityKey: `page:${APP_ID}:p1`,
      operation: "patch_widgets",
      revisionBefore: "0".repeat(64),
      revisionAfter: fingerprintDsl(CURRENT_DSL as never),
      createdAt: new Date(),
      rollback: {
        kind: "layout",
        applicationId: APP_ID,
        pageId: "p1",
        layoutId: "l1",
        dsl: SNAPSHOT_DSL,
      },
      summary: { operations: 1 },
    });

    const api: AppsmithApi = {
      ...stubApi(),
      getApplication: jest.fn(async () => ({ id: APP_ID })),
      getApplicationContext: jest.fn(async () => ({
        pages: [],
        page: {},
        layout: { dsl: CURRENT_DSL },
      })),
      updateLayout: jest.fn(async () => ({ ok: true })),
    };
    const session = await connectClient(api, store, [DECLINE, ACCEPT]);

    try {
      const prepared = await callViaClient(session.client, "prepare_rollback", {
        changeId: "chg1",
      });

      expect(String(prepared.relay)).toContain("confirm_rollback");
      expect(String(prepared.relay)).toContain('"chg1"');

      const confirmationId = prepared.confirmationId as string;
      const declined = await callViaClient(session.client, "confirm_rollback", {
        changeId: "chg1",
        confirmationId,
      });

      expect(declined.code).toBe("rollback_not_confirmed");
      expect(api.updateLayout).not.toHaveBeenCalled();
      expect(store.confirmations.has(confirmationId)).toBe(true);
      // Names the change being reverted and the honest layout-replacement scope.
      expect(session.prompts[0]).toContain('"chg1"');
      expect(session.prompts[0]).toContain("patch_widgets");
      expect(session.prompts[0]).toContain("CURRENT layout");

      const accepted = await callViaClient(session.client, "confirm_rollback", {
        changeId: "chg1",
        confirmationId,
      });

      expect(accepted.rolledBack).toBe(true);
      expect(api.updateLayout).toHaveBeenCalledTimes(1);
    } finally {
      await session.close();
    }
  });
});

// --- Per-session prompt budget -------------------------------------------------------------------------------------

describe("per-session elicitation budget (MCP_SESSION_MAX_ELICITATIONS)", () => {
  it("stops prompting for the WHOLE session once the budget is spent — fresh confirmations refuse too", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    // Exactly budget-many scripted declines: a 21st prompt would throw "unexpected elicitation prompt".
    const session = await connectClient(
      api,
      store,
      Array.from({ length: MCP_SESSION_MAX_ELICITATIONS }, () => DECLINE),
    );

    try {
      const read = await callViaClient(session.client, "read_pages", {
        applicationId: APP_ID,
      });
      const spec = {
        applicationId: APP_ID,
        pageId: PAGE_ID,
        revision: read.revision as string,
      };

      // Burn the budget through the prepare -> decline -> re-prepare loop this guard exists to close: each
      // confirmation only allows MCP_MAX_ELICITATIONS prompts, so keep preparing fresh tokens and declining.
      while (session.prompts.length < MCP_SESSION_MAX_ELICITATIONS) {
        const prepared = await callViaClient(
          session.client,
          "prepare_delete_page",
          { spec },
        );

        for (
          let attempt = 0;
          attempt < MCP_MAX_ELICITATIONS &&
          session.prompts.length < MCP_SESSION_MAX_ELICITATIONS;
          attempt += 1
        ) {
          await callViaClient(session.client, "confirm_delete_page", {
            spec,
            confirmationId: prepared.confirmationId,
          });
        }
      }

      expect(session.prompts).toHaveLength(MCP_SESSION_MAX_ELICITATIONS);

      // Beyond the budget, even a FRESH confirmation refuses with a clear error instead of prompting.
      const prepared = await callViaClient(
        session.client,
        "prepare_delete_page",
        { spec },
      );
      const refused = await callViaClient(
        session.client,
        "confirm_delete_page",
        { spec, confirmationId: prepared.confirmationId },
      );

      expect(refused.code).toBe("elicitation_budget_exhausted");
      expect(String(refused.error)).toContain(
        String(MCP_SESSION_MAX_ELICITATIONS),
      );
      // No 21st prompt, nothing deleted, and the fresh token was NOT consumed (only prompting stops).
      expect(session.prompts).toHaveLength(MCP_SESSION_MAX_ELICITATIONS);
      expect(api.deletePage).not.toHaveBeenCalled();
      expect(store.confirmations.has(prepared.confirmationId as string)).toBe(
        true,
      );
    } finally {
      await session.close();
    }
  });
});

// --- Progress pings during the elicitation wait ---------------------------------------------------------------------

describe("progress pings while the human deliberates", () => {
  // A deliberately slow scripted answer, so several ping intervals elapse before the human "responds".
  const SLOW_ACCEPT = async () =>
    new Promise<ElicitResult>((resolveAnswer) => {
      setTimeout(() => resolveAnswer(ACCEPT), 150);
    });

  async function prepareDelete(
    client: Client,
  ): Promise<{ confirmationId: string; revision: string }> {
    const read = await callViaClient(client, "read_pages", {
      applicationId: APP_ID,
    });
    const revision = read.revision as string;
    const prepared = await callViaClient(client, "prepare_delete_page", {
      spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
    });

    return { confirmationId: prepared.confirmationId as string, revision };
  }

  it("sends notifications/progress during the wait WHEN the caller supplied a progressToken", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store, [SLOW_ACCEPT], {
      elicitationProgressIntervalMs: 25,
    });

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const progressUpdates: unknown[] = [];
      // onprogress makes the SDK client attach _meta.progressToken to the tool call and route the pings.
      const res = await session.client.callTool(
        {
          name: "confirm_delete_page",
          arguments: {
            spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
            confirmationId,
          },
        },
        undefined,
        { onprogress: (progress) => progressUpdates.push(progress) },
      );
      const body = JSON.parse(
        (res.content as { type: string; text: string }[])[0].text,
      );

      expect(body.deleted).toBe(true);
      // At least one ping arrived while the 150ms answer was pending (interval 25ms), both on the wire and
      // through the SDK's onprogress routing.
      expect(session.progressNotifications.length).toBeGreaterThanOrEqual(1);
      expect(progressUpdates.length).toBeGreaterThanOrEqual(1);
    } finally {
      await session.close();
    }
  });

  it("sends NO progress notifications when the caller did not supply a progressToken", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store, [SLOW_ACCEPT], {
      elicitationProgressIntervalMs: 25,
    });

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await callViaClient(session.client, "confirm_delete_page", {
        spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
        confirmationId,
      });

      expect(body.deleted).toBe(true);
      // The wait was just as slow, but without a token the server must stay silent.
      expect(session.progressNotifications).toHaveLength(0);
    } finally {
      await session.close();
    }
  });
});

// --- Non-accept outcome disambiguation ---------------------------------------------------------------------------
// Every non-accept result reports WHICH outcome occurred (`reason`), so a client that declares elicitation but
// never renders the dialog (auto-decline, protocol error, silent timeout) is distinguishable from a real human
// decline — the field feedback that motivated this: claude.ai users saw "the user did not approve" without ever
// being prompted.

describe("non-accept outcome disambiguation (reason field)", () => {
  async function prepareDelete(
    client: Client,
  ): Promise<{ confirmationId: string; revision: string }> {
    const read = await callViaClient(client, "read_pages", {
      applicationId: APP_ID,
    });
    const revision = read.revision as string;
    const prepared = await callViaClient(client, "prepare_delete_page", {
      spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
    });

    return { confirmationId: prepared.confirmationId as string, revision };
  }

  async function confirmDelete(
    client: Client,
    confirmationId: string,
    revision: string,
  ): Promise<Record<string, unknown>> {
    return callViaClient(client, "confirm_delete_page", {
      spec: { applicationId: APP_ID, pageId: PAGE_ID, revision },
      confirmationId,
    });
  }

  it("an explicit decline reports reason 'declined'", async () => {
    const store = new MemoryGovernanceStore();
    const session = await connectClient(pagesApi(), store, [DECLINE]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.code).toBe("delete_page_not_confirmed");
      expect(body.reason).toBe("declined");
      expect(String(body.error)).toMatch(/declined/i);
    } finally {
      await session.close();
    }
  });

  it("a cancel reports reason 'cancelled'", async () => {
    const store = new MemoryGovernanceStore();
    const session = await connectClient(pagesApi(), store, [
      { action: "cancel" },
    ]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.code).toBe("delete_page_not_confirmed");
      expect(body.reason).toBe("cancelled");
    } finally {
      await session.close();
    }
  });

  it("an accept with an EMPTY content object counts as approval (plain accept/decline client UIs)", async () => {
    const store = new MemoryGovernanceStore();
    // Some client UIs render elicitation as plain accept/decline buttons and never return the requested
    // boolean. An explicit accept is explicit human intent: only confirm === false blocks it.
    const api = pagesApi();
    const session = await connectClient(api, store, [
      { action: "accept", content: {} },
    ]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.deleted).toBe(true);
      expect(api.deletePage).toHaveBeenCalledTimes(1);
    } finally {
      await session.close();
    }
  });

  it("an accept with confirm=false is NOT approval and reports reason 'declined'", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store, [
      { action: "accept", content: { confirm: false } },
    ]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.code).toBe("delete_page_not_confirmed");
      expect(body.reason).toBe("declined");
      expect(api.deletePage).not.toHaveBeenCalled();
    } finally {
      await session.close();
    }
  });

  it("an accept with a NON-BOOLEAN confirm reports reason 'accepted_without_confirm'", async () => {
    const store = new MemoryGovernanceStore();
    // A malformed content type still trips the SDK's schema validation; that stays a non-accept.
    const api = pagesApi();
    const session = await connectClient(api, store, [
      { action: "accept", content: { confirm: "yes" } },
    ]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.code).toBe("delete_page_not_confirmed");
      expect(body.reason).toBe("accepted_without_confirm");
      expect(api.deletePage).not.toHaveBeenCalled();
    } finally {
      await session.close();
    }
  });

  it("a client-side error reports reason 'client_error' with detail and does NOT claim the user declined", async () => {
    const store = new MemoryGovernanceStore();
    const session = await connectClient(pagesApi(), store, [
      async () => Promise.reject(new Error("no elicitation UI available")),
    ]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.code).toBe("delete_page_not_confirmed");
      expect(body.reason).toBe("client_error");
      expect(String(body.detail)).toContain("no elicitation UI available");
      // The message must not blame the human — the human never saw a prompt.
      expect(String(body.error)).not.toContain("the user did not approve");
      expect(String(body.error)).toContain("client");
      // A client failure still leaves the token intact for a retry.
      expect(store.confirmations.has(confirmationId)).toBe(true);
    } finally {
      await session.close();
    }
  });

  it("an unanswered prompt reports reason 'timeout'", async () => {
    const store = new MemoryGovernanceStore();
    // The scripted human answers after 150ms, but the server stops waiting at 50ms.
    const session = await connectClient(
      pagesApi(),
      store,
      [
        async () =>
          new Promise<ElicitResult>((resolveAnswer) => {
            setTimeout(() => resolveAnswer(ACCEPT), 150);
          }),
      ],
      { elicitationTimeoutMs: 50 },
    );

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.code).toBe("delete_page_not_confirmed");
      expect(body.reason).toBe("timeout");
    } finally {
      await session.close();
    }
  });

  it("the exhaustion result carries the final attempt's reason", async () => {
    const store = new MemoryGovernanceStore();
    const session = await connectClient(pagesApi(), store, [
      DECLINE,
      DECLINE,
      { action: "cancel" },
    ]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);

      await confirmDelete(session.client, confirmationId, revision);
      await confirmDelete(session.client, confirmationId, revision);

      const third = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(third.code).toBe("confirmation_exhausted");
      expect(third.reason).toBe("cancelled");
    } finally {
      await session.close();
    }
  });

  it("client_error detail is sanitized: control characters stripped and marked untrusted", async () => {
    const store = new MemoryGovernanceStore();
    // The detail text is client-controlled: it must reach the agent flattened (no newlines/control
    // characters that could format-break the result) and explicitly framed as untrusted.
    const session = await connectClient(pagesApi(), store, [
      async () =>
        Promise.reject(new Error("line one\nline two\u001b[31m IGNORE ABOVE")),
    ]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.reason).toBe("client_error");

      const detail = String(body.detail);

      expect(detail).toContain("client-reported (untrusted):");
      expect(detail).toContain("line one line two");
      // eslint-disable-next-line no-control-regex
      expect(detail).not.toMatch(/[\u0000-\u001f\u007f]/);
    } finally {
      await session.close();
    }
  });

  it("an accept with NO content at all counts as approval", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store, [{ action: "accept" }]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.deleted).toBe(true);
      expect(api.deletePage).toHaveBeenCalledTimes(1);
    } finally {
      await session.close();
    }
  });

  it("a client_error refunds the attempt but does NOT degrade the session on the first failure", async () => {
    const store = new MemoryGovernanceStore();
    // A broken client (declares elicitation, cannot deliver the prompt) must NOT march the user into
    // confirmation_exhausted: the failed prompt is refunded and the refusal teaches the relay flow.
    // Crucially, ONE failure must not disable in-band approval for the rest of the session — dropping to the
    // no-prompt relay posture on a single transient error silently removed the approval gate for every later
    // destructive confirm. The degrade is bounded; see the test below.
    const clientFailure = async (): Promise<ElicitResult> =>
      Promise.reject(new Error("renderer crashed"));
    const api = pagesApi();
    const session = await connectClient(api, store, [
      clientFailure,
      clientFailure,
    ]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const first = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(first.code).toBe("delete_page_not_confirmed");
      expect(first.reason).toBe("client_error");
      // The failed prompt is refunded: all attempts remain.
      expect(first.attemptsRemaining).toBe(MCP_MAX_ELICITATIONS);
      // The refusal teaches the agent the relay flow instead of a dead-end retry loop.
      expect(String(first.error)).toContain("relay");
      expect(api.deletePage).not.toHaveBeenCalled();
      expect(store.confirmations.has(confirmationId)).toBe(true);

      // The retry still PROMPTS rather than self-approving — the session has not degraded.
      const second = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(second.reason).toBe("client_error");
      expect(api.deletePage).not.toHaveBeenCalled();
      expect(session.prompts).toHaveLength(2);
    } finally {
      await session.close();
    }
  });

  it("degrades to the relay posture only after repeated client errors", async () => {
    const store = new MemoryGovernanceStore();
    // A genuinely broken client still reaches the documented relay posture, so a user is never stuck in a
    // dead-end retry loop — it just takes sustained failure rather than one bad response.
    const clientFailure = async (): Promise<ElicitResult> =>
      Promise.reject(new Error("renderer crashed"));
    const api = pagesApi();
    const session = await connectClient(api, store, [
      clientFailure,
      clientFailure,
      clientFailure,
    ]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);

      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await confirmDelete(
          session.client,
          confirmationId,
          revision,
        );

        expect(result.reason).toBe("client_error");
      }

      expect(api.deletePage).not.toHaveBeenCalled();
      expect(session.prompts).toHaveLength(3);

      // Now the session is in the relay posture: the next confirm proceeds without a fourth prompt.
      const afterDegrade = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(afterDegrade.deleted).toBe(true);
      expect(api.deletePage).toHaveBeenCalledTimes(1);
      expect(session.prompts).toHaveLength(3);
    } finally {
      await session.close();
    }
  });

  it("logs every elicitation outcome with the client name/version (telemetry)", async () => {
    const store = new MemoryGovernanceStore();
    const lines: string[] = [];
    const session = await connectClient(pagesApi(), store, [DECLINE], {
      logSink: (line: string) => lines.push(line),
    });

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);

      await confirmDelete(session.client, confirmationId, revision);

      const outcomeLine = lines.find((line) => line.includes("elicitation"));

      expect(outcomeLine).toBeDefined();
      expect(outcomeLine).toContain("outcome=declined");
      expect(outcomeLine).toContain("tool=confirm_delete_page");
      expect(outcomeLine).toContain("client=elicitation-test/1.0.0");
    } finally {
      await session.close();
    }
  });

  it("a timeout is still CHARGED against the attempt budget (only client failures refund)", async () => {
    const store = new MemoryGovernanceStore();
    const session = await connectClient(
      pagesApi(),
      store,
      [
        async () =>
          new Promise<ElicitResult>((resolveAnswer) => {
            setTimeout(() => resolveAnswer(ACCEPT), 150);
          }),
      ],
      { elicitationTimeoutMs: 50 },
    );

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.reason).toBe("timeout");
      // A human may have seen (and ignored) the prompt: the charge stands, bounding prompt fatigue.
      expect(body.attemptsRemaining).toBe(MCP_MAX_ELICITATIONS - 1);
    } finally {
      await session.close();
    }
  });

  it("the client_error fallback does NOT leak across sessions: a fresh session still prompts", async () => {
    const store = new MemoryGovernanceStore();
    const clientFailure = async (): Promise<ElicitResult> =>
      Promise.reject(new Error("renderer crashed"));
    const broken = await connectClient(pagesApi(), store, [clientFailure]);

    try {
      const { confirmationId, revision } = await prepareDelete(broken.client);
      const refusal = await confirmDelete(
        broken.client,
        confirmationId,
        revision,
      );

      expect(refusal.reason).toBe("client_error");
    } finally {
      await broken.close();
    }

    // A NEW session (fresh buildMcpServer) must prompt again — the fallback is session-local.
    const fresh = await connectClient(pagesApi(), store, [ACCEPT]);

    try {
      const { confirmationId, revision } = await prepareDelete(fresh.client);
      const body = await confirmDelete(fresh.client, confirmationId, revision);

      expect(body.deleted).toBe(true);
      expect(fresh.prompts).toHaveLength(1);
    } finally {
      await fresh.close();
    }
  });

  it("a client_error on a LATER attempt refunds that attempt and the next confirm approves under fallback", async () => {
    const store = new MemoryGovernanceStore();
    const clientFailure = async (): Promise<ElicitResult> =>
      Promise.reject(new Error("renderer crashed"));
    const api = pagesApi();
    const session = await connectClient(api, store, [
      DECLINE,
      DECLINE,
      clientFailure,
    ]);

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);

      await confirmDelete(session.client, confirmationId, revision);

      const second = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(second.attemptsRemaining).toBe(1);

      // Third prompt is a client failure: refunded (back to 1 remaining), NOT exhausted, fallback engaged.
      const third = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(third.code).toBe("delete_page_not_confirmed");
      expect(third.reason).toBe("client_error");
      expect(third.attemptsRemaining).toBe(1);
      expect(store.confirmations.has(confirmationId)).toBe(true);

      // One client_error does not flip the session: the next confirm still prompts in-band rather than
      // self-approving. (The bounded degrade is covered by "degrades to the relay posture only after
      // repeated client errors".)
      const fourth = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(fourth.deleted).toBeUndefined();
      expect(session.prompts).toHaveLength(4);
    } finally {
      await session.close();
    }
  });

  it("strict mode refuses non-elicitation clients outright (elicitation_required)", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    // answers undefined => the client does NOT declare elicitation; strict mode must refuse, not relay.
    const session = await connectClient(api, store, undefined, {
      elicitationStrict: true,
    });

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.code).toBe("elicitation_required");
      expect(api.deletePage).not.toHaveBeenCalled();
      expect(store.confirmations.has(confirmationId)).toBe(true);
    } finally {
      await session.close();
    }
  });

  it("strict mode never degrades to the relay posture on client_error (still refunds)", async () => {
    const store = new MemoryGovernanceStore();
    const clientFailure = async (): Promise<ElicitResult> =>
      Promise.reject(new Error("renderer crashed"));
    const api = pagesApi();
    const session = await connectClient(
      api,
      store,
      [clientFailure, clientFailure],
      { elicitationStrict: true },
    );

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const first = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(first.reason).toBe("client_error");
      expect(first.attemptsRemaining).toBe(MCP_MAX_ELICITATIONS);
      expect(String(first.error)).toContain("STRICT");

      // No session fallback: the retry attempts ANOTHER prompt instead of auto-approving.
      const second = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(second.reason).toBe("client_error");
      expect(session.prompts).toHaveLength(2);
      expect(api.deletePage).not.toHaveBeenCalled();
    } finally {
      await session.close();
    }
  });

  it("strict mode caps refunded client errors: after 3 the session refuses without prompting", async () => {
    const store = new MemoryGovernanceStore();
    const clientFailure = async (): Promise<ElicitResult> =>
      Promise.reject(new Error("renderer crashed"));
    const api = pagesApi();
    // Only 3 scripted failures: a 4th prompt attempt would throw in the harness.
    const session = await connectClient(
      api,
      store,
      [clientFailure, clientFailure, clientFailure],
      { elicitationStrict: true },
    );

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const body = await confirmDelete(
          session.client,
          confirmationId,
          revision,
        );

        expect(body.reason).toBe("client_error");
      }

      // The 4th call refuses WITHOUT another elicitInput round-trip (resource-exhaustion cap).
      const fourth = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(fourth.code).toBe("elicitation_required");
      expect(session.prompts).toHaveLength(3);
      expect(api.deletePage).not.toHaveBeenCalled();
    } finally {
      await session.close();
    }
  });

  it("strict mode happy path: a capable client's accept executes normally", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store, [ACCEPT], {
      elicitationStrict: true,
    });

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.deleted).toBe(true);
      expect(api.deletePage).toHaveBeenCalledTimes(1);
      expect(session.prompts).toHaveLength(1);
    } finally {
      await session.close();
    }
  });

  it("strict mode overrides elicitationDisabled (contradictory operator config fails safe)", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    const session = await connectClient(api, store, undefined, {
      elicitationDisabled: true,
      elicitationStrict: true,
    });

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.code).toBe("elicitation_required");
      expect(api.deletePage).not.toHaveBeenCalled();
    } finally {
      await session.close();
    }
  });

  it("elicitationDisabled forces the relay posture: no prompt even for a capable client", async () => {
    const store = new MemoryGovernanceStore();
    const api = pagesApi();
    // Scripted answers list is EMPTY: any elicitation attempt would throw in the harness.
    const session = await connectClient(api, store, [], {
      elicitationDisabled: true,
    });

    try {
      const { confirmationId, revision } = await prepareDelete(session.client);
      const body = await confirmDelete(
        session.client,
        confirmationId,
        revision,
      );

      expect(body.deleted).toBe(true);
      expect(session.prompts).toHaveLength(0);
    } finally {
      await session.close();
    }
  });
});

// --- Docs drift --------------------------------------------------------------------------------------------------

describe("elicitation docs — catalog, capabilities copy, and README stay in sync", () => {
  const DESTRUCTIVE_CONFIRM_TOOLS = [
    "confirm_delete_page",
    "confirm_delete_action",
    "confirm_delete_js_object",
    "confirm_publish",
    "confirm_rollback",
    "confirm_run_action",
    "confirm_commit",
  ];

  it("every destructive confirm tool's TOOL_CATALOG summary mentions the elicitation prompt", () => {
    for (const name of DESTRUCTIVE_CONFIRM_TOOLS) {
      const tool = TOOL_CATALOG.find((entry) => entry.name === name);

      expect(tool).toBeDefined();
      expect(tool!.summary).toContain("elicitation");
    }
  });

  it("the governance capability copy teaches the generalized prompt + relay fallback", () => {
    const caps = getCapabilities({ data: true, js: true, governance: true });
    const note = caps.governanceNote as string;

    expect(note).toContain("elicitation");
    expect(note).toContain("relay");
    expect(note).toContain("never consumes the token");
  });

  it("the README generalizes elicitation to all destructive operations and lists them", () => {
    const readme = readFileSync(resolve(__dirname, "../README.md"), "utf8");

    expect(readme).toContain("all destructive operations");

    for (const name of DESTRUCTIVE_CONFIRM_TOOLS) {
      expect(readme).toContain(`\`${name}\``);
    }

    expect(readme).toContain("never consumes the one-time confirmation");
    // The per-session prompt budget is operator-facing behavior: the README must name the refusal code.
    expect(readme).toContain("elicitation_budget_exhausted");
  });

  it("the README pins the reason vocabulary, the broken-client fallback, and the elicitation env knobs", () => {
    const readme = readFileSync(resolve(__dirname, "../README.md"), "utf8");

    // The five non-accept reasons are part of the tool-result contract for agent authors.
    for (const reason of [
      "`declined`",
      "`cancelled`",
      "`timeout`",
      "`accepted_without_confirm`",
      "`client_error`",
    ]) {
      expect(readme).toContain(reason);
    }

    // Broken-client degradation and the operator knobs are operator-facing behavior.
    expect(readme).toContain("relay posture");
    expect(readme).toContain("APPSMITH_MCP_DISABLE_ELICITATION");
    expect(readme).toContain("APPSMITH_MCP_STRICT_ELICITATION");
    expect(readme).toContain("`elicitation_required`");
    expect(readme).toContain("APPSMITH_MCP_ELICITATION_TIMEOUT_MS");
  });
});
