import type { ReduxAction } from "constants/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  all,
  call,
  debounce,
  select,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import {
  batchCallsToUpdateWidgetAutoHeightSaga,
  callEvalWithoutReplay,
} from "./batcher";
import { dynamicallyUpdateContainersSaga } from "./containers";
import { generateTreeForAutoHeightComputations } from "./layoutTree";
import { updateWidgetAutoHeightSaga } from "./widgets";
import { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";

// Auto height actions must be computed only in FIXED layout
// We can avoid these types of checks once we change the architecture of layout specific sagas.
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* shouldCallAutoHeight(saga: any, action: ReduxAction<unknown>) {
  const layoutSystemType: LayoutSystemTypes = yield select(getLayoutSystemType);

  if (layoutSystemType === LayoutSystemTypes.FIXED) {
    yield call(saga, action);
  }
}

export default function* autoHeightSagas() {
  yield all([
    takeLatest(
      [
        ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
        ReduxActionTypes.SET_PREVIEW_MODE,
      ],
      shouldCallAutoHeight,
      dynamicallyUpdateContainersSaga,
    ),
    takeEvery(
      ReduxActionTypes.UPDATE_WIDGET_AUTO_HEIGHT,
      shouldCallAutoHeight,
      batchCallsToUpdateWidgetAutoHeightSaga,
    ),
    debounce(
      50,
      ReduxActionTypes.PROCESS_AUTO_HEIGHT_UPDATES,
      shouldCallAutoHeight,
      updateWidgetAutoHeightSaga,
    ),
    takeEvery(
      ReduxActionTypes.DIRECT_DOM_UPDATE_AUTO_HEIGHT,
      shouldCallAutoHeight,
      updateWidgetAutoHeightSaga,
    ),
    takeLatest(
      ReduxActionTypes.GENERATE_AUTO_HEIGHT_LAYOUT_TREE, // add, move, paste, cut, delete, undo/redo
      shouldCallAutoHeight,
      generateTreeForAutoHeightComputations,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_MULTIPLE_WIDGET_PROPERTIES,
      callEvalWithoutReplay,
    ),
  ]);
}
