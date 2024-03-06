export * from "ce/sagas/NavigationSagas";

import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
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
    takeEvery(ReduxActionTypes.ROUTE_CHANGED, EE_handleRouteChange),
  ]);
}

import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { AppsmithLocationState } from "utils/history";
import type { Location } from "history";
import { hasNavigatedOutOfPage } from "@appsmith/pages/Editor/Explorer/helpers";
import { call } from "redux-saga/effects";
import { clearAllWindowMessageListeners } from "./WindowMessageListener/WindowMessageListenerSagas";
import { getAppsmithConfigs } from "@appsmith/configs";

export const { cloudHosting } = getAppsmithConfigs();

let previousPath: string;
export function* EE_handleRouteChange(
  action: ReduxAction<{ location: Location<AppsmithLocationState> }>,
) {
  const { pathname } = action.payload.location;
  if (!cloudHosting && hasNavigatedOutOfPage(previousPath, pathname)) {
    yield call(clearAllWindowMessageListeners);
  }
  previousPath = pathname;
}
