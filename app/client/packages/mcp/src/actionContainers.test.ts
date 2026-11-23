import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type {
  McpChangeRecord,
  McpGovernanceStore,
  PreparedConfirmation,
} from "./governance/store.js";

// The action-container seam (ce/extensions/actionContainers.ts, re-exported through ee/extensions). CE ships no
// containers, so these tests replace the ee/ module with a fake "workflow" container and check that the core action
// tools route through its hooks, and that application calls are unchanged.

class MemoryGovernanceStore implements McpGovernanceStore {
  readonly confirmations = new Map<string, PreparedConfirmation>();
  // The governance keys locked, in order, so a test can check a container's entityKey.
  readonly lockedKeys: string[] = [];
  async acquireLock(entityKey: string): Promise<string | undefined> {
    this.lockedKeys.push(entityKey);

    return "lock";
  }
  async releaseLock(): Promise<void> {}
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
  async saveChange(): Promise<void> {}
  async getChange(): Promise<McpChangeRecord | undefined> {
    return undefined;
  }
  async listChanges(): Promise<McpChangeRecord[]> {
    return [];
  }
  async getAnyChange(): Promise<McpChangeRecord | undefined> {
    return undefined;
  }
  async listAllChanges(): Promise<McpChangeRecord[]> {
    return [];
  }
}

const WORKFLOW_ACTION = {
  id: "wact1",
  name: "SendRejection",
  workflowId: "wf1",
  pluginType: "DB",
  pluginId: "smtp-plugin",
  updatedAt: "2026-11-01T00:00:00.000Z",
  datasource: { id: "ds1" },
  actionConfiguration: {
    formData: { command: "SEND", send: { to: "x@example.com" } },
    body: "old",
  },
};

const WORKFLOW_SQL_ACTION = {
  id: "wact3",
  name: "LoadTickets",
  workflowId: "wf1",
  pluginType: "DB",
  pluginId: "postgres-plugin",
  updatedAt: "2026-11-01T00:00:00.000Z",
  datasource: { id: "ds2" },
  actionConfiguration: { body: "SELECT 1" },
};

interface Hooks {
  listActions: jest.Mock;
  workspaceId: jest.Mock;
  prepareSpec: jest.Mock;
  placeAction: jest.Mock;
}

// Optional container fields a test can add to the fake workflow container.
interface ContainerOptions {
  entityKey?: (id: string, actionId: string) => string;
  hasPageLoad?: boolean;
  branchGate?: jest.Mock;
}

function mockContainer(options: ContainerOptions = {}): Hooks {
  const hooks: Hooks = {
    listActions: jest.fn(async () => [WORKFLOW_ACTION, WORKFLOW_SQL_ACTION]),
    workspaceId: jest.fn(async () => "ws1"),
    prepareSpec: jest.fn((source: Record<string, unknown>, id: string) => {
      if (source.reject === true) {
        return { ok: false, error: "refused by the container" };
      }

      return {
        ok: true,
        source: { ...source, applicationId: id, pageId: id },
      };
    }),
    placeAction: jest.fn((action: Record<string, unknown>, id: string) => {
      const placed: Record<string, unknown> = {
        ...action,
        workflowId: id,
        contextType: "WORKFLOW",
      };

      delete placed.pageId;

      return placed;
    }),
  };

  jest.doMock("./ee/extensions/actionContainers", () => ({
    ...jest.requireActual("./ce/extensions/actionContainers"),
    ACTION_CONTAINERS: [
      {
        idField: "workflowId",
        noun: "workflow",
        listActions: (_api: unknown, id: string) => hooks.listActions(id),
        workspaceId: (_api: unknown, id: string) => hooks.workspaceId(id),
        prepareSpec: hooks.prepareSpec,
        placeAction: hooks.placeAction,
        ...(options.entityKey ? { entityKey: options.entityKey } : {}),
        ...(options.hasPageLoad !== undefined
          ? { hasPageLoad: options.hasPageLoad }
          : {}),
        ...(options.branchGate
          ? {
              branchGate: (_api: unknown, id: string, branch?: string) =>
                options.branchGate!(id, branch),
            }
          : {}),
      },
    ],
  }));

  return hooks;
}

