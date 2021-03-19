import { io } from "socket.io-client";
import { eventChannel } from "redux-saga";
import { fork, take, call, cancel, put } from "redux-saga/effects";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";

import { commentEvent } from "actions/commentActions";

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
    socket.on("connect", () => {
      emit("connect");
    });
    socket.onAny((event: any, ...args: any) => {
      emit({
        type: event,
        payload: args,
      });
    });
    socket.on("disconnect", (e: any) => {
      console.log("disconnect", e);
      // TODO: handle explicit disconnects
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
    yield put(commentEvent(action));
  }
}

function* write(socket: any) {
  console.log("write", socket);
  // todo handle writes
  // while (true) {
  //   const { payload } = yield take(`${sendMessage}`);
  //   socket.emit("message", payload);
  // }
}

function* handleIO(socket: any) {
  yield fork(read, socket);
  yield fork(write, socket);
}

function* flow() {
  while (true) {
    const { payload } = yield take(ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS);
    if (payload.name !== ANONYMOUS_USERNAME) {
      const socket = yield call(connect);
      const task = yield fork(handleIO, socket);
      yield take(ReduxActionTypes.LOGOUT_USER_INIT);
      yield cancel(task);
      socket.disconnect();
    }
  }
}

export default function* rootSaga() {
  yield fork(flow);
}
