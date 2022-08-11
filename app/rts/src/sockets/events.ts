import { Server, Socket } from "socket.io";
import log from "loglevel";
import {
  APP_ROOM_PREFIX,
  RELEASE_VERSION_EVENT_NAME,
  LEAVE_EDIT_EVENT_NAME,
  PAGE_EDIT_NAMESPACE,
  PAGE_ROOM_PREFIX,
  ROOT_NAMESPACE,
} from "../constants/socket";
import { VERSION as buildVersion } from "../constants/version";
import {
  subscribeToEditEvents,
  onAppSocketConnected,
  onPageSocketConnected,
  sendCurrentUsers,
} from "../controllers/socket";

export function watchEvents(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.emit(RELEASE_VERSION_EVENT_NAME, buildVersion);
    subscribeToEditEvents(socket, APP_ROOM_PREFIX);
    onAppSocketConnected(socket).catch((error) =>
      log.error("Error in socket connected handler", error)
    );
  });

  io.of(PAGE_EDIT_NAMESPACE).on("connection", (socket: Socket) => {
    subscribeToEditEvents(socket, PAGE_ROOM_PREFIX);
    onPageSocketConnected(socket, io).catch((error) =>
      log.error("Error in socket connected handler", error)
    );
  });

  io.of(ROOT_NAMESPACE).adapter.on("leave-room", (room, id) => {
    if (room.startsWith(APP_ROOM_PREFIX)) {
      log.debug(`ns:${ROOT_NAMESPACE}# socket ${id} left the room ${room}`);
    }
    sendCurrentUsers(io, room, APP_ROOM_PREFIX);
  });

  io.of(ROOT_NAMESPACE).adapter.on("join-room", (room, id) => {
    if (room.startsWith(APP_ROOM_PREFIX)) {
      log.debug(`ns:${ROOT_NAMESPACE}# socket ${id} joined the room ${room}`);
    }
    sendCurrentUsers(io, room, APP_ROOM_PREFIX);
  });

  io.of(PAGE_EDIT_NAMESPACE).adapter.on("leave-room", (room, id) => {
    if (room.startsWith(PAGE_ROOM_PREFIX)) {
      // someone left the page edit, notify others
      log.debug(
        `ns:${PAGE_EDIT_NAMESPACE} # socket ${id} left the room ${room}`
      );
      io.of(PAGE_EDIT_NAMESPACE).to(room).emit(LEAVE_EDIT_EVENT_NAME, id);
    }
    sendCurrentUsers(io.of(PAGE_EDIT_NAMESPACE), room, PAGE_ROOM_PREFIX);
  });

  io.of(PAGE_EDIT_NAMESPACE).adapter.on("join-room", (room, id) => {
    if (room.startsWith(PAGE_ROOM_PREFIX)) {
      log.debug(
        `ns:${PAGE_EDIT_NAMESPACE}# socket ${id} joined the room ${room}`
      );
    }
    sendCurrentUsers(io.of(PAGE_EDIT_NAMESPACE), room, PAGE_ROOM_PREFIX);
  });
}