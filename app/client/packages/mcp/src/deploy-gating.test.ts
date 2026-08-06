import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// K.5 — deploy-time gating guard. The MCP route and process are OFF BY DEFAULT and opt-in via APPSMITH_MCP_ENABLED
// (Admin Settings -> MCP Server). Every layer uses the SAME allow-list spelling (true|1|yes|on), so absent, blank,
// and unrecognized values all mean disabled and no instance can acquire an agent-facing endpoint by upgrading into
// it. Full routing/health behaviour is a Docker integration test; this guards the gate wiring itself.

const REPO_ROOT = resolve(__dirname, "../../../../..");

function readDeployFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

describe("Caddy MCP routing is off by default and requires an explicit opt-in", () => {
  const caddy = readDeployFile(
    "deploy/docker/fs/opt/appsmith/caddy-reconfigure.mjs",
  );

  it("treats MCP as disabled unless APPSMITH_MCP_ENABLED is explicitly true/1/yes/on", () => {
    expect(caddy).toMatch(
      /isMcpEnabled\s*=\s*\/\^\(true\|1\|yes\|on\)\$\/i\.test\(/,
    );
    // No deny-list spelling may survive anywhere in the gate: that form treats an absent or typo'd value as ENABLED.
    expect(caddy).not.toMatch(/isMcpEnabled\s*=\s*!/);
  });

  it("answers /mcp explicitly when disabled instead of falling through to the SPA", () => {
    // Falling through returned 200 with the app's HTML: an MCP client saw an unparseable "success" and an operator
    // health check pointed at /mcp/health reported green for a service that is switched off.
    expect(caddy).toContain("mcp_disabled");
    expect(caddy).toMatch(/respond[^\n]*404/);
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

describe("supervisord, run script, and healthcheck keep MCP default-off and toggleable", () => {
  it("entrypoint always installs the MCP program (toggle handled by run-mcp.sh)", () => {
    const entrypoint = readDeployFile(
      "deploy/docker/fs/opt/appsmith/entrypoint.sh",
    );

    // The old conditional `rm mcp.conf` must NOT return: removing the program at boot would make the
    // Admin Settings toggle require a full container restart to re-enable.
    expect(entrypoint).not.toMatch(/rm\s+-f\s+"?\$?\{?SUPERVISORD[^\n]*mcp/);
    // Existing installs get the gates backfilled into docker.env as DISABLED, so an upgrade never silently grants
    // an agent-facing endpoint, a data layer, or JS authoring to an instance that never asked for them.
    expect(entrypoint).toMatch(/APPSMITH_MCP_ENABLED=false/);
    expect(entrypoint).toMatch(/APPSMITH_MCP_DATA_ENABLED=false/);
    expect(entrypoint).toMatch(/APPSMITH_MCP_JS_ENABLED=false/);
    expect(entrypoint).not.toMatch(/APPSMITH_MCP_(DATA_|JS_)?ENABLED=true/);
  });

  it("run-mcp.sh parks (never crash-loops) unless explicitly enabled", () => {
    const runMcp = readDeployFile("deploy/docker/fs/opt/appsmith/run-mcp.sh");

    expect(runMcp).toMatch(/APPSMITH_MCP_ENABLED:-false/);
    expect(runMcp).toMatch(/\(true\|1\|yes\|on\)/);
    expect(runMcp).toContain("exec sleep infinity");
    expect(runMcp).toContain("exec node --enable-source-maps");
  });

  it("docker.env template seeds the gates disabled (server + data + JS all off by default)", () => {
    const dockerEnv = readDeployFile(
      "deploy/docker/fs/opt/appsmith/templates/docker.env.sh",
    );

    expect(dockerEnv).toContain("APPSMITH_MCP_ENABLED=false");
    expect(dockerEnv).toContain("APPSMITH_MCP_DATA_ENABLED=false");
    expect(dockerEnv).toContain("APPSMITH_MCP_JS_ENABLED=false");
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

    // MCP is opt-in, so "enabled" and "the operator asked for it" are the same condition — and the gate is read
    // with the allow-list spelling, so an absent or unrecognized value can never make MCP fatal to container health.
    expect(healthcheck).toMatch(
      /mcp_enabled_value"?\s*=~\s*\^\(\[Tt\]\[Rr\]\[Uu\]\[Ee\]\|1\|\[Yy\]\[Ee\]\[Ss\]\|\[Oo\]\[Nn\]\)\$/,
    );
    expect(healthcheck).toMatch(/mcp_required="\$mcp_enabled"/);
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

    // The env flag is read (default OFF) and the auth filter's matcher short-circuits when disabled, so an
    // already-issued mcp_ token is rejected server-side (401) rather than merely losing its Caddy route. The check
    // is evaluated per request (isMcpAuthenticationRequest), so the toggle takes effect without a bean/JVM rebuild.
    expect(securityConfig).toMatch(
      /@Value\("\$\{APPSMITH_MCP_ENABLED:false\}"\)/,
    );
    expect(securityConfig).toMatch(/if\s*\(!isMcpEnabled\(\)\)/);
    expect(securityConfig).toMatch(/boolean isMcpAuthenticationRequest\(/);
  });
});
