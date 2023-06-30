import { watchEvents } from "./events";
import type { Server } from "socket.io";

// Initializing Multiple Sockets
export function initializeSockets(io: Server) {
  watchEvents(io);
}
