export * from "ce/sagas/NavigationSagas";

import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { all, takeEvery } from "redux-saga/effects";
import { handlePageChange, handleRouteChange } from "ce/sagas/NavigationSagas";

export default function* rootSaga() {
  yield all([
    takeEvery(ReduxActionTypes.ROUTE_CHANGED, handleRouteChange),
    takeEvery(ReduxActionTypes.PAGE_CHANGED, handlePageChange),
    // EE sagas called after this
    takeEvery(ReduxActionTypes.ROUTE_CHANGED, EE_handleRouteChange),
  ]);
}

import { ReduxAction } from "ce/constants/ReduxActionConstants";
import { AppsmithLocationState } from "utils/history";
import { Location } from "history";
import { hasNavigatedOutOfPage } from "@appsmith/pages/Editor/Explorer/helpers";
import { call } from "redux-saga/effects";
import { clearAllWindowMessageListeners } from "./WindowMessageListener/WindowMessageListenerSagas";

let previousPath: string;
export function* EE_handleRouteChange(
  action: ReduxAction<{ location: Location<AppsmithLocationState> }>,
) {
  const { pathname } = action.payload.location;
  if (hasNavigatedOutOfPage(previousPath, pathname)) {
    yield call(clearAllWindowMessageListeners);
  }
  previousPath = pathname;
}
