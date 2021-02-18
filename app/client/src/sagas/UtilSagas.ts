import { all, takeEvery } from "redux-saga/effects";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import history from "utils/history";

function* RedirectWindowLocationSaga(
  actionPayload: ReduxAction<{ url: string }>,
) {
  window.location.href = actionPayload.payload.url;
}

function* HistoryPushSaga(actionPayload: ReduxAction<{ url: string }>) {
  history.push(actionPayload.payload.url);
}

export default function* root() {
  yield all([
    takeEvery(ReduxActionTypes.HISTORY_PUSH, HistoryPushSaga),
    takeEvery(
      ReduxActionTypes.REDIRECT_WINDOW_LOCATION,
      RedirectWindowLocationSaga,
    ),
  ]);
}
