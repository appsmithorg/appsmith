import type { Server } from "node:http";
import {
  createMcpHttpServer,
  MAX_MCP_SESSIONS,
  MAX_MCP_SESSIONS_PER_USER,
  MCP_SESSION_TTL_MS,
} from "./app.js";
import {
  elicitationTimeoutFromEnv,
  gateEnabled,
  publicOriginFromEnv,
  sessionLimitsFromEnv,
} from "./gates.js";
import { McpGovernanceCoordinator } from "./governance/coordinator.js";
import {
  createGovernanceStoreFromEnv,
  type MongoRedisGovernanceStore,
} from "./governance/store.js";

const port = Number(process.env.APPSMITH_MCP_PORT ?? 8092);
const apiBaseUrl = process.env.APPSMITH_API_BASE_URL ?? "http://127.0.0.1:8080";

// The data layer and restricted JS objects are OFF unless explicitly enabled, matching the parent
// APPSMITH_MCP_ENABLED gate: an admin opts into each capability. Governed/destructive tools additionally require
// Mongo+Redis, so they only register when that infra is present.
const dataEnabled = gateEnabled(process.env.APPSMITH_MCP_DATA_ENABLED);
const jsEnabled = gateEnabled(process.env.APPSMITH_MCP_JS_ENABLED);

// Optional Host-header allowlist (comma-separated hostnames) enforced on /mcp. Unset by default: this service is
// fronted by Caddy which preserves the original Host, so a default loopback list would reject the proxied public
// deployment. A loopback-only or host-pinned deployment sets this to enforce a DNS-rebinding Host check.
const allowedHosts = (process.env.APPSMITH_MCP_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter((host) => host.length > 0);

// Operator escape hatch: force the relay posture (no elicitation prompts) for deployments whose client fleet
// declares elicitation but cannot render it. OFF by default — only an explicit truthy value disables prompting.
const elicitationDisabled = gateEnabled(
  process.env.APPSMITH_MCP_DISABLE_ELICITATION,
);

// Strict mode: in-band approval prompts are REQUIRED; non-elicitation clients are refused instead of relayed.
const elicitationStrict = gateEnabled(
  process.env.APPSMITH_MCP_STRICT_ELICITATION,
);

if (elicitationStrict && elicitationDisabled) {
  process.stderr.write(
    "Appsmith MCP: APPSMITH_MCP_STRICT_ELICITATION and APPSMITH_MCP_DISABLE_ELICITATION are both set; strict wins (prompts required)\n",
  );
} else if (elicitationDisabled) {
  process.stderr.write(
    "Appsmith MCP elicitation disabled by APPSMITH_MCP_DISABLE_ELICITATION; destructive confirms use the relay posture\n",
  );
}

if (elicitationStrict) {
  process.stderr.write(
    "Appsmith MCP strict elicitation enforced by APPSMITH_MCP_STRICT_ELICITATION; non-elicitation clients cannot run destructive operations\n",
  );
}

// Optional override for how long destructive confirms wait for the human to answer the approval prompt. Clients
// that do not reset their tool-call timeout on progress notifications may abort before the built-in 120s default;
// invalid values fall back to the default and absurd ones clamp, each with a startup warning (parsed in gates.ts
// so the behavior is unit-tested).
const elicitationTimeoutMs = elicitationTimeoutFromEnv(
  process.env.APPSMITH_MCP_ELICITATION_TIMEOUT_MS,
  (message) => process.stderr.write(`Appsmith MCP ${message}\n`),
);

// Preferred origin for the editor/viewer URLs build_application returns. Fail-closed: an invalid value is warned
// about and dropped, so URL construction falls back to per-session header derivation and then to root-relative paths.
const publicOrigin = publicOriginFromEnv(
  process.env.APPSMITH_MCP_PUBLIC_ORIGIN,
  (message) => process.stderr.write(`Appsmith MCP ${message}\n`),
);

// Session caps and idle TTL. When a user hits the per-user cap, the server evicts their own oldest session
// rather than rejecting, so these bound memory use rather than acting as a hard rate limit; invalid or unset
// values fall back to the built-in defaults (a present-but-invalid value is warned about at startup).
const sessionLimits = sessionLimitsFromEnv(
  process.env,
  {
    maxSessions: MAX_MCP_SESSIONS,
    maxSessionsPerUser: MAX_MCP_SESSIONS_PER_USER,
    sessionTtlMs: MCP_SESSION_TTL_MS,
  },
  (message) => process.stderr.write(`Appsmith MCP ${message}\n`),
);

let httpServer: Server | undefined;
let governanceStore: MongoRedisGovernanceStore | undefined;
let shuttingDown = false;

function shutdown(signal: string) {
  if (shuttingDown) return;

  shuttingDown = true;
  process.stderr.write(`Appsmith MCP received ${signal}; draining requests\n`);

  // Stop accepting connections immediately. Existing Streamable HTTP requests
  // are given a bounded window to finish before supervisord restarts us.
  const forceExit = setTimeout(() => process.exit(1), 10_000);

  forceExit.unref();

  const finish = (code: number) => {
    void Promise.resolve(governanceStore?.close())
      .catch(() => {})
      .finally(() => {
        clearTimeout(forceExit);
        process.exit(code);
      });
  };

  if (!httpServer) {
    finish(0);

    return;
  }

  httpServer.close((error) => {
    if (error) {
      process.stderr.write(`Appsmith MCP shutdown failed: ${error.message}\n`);
      finish(1);

      return;
    }

    finish(0);
  });
}

async function main(): Promise<void> {
  // Governance is available only when Mongo AND Redis are configured. If configured but unreachable we fail loudly
  // (supervisord restarts) rather than silently degrade — governed/destructive safety must not vanish unnoticed.
  const store = createGovernanceStoreFromEnv();
  let governance: McpGovernanceCoordinator | undefined;

  if (store) {
    await store.connect();
    governanceStore = store;
    governance = new McpGovernanceCoordinator(store);
    process.stderr.write("Appsmith MCP governance store connected\n");
  } else {
    process.stderr.write(
      "Appsmith MCP governance disabled (APPSMITH_MONGODB_URI/APPSMITH_DB_URL + APPSMITH_REDIS_URL not set); " +
        "governed and destructive tools will not be registered\n",
    );
  }

  httpServer = createMcpHttpServer(apiBaseUrl, undefined, {
    dataEnabled,
    jsEnabled,
    governance,
    allowedHosts,
    publicOrigin,
    elicitationDisabled,
    elicitationStrict,
    elicitationTimeoutMs,
    ...sessionLimits,
  });

  httpServer.listen(port, "127.0.0.1", () => {
    process.stderr.write(`Appsmith MCP listening on 127.0.0.1:${port}\n`);
  });
}

// A truly uncaught exception leaves the process in an undefined state — exit so supervisord restarts it cleanly.
process.once("uncaughtException", () => {
  process.stderr.write("Appsmith MCP uncaught exception\n");
  process.exit(1);
});

// An unhandled rejection (e.g. a stray transport cleanup) must NOT hard-exit: that would let a single bad request
// crash-loop the whole service. Log and keep serving.
process.on("unhandledRejection", () => {
  process.stderr.write("Appsmith MCP unhandled rejection\n");
});

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);

  process.stderr.write(`Appsmith MCP failed to start: ${message}\n`);
  process.exit(1);
});
