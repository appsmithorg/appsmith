import type { Server } from "node:http";
import {
  createMcpHttpServer,
  MAX_MCP_SESSIONS,
  MAX_MCP_SESSIONS_PER_USER,
  MCP_SESSION_TTL_MS,
} from "./app.js";
import {
  apiBaseUrlFromEnv,
  elicitationTimeoutFromEnv,
  gateEnabled,
  gateEnabledUnlessFalse,
  publicOriginFromEnv,
  requiredRedisUrlFromEnv,
  sessionLimitsFromEnv,
} from "./gates.js";
import { McpGovernanceCoordinator } from "./governance/coordinator.js";
import {
  createGovernanceStoreFromEnv,
  createRedisClientFromUrl,
  type MongoRedisGovernanceStore,
  type RedisConnection,
} from "./governance/store.js";
import { RedisSessionRelay } from "./session/relay.js";
import { RedisSessionStore, type McpSessionStore } from "./session/store.js";

const port = Number(process.env.APPSMITH_MCP_PORT ?? 8092);
const apiBaseUrl = apiBaseUrlFromEnv(
  process.env.APPSMITH_API_BASE_URL ?? "http://127.0.0.1:8080",
);

// Data and JS stay on unless an operator explicitly sets the env var to "false". Governed/destructive tools
// still require Mongo+Redis and register only when that infrastructure is present.
const dataEnabled = gateEnabledUnlessFalse(
  process.env.APPSMITH_MCP_DATA_ENABLED,
);
const jsEnabled = gateEnabledUnlessFalse(process.env.APPSMITH_MCP_JS_ENABLED);

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
let sessionRedis: RedisConnection | undefined;
let sessionRelay: RedisSessionRelay | undefined;
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
    void Promise.allSettled([
      Promise.resolve(governanceStore?.close()),
      Promise.resolve(sessionRelay?.close()),
      Promise.resolve(sessionRedis?.close()),
    ])
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

// How long a startup connection to Redis may take before the process gives up and exits (see main()).
const STARTUP_CONNECT_TIMEOUT_MS = 30_000;

async function withStartupTimeout<T>(
  work: Promise<T>,
  label: string,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new Error(
          `${label} did not connect within ${STARTUP_CONNECT_TIMEOUT_MS} ms (APPSMITH_REDIS_URL unreachable?)`,
        ),
      );
    }, STARTUP_CONNECT_TIMEOUT_MS);
  });

  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

async function main(): Promise<void> {
  // Governance is available only when Mongo AND Redis are configured. If configured but unreachable we fail loudly
  // (supervisord restarts) rather than silently degrade — governed/destructive safety must not vanish unnoticed.
  const store = createGovernanceStoreFromEnv();
  let governance: McpGovernanceCoordinator | undefined;

  if (store) {
    // Bounded like the session connects below: node-redis retries an unreachable server forever, and this await
    // runs first, so without a timeout a pod could sit here indefinitely without ever listening.
    await withStartupTimeout(store.connect(), "governance store");
    governanceStore = store;
    governance = new McpGovernanceCoordinator(store);
    process.stderr.write("Appsmith MCP governance store connected\n");
  } else {
    process.stderr.write(
      "Appsmith MCP governance disabled (APPSMITH_DB_URL/APPSMITH_MONGODB_URI + APPSMITH_REDIS_URL not set); " +
        "governed and destructive tools will not be registered\n",
    );
  }

  // Sessions ALWAYS live in the Redis that APPSMITH_REDIS_URL names — the one every Appsmith deployment already
  // requires for the server's own web sessions — so any replica can serve any session and elicitation answers
  // reach the pod that asked (see README "Running more than one replica"). There is no in-process mode: Appsmith
  // itself does not run without Redis, so a missing or unusable URL fails startup loudly (supervisord restarts)
  // rather than silently reproducing the multi-replica 404s.
  const redisUrl = requiredRedisUrlFromEnv(process.env.APPSMITH_REDIS_URL);
  const redis = createRedisClientFromUrl(redisUrl);

  if (!redis) {
    throw new Error(
      "APPSMITH_REDIS_URL must be a redis://, rediss://, or redis-cluster:// URL for Appsmith MCP sessions",
    );
  }

  // A runtime socket error with no listener would throw out of the event loop and exit the process; node-redis
  // reconnects on its own, so log and keep serving (requests fail individually while it is down).
  redis.on("error", (error) => {
    process.stderr.write(
      `Appsmith MCP session Redis error: ${error.message}\n`,
    );
  });
  // node-redis retries an unreachable server forever, so a bare connect() would leave the process alive but
  // never listening. Bound the startup connects: on timeout main() rejects, the process exits 1, and supervisord
  // restarts it (visible in logs) instead of a silent hang.
  await withStartupTimeout(redis.connect(), "session Redis");
  sessionRedis = redis;
  const sessionStore: McpSessionStore = new RedisSessionStore(redis);

  sessionRelay = new RedisSessionRelay(redis);
  // Open the relay's subscriber connection AND subscribe the pod channel NOW (RedisSessionRelay.connect), so an
  // unreachable Redis or an ACL that forbids SUBSCRIBE fails startup loudly instead of leaving a live pod that
  // answers 503 forever while Kubernetes — whose probes watch the backend — keeps it in rotation.
  await withStartupTimeout(sessionRelay.connect(), "session relay subscriber");
  process.stderr.write(
    `Appsmith MCP sessions shared through Redis (pod id ${sessionRelay.podId})\n`,
  );

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
    sessionStore,
    sessionRelay,
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
