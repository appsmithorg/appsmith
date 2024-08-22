import type { Server } from "socket.io";

import { watchEvents } from "./events";

// Initializing Multiple Sockets
export function initializeSockets(io: Server) {
  watchEvents(io);
}
