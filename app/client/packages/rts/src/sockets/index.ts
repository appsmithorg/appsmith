import { watchActionEvents } from "./actionEvents";
import { watchEvents } from "./events";
import type { Server } from "socket.io";

// Initializing Multiple Sockets
export function initializeSockets(io: Server) {
  watchEvents(io);
}

export function initializeActionSockets(io: Server) {
  watchActionEvents(io);
}
