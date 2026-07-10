import { createMcpHttpServer } from "./app.js";

const port = Number(process.env.APPSMITH_MCP_PORT ?? 8092);
const apiBaseUrl = process.env.APPSMITH_API_BASE_URL ?? "http://127.0.0.1:8080";

const httpServer = createMcpHttpServer(apiBaseUrl);

function reportProcessFailure(kind: string) {
  process.stderr.write(`Appsmith MCP ${kind}\n`);
  process.exitCode = 1;
}

process.once("uncaughtException", () => reportProcessFailure("process failure"));
process.once("unhandledRejection", () => reportProcessFailure("process rejection"));

httpServer.listen(port, "127.0.0.1", () => {
  process.stderr.write(`Appsmith MCP listening on 127.0.0.1:${port}\n`);
});
