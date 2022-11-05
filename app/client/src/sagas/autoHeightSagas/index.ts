import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { all, takeLatest } from "redux-saga/effects";
import { dynamicallyUpdateContainersSaga } from "./containers";

export default function* widgetOperationSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
      dynamicallyUpdateContainersSaga,
    ),
  ]);
}
