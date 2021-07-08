import { io } from "socket.io-client";
import { eventChannel } from "redux-saga";
import {
  fork,
  take,
  call,
  cancel,
  put,
  delay,
  select,
} from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxSagaChannels,
} from "constants/ReduxActionConstants";
import {
  WEBSOCKET_EVENTS,
  websocketDisconnectedEvent,
  websocketConnectedEvent,
} from "constants/WebsocketConstants";

import {
  setIsWebsocketConnected,
  retrySocketConnection,
} from "actions/websocketActions";

import { areCommentsEnabledForUserAndApp } from "selectors/commentsSelectors";

import handleSocketEvent from "./handleSocketEvent";

function connect() {
  const socket = io();

  return new Promise((resolve) => {
    socket.on("connect", () => {
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
    if (payload.type === WEBSOCKET_EVENTS.RECONNECT) {
      socket.disconnect().connect();
    } else {
      // handle other writes here:
      // socket.emit(payload.type, payload.payload);
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
      ReduxActionTypes.SET_ARE_COMMENTS_ENABLED,
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
      const commentsEnabled = yield select(areCommentsEnabledForUserAndApp);
      if (commentsEnabled) {
        const socket = yield call(connect);
        const task = yield fork(handleIO, socket);
        yield put(setIsWebsocketConnected(true));
        // Disconnect if comments are disabled or user is logged out
        yield take([
          ReduxActionTypes.SET_ARE_COMMENTS_ENABLED,
          ReduxActionTypes.LOGOUT_USER_INIT,
        ]);
        yield take();
        yield cancel(task);
        socket.disconnect();
      }
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
