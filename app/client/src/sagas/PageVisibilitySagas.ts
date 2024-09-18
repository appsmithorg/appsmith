import type { EventChannel } from "redux-saga";
import { eventChannel } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";
import { pageVisibilityAppEvent } from "actions/pageVisibilityActions";

// Track page visibility
// https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
function listenToVisibilityEvents() {
  return eventChannel((emitter) => {
    document.addEventListener("visibilitychange", emitter, false);

    return () => {
      document.removeEventListener("visibilitychange", emitter, false);
    };
  });
}

function* handleTabVisibilityConnection() {
  const channel: EventChannel<unknown> = yield call(listenToVisibilityEvents);

  while (true) {
    const event: {
      target: { visibilityState: DocumentVisibilityState };
    } = yield take(channel);

    // Only invoke when page gets visible
    if (event.target && event.target.visibilityState === "visible") {
      yield put(pageVisibilityAppEvent(event.target.visibilityState));
    }
  }
}

export default function* rootSaga() {
  yield fork(handleTabVisibilityConnection);
}
