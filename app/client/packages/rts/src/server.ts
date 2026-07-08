import server from "./ee/server";
import log from "loglevel";
import { VERSION as buildVersion } from "./version"; // release version of the api

const APPSMITH_RTS_PORT = Number(process.env.APPSMITH_RTS_PORT) || 8091;
// Bind to loopback by default; override with APPSMITH_RTS_HOST for non-Docker deployments.
const APPSMITH_RTS_HOST = process.env.APPSMITH_RTS_HOST || "127.0.0.1";

server.listen(APPSMITH_RTS_PORT, APPSMITH_RTS_HOST, () => {
  log.info(
    `RTS version ${buildVersion} running at http://localhost:${APPSMITH_RTS_PORT}`,
  );
});
