import "./instrumentation";
import http from "http";
import express from "express";
import { Server } from "socket.io";
import type { LogLevelDesc } from "loglevel";
import log from "loglevel";
import { VERSION as buildVersion } from "./version"; // release version of the api
import { initializeSockets } from "./sockets";

// routes
import ast_routes from "./routes/ast_routes";
import dsl_routes from "./routes/dsl_routes";
import health_check_routes from "./routes/health_check_routes";

const RTS_BASE_PATH = "/rts";

export const RTS_BASE_API_PATH = "/rts-api/v1";

// Setting the logLevel for all log messages
const logLevel: LogLevelDesc = (process.env.APPSMITH_LOG_LEVEL ||
  "debug") as LogLevelDesc;

log.setLevel(logLevel);

const API_BASE_URL = process.env.APPSMITH_API_BASE_URL || "http://localhost:8080/api/v1";
const APPSMITH_RTS_PORT = process.env.APPSMITH_RTS_PORT || 8091;

//Disable x-powered-by header to prevent information disclosure
const app = express();

app.disable("x-powered-by");
const server = new http.Server(app);
const io = new Server(server, {
  path: RTS_BASE_PATH,
});

initializeSockets(io);

// parse incoming json requests
app.use(express.json({ limit: "5mb" }));

app.use(`${RTS_BASE_API_PATH}/ast`, ast_routes);
app.use(`${RTS_BASE_API_PATH}/dsl`, dsl_routes);
app.use(`${RTS_BASE_API_PATH}`, health_check_routes);

server.headersTimeout = 61000;
server.keepAliveTimeout = 60000;
// Run the server
server.listen(APPSMITH_RTS_PORT, () => {
  log.info(
    `RTS version ${buildVersion} running at http://localhost:${APPSMITH_RTS_PORT}`,
  );
});

export default server;
