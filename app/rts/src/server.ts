import http from "http";
import path from "path";
import express from "express";
import { Server } from "socket.io";
import log, { LogLevelDesc } from "loglevel";
import { VERSION as buildVersion } from "./version"; // release version of the api
import { initializeSockets } from "./sockets";

const RTS_BASE_PATH = "/rts";

// Setting the logLevel for all log messages
const logLevel: LogLevelDesc = (process.env.APPSMITH_LOG_LEVEL ||
  "debug") as LogLevelDesc;
log.setLevel(logLevel);

// Verifing Environment Variables
const MONGODB_URI = process.env.APPSMITH_MONGODB_URI;
if (
  MONGODB_URI == null ||
  MONGODB_URI === "" ||
  !MONGODB_URI.startsWith("mongodb")
) {
  log.error("Please provide a valid value for `APPSMITH_MONGODB_URI`.");
  process.exit(1);
}

const API_BASE_URL = process.env.APPSMITH_API_BASE_URL;
if (API_BASE_URL == null || API_BASE_URL === "") {
  log.error("Please provide a valid value for `APPSMITH_API_BASE_URL`.");
  process.exit(1);
}

const PORT = process.env.PORT || 8091;

main();

function main() {
  const app = express();
  //Disable x-powered-by header to prevent information disclosure
  app.disable("x-powered-by");
  const server = new http.Server(app);
  const io = new Server(server, {
    path: RTS_BASE_PATH,
  });

  // Initializing Sockets
  initializeSockets(io);

  // Initializing Routes
  app.use(express.static(path.join(__dirname, "static")));
  app.get("/", (_, res) => {
    res.redirect("/index.html");
  });
  
  // Run the server
  server.listen(PORT, () => {
    log.info(`RTS version ${buildVersion} running at http://localhost:${PORT}`);
  });
}
