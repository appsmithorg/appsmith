import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createMcpHttpServer, type AppsmithApi } from "./app.js";

// K.4 — acceptance through a REAL @modelcontextprotocol/sdk client over Streamable HTTP against an in-process server
// (not supertest). Proves the actual protocol handshake, listTools, and callTool work end to end.

// A stub AppsmithApi: every method is an inert jest.fn except validateToken, which authenticates the bearer.
function stubApi(): AppsmithApi {
  const methodNames: (keyof AppsmithApi)[] = [
    "getApplicationContext",
    "listApplications",
    "listWorkspaces",
    "importApplicationArtifact",
    "importPartialApplicationArtifact",
    "updateLayout",
    "listDatasources",
    "getDatasourceStructure",
    "getApplicationPages",
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
  ];
  const api = {} as Record<string, unknown>;

  for (const name of methodNames) api[name] = jest.fn(async () => ({}));

  api.validateToken = jest.fn(async () => ({
    username: "user@appsmith.com",
    isAnonymous: false,
  }));

  return api as unknown as AppsmithApi;
}

describe("real MCP SDK client over Streamable HTTP", () => {
  it("connects, lists tools, and calls a tool via the SDK client", async () => {
    const httpServer = createMcpHttpServer("https://appsmith.example", () =>
      stubApi(),
    );

    await new Promise<void>((resolve) =>
      httpServer.listen(0, "127.0.0.1", resolve),
    );
    const port = (httpServer.address() as AddressInfo).port;

    const client = new Client({ name: "acceptance", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${port}/mcp`),
      {
        requestInit: {
          headers: { Authorization: "Bearer mcp_acceptance-token" },
        },
      },
    );

    try {
      await client.connect(transport);

      const tools = await client.listTools();
      const names = tools.tools.map((tool) => tool.name);

      expect(names).toContain("build_application");
      expect(names).toContain("get_capabilities");

      const capabilities = await client.callTool({
        name: "get_capabilities",
        arguments: {},
      });
      const text = (capabilities.content as { type: string; text: string }[])[0]
        .text;

      expect(text).toContain("build_application");
    } finally {
      await client.close();
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  });
});
