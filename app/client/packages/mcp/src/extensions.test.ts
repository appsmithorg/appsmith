import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { z } from "zod";
import { getCapabilities, TOOL_CATALOG } from "./builder/capabilities.js";
import {
  EXTENSION_GATE_REQUIREMENTS,
  EXTENSION_TOOL_ANNOTATIONS,
  EXTENSION_TOOL_CATALOG,
} from "./ee/extensions/catalog.js";
import { TOOL_ANNOTATIONS } from "./toolAnnotations.js";

// The edition extension seam (src/ce/extensions, re-exported through src/ee/extensions). These invariants hold for
// any edition's implementation, so they keep guarding EE once it overrides the ee/ modules: an extension describes its
// tools consistently, can never shadow or relabel a core tool, API method, capability section or guide, and its tools
// are registered only through the enforcing host. The mocked tests replace the ee/ modules wholesale, so they do not
// depend on what an edition ships.

function okFetch(): typeof fetch {
  return (async () =>
    new Response(JSON.stringify({ data: {} }), {
      status: 200,
    })) as unknown as typeof fetch;
}

const READ = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const WORKFLOWS_REQUIREMENT = {
  requires: "ask your Appsmith administrator to enable workflows",
  provides: "workflow tools",
};

interface MockHost {
  registerTool: (...args: unknown[]) => unknown;
  gates: unknown;
  result: (data: unknown) => unknown;
}

interface McpServerLike {
  connect: (transport: unknown) => Promise<void>;
}

interface IsolatedApp {
  buildMcpServer: (api: unknown, ctx?: unknown) => McpServerLike;
  createMcpHttpServer: (
    apiBaseUrl: string,
    createApi: (token: string) => unknown,
    options?: Record<string, unknown>,
  ) => Server;
}

// The whole data module, with CE's empty defaults for anything a test does not set.
function mockCatalog(overrides: Record<string, unknown>) {
  jest.doMock("./ee/extensions/catalog", () => ({
    EXTENSION_TOOL_CATALOG: [],
    EXTENSION_TOOL_ANNOTATIONS: {},
    EXTENSION_GATE_REQUIREMENTS: {},
    EXTENSION_GUIDES: [],
    EXTENSION_SERVER_INSTRUCTIONS: "",
    ...overrides,
  }));
}

function mockTools(overrides: Record<string, unknown>) {
  jest.doMock("./ee/extensions/tools", () => ({
    registerExtensionTools: () => undefined,
    resolveExtensionGates: async () => ({}),
    ...overrides,
  }));
}

// One extension tool, list_workflows, read-only, under the given gate.
function mockWorkflowsCatalog(gate: string) {
  mockCatalog({
    EXTENSION_TOOL_CATALOG: [
      { name: "list_workflows", gate, summary: "list workflows" },
    ],
    EXTENSION_TOOL_ANNOTATIONS: { list_workflows: READ },
    EXTENSION_GATE_REQUIREMENTS: { workflows: WORKFLOWS_REQUIREMENT },
  });
}

// Registers list_workflows unconditionally (as an edition should) and records what the host returned.
function registerListWorkflows(registered: unknown[]) {
  return (host: MockHost) => {
    registered.push(
      host.registerTool("list_workflows", "List workflows.", {}, async () =>
        host.result({ workflows: [] }),
      ),
    );
  };
}

function loadApp(): IsolatedApp {
  let app: IsolatedApp | undefined;

  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    app = require("./app");
  });

  return app as IsolatedApp;
}

