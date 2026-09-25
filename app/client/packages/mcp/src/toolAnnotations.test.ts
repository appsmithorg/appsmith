import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildMcpServer, type AppsmithApi } from "./app.js";
import { McpGovernanceCoordinator } from "./governance/coordinator.js";
import type {
  McpChangeRecord,
  McpGovernanceStore,
  PreparedConfirmation,
} from "./governance/store.js";
import { TOOL_ANNOTATIONS } from "./toolAnnotations.js";

// Every tool the server can register, under every gate, must carry MCP annotations that tell hosted clients
// whether a call is a read, a reversible write, or destructive. Codex / the ChatGPT app treats an un-annotated
// tool as destructive + open-world and demands an approval for every call, so a missing entry silently makes the
// whole server unusable there.

function stubApi(): AppsmithApi {
  const api = {} as Record<string, unknown>;
  const methods = [
    "getApplicationContext",
    "importApplicationArtifact",
    "importPartialApplicationArtifact",
    "listApplications",
    "listWorkspaces",
    "updateLayout",
    "listDatasources",
    "createDatasource",
    "getDatasourceStructure",
    "triggerDatasource",
    "getApplicationPages",
    "getPage",
    "getApplication",
    "getGitStatus",
    "getGitProtectedBranches",
    "listGitBranches",
    "createGitBranch",
    "commitGitApplication",
    "listActions",
    "createAction",
    "getAction",
    "updateAction",
    "deleteAction",
    "executeAction",
    "getCurrentTheme",
    "updateTheme",
    "createPage",
    "updatePage",
    "deletePage",
    "publishApplication",
    "listPlugins",
    "listActionCollections",
    "createActionCollection",
    "updateActionCollection",
    "deleteActionCollection",
    "validateToken",
  ];

  for (const name of methods) api[name] = jest.fn(async () => ({}));

  return api as unknown as AppsmithApi;
}

class MemoryGovernanceStore implements McpGovernanceStore {
  readonly confirmations = new Map<string, PreparedConfirmation>();
  async acquireLock(): Promise<string | undefined> {
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

async function listAllTools() {
  const server = buildMcpServer(stubApi(), {
    dataEnabled: true,
    jsEnabled: true,
    governance: new McpGovernanceCoordinator(new MemoryGovernanceStore()),
    actorId: "user@appsmith.com",
    isAdmin: true,
    organizationId: "org-1",
  });
  const client = new Client({ name: "annotations-test", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  const { tools } = await client.listTools();

  await client.close();

  return tools;
}

describe("tool annotations", () => {
  it("every registered tool (all gates on) carries annotations from the table, and the table has no stale entries", async () => {
    const tools = await listAllTools();
    const registered = tools.map((tool) => tool.name).sort();

    expect(registered.length).toBeGreaterThan(50);
    expect(Object.keys(TOOL_ANNOTATIONS).sort()).toEqual(registered);

    for (const tool of tools) {
      expect(tool.annotations).toEqual(TOOL_ANNOTATIONS[tool.name]);
      // A read-only tool can never also be destructive.
      expect(
        tool.annotations?.readOnlyHint === true &&
          tool.annotations?.destructiveHint === true,
      ).toBe(false);
    }
  });

  it("classifies the destructive handshake and the reads the way hosted clients gate on", async () => {
    const tools = await listAllTools();
    const byName = new Map(tools.map((tool) => [tool.name, tool.annotations]));

    for (const [name, annotations] of byName) {
      // Destructive is exactly the confirm_* half of the handshake: flipping any authoring write or read to
      // destructive would bring back "Codex asks for approval on every call" for the bulk of the surface.
      expect({ name, destructive: annotations?.destructiveHint }).toEqual({
        name,
        destructive: name.startsWith("confirm_"),
      });

      if (name.startsWith("confirm_")) {
        expect(annotations?.readOnlyHint).toBe(false);
      }

      if (/^(list_|get_|read_|inspect_|validate_|resolve_)/.test(name)) {
        expect(annotations?.readOnlyHint).toBe(true);
      }
    }

    // run_action is the one read with a bespoke name: the server only executes provably read-only actions.
    expect(byName.get("run_action")?.readOnlyHint).toBe(true);
    // Only the tools that reach outside the instance (git remote, datasource) are open-world; Codex requires an
    // approval for any non-read-only open-world tool, so create_branch prompts even though it is not destructive.
    const openWorld = [...byName]
      .filter(([, annotations]) => annotations?.openWorldHint === true)
      .map(([name]) => name)
      .sort();

    expect(openWorld).toEqual([
      "confirm_commit",
      "confirm_run_action",
      "create_branch",
      "run_action",
    ]);

    // Side effects that leave the instance are declared as such.
    expect(byName.get("create_branch")?.openWorldHint).toBe(true);
    expect(byName.get("confirm_commit")?.openWorldHint).toBe(true);
    expect(byName.get("confirm_run_action")?.openWorldHint).toBe(true);
    expect(byName.get("run_action")?.openWorldHint).toBe(true);
    // Everything else stays inside the Appsmith instance.
    expect(byName.get("build_application")?.openWorldHint).toBe(false);
    expect(byName.get("get_capabilities")).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
  });
});
