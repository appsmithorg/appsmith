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
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import {
  WEBSOCKET_EVENTS,
  websocketDisconnectedEvent,
  websocketConnectedEvent,
} from "constants/WebsocketConstants";

import { commentEvent } from "actions/commentActions";
import {
  setIsWebsocketConnected,
  retrySocketConnection,
} from "actions/websocketActions";

import { areCommentsEnabledForUser } from "selectors/commentsSelectors";

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
      default:
        yield put(commentEvent(action));
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
    const { payload } = yield take([
      ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
      ReduxActionTypes.RETRY_WEBSOCKET_CONNECTION,
    ]);

    try {
      /**
       * Incase the socket is disconnected due to network latencies
       * it reuses the same instance so we don't need to bind it again
       * this is verified using the reconnect flow
       * We only need to retry incase the socket connection isn't made
       * in the first attempt itself
       */
      if (payload.name !== ANONYMOUS_USERNAME) {
        const commentsEnabled = yield select(areCommentsEnabledForUser);
        if (!commentsEnabled) return;

        const socket = yield call(connect);
        const task = yield fork(handleIO, socket);
        yield put(setIsWebsocketConnected(true));
        yield take(ReduxActionTypes.LOGOUT_USER_INIT);
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
