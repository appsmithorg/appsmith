import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { all, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import { callSagaOnlyForAnvil } from "./utils";
import {
  hideDetachedWidgetAction,
  resetDetachedWidgetsAction,
  showDetachedWidgetAction,
} from "../actions/detachedWidgetActions";
import { getWidgetByName } from "sagas/selectors";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";

function* closeAnvilModalSaga(action: ReduxAction<{ modalName?: string }>) {
  const { modalName } = action.payload;

  if (modalName) {
    const widget: FlattenedWidgetProps | undefined = yield select(
      getWidgetByName,
      modalName,
    );
    if (widget) {
      hideDetachedWidgetAction(widget.widgetId);
    }
  } else {
    yield put(resetDetachedWidgetsAction());
  }
}

function* showAnvilModalSaga(action: ReduxAction<{ modalId: string }>) {
  yield put(showDetachedWidgetAction(action.payload.modalId));
}

export default function* anvilDetachedWidgetSagas() {
  yield all([
    takeEvery(
      ReduxActionTypes.CLOSE_MODAL,
      callSagaOnlyForAnvil,
      closeAnvilModalSaga,
    ),
    takeLatest(
      ReduxActionTypes.SHOW_MODAL,
      callSagaOnlyForAnvil,
      showAnvilModalSaga,
    ),
  ]);
}