function stubApi(overrides: Record<string, unknown> = {}) {
  return {
    listActions: jest.fn(async () => []),
    getAction: jest.fn(async () => {
      throw new Error("the application path must not be used");
    }),
    getApplicationPages: jest.fn(async () => {
      throw new Error("the application path must not be used");
    }),
    listDatasources: jest.fn(async () => [
      { id: "ds1", name: "Mail", pluginId: "smtp-plugin" },
      { id: "ds2", name: "Tickets", pluginId: "postgres-plugin" },
    ]),
    listPlugins: jest.fn(async () => [
      { id: "smtp-plugin", packageName: "smtp-plugin" },
      { id: "postgres-plugin", packageName: "postgres-plugin" },
    ]),
    updateAction: jest.fn(async (_id: string, action: unknown) => ({
      ...WORKFLOW_ACTION,
      ...(action as object),
    })),
    createAction: jest.fn(async (action: unknown) => ({
      id: "wact2",
      ...(action as object),
    })),
    setActionRunBehaviour: jest.fn(async () => ({})),
    ...overrides,
  };
}

async function connectIsolated(
  api: Record<string, unknown>,
  store: MemoryGovernanceStore = new MemoryGovernanceStore(),
): Promise<{
  client: Client;
  call: (name: string, args: unknown) => Promise<Record<string, unknown>>;
}> {
  let server: { connect: (transport: unknown) => Promise<void> } | undefined;

  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { buildMcpServer } = require("./app");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { McpGovernanceCoordinator } = require("./governance/coordinator");

    server = buildMcpServer(api, {
      dataEnabled: true,
      jsEnabled: false,
      governance: new McpGovernanceCoordinator(store),
      actorId: "user@appsmith.com",
      organizationId: "org-1",
    });
  });

  const client = new Client({ name: "containers-test", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await Promise.all([
    server!.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  return {
    client,
    call: async (name, args) => {
      const response = (await client.callTool({
        name,
        arguments: args as Record<string, unknown>,
      })) as { content: { text: string }[] };

      return JSON.parse(response.content[0].text);
    },
  };
}

const EMAIL = {
  name: "SendRejection",
  datasourceId: "ds1",
  from: "noreply@example.com",
  to: "ops@example.com",
  subject: "Rejected",
  body: "Your request was rejected.",
};

describe("action containers", () => {
  afterEach(() => {
    jest.dontMock("./ee/extensions/actionContainers");
    jest.resetModules();
  });

  it("CE has no containers, so the action tools keep their application-only schema", async () => {
    const { client } = await connectIsolated(stubApi());

    try {
      const { tools } = await client.listTools();
      const schemaOf = (name: string) =>
        tools.find((tool) => tool.name === name)?.inputSchema;

      expect(schemaOf("list_actions")).toMatchObject({
        properties: { applicationId: expect.any(Object) },
        required: ["applicationId"],
      });
      expect(
        Object.keys(
          (schemaOf("get_action") as { properties: object }).properties,
        ).sort(),
      ).toEqual(["actionId", "applicationId"]);
    } finally {
      await client.close();
    }
  });

  describe("with a workflow container", () => {
    it("list_actions and get_action read through the container", async () => {
      const hooks = mockContainer();
      const api = stubApi();
      const { call, client } = await connectIsolated(api);

      try {
        const listed = await call("list_actions", { workflowId: "wf1" });
        const read = await call("get_action", {
          workflowId: "wf1",
          actionId: "wact1",
        });

        expect(hooks.listActions).toHaveBeenCalledWith("wf1");
        expect(JSON.stringify(listed)).toContain("SendRejection");
        expect((read.email as Record<string, unknown>).to).toBe(
          "x@example.com",
        );
        expect(api.getAction).not.toHaveBeenCalled();
      } finally {
        await client.close();
      }
    });

    it("refuses a call that names both or neither id", async () => {
      mockContainer();
      const { call, client } = await connectIsolated(stubApi());

      try {
        expect(
          (
            await call("list_actions", {
              workflowId: "wf1",
              applicationId: "app1",
            })
          ).error,
        ).toMatch(/exactly one of applicationId, workflowId/);
        expect((await call("list_actions", {})).error).toMatch(
          /exactly one of/,
        );
      } finally {
        await client.close();
      }
    });

    it("keeps application calls on the core path", async () => {
      mockContainer();
      const api = stubApi({ listActions: jest.fn(async () => []) });
      const { call, client } = await connectIsolated(api);

      try {
        await call("list_actions", { applicationId: "app1" });

        expect(api.listActions).toHaveBeenCalledWith("app1");
      } finally {
        await client.close();
      }
    });

    it("update_action prepares, compiles and places a workflow email, with the container's workspace", async () => {
      const hooks = mockContainer();
      const api = stubApi();
      const { call, client } = await connectIsolated(api);

      try {
        const read = await call("get_action", {
          workflowId: "wf1",
          actionId: "wact1",
        });
        const updated = await call("update_action", {
          spec: {
            kind: "SMTP",
            workflowId: "wf1",
            actionId: "wact1",
            revision: read.revision,
            email: EMAIL,
          },
        });

        expect(updated.updated).toBe(true);
        expect(hooks.prepareSpec).toHaveBeenCalledWith(EMAIL, "wf1", "SMTP");
        expect(hooks.placeAction).toHaveBeenCalledWith(
          expect.any(Object),
          "wf1",
          "SMTP",
        );
        expect(hooks.workspaceId).toHaveBeenCalledWith("wf1");
        expect(api.getApplicationPages).not.toHaveBeenCalled();

        const patch = (api.updateAction as jest.Mock).mock.calls[0][1];

        expect(patch).toMatchObject({
          workflowId: "wf1",
          contextType: "WORKFLOW",
          executeOnLoad: false,
        });
        expect(patch).not.toHaveProperty("pageId");
        expect(api.setActionRunBehaviour).toHaveBeenCalledWith(
          "wact1",
          "MANUAL",
        );
      } finally {
        await client.close();
      }
    });

    it("update_action relays a container's refusal and writes nothing", async () => {
      mockContainer();
      const api = stubApi();
      const { call, client } = await connectIsolated(api);

      try {
        const updated = await call("update_action", {
          spec: {
            kind: "SMTP",
            workflowId: "wf1",
            actionId: "wact1",
            revision: "a".repeat(64),
            email: { ...EMAIL, reject: true },
          },
        });

        expect(updated.error).toBe("refused by the container");
        expect(api.updateAction).not.toHaveBeenCalled();
      } finally {
        await client.close();
      }
    });

    it("refuses a branch for a container without its own branch gate", async () => {
      mockContainer();
      const api = stubApi();
      const { call, client } = await connectIsolated(api);

      try {
        const read = await call("get_action", {
          workflowId: "wf1",
          actionId: "wact1",
        });
        const updated = await call("update_action", {
          spec: {
            kind: "SMTP",
            workflowId: "wf1",
            actionId: "wact1",
            revision: read.revision,
            name: "Renamed",
          },
          branch: "main",
        });

        expect(updated.code).toBe("git_branch_unsupported");
        expect(api.updateAction).not.toHaveBeenCalled();
      } finally {
        await client.close();
      }
    });

    it("duplicate_action copies a workflow action into the same workflow", async () => {
      const hooks = mockContainer();
      const api = stubApi();
      const { call, client } = await connectIsolated(api);

      try {
        const read = await call("get_action", {
          workflowId: "wf1",
          actionId: "wact1",
        });
        const duplicated = await call("duplicate_action", {
          spec: {
            kind: "SMTP",
            workflowId: "wf1",
            actionId: "wact1",
            revision: read.revision,
            name: "SendRejectionCopy",
          },
        });

        expect(duplicated.duplicated).toBe(true);
        expect(hooks.placeAction).toHaveBeenCalledWith(
          expect.any(Object),
          "wf1",
          "SMTP",
        );
        expect((api.createAction as jest.Mock).mock.calls[0][0]).toMatchObject({
          name: "SendRejectionCopy",
          workflowId: "wf1",
          contextType: "WORKFLOW",
        });
        // The copy is an email too, so it is pinned to Manual.
        expect(api.setActionRunBehaviour).toHaveBeenCalledWith(
          "wact2",
          "MANUAL",
        );
      } finally {
        await client.close();
      }
    });

    it("duplicate_action places a copy by the stored kind, not a mislabelled one", async () => {
      const hooks = mockContainer();
      const { call, client } = await connectIsolated(stubApi());

      try {
        const read = await call("get_action", {
          workflowId: "wf1",
          actionId: "wact1",
        });

        await call("duplicate_action", {
          spec: {
            kind: "SQL",
            workflowId: "wf1",
            actionId: "wact1",
            revision: read.revision,
            name: "SendRejectionCopy",
          },
        });

        expect(hooks.placeAction).toHaveBeenCalledWith(
          expect.any(Object),
          "wf1",
          "SMTP",
        );
      } finally {
        await client.close();
      }
    });

    it("update_action passes a SQL spec's query object and kind to prepareSpec", async () => {
      const hooks = mockContainer();
      const api = stubApi();
      const { call, client } = await connectIsolated(api);
      const query = {
        name: "LoadTickets",
        datasourceId: "ds2",
        operation: "SELECT",
        table: "tickets",
      };

      try {
        const read = await call("get_action", {
          workflowId: "wf1",
          actionId: "wact3",
        });
        const updated = await call("update_action", {
          spec: {
            kind: "SQL",
            workflowId: "wf1",
            actionId: "wact3",
            revision: read.revision,
            query,
          },
        });

        expect(updated.updated).toBe(true);
        expect(hooks.prepareSpec).toHaveBeenCalledWith(query, "wf1", "SQL");
        expect(hooks.placeAction).toHaveBeenCalledWith(
          expect.any(Object),
          "wf1",
          "SQL",
        );
        // A SQL update is not an email, so nothing is pinned.
        expect(api.setActionRunBehaviour).not.toHaveBeenCalled();
      } finally {
        await client.close();
      }
    });

    it("uses the container's entityKey for the governance lock", async () => {
      mockContainer({
        entityKey: (id, actionId) => `workflow:${id}:action:${actionId}`,
      });
      const api = stubApi();
      const store = new MemoryGovernanceStore();
      const { call, client } = await connectIsolated(api, store);

      try {
        const read = await call("get_action", {
          workflowId: "wf1",
          actionId: "wact1",
        });

        await call("update_action", {
          spec: {
            kind: "SMTP",
            workflowId: "wf1",
            actionId: "wact1",
            revision: read.revision,
            name: "Renamed",
          },
        });
        await call("duplicate_action", {
          spec: {
            kind: "SMTP",
            workflowId: "wf1",
            actionId: "wact1",
            revision: read.revision,
            name: "SendRejectionCopy",
          },
        });

        expect(store.lockedKeys).toEqual([
          "workflow:wf1:action:wact1",
          "workflow:wf1:action:wact1",
        ]);
      } finally {
        await client.close();
      }
    });

    it("uses action:<actionId> for the governance lock when the container sets no entityKey", async () => {
      mockContainer();
      const store = new MemoryGovernanceStore();
      const { call, client } = await connectIsolated(stubApi(), store);

      try {
        const read = await call("get_action", {
          workflowId: "wf1",
          actionId: "wact1",
        });

        await call("update_action", {
          spec: {
            kind: "SMTP",
            workflowId: "wf1",
            actionId: "wact1",
            revision: read.revision,
            name: "Renamed",
          },
        });

        expect(store.lockedKeys).toEqual(["action:wact1"]);
      } finally {
        await client.close();
      }
    });

    it.each(["prepareSpec", "placeAction"] as const)(
      "reports a throw from %s as a compile error and writes nothing",
      async (hook) => {
        const hooks = mockContainer();

        hooks[hook].mockImplementation(() => {
          throw new Error(`${hook} failed`);
        });

        const api = stubApi();
        const { call, client } = await connectIsolated(api);

        try {
          const updated = await call("update_action", {
            spec: {
              kind: "SMTP",
              workflowId: "wf1",
              actionId: "wact1",
              revision: "a".repeat(64),
              email: EMAIL,
            },
          });

          expect(updated.valid).toBe(false);
          expect(JSON.stringify(updated.errors)).toContain(`${hook} failed`);
          expect(api.updateAction).not.toHaveBeenCalled();
          expect(api.setActionRunBehaviour).not.toHaveBeenCalled();
        } finally {
          await client.close();
        }
      },
    );

    it("reports a throw from listActions while update_action reads the action as a compile error", async () => {
      const hooks = mockContainer();

      hooks.listActions.mockRejectedValue(new Error("listActions failed"));

      const api = stubApi();
      const { call, client } = await connectIsolated(api);

      try {
        const updated = await call("update_action", {
          spec: {
            kind: "SMTP",
            workflowId: "wf1",
            actionId: "wact1",
            revision: "a".repeat(64),
            email: EMAIL,
          },
        });

        expect(updated.valid).toBe(false);
        expect(JSON.stringify(updated.errors)).toContain("listActions failed");
        expect(api.updateAction).not.toHaveBeenCalled();
      } finally {
        await client.close();
      }
    });

    it("reports a throw from listActions in list_actions as a tool error", async () => {
      const hooks = mockContainer();

      hooks.listActions.mockRejectedValue(new Error("listActions failed"));

      const { client } = await connectIsolated(stubApi());

      try {
        const response = (await client.callTool({
          name: "list_actions",
          arguments: { workflowId: "wf1" },
        })) as { isError?: boolean; content: { text: string }[] };

        expect(response.isError).toBe(true);
        expect(response.content[0].text).toContain("listActions failed");
      } finally {
        await client.close();
      }
    });

    it("skips the Manual pins for a container without page load", async () => {
      mockContainer({ hasPageLoad: false });
      const api = stubApi();
      const { call, client } = await connectIsolated(api);

      try {
        const read = await call("get_action", {
          workflowId: "wf1",
          actionId: "wact1",
        });
        const updated = await call("update_action", {
          spec: {
            kind: "SMTP",
            workflowId: "wf1",
            actionId: "wact1",
            revision: read.revision,
            email: EMAIL,
          },
        });
        const duplicated = await call("duplicate_action", {
          spec: {
            kind: "SMTP",
            workflowId: "wf1",
            actionId: "wact1",
            revision: read.revision,
            name: "SendRejectionCopy",
          },
        });

        expect(updated.updated).toBe(true);
        expect(duplicated.duplicated).toBe(true);
        expect(api.setActionRunBehaviour).not.toHaveBeenCalled();
      } finally {
        await client.close();
      }
    });

    it("runs the container's branch gate and relays its refusal", async () => {
      const branchGate = jest.fn(async (_id: string, branch?: string) =>
        branch === "main"
          ? { ok: true }
          : {
              ok: false,
              result: {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      error: "no such workflow branch",
                      code: "git_branch_unknown",
                    }),
                  },
                ],
              },
            },
      );

      mockContainer({ branchGate });
      const api = stubApi();
      const { call, client } = await connectIsolated(api);

      try {
        const read = await call("get_action", {
          workflowId: "wf1",
          actionId: "wact1",
        });
        const spec = {
          kind: "SMTP",
          workflowId: "wf1",
          actionId: "wact1",
          revision: read.revision,
          name: "Renamed",
        };
        const refused = await call("update_action", { spec, branch: "dev" });

        expect(refused.code).toBe("git_branch_unknown");
        expect(api.updateAction).not.toHaveBeenCalled();

        const allowed = await call("update_action", { spec, branch: "main" });

        expect(allowed.updated).toBe(true);
        expect(branchGate).toHaveBeenNthCalledWith(1, "wf1", "dev");
        expect(branchGate).toHaveBeenNthCalledWith(2, "wf1", "main");
      } finally {
        await client.close();
      }
    });

    it("get_action reports an error for an action that is not in the container", async () => {
      mockContainer();
      const api = stubApi();
      const { client } = await connectIsolated(api);

      try {
        const response = (await client.callTool({
          name: "get_action",
          arguments: { workflowId: "wf1", actionId: "missing1" },
        })) as { isError?: boolean; content: { text: string }[] };

        expect(response.isError).toBe(true);
        expect(response.content[0].text).toMatch(
          /action missing1 was not found in workflow wf1/,
        );
        expect(api.getAction).not.toHaveBeenCalled();
      } finally {
        await client.close();
      }
    });
  });
});
