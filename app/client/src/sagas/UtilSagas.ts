import { all, takeEvery, race, put, take } from "redux-saga/effects";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import history from "utils/history";
import { showActionConfirmationModal } from "actions/pluginActionActions";

function* redirectWindowLocationSaga(
  actionPayload: ReduxAction<{ url: string }>,
) {
  window.location.href = actionPayload.payload.url;
}

function* historyPushSaga(actionPayload: ReduxAction<{ url: string }>) {
  history.push(actionPayload.payload.url);
}

export default function* root() {
  yield all([
    takeEvery(ReduxActionTypes.HISTORY_PUSH, historyPushSaga),
    takeEvery(
      ReduxActionTypes.REDIRECT_WINDOW_LOCATION,
      redirectWindowLocationSaga,
    ),
  ]);
}

export function* requestModalConfirmationSaga() {
  yield put(showActionConfirmationModal(true));

  const { accept } = yield race({
    cancel: take(ReduxActionTypes.CANCEL_ACTION_MODAL),
    accept: take(ReduxActionTypes.CONFIRM_ACTION_MODAL),
  });

  return !!accept;
}
