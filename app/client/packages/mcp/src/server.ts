import type { Server } from "node:http";
import { createMcpHttpServer } from "./app.js";
import { McpGovernanceCoordinator } from "./governance/coordinator.js";
import {
  createGovernanceStoreFromEnv,
  type MongoRedisGovernanceStore,
} from "./governance/store.js";

const port = Number(process.env.APPSMITH_MCP_PORT ?? 8092);
const apiBaseUrl = process.env.APPSMITH_API_BASE_URL ?? "http://127.0.0.1:8080";
// The data layer and restricted JS objects are independent opt-ins on top of APPSMITH_MCP_ENABLED. Default off.
const dataEnabled = process.env.APPSMITH_MCP_DATA_ENABLED === "1";
const jsEnabled = process.env.APPSMITH_MCP_JS_ENABLED === "1";

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
