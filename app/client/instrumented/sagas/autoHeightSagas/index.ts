import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
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
import { getIsAutoLayout } from "selectors/editorSelectors";

function* shouldCallAutoHeight(saga: any, action: ReduxAction<unknown>) {
  const isAutoLayout: boolean = yield select(getIsAutoLayout);
  if (!isAutoLayout) {
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
