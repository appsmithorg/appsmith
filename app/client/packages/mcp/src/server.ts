import { createMcpHttpServer } from "./app.js";

const port = Number(process.env.APPSMITH_MCP_PORT ?? 8092);
const apiBaseUrl = process.env.APPSMITH_API_BASE_URL ?? "http://127.0.0.1:8080";

const httpServer = createMcpHttpServer(apiBaseUrl);

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

httpServer.listen(port, "127.0.0.1", () => {
  process.stderr.write(`Appsmith MCP listening on 127.0.0.1:${port}\n`);
});
