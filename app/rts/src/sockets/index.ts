import { watchMongoDB } from "./mongo";
import { watchEvents } from "./events";
import { Server } from "socket.io";
import log from "loglevel";

// Initializing Multiple Sockets
export function initializeSockets(io: Server) {
  watchMongoDB(io).catch((error) => log.error("Error watching MongoDB", error));
  watchEvents(io);
}
