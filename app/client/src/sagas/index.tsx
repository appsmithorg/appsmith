import { all, spawn } from "redux-saga/effects";
import pageSagas from "../sagas/PageSagas";
import { fetchWidgetCardsSaga } from "./WidgetSidebarSagas";
import { watchExecuteActionSaga } from "./ActionSagas";
import widgetOperationSagas from "./WidgetOperationSagas";
import errorSagas from "./ErrorSagas";

export function* rootSaga() {
  yield all([
    spawn(pageSagas),
    spawn(fetchWidgetCardsSaga),
    spawn(watchExecuteActionSaga),
    spawn(widgetOperationSagas),
    spawn(errorSagas),
  ]);
}
