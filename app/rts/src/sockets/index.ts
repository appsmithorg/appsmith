import { watchEvents } from "./events";
import { Server } from "socket.io";
import log from "loglevel";

// Initializing Multiple Sockets
export function initializeSockets(io: Server) {
  watchEvents(io);
}