async function connect(server: McpServerLike): Promise<Client> {
  const client = new Client({ name: "extensions-test", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  return client;
}

async function callJson(
  client: Client,
  name: string,
  args: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const res = await client.callTool({ name, arguments: args });

  return JSON.parse((res.content as { text: string }[])[0].text);
}

interface CapabilitiesView {
  tools: string[];
  gates: { extensions: Record<string, boolean> };
  disabledCapabilities: {
    groups: { requires: string; provides: string; tools: string[] }[];
  };
}

async function capabilitiesOf(client: Client): Promise<CapabilitiesView> {
  return (await callJson(
    client,
    "get_capabilities",
  )) as unknown as CapabilitiesView;
}

async function toolNames(client: Client): Promise<string[]> {
  return (await client.listTools()).tools.map((tool) => tool.name);
}

describe("edition extension seam", () => {
  it("annotates exactly the extension tools it catalogs", () => {
    expect(Object.keys(EXTENSION_TOOL_ANNOTATIONS).sort()).toEqual(
      EXTENSION_TOOL_CATALOG.map((tool) => tool.name).sort(),
    );
  });

  it("merges extension tools into the catalog and the annotation table", () => {
    for (const tool of EXTENSION_TOOL_CATALOG) {
      expect(TOOL_CATALOG).toContainEqual(tool);
      expect(TOOL_ANNOTATIONS[tool.name]).toEqual(
        EXTENSION_TOOL_ANNOTATIONS[tool.name],
      );
    }
  });

  it("describes every edition gate it uses and ships no destructive extension tool", () => {
    for (const tool of EXTENSION_TOOL_CATALOG) {
      if (tool.gate.startsWith("extension:")) {
        expect(EXTENSION_GATE_REQUIREMENTS).toHaveProperty([
          tool.gate.slice("extension:".length),
        ]);
      }

      const { destructiveHint, readOnlyHint } =
        EXTENSION_TOOL_ANNOTATIONS[tool.name] ?? {};

      expect(destructiveHint ?? readOnlyHint !== true).toBe(false);
    }
  });

  it("always reports a workflows section in get_capabilities", () => {
    expect(getCapabilities()).toHaveProperty("workflows.available");
  });

  it("reports no extension gates when none are given", () => {
    expect(getCapabilities().gates.extensions).toEqual({});
  });

  describe("with a mocked edition extension", () => {
    // doMock registrations outlive resetModules, so each one is dropped explicitly.
    afterEach(() => {
      jest.dontMock("./ee/extensions/api");
      jest.dontMock("./ee/extensions/catalog");
      jest.dontMock("./ee/extensions/tools");
      jest.dontMock("./ee/extensions/capabilities");
      jest.resetModules();
    });

    it("refuses an extension tool that shadows a core tool", () => {
      mockCatalog({
        EXTENSION_TOOL_CATALOG: [
          { name: "build_application", gate: "always", summary: "shadow" },
        ],
      });

      jest.isolateModules(() => {
        expect(() => require("./builder/capabilities")).toThrow(
          'MCP extension tool "build_application" collides with core',
        );
      });
    });

    it("refuses an extension annotation that relabels a core tool", () => {
      mockCatalog({
        EXTENSION_TOOL_ANNOTATIONS: {
          confirm_publish: { readOnlyHint: true, destructiveHint: false },
        },
      });

      jest.isolateModules(() => {
        expect(() => require("./toolAnnotations")).toThrow(
          'MCP extension annotation "confirm_publish" collides with core',
        );
      });
    });

    it("refuses an edition gate that has no EXTENSION_GATE_REQUIREMENTS entry", () => {
      mockCatalog({
        EXTENSION_TOOL_CATALOG: [
          {
            name: "list_workflows",
            gate: "extension:workflows",
            summary: "list workflows",
          },
        ],
        EXTENSION_TOOL_ANNOTATIONS: { list_workflows: READ },
      });

      jest.isolateModules(() => {
        expect(() => require("./builder/capabilities")).toThrow(
          'MCP extension tool "list_workflows" uses gate "extension:workflows", which has no EXTENSION_GATE_REQUIREMENTS entry',
        );
      });
    });

    it("refuses an extension API method that replaces a core one", () => {
      jest.doMock("./ee/extensions/api", () => ({
        createExtensionApi: () => ({ validateToken: async () => ({}) }),
      }));

      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createAppsmithApi } = require("./app");

        expect(() =>
          createAppsmithApi("token", "http://server.test", okFetch()),
        ).toThrow(
          'MCP extension API method "validateToken" collides with core',
        );
      });
    });

    it("hands extension API methods the authenticated request", async () => {
      const calls: { url: string; auth: string | null }[] = [];
      const recordingFetch = (async (url: string, init?: RequestInit) => {
        calls.push({
          url,
          auth: new Headers(init?.headers).get("Authorization"),
        });

        return new Response(JSON.stringify({ data: { id: "w1" } }), {
          status: 200,
        });
      }) as unknown as typeof fetch;

      jest.doMock("./ee/extensions/api", () => ({
        createExtensionApi: (request: (path: string) => Promise<unknown>) => ({
          getWorkflow: async (id: string) =>
            request(`/api/v1/workflows/${encodeURIComponent(id)}`),
        }),
      }));

      let api: Record<string, (...args: unknown[]) => Promise<unknown>> = {};

      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createAppsmithApi } = require("./app");

        api = createAppsmithApi("token", "http://server.test", recordingFetch);
      });

      await expect(api.getWorkflow("w1")).resolves.toEqual({ id: "w1" });
      expect(calls).toEqual([
        {
          url: "http://server.test/api/v1/workflows/w1",
          auth: "Bearer token",
        },
      ]);
    });

    it("registers extension tools through the host, with their annotations and the session's gates", async () => {
      const seenGates: unknown[] = [];

      mockCatalog({
        EXTENSION_TOOL_CATALOG: [
          { name: "list_workflows", gate: "always", summary: "list workflows" },
        ],
        EXTENSION_TOOL_ANNOTATIONS: { list_workflows: READ },
      });
      mockTools({
        registerExtensionTools: (host: MockHost) => {
          seenGates.push(host.gates);
          host.registerTool("list_workflows", "List workflows.", {}, async () =>
            host.result({ workflows: [] }),
          );
        },
      });

      let buildMcpServer: IsolatedApp["buildMcpServer"] | undefined;
      let isolatedCatalog: { name: string }[] = [];

      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        buildMcpServer = require("./app").buildMcpServer;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        isolatedCatalog = require("./builder/capabilities").TOOL_CATALOG;
      });

      // The extension tool is merged into the catalog get_capabilities is generated from.
      expect(isolatedCatalog).toContainEqual({
        name: "list_workflows",
        gate: "always",
        summary: "list workflows",
      });

      const client = await connect(
        buildMcpServer!(
          {},
          { dataEnabled: true, jsEnabled: false, actorId: "user@appsmith.com" },
        ),
      );

      try {
        const { tools } = await client.listTools();
        const tool = tools.find((entry) => entry.name === "list_workflows");
        const called = await client.callTool({
          name: "list_workflows",
          arguments: {},
        });
        const capabilities = await capabilitiesOf(client);

        expect(seenGates).toEqual([
          { data: true, js: false, governance: false, extensions: {} },
        ]);
        expect(tool?.annotations).toEqual(READ);
        expect(called.content).toEqual([
          { type: "text", text: JSON.stringify({ workflows: [] }, null, 2) },
        ]);
        expect(capabilities.tools).toContain("list_workflows — list workflows");
      } finally {
        await client.close();
      }
    });

    it("refuses an extension capability section that overwrites a core one", () => {
      jest.doMock("./ee/extensions/capabilities", () => ({
        extensionCapabilities: () => ({ tools: [] }),
      }));

      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { getCapabilities: isolated } = require("./builder/capabilities");

        expect(() => isolated()).toThrow(
          'MCP extension capability "tools" collides with core',
        );
      });
    });

    describe("host registrar enforcement", () => {
      it("refuses a tool that is not in EXTENSION_TOOL_CATALOG", () => {
        mockWorkflowsCatalog("always");
        mockTools({
          registerExtensionTools: (host: MockHost) => {
            host.registerTool("rogue_tool", "Not catalogued.", {}, async () =>
              host.result({}),
            );
          },
        });

        const { buildMcpServer } = loadApp();

        expect(() => buildMcpServer({})).toThrow(
          'MCP extension tool "rogue_tool" is not in EXTENSION_TOOL_CATALOG',
        );
      });

      it("skips a tool whose edition gate is off and reports it in disabledCapabilities", async () => {
        const registered: unknown[] = [];

        mockWorkflowsCatalog("extension:workflows");
        mockTools({
          registerExtensionTools: registerListWorkflows(registered),
        });

        const { buildMcpServer } = loadApp();
        // A non-boolean truthy value is still off: only exactly true enables a gate.
        const client = await connect(
          buildMcpServer(
            {},
            {
              dataEnabled: false,
              jsEnabled: false,
              actorId: "user@appsmith.com",
              extensionGates: { workflows: "true" },
            },
          ),
        );

        try {
          const capabilities = await capabilitiesOf(client);

          expect(registered).toEqual([undefined]);
          expect(await toolNames(client)).not.toContain("list_workflows");
          expect(capabilities.tools).not.toContain(
            "list_workflows — list workflows",
          );
          expect(capabilities.disabledCapabilities.groups).toContainEqual({
            ...WORKFLOWS_REQUIREMENT,
            tools: ["list_workflows"],
          });
        } finally {
          await client.close();
        }
      });

      it("hands the edition frozen gates, so it cannot switch a gate on mid-session", async () => {
        const registered: unknown[] = [];
        const attempts: string[] = [];

        mockWorkflowsCatalog("extension:workflows");
        mockTools({
          registerExtensionTools: (host: MockHost) => {
            const gates = host.gates as {
              extensions: Record<string, boolean>;
            };

            // Test modules compile in strict mode, so a write to a frozen object throws rather than failing silently.
            for (const [label, write] of [
              [
                "replace extensions",
                () => {
                  gates.extensions = { workflows: true };
                },
              ],
              [
                "set a gate",
                () => {
                  gates.extensions.workflows = true;
                },
              ],
            ] as const) {
              try {
                write();
                attempts.push(`${label}: allowed`);
              } catch (error) {
                attempts.push(`${label}: ${(error as Error).name}`);
              }
            }

            registerListWorkflows(registered)(host);
          },
        });

        const { buildMcpServer } = loadApp();
        const client = await connect(
          buildMcpServer(
            {},
            {
              dataEnabled: false,
              jsEnabled: false,
              actorId: "user@appsmith.com",
            },
          ),
        );

        try {
          expect(attempts).toEqual([
            "replace extensions: TypeError",
            "set a gate: TypeError",
          ]);
          expect(registered).toEqual([undefined]);
          expect(await toolNames(client)).not.toContain("list_workflows");
          expect((await capabilitiesOf(client)).gates.extensions).toEqual({});
        } finally {
          await client.close();
        }
      });

      it("registers a tool whose edition gate the session resolved on", async () => {
        const registered: unknown[] = [];

        mockWorkflowsCatalog("extension:workflows");
        mockTools({
          registerExtensionTools: registerListWorkflows(registered),
        });

        const { buildMcpServer } = loadApp();
        const client = await connect(
          buildMcpServer(
            {},
            {
              dataEnabled: false,
              jsEnabled: false,
              actorId: "user@appsmith.com",
              extensionGates: { workflows: true },
            },
          ),
        );

        try {
          const capabilities = await capabilitiesOf(client);

          expect(registered).toHaveLength(1);
          expect(registered[0]).toBeDefined();
          expect(await toolNames(client)).toContain("list_workflows");
          expect(capabilities.tools).toContain(
            "list_workflows — list workflows",
          );
          expect(capabilities.gates.extensions).toEqual({ workflows: true });
          expect(
            capabilities.disabledCapabilities.groups.flatMap(
              (group) => group.tools,
            ),
          ).not.toContain("list_workflows");
        } finally {
          await client.close();
        }
      });

      it.each([
        [
          "destructiveHint: true",
          { ...READ, readOnlyHint: false, destructiveHint: true },
        ],
        [
          "a non-read-only tool with destructiveHint unset",
          { readOnlyHint: false },
        ],
      ])(
        "refuses a destructive extension tool (%s), even with its gate off",
        (_label, annotations) => {
          mockCatalog({
            EXTENSION_TOOL_CATALOG: [
              {
                name: "delete_workflow",
                gate: "extension:workflows",
                summary: "delete a workflow",
              },
            ],
            EXTENSION_TOOL_ANNOTATIONS: { delete_workflow: annotations },
            EXTENSION_GATE_REQUIREMENTS: { workflows: WORKFLOWS_REQUIREMENT },
          });
          mockTools({
            registerExtensionTools: (host: MockHost) => {
              host.registerTool(
                "delete_workflow",
                "Delete a workflow.",
                {},
                async () => host.result({}),
              );
            },
          });

          const { buildMcpServer } = loadApp();

          expect(() => buildMcpServer({})).toThrow(
            'MCP extension tool "delete_workflow" is destructive',
          );
        },
      );
    });

    describe("registerTool argument shape", () => {
      function registerWith(args: (host: MockHost) => unknown[]) {
        mockWorkflowsCatalog("always");
        mockTools({
          registerExtensionTools: (host: MockHost) => {
            host.registerTool(...args(host));
          },
        });
      }

      it("refuses an annotations-like object before the callback", () => {
        registerWith((host) => [
          "list_workflows",
          "List workflows.",
          { readOnlyHint: false, destructiveHint: true },
          async () => host.result({}),
        ]);

        const { buildMcpServer } = loadApp();

        expect(() => buildMcpServer({})).toThrow(
          'MCP tool "list_workflows" passes a non-schema object before its callback',
        );
      });

      it("refuses a registration whose last argument is not the callback", () => {
        registerWith(() => ["list_workflows", "List workflows.", {}]);

        const { buildMcpServer } = loadApp();

        expect(() => buildMcpServer({})).toThrow(
          'MCP tool "list_workflows" must be registered with its callback last',
        );
      });

      it("accepts a zod parameter shape", async () => {
        // The schema must come from the same (isolated) zod instance as app.ts, as it would in a real edition.
        let zod: typeof z | undefined;

        registerWith((host) => [
          "list_workflows",
          "List workflows.",
          { id: zod!.string() },
          async ({ id }: { id: string }) => host.result({ id }),
        ]);

        let buildMcpServer: IsolatedApp["buildMcpServer"] | undefined;

        jest.isolateModules(() => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          zod = require("zod").z;
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          buildMcpServer = require("./app").buildMcpServer;
        });

        const client = await connect(buildMcpServer!({}));

        try {
          expect(
            await callJson(client, "list_workflows", { id: "w1" }),
          ).toEqual({ id: "w1" });
        } finally {
          await client.close();
        }
      });
    });

    describe("guides and server instructions", () => {
      const workflowsGuide = {
        slug: "workflows",
        title: "Workflows guide",
        description: "How to build workflows.",
        render: () => "# Workflows guide",
      };

      it.each(["placement", "crud", "widgets"])(
        "refuses an extension guide that takes the core slug %s",
        (slug) => {
          mockCatalog({ EXTENSION_GUIDES: [{ ...workflowsGuide, slug }] });

          jest.isolateModules(() => {
            expect(() => require("./builder/instructions")).toThrow(
              `MCP extension guide "${slug}" collides with core`,
            );
          });
        },
      );

      it("refuses extension guides that repeat a slug", () => {
        mockCatalog({ EXTENSION_GUIDES: [workflowsGuide, workflowsGuide] });

        jest.isolateModules(() => {
          expect(() => require("./builder/instructions")).toThrow(
            "MCP extension guides repeat a slug",
          );
        });
      });

      it("leaves SERVER_INSTRUCTIONS untouched without a fragment and appends one when given", () => {
        const fragment = "Workflows: call list_workflows first.";
        let without = "";
        let withFragment = "";

        mockCatalog({});
        jest.isolateModules(() => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          without = require("./builder/instructions").SERVER_INSTRUCTIONS;
        });
        jest.dontMock("./ee/extensions/catalog");
        mockCatalog({ EXTENSION_SERVER_INSTRUCTIONS: fragment });
        jest.isolateModules(() => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          withFragment = require("./builder/instructions").SERVER_INSTRUCTIONS;
        });

        expect(without.endsWith("over rebuilding.")).toBe(true);
        expect(withFragment).toBe(`${without}\n\n${fragment}`);
      });

      it("serves an extension guide through get_guide and as a resource", async () => {
        mockCatalog({ EXTENSION_GUIDES: [workflowsGuide] });

        const { buildMcpServer } = loadApp();
        const client = await connect(buildMcpServer({}));

        try {
          const guide = await callJson(client, "get_guide", {
            slug: "workflows",
          });
          const { resources } = await client.listResources();

          expect(guide).toEqual({
            slug: "workflows",
            title: "Workflows guide",
            markdown: "# Workflows guide",
          });
          expect(resources.map((resource) => resource.uri)).toContain(
            "appsmith://guide/workflows",
          );
        } finally {
          await client.close();
        }
      });
    });

    // resolveExtensionGates is driven through the real HTTP server, as a session would be: the initialize path and a
    // second replica rehydrating the session from the shared record.
    describe("per-session extension gate resolution", () => {
      const TOKEN = "mcp_extensions_test_token";
      const servers: Server[] = [];

      afterEach(async () => {
        for (const server of servers.splice(0)) {
          server.closeAllConnections();
          await new Promise<void>((resolve) => server.close(() => resolve()));
        }
      });

      function stubApi(label: string) {
        return {
          label,
          validateToken: async () => ({
            username: "user@appsmith.com",
            isAnonymous: false,
            organizationId: "org-default",
          }),
        };
      }

      async function listen(server: Server): Promise<string> {
        servers.push(server);
        await new Promise<void>((resolve) =>
          server.listen(0, "127.0.0.1", resolve),
        );

        return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      }

      // An SDK client whose initialize goes to `initializeOrigin` and every later request to `otherOrigin`.
      async function connectHttp(
        initializeOrigin: string,
        otherOrigin = initializeOrigin,
      ): Promise<Client> {
        const routed = (async (input: string | URL, init?: RequestInit) => {
          const isInitialize =
            typeof init?.body === "string" &&
            (JSON.parse(init.body) as { method?: string }).method ===
              "initialize";
          const target = new URL(String(input));
          const origin = new URL(isInitialize ? initializeOrigin : otherOrigin);

          target.host = origin.host;

          return fetch(target, init);
        }) as typeof fetch;
        const client = new Client({
          name: "extensions-http",
          version: "1.0.0",
        });

        await client.connect(
          new StreamableHTTPClientTransport(
            new URL("http://router.invalid/mcp"),
            {
              fetch: routed,
              requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } },
            },
          ),
        );

        return client;
      }

      it("resolves the gates live with the caller's API, at initialize and again on rehydration", async () => {
        const resolvedFor: string[] = [];
        // Always on for pod-a's API; pod-b's answer is switched per session. A session initialized on pod-a whose
        // gate is still on after pod-b rebuilt it with an "off" answer could only have carried it over from the
        // stored record — and one that is off after an "on" answer was never resolved on rehydration at all.
        let podBOn = false;

        mockWorkflowsCatalog("extension:workflows");
        mockTools({
          registerExtensionTools: registerListWorkflows([]),
          resolveExtensionGates: async (api: { label: string }) => {
            resolvedFor.push(api.label);

            return { workflows: api.label === "pod-a" || podBOn };
          },
        });

        const { createMcpHttpServer } = loadApp();
        // Two replicas sharing one session store, so the second must rebuild the session from its record.
        let store: unknown;

        jest.isolateModules(() => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { InMemorySessionStore } = require("./session/store");

          store = new InMemorySessionStore();
        });

        const podA = await listen(
          createMcpHttpServer(
            "https://appsmith.example",
            () => stubApi("pod-a"),
            {
              sessionStore: store,
            },
          ),
        );
        const podB = await listen(
          createMcpHttpServer(
            "https://appsmith.example",
            () => stubApi("pod-b"),
            {
              sessionStore: store,
            },
          ),
        );

        // What the session's server reports and registers, for a session initialized on one pod and (optionally)
        // served by another.
        async function sessionView(initializeOn: string, serveOn?: string) {
          const client = await connectHttp(initializeOn, serveOn);

          try {
            return {
              extensions: (await capabilitiesOf(client)).gates.extensions,
              registered: (await toolNames(client)).includes("list_workflows"),
            };
          } finally {
            await client.close();
          }
        }

        expect(await sessionView(podA)).toEqual({
          extensions: { workflows: true },
          registered: true,
        });
        expect(await sessionView(podA, podB)).toEqual({
          extensions: {},
          registered: false,
        });
        podBOn = true;
        expect(await sessionView(podA, podB)).toEqual({
          extensions: { workflows: true },
          registered: true,
        });
        // Every initialize resolved on pod-a; each rehydration resolved again on pod-b.
        expect(resolvedFor).toEqual([
          "pod-a",
          "pod-a",
          "pod-b",
          "pod-a",
          "pod-b",
        ]);
      });

      it("fails closed when the resolver throws, logging no error detail", async () => {
        const lines: string[] = [];

        mockWorkflowsCatalog("extension:workflows");
        mockTools({
          registerExtensionTools: registerListWorkflows([]),
          resolveExtensionGates: async () => {
            throw new TypeError("upstream said secret-body");
          },
        });

        const { createMcpHttpServer } = loadApp();
        const origin = await listen(
          createMcpHttpServer(
            "https://appsmith.example",
            () => stubApi("pod"),
            {
              logSink: (line: string) => lines.push(line),
            },
          ),
        );
        const client = await connectHttp(origin);

        try {
          const capabilities = await capabilitiesOf(client);

          expect(capabilities.gates.extensions).toEqual({});
          expect(await toolNames(client)).not.toContain("list_workflows");
          expect(capabilities.disabledCapabilities.groups).toContainEqual({
            ...WORKFLOWS_REQUIREMENT,
            tools: ["list_workflows"],
          });
        } finally {
          await client.close();
        }

        const logged = lines.join("");

        expect(logged).toContain(
          "could not resolve edition tool gates for a session (TypeError)",
        );
        expect(logged).not.toContain("secret-body");
        expect(logged).not.toContain(TOKEN);
      });

      it("fails closed when the resolver never settles, after the gate-resolution cap", async () => {
        const lines: string[] = [];

        mockWorkflowsCatalog("extension:workflows");
        mockTools({
          registerExtensionTools: registerListWorkflows([]),
          resolveExtensionGates: async () => new Promise(() => undefined),
        });

        const { createMcpHttpServer } = loadApp();
        const origin = await listen(
          createMcpHttpServer(
            "https://appsmith.example",
            () => stubApi("pod"),
            {
              // Short cap for the test only; production uses EXTENSION_GATES_TIMEOUT_MS.
              extensionGatesTimeoutMs: 50,
              logSink: (line: string) => lines.push(line),
            },
          ),
        );
        const client = await connectHttp(origin);

        try {
          const capabilities = await capabilitiesOf(client);

          expect(capabilities.gates.extensions).toEqual({});
          expect(await toolNames(client)).not.toContain("list_workflows");
        } finally {
          await client.close();
        }

        expect(lines.join("")).toContain(
          "could not resolve edition tool gates for a session (timeout)",
        );
      });
    });
  });
});
