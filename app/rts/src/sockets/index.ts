import { watchEvents } from "./events";
import { Server } from "socket.io";

// Initializing Multiple Sockets
export function initializeSockets(io: Server) {
  watchEvents(io);
}
