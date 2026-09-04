import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Deploy wiring for the always-on MCP process. Product enablement is organization policy
// (`mcpConfig.enabled`), not APPSMITH_MCP_ENABLED. These tests guard the container route, process,
// health probe, and the strip of a forged internal marker — not the org-level toggle.

const REPO_ROOT = resolve(__dirname, "../../../../..");

function readDeployFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

describe("Caddy always proxies /mcp to the MCP process", () => {
  const caddy = readDeployFile(
    "deploy/docker/fs/opt/appsmith/caddy-reconfigure.mjs",
  );

  it("routes /mcp and /mcp/health to the MCP port", () => {
    expect(caddy).toMatch(/handle \/mcp \{/);
    expect(caddy).toMatch(/handle \/mcp\/health \{/);
    expect(caddy).toContain("APPSMITH_MCP_PORT");
  });

  it("does not env-gate the /mcp route", () => {
    expect(caddy).not.toMatch(/isMcpEnabled/);
    expect(caddy).not.toContain("mcp_disabled");
    expect(caddy).not.toMatch(/APPSMITH_MCP_ENABLED/);
  });

  it("strips the inbound MCP internal marker header in the shared all-config block", () => {
    // An external client must never be able to forge X-Appsmith-Mcp-Internal; only the loopback MCP service adds
    // it. Stripping it in (all-config) covers every route (/api/*, /mcp, /rts/*).
    expect(caddy).toContain("request_header -X-Appsmith-Mcp-Internal");
  });
});

describe("supervisord, run script, and healthcheck keep MCP running", () => {
  it("entrypoint always installs the MCP program (never removes mcp.conf at boot)", () => {
    const entrypoint = readDeployFile(
      "deploy/docker/fs/opt/appsmith/entrypoint.sh",
    );

    // Removing the program at boot would make MCP require a full container restart to come back.
    expect(entrypoint).not.toMatch(/rm\s+-f\s+"?\$?\{?SUPERVISORD[^\n]*mcp/);
  });

  it("run-mcp.sh always starts the Node process", () => {
    const runMcp = readDeployFile("deploy/docker/fs/opt/appsmith/run-mcp.sh");

    expect(runMcp).toContain("exec node --enable-source-maps");
    expect(runMcp).not.toContain("exec sleep infinity");
    expect(runMcp).not.toMatch(/APPSMITH_MCP_ENABLED/);
  });

  it("healthcheck probes MCP /health when the supervisord program is present", () => {
    const healthcheck = readDeployFile(
      "deploy/docker/fs/opt/appsmith/healthcheck.sh",
    );

    expect(healthcheck).toMatch(/supervisorctl status .*\|\s*grep .*mcp/);
    expect(healthcheck).toMatch(/"\$process"\s*==\s*"mcp"/);
    expect(healthcheck).toMatch(
      /localhost:\$\{APPSMITH_MCP_PORT:-8092\}\/health/,
    );
    expect(healthcheck).not.toMatch(/mcp_enabled/);
    expect(healthcheck).not.toMatch(/mcp_required/);
  });

  it("the admin restart command includes the mcp program", () => {
    const envManager = readDeployFile(
      "app/server/appsmith-server/src/main/java/com/appsmith/server/solutions/ce/EnvManagerCEImpl.java",
    );

    expect(envManager).toMatch(
      /"supervisorctl",\s*"restart",\s*"backend",\s*"editor",\s*"rts",\s*"mcp",?/,
    );
  });

  it("SecurityConfig authenticates MCP bearers by token prefix, not an env kill switch", () => {
    const securityConfig = readDeployFile(
      "app/server/appsmith-server/src/main/java/com/appsmith/server/configurations/SecurityConfig.java",
    );

    expect(securityConfig).not.toMatch(
      /@Value\("\$\{APPSMITH_MCP_ENABLED:false\}"\)/,
    );
    expect(securityConfig).toMatch(/boolean isMcpAuthenticationRequest\(/);
    expect(securityConfig).toContain("Bearer mcp_");
  });
});
