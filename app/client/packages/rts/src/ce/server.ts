import http from "http";
import express from "express";
import type { LogLevelDesc } from "loglevel";
import log from "loglevel";

// routes
import ast_routes from "../routes/ast_routes";
import dsl_routes from "../routes/dsl_routes";
import health_check_routes from "../routes/health_check_routes";

import { RTS_BASE_API_PATH } from "@constants/routes";

// Setting the logLevel for all log messages
const logLevel: LogLevelDesc = (process.env.APPSMITH_LOG_LEVEL ||
  "debug") as LogLevelDesc;

log.setLevel(logLevel);

//Disable x-powered-by header to prevent information disclosure
export const app = express();

app.disable("x-powered-by");
const server = new http.Server(app);

// parse incoming json requests
app.use(express.json({ limit: "5mb" }));

app.use(`${RTS_BASE_API_PATH}/ast`, ast_routes);
app.use(`${RTS_BASE_API_PATH}/dsl`, dsl_routes);
app.use(`${RTS_BASE_API_PATH}`, health_check_routes);

server.headersTimeout = 61000;
server.keepAliveTimeout = 60000;

export default server;
