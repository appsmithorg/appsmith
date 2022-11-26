import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { all, debounce, takeEvery, takeLatest } from "redux-saga/effects";
import { batchCallsToUpdateWidgetAutoHeightSaga } from "./batcher";
import { dynamicallyUpdateContainersSaga } from "./containers";
import { generateTreeForAutoHeightComputations } from "./layoutTree";
import { updateWidgetAutoHeightSaga } from "./widgets";

export default function* autoHeightSagas() {
  yield all([
    takeLatest(
      [
        ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
        ReduxActionTypes.SET_PREVIEW_MODE,
      ],
      dynamicallyUpdateContainersSaga,
    ),
    takeEvery(
      ReduxActionTypes.UPDATE_WIDGET_AUTO_HEIGHT,
      batchCallsToUpdateWidgetAutoHeightSaga,
    ),
    debounce(
      50,
      ReduxActionTypes.PROCESS_AUTO_HEIGHT_UPDATES,
      updateWidgetAutoHeightSaga,
    ),
    takeLatest(
      [
        ReduxActionTypes.GENERATE_AUTO_HEIGHT_LAYOUT_TREE, // add, move, paste, cut, delete, undo/redo
      ],
      generateTreeForAutoHeightComputations,
    ),
  ]);
}
