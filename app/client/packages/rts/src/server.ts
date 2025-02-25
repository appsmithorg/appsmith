import server from "./ee/server";
import log from "loglevel";
import { VERSION as buildVersion } from "./version"; // release version of the api

const APPSMITH_RTS_PORT = process.env.APPSMITH_RTS_PORT || 8091;

server.listen(APPSMITH_RTS_PORT, () => {
  log.info(
    `RTS version ${buildVersion} running at http://localhost:${APPSMITH_RTS_PORT}`,
  );
});
