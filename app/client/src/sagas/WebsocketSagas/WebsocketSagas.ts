import type { Socket, ManagerOptions, SocketOptions } from "socket.io-client";
import { io } from "socket.io-client";
import type { EventChannel, Task } from "redux-saga";
import { eventChannel } from "redux-saga";
import { fork, take, call, cancel, put } from "redux-saga/effects";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  WEBSOCKET_EVENTS,
  RTS_BASE_PATH,
  WEBSOCKET_NAMESPACE,
  websocketDisconnectedEvent,
  websocketConnectedEvent,
} from "constants/WebsocketConstants";

import {
  setIsAppLevelWebsocketConnected,
  setIsPageLevelWebsocketConnected,
} from "actions/websocketActions";

import handleAppLevelSocketEvents from "./handleAppLevelSocketEvents";
import handlePageLevelSocketEvents from "./handlePageLevelSocketEvents";
import * as Sentry from "@sentry/react";
import { SOCKET_CONNECTION_EVENTS } from "./socketEvents";

async function connect(namespace?: string) {
  const options: Partial<ManagerOptions & SocketOptions> = {
    path: RTS_BASE_PATH,
    // The default transports is ["polling", "websocket"], so polling is tried first. But polling
    //   needs sticky session to be turned on, in a clustered environment, even for it to upgrade to websockets.
    // Ref: <https://github.com/socketio/socket.io/issues/2140>.
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  };
  const socket = !!namespace ? io(namespace, options) : io(options);

  return new Promise((resolve) => {
    socket.on(SOCKET_CONNECTION_EVENTS.CONNECT, () => {
      socket.off(SOCKET_CONNECTION_EVENTS.CONNECT);
      resolve(socket);
    });
  });
}

function listenToSocket(socket: Socket) {
  return eventChannel((emit) => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.onAny((event: any, ...args: any) => {
      emit({
        type: event,
        payload: args,
      });
    });
    socket.on(SOCKET_CONNECTION_EVENTS.DISCONNECT, () => {
      emit(websocketDisconnectedEvent());
    });
    socket.on(SOCKET_CONNECTION_EVENTS.CONNECT, () => {
      emit(websocketConnectedEvent());
    });

    return () => {
      socket.disconnect();
    };
  });
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* readFromAppSocket(socket: any) {
  const channel: EventChannel<unknown> = yield call(listenToSocket, socket);

  while (true) {
    const action: { type: keyof typeof WEBSOCKET_EVENTS } = yield take(channel);

    switch (action.type) {
      case WEBSOCKET_EVENTS.DISCONNECTED:
        yield put(setIsAppLevelWebsocketConnected(false));
        break;
      case WEBSOCKET_EVENTS.CONNECTED:
        yield put(setIsAppLevelWebsocketConnected(true));
        break;
      default: {
        yield call(handleAppLevelSocketEvents, action);
      }
    }
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* writeToAppSocket(socket: any) {
  while (true) {
    const { payload } = yield take(
      ReduxActionTypes.WEBSOCKET_APP_LEVEL_WRITE_CHANNEL,
    );

    // reconnect to reset connection at the server
    try {
      if (payload.type === WEBSOCKET_EVENTS.RECONNECT) {
        yield put(setIsAppLevelWebsocketConnected(false));
        socket.disconnect().connect();
      } else {
        socket.emit(payload.type, payload.payload);
      }
    } catch (e) {
      Sentry.captureException(e);
    }
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* handleAppSocketIO(socket: any) {
  yield fork(readFromAppSocket, socket);
  yield fork(writeToAppSocket, socket);
}

function* openAppLevelSocketConnection() {
  while (true) {
    yield take(ReduxActionTypes.INIT_APP_LEVEL_SOCKET_CONNECTION);
    try {
      /**
       * Incase the socket is disconnected due to network latencies
       * it reuses the same instance so we don't need to bind it again
       * this is verified using the reconnect flow
       * We only need to retry incase the socket connection isn't made
       * in the first attempt itself
       */
      const socket: Socket = yield call(connect);
      const task: Task = yield fork(handleAppSocketIO, socket);

      yield put(setIsAppLevelWebsocketConnected(true));
      yield take([ReduxActionTypes.LOGOUT_USER_INIT]);
      yield cancel(task);
      socket?.disconnect();
    } catch (e) {
      Sentry.captureException(e);
    }
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* readFromPageSocket(socket: any) {
  const channel: EventChannel<unknown> = yield call(listenToSocket, socket);

  while (true) {
    const action: { type: keyof typeof WEBSOCKET_EVENTS } = yield take(channel);

    switch (action.type) {
      case WEBSOCKET_EVENTS.DISCONNECTED:
        yield put(setIsPageLevelWebsocketConnected(false));
        break;
      case WEBSOCKET_EVENTS.CONNECTED:
        yield put(setIsPageLevelWebsocketConnected(true));
        break;
      default: {
        yield call(handlePageLevelSocketEvents, action, socket);
      }
    }
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* writeToPageSocket(socket: any) {
  while (true) {
    const { payload } = yield take(
      ReduxActionTypes.WEBSOCKET_PAGE_LEVEL_WRITE_CHANNEL,
    );

    // reconnect to reset connection at the server
    try {
      if (payload.type === WEBSOCKET_EVENTS.RECONNECT) {
        yield put(setIsPageLevelWebsocketConnected(false));
        socket.disconnect().connect();
      } else {
        socket.emit(payload.type, payload.payload);
      }
    } catch (e) {
      Sentry.captureException(e);
    }
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* handlePageSocketIO(socket: any) {
  yield fork(readFromPageSocket, socket);
  yield fork(writeToPageSocket, socket);
}

function* openPageLevelSocketConnection() {
  while (true) {
    yield take(ReduxActionTypes.INIT_PAGE_LEVEL_SOCKET_CONNECTION);
    try {
      const socket: Socket = yield call(connect, WEBSOCKET_NAMESPACE.PAGE_EDIT);
      const task: Task = yield fork(handlePageSocketIO, socket);

      yield put(setIsPageLevelWebsocketConnected(true));
      yield take([ReduxActionTypes.LOGOUT_USER_INIT]);
      yield cancel(task);
      socket.disconnect();
    } catch (e) {
      Sentry.captureException(e);
    }
  }
}

export default function* rootSaga() {
  yield fork(openAppLevelSocketConnection);
  yield fork(openPageLevelSocketConnection);
}
