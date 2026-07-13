import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// K.5 — deploy-time gating guard. The MCP route and process must remain opt-in behind APPSMITH_MCP_ENABLED. Full
// routing/health behaviour is a Docker integration test; this guards against the gate being silently removed.

const REPO_ROOT = resolve(__dirname, "../../../../..");

function readDeployFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

describe("Caddy MCP routing is gated behind APPSMITH_MCP_ENABLED", () => {
  const caddy = readDeployFile(
    "deploy/docker/fs/opt/appsmith/caddy-reconfigure.mjs",
  );

  it("derives the MCP flag from APPSMITH_MCP_ENABLED === '1'", () => {
    expect(caddy).toMatch(
      /isMcpEnabled\s*=\s*process\.env\.APPSMITH_MCP_ENABLED\s*===\s*["']1["']/,
    );
  });

  it("routes /mcp only when MCP is enabled and proxies the MCP port", () => {
    expect(caddy).toMatch(/isMcpEnabled\s*\?\s*`?handle \/mcp/);
    expect(caddy).toContain("APPSMITH_MCP_PORT");
  });
});

describe("supervisord and healthcheck keep MCP opt-in", () => {
  it("entrypoint removes the MCP program when APPSMITH_MCP_ENABLED is not 1", () => {
    const entrypoint = readDeployFile(
      "deploy/docker/fs/opt/appsmith/entrypoint.sh",
    );

    expect(entrypoint).toContain("APPSMITH_MCP_ENABLED");
    expect(entrypoint).toMatch(/mcp\.conf/);
  });

  it("healthcheck only probes MCP when its program is present", () => {
    const healthcheck = readDeployFile(
      "deploy/docker/fs/opt/appsmith/healthcheck.sh",
    );

    expect(healthcheck).toMatch(/supervisorctl status .*\|\s*grep .*mcp/);
  });
});
