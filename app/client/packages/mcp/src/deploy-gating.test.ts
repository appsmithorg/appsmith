import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// K.5 — deploy-time gating guard. The MCP route and process are ON BY DEFAULT and admin-toggleable via
// APPSMITH_MCP_ENABLED (Admin Settings -> Configuration); explicitly disabling it must drop the route and park the
// process. Full routing/health behaviour is a Docker integration test; this guards the gate wiring itself.

const REPO_ROOT = resolve(__dirname, "../../../../..");

function readDeployFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

describe("Caddy MCP routing defaults on and honors an explicit disable", () => {
  const caddy = readDeployFile(
    "deploy/docker/fs/opt/appsmith/caddy-reconfigure.mjs",
  );

  it("treats MCP as enabled unless APPSMITH_MCP_ENABLED is explicitly false/0/no/off", () => {
    expect(caddy).toMatch(
      /isMcpEnabled\s*=\s*!\/\^\(false\|0\|no\|off\)\$\/i\.test\(\s*process\.env\.APPSMITH_MCP_ENABLED\s*\?\?\s*""\s*,?\s*\)/,
    );
  });

  it("routes /mcp only when MCP is enabled and proxies the MCP port", () => {
    expect(caddy).toMatch(/isMcpEnabled\s*\?\s*`?handle \/mcp/);
    expect(caddy).toContain("APPSMITH_MCP_PORT");
  });

  it("strips the inbound MCP internal marker header in the shared all-config block", () => {
    // An external client must never be able to forge X-Appsmith-Mcp-Internal; only the loopback MCP service adds
    // it. Stripping it in (all-config) covers every route (/api/*, /mcp, /rts/*).
    expect(caddy).toContain("request_header -X-Appsmith-Mcp-Internal");
  });
});

describe("MCP internal marker secret is provisioned to backend and mcp process", () => {
  it("entrypoint generates the secret at first boot and backfills it on upgrade", () => {
    const entrypoint = readDeployFile(
      "deploy/docker/fs/opt/appsmith/entrypoint.sh",
    );

    // First-boot generation, passed as the 6th positional arg to docker.env.sh.
    expect(entrypoint).toMatch(/generated_appsmith_mcp_internal_secret/);
    // Backfill for installs whose docker.env predates the secret.
    expect(entrypoint).toMatch(
      /grep -q "\^APPSMITH_MCP_INTERNAL_SECRET=" "\$ENV_PATH"/,
    );
  });

  it("docker.env template emits APPSMITH_MCP_INTERNAL_SECRET (name masks in /actuator/env)", () => {
    const dockerEnv = readDeployFile(
      "deploy/docker/fs/opt/appsmith/templates/docker.env.sh",
    );

    expect(dockerEnv).toContain(
      "APPSMITH_MCP_INTERNAL_SECRET=$MCP_INTERNAL_SECRET",
    );
    expect(dockerEnv).toMatch(/MCP_INTERNAL_SECRET="\$\{6:-\}"/);
  });
});

describe("supervisord, run script, and healthcheck keep MCP default-on and toggleable", () => {
  it("entrypoint always installs the MCP program (toggle handled by run-mcp.sh)", () => {
    const entrypoint = readDeployFile(
      "deploy/docker/fs/opt/appsmith/entrypoint.sh",
    );

    // The old conditional `rm mcp.conf` must NOT return: removing the program at boot would make the
    // Admin Settings toggle require a full container restart to re-enable.
    expect(entrypoint).not.toMatch(/rm\s+-f\s+"?\$?\{?SUPERVISORD[^\n]*mcp/);
    // Existing installs get the gates backfilled into docker.env so the Admin UI mirrors reality (all on by default).
    expect(entrypoint).toMatch(/APPSMITH_MCP_ENABLED=true/);
    expect(entrypoint).toMatch(/APPSMITH_MCP_DATA_ENABLED=true/);
    expect(entrypoint).toMatch(/APPSMITH_MCP_JS_ENABLED=true/);
  });

  it("run-mcp.sh parks (never crash-loops) when explicitly disabled and runs by default", () => {
    const runMcp = readDeployFile("deploy/docker/fs/opt/appsmith/run-mcp.sh");

    expect(runMcp).toMatch(/APPSMITH_MCP_ENABLED:-true/);
    expect(runMcp).toMatch(/\(false\|0\|no\|off\)/);
    expect(runMcp).toContain("exec sleep infinity");
    expect(runMcp).toContain("exec node --enable-source-maps");
  });

  it("docker.env template seeds the gates (server + data + JS all on by default)", () => {
    const dockerEnv = readDeployFile(
      "deploy/docker/fs/opt/appsmith/templates/docker.env.sh",
    );

    expect(dockerEnv).toContain("APPSMITH_MCP_ENABLED=true");
    expect(dockerEnv).toContain("APPSMITH_MCP_DATA_ENABLED=true");
    expect(dockerEnv).toContain("APPSMITH_MCP_JS_ENABLED=true");
  });

  it("healthcheck probes the MCP endpoint only when the gate is enabled", () => {
    const healthcheck = readDeployFile(
      "deploy/docker/fs/opt/appsmith/healthcheck.sh",
    );

    expect(healthcheck).toMatch(/supervisorctl status .*\|\s*grep .*mcp/);
    // The probe is conditional on the enablement gate, not just program presence (a parked program is RUNNING).
    expect(healthcheck).toMatch(
      /"\$process"\s*==\s*"mcp"\s*&&\s*"\$mcp_enabled"\s*==\s*"true"/,
    );
  });

  it("MCP can only fail container health when the operator explicitly enabled it", () => {
    const healthcheck = readDeployFile(
      "deploy/docker/fs/opt/appsmith/healthcheck.sh",
    );

    // MCP is default-ON, so an instance that merely upgraded into it never opted in. An MCP-only fault there
    // must not mark the whole container unhealthy and have an orchestrator restart a working Appsmith.
    // mcp_required is set ONLY from an explicitly truthy gate value — never from the default.
    expect(healthcheck).toMatch(
      /mcp_required=true[\s\S]*?else[\s\S]*?mcp_required=false/,
    );
    // Both fatal paths (the not-RUNNING branch and the /health probe) are guarded by it.
    expect(healthcheck).toMatch(
      /"\$process"\s*==\s*"mcp"\s*&&\s*"\$mcp_required"\s*!=\s*"true"/,
    );
    expect(healthcheck).toMatch(
      /"\$mcp_required"\s*==\s*"true"[\s\S]*?healthy=false/,
    );
  });

  it("the admin restart command includes the mcp program so toggles apply", () => {
    const envManager = readDeployFile(
      "app/server/appsmith-server/src/main/java/com/appsmith/server/solutions/ce/EnvManagerCEImpl.java",
    );

    expect(envManager).toMatch(
      /"supervisorctl",\s*"restart",\s*"backend",\s*"editor",\s*"rts",\s*"mcp",?/,
    );
  });

  it("SecurityConfig gates MCP bearer auth on APPSMITH_MCP_ENABLED (real kill switch)", () => {
    const securityConfig = readDeployFile(
      "app/server/appsmith-server/src/main/java/com/appsmith/server/configurations/SecurityConfig.java",
    );

    // The env flag is read (default on) and the auth filter's matcher short-circuits when disabled, so disabling
    // MCP rejects already-issued mcp_ tokens server-side rather than only dropping the Caddy route. The check is
    // evaluated per request (isMcpAuthenticationRequest), so the toggle takes effect without a bean/JVM rebuild.
    expect(securityConfig).toMatch(
      /@Value\("\$\{APPSMITH_MCP_ENABLED:true\}"\)/,
    );
    expect(securityConfig).toMatch(/if\s*\(!isMcpEnabled\(\)\)/);
    expect(securityConfig).toMatch(/boolean isMcpAuthenticationRequest\(/);
  });
});
