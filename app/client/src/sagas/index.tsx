import { all, spawn } from "redux-saga/effects";
import pageSagas from "../sagas/PageSagas";
import { fetchWidgetCardsSaga } from "./WidgetSidebarSagas";
import { watchActionSagas } from "./ActionSagas";
import widgetOperationSagas from "./WidgetOperationSagas";
import errorSagas from "./ErrorSagas";
import configsSagas from "./ConfigsSagas";
import applicationSagas from "./ApplicationSagas";
import { watchResourcesSagas } from "./ResourcesSagas";
export function* rootSaga() {
  yield all([
    spawn(pageSagas),
    spawn(fetchWidgetCardsSaga),
    spawn(watchActionSagas),
    spawn(widgetOperationSagas),
    spawn(errorSagas),
    spawn(configsSagas),
    spawn(watchResourcesSagas),
    spawn(applicationSagas),
  ]);
}
