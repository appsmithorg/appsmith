export * from "ce/sagas/NavigationSagas";

import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { all, takeEvery } from "redux-saga/effects";
import { handleRouteChange } from "ce/sagas/NavigationSagas";
import FocusRetention from "sagas/FocusRetentionSaga";
export default function* rootSaga() {
  yield all([
    takeEvery(ReduxActionTypes.ROUTE_CHANGED, handleRouteChange),
    takeEvery(
      ReduxActionTypes.REMOVE_FOCUS_HISTORY_REQUEST,
      FocusRetention.handleRemoveFocusHistory.bind(FocusRetention),
    ),
    // EE sagas called after this
  ]);
}
