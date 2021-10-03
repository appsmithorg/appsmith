import { io } from "socket.io-client";
import { eventChannel } from "redux-saga";
import { fork, take, call, cancel, put, delay } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxSagaChannels,
} from "constants/ReduxActionConstants";
import {
  WEBSOCKET_EVENTS,
  RTS_BASE_PATH,
  websocketDisconnectedEvent,
  websocketConnectedEvent,
} from "constants/WebsocketConstants";

import {
  setIsWebsocketConnected,
  retrySocketConnection,
} from "actions/websocketActions";

import handleSocketEvent from "./handleSocketEvent";
import * as Sentry from "@sentry/react";
import { SOCKET_CONNECTION_EVENTS } from "./socketEvents";
import { debug } from "loglevel";

function connect() {
  const socket = io({
    path: RTS_BASE_PATH,
  };
  const socket = !!namespace ? io(namespace, options) : io(options);
  debug("connected req", namespace);
  return new Promise((resolve) => {
    socket.on(SOCKET_CONNECTION_EVENTS.CONNECT, () => {
      debug("connected", namespace);
      socket.off(SOCKET_CONNECTION_EVENTS.CONNECT);
      resolve(socket);
    });
  });
}

function subscribe(socket: any) {
  return eventChannel((emit) => {
    socket.onAny((event: any, ...args: any) => {
      emit({
        type: event,
        payload: args,
      });
    });
    socket.on("disconnect", () => {
      emit(websocketDisconnectedEvent());
    });
    socket.on("connect", () => {
      emit(websocketConnectedEvent());
    });
    return () => {
      socket.disconnect();
    };
  });
}

function* read(socket: any) {
  const channel = yield call(subscribe, socket);
  while (true) {
    const action = yield take(channel);
    switch (action.type) {
      case WEBSOCKET_EVENTS.DISCONNECTED:
        yield put(setIsWebsocketConnected(false));
        break;
      case WEBSOCKET_EVENTS.CONNECTED:
        yield put(setIsWebsocketConnected(true));
        break;
      default: {
        yield call(handleSocketEvent, action);
      }
    }
  }
}

function* write(socket: any) {
  while (true) {
    const { payload } = yield take(ReduxSagaChannels.WEBSOCKET_WRITE_CHANNEL);
    // reconnect to reset connection at the server
    try {
      if (payload.type === WEBSOCKET_EVENTS.RECONNECT) {
        yield put(setIsWebsocketConnected(false));
        socket.disconnect().connect();
      } else {
        socket.emit(payload.type, payload.payload);
      }
    } catch (e) {
      Sentry.captureException(e);
    }
  }
}

function* handleIO(socket: any) {
  yield fork(read, socket);
  yield fork(write, socket);
}

function* flow() {
  while (true) {
    yield take([
      ReduxActionTypes.INIT_SOCKET_CONNECTION,
      ReduxActionTypes.RETRY_WEBSOCKET_CONNECTION, // for manually triggering reconnection
    ]);
    try {
      /**
       * Incase the socket is disconnected due to network latencies
       * it reuses the same instance so we don't need to bind it again
       * this is verified using the reconnect flow
       * We only need to retry incase the socket connection isn't made
       * in the first attempt itself
       */
      const socket = yield call(connect);
      const task = yield fork(handleAppSocketIO, socket);
      yield put(setIsAppLevelWebsocketConnected(true));
      yield take([ReduxActionTypes.LOGOUT_USER_INIT]);
      yield cancel(task);
      socket.disconnect();
    } catch (e) {
      // this has to be non blocking
      yield fork(function*() {
        yield delay(3000);
        yield put(retryAppLevelSocketConnection());
      });
    }
  }
}

function* readFromPageSocket(socket: any) {
  const channel = yield call(listenToSocket, socket);
  while (true) {
    const action = yield take(channel);
    debug(action);
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

function* writeToPageSocket(socket: any) {
  while (true) {
    const { payload } = yield take(
      ReduxSagaChannels.WEBSOCKET_PAGE_LEVEL_WRITE_CHANNEL,
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

function* handlePageSocketIO(socket: any) {
  yield fork(readFromPageSocket, socket);
  yield fork(writeToPageSocket, socket);
}

function* openPageLevelSocketConnection() {
  while (true) {
    yield take([
      ReduxActionTypes.INIT_PAGE_LEVEL_SOCKET_CONNECTION,
      ReduxActionTypes.RETRY_PAGE_LEVEL_WEBSOCKET_CONNECTION, // for manually triggering reconnection
    ]);
    try {
      const socket = yield call(connect, WEBSOCKET_NAMESPACE.PAGE_EDIT);
      const task = yield fork(handlePageSocketIO, socket);
      yield put(setIsPageLevelWebsocketConnected(true));
      yield take([ReduxActionTypes.LOGOUT_USER_INIT]);
      yield take();
      yield cancel(task);
      socket.disconnect();
    } catch (e) {
      // this has to be non blocking
      yield fork(function*() {
        yield delay(3000);
        yield put(retrySocketConnection());
      });
    }
  }
}

export default function* rootSaga() {
  yield fork(flow);
}
