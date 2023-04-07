import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { log } from "loglevel";
import { all, takeLatest } from "redux-saga/effects";

function* BindWidgetToDatasource(action: ReduxAction<unknown>) {
  log(action.payload);
}

export default function* oneClickBindingSaga() {
  yield all([
    takeLatest(
      ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE,
      BindWidgetToDatasource,
    ),
  ]);
}
