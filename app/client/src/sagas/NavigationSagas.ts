import { all, call, takeEvery } from "redux-saga/effects";
import type { ReduxAction } from "constants/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import EntityNavigationFactory from "pages/Editor/EntityNavigation/factory";
import type { EntityInfo } from "pages/Editor/EntityNavigation/types";
import log from "loglevel";
import type PaneNavigation from "pages/Editor/EntityNavigation/PaneNavigation";

function* navigateEntitySaga(action: ReduxAction<EntityInfo>) {
  try {
    const paneNavigation: PaneNavigation = yield call(
      EntityNavigationFactory.create,
      action.payload,
    );

    yield call(paneNavigation.init);
    yield call(paneNavigation.navigate);
  } catch (e) {
    log.error(e);
  }
}

export default function* navigationSagas() {
  yield all([
    takeEvery(ReduxActionTypes.NAVIGATE_TO_ENTITY, navigateEntitySaga),
  ]);
}
