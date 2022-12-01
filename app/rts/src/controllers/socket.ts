import { Server, Socket } from "socket.io";
import { tryAuth } from "@middlewares/socket-auth";
import {
  START_EDIT_EVENT_NAME,
  LEAVE_EDIT_EVENT_NAME,
  MOUSE_POINTER_EVENT_NAME,
  PAGE_EDIT_NAMESPACE,
  PAGE_ROOM_PREFIX,
  EDITORS_EVENT_NAME,
} from "@constants/socket";
import {
  AppUser,
  Policy,
  CurrentEditorsEvent,
  MousePointerEvent,
} from "@utils/models";

function subscribeToEditEvents(socket: Socket, appRoomPrefix: string) {
  socket.on(START_EDIT_EVENT_NAME, (resourceId) => {
    if (socket.data.email) {
      // user is authenticated, join the room now
      joinEditRoom(socket, resourceId, appRoomPrefix);
    } else {
      // user not authenticated yet, save the resource id and room prefix to join later after auth
      socket.data.pendingRoomId = resourceId;
      socket.data.pendingRoomPrefix = appRoomPrefix;
    }
  });

  socket.on(LEAVE_EDIT_EVENT_NAME, (resourceId) => {
    let roomName = appRoomPrefix + resourceId;
    socket.leave(roomName); // remove this socket from room
  });
}

async function onAppSocketConnected(socket: Socket) {
  let isAuthenticated = await tryAuthAndJoinPendingRoom(socket);
  if (isAuthenticated) {
    socket.join("email:" + socket.data.email);
  }
}

async function onPageSocketConnected(socket: Socket, socketIo: Server) {
  let isAuthenticated = await tryAuthAndJoinPendingRoom(socket);
  if (isAuthenticated) {
    socket.on(MOUSE_POINTER_EVENT_NAME, (event: MousePointerEvent) => {
      event.user = new AppUser(socket.data.name, socket.data.email);
      event.socketId = socket.id;
      socketIo
        .of(PAGE_EDIT_NAMESPACE)
        .to(PAGE_ROOM_PREFIX + event.pageId)
        .emit(MOUSE_POINTER_EVENT_NAME, event);
    });
  }
}

async function tryAuthAndJoinPendingRoom(socket: Socket) {
  const isAuthenticated = await tryAuth(socket);
  if (socket.data.pendingRoomId) {
    // an appId or pageId is pending for this socket, join now
    joinEditRoom(
      socket,
      socket.data.pendingRoomId,
      socket.data.pendingRoomPrefix
    );
  }

  return isAuthenticated;
}

function joinEditRoom(socket: Socket, roomId: string, roomPrefix: string) {
  // remove this socket from any other rooms with roomPrefix
  if (socket.rooms) {
    socket.rooms.forEach((roomName) => {
      if (roomName.startsWith(roomPrefix)) {
        socket.leave(roomName);
      }
    });
  }

  // add this socket to room with application id
  let roomName = roomPrefix + roomId;
  socket.join(roomName);
}

function findPolicyEmails(policies: Policy[], permission: string): string[] {
  const emails: string[] = [];
  for (const policy of policies) {
    if (policy.permission === permission) {
      for (const email of policy.users) {
        emails.push(email);
      }
      break;
    }
  }
  return emails;
}

function sendCurrentUsers(socketIo, roomName: string, roomPrefix: string) {
  if (roomName.startsWith(roomPrefix)) {
    socketIo
      .in(roomName)
      .fetchSockets()
      .then((sockets) => {
        let onlineUsernames = new Set<string>();
        let onlineUsers = new Array<AppUser>();
        if (sockets) {
          sockets.forEach((s) => {
            if (!onlineUsernames.has(s.data.email)) {
              onlineUsers.push(new AppUser(s.data.name, s.data.email));
            }
            onlineUsernames.add(s.data.email);
          });
        }
        let resourceId = roomName.replace(roomPrefix, ""); // get resourceId from room name by removing the prefix
        let response = new CurrentEditorsEvent(resourceId, onlineUsers);
        socketIo.to(roomName).emit(EDITORS_EVENT_NAME, response);
      });
  }
}

export {
  subscribeToEditEvents,
  onAppSocketConnected,
  onPageSocketConnected,
  sendCurrentUsers,
  findPolicyEmails,
};
