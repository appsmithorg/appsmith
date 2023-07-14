import net from "net";
import type { Server, Socket } from "socket.io";

let mainSocket: Socket;

const sockets: {
  [key: string]: net.Socket;
} = {};

type CreateSocketOptions = {
  path: string;
  actionId: string;
};

type EventDataType = {
  actionId: string;
  data?: string;
  path?: string;
  type: "create" | "emit" | "close";
};

function createSocketConnection(options: CreateSocketOptions) {
  const socket = net.createConnection(options.path);
  const params = { actionId: options.actionId };

  socket.on("connect", () => {
    // console.log(`Connected to socket: ${options.path}`);
    mainSocket.emit(`Connected to socket: ${options.path}`);
  });

  socket.on("data", (data) => {
    // console.log(`Received data from socket ${options.path}: ${data}`);
    const message = JSON.stringify({ ...params, data });
    mainSocket.emit("data", message);
  });

  socket.on("error", (error) => {
    // console.error(`Socket ${options.path} error: ${error}`);
    const message = JSON.stringify({ ...params, error });
    mainSocket.emit("error", message);
  });

  socket.on("end", () => {
    // console.log(`Socket ${options.path} disconnected.`);
  });

  socket.on("close", () => {
    // console.log(`Socket ${options.path} closed.`);
    delete sockets[options.actionId];
  });

  // Add the socket to the object to keep track of active connections
  sockets[options.actionId] = socket;
}

export function watchActionEvents(io: Server) {
  io.on("connection", (socket: Socket) => {
    // console.log(`Socket connection established`, socket);
    mainSocket = socket;
    socket.on("data", (data) => {
      try {
        const obj: EventDataType = JSON.parse(data);
        switch (obj.type) {
          case "create":
            if (obj.path)
              createSocketConnection({
                path: obj.path,
                actionId: obj.actionId,
              });
            break;
          case "emit":
            if (sockets[obj.actionId] && obj.data)
              sockets[obj.actionId].emit("data", obj.data);
            break;
          case "close":
            if (sockets[obj.actionId]) sockets[obj.actionId].emit("close");
            break;
          default:
            // console.log("Socket event", obj);
            break;
        }
      } catch (e) {
        // console.log(e);
      }
    });
  });
}
