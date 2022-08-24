import { call, all, spawn, race, take } from "redux-saga/effects";
import pageSagas from "sagas/PageSagas";
import { watchActionSagas } from "sagas/ActionSagas";
import { watchJSActionSagas } from "sagas/JSActionSagas";
import { watchActionExecutionSagas } from "sagas/ActionExecution/ActionExecutionSagas";
import { watchPluginActionExecutionSagas } from "sagas/ActionExecution/PluginActionSaga";
import templateSagas from "sagas/TemplatesSagas";
import widgetOperationSagas from "sagas/WidgetOperationSagas";
import errorSagas from "sagas/ErrorSagas";
import applicationSagas from "sagas/ApplicationSagas";
import { watchDatasourcesSagas } from "sagas/DatasourcesSagas";
import initSagas from "sagas/InitSagas";
import apiPaneSagas from "sagas/ApiPaneSagas";
import jsPaneSagas from "sagas/JSPaneSagas";
import userSagas from "sagas/userSagas";
import pluginSagas from "sagas/PluginSagas";
import workspaceSagas from "sagas/WorkspaceSagas";
import importedCollectionsSagas from "sagas/CollectionSagas";
import providersSagas from "sagas/ProvidersSaga";
import curlImportSagas from "sagas/CurlImportSagas";
import snipingModeSagas from "sagas/SnipingModeSagas";
import queryPaneSagas from "sagas/QueryPaneSagas";
import modalSagas from "sagas/ModalSagas";
import batchSagas from "sagas/BatchSagas";
import themeSagas from "sagas/ThemeSaga";
import evaluationsSaga from "sagas/EvaluationsSaga";
import onboardingSagas from "sagas/OnboardingSagas";
import utilSagas from "sagas/UtilSagas";
import saaSPaneSagas from "sagas/SaaSPaneSagas";
import actionExecutionChangeListeners from "sagas/WidgetLoadingSaga";
import globalSearchSagas from "sagas/GlobalSearchSagas";
import recentEntitiesSagas from "sagas/RecentEntitiesSagas";
import websocketSagas from "sagas/WebsocketSagas/WebsocketSagas";
import debuggerSagas from "sagas/DebuggerSagas";
import replaySaga from "sagas/ReplaySaga";
import selectionCanvasSagas from "sagas/CanvasSagas/SelectionCanvasSagas";
import draggingCanvasSagas from "sagas/CanvasSagas/DraggingCanvasSagas";
import gitSyncSagas from "sagas/GitSyncSagas";
import appThemingSaga from "sagas/AppThemingSaga";
import log from "loglevel";
import * as sentry from "@sentry/react";
import formEvaluationChangeListener from "sagas/FormEvaluationSaga";
import SuperUserSagas from "@appsmith/sagas/SuperUserSagas";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

const sagas = [
  initSagas,
  pageSagas,
  watchActionSagas,
  watchJSActionSagas,
  watchActionExecutionSagas,
  watchPluginActionExecutionSagas,
  widgetOperationSagas,
  errorSagas,
  watchDatasourcesSagas,
  applicationSagas,
  apiPaneSagas,
  jsPaneSagas,
  userSagas,
  templateSagas,
  pluginSagas,
  workspaceSagas,
  importedCollectionsSagas,
  providersSagas,
  curlImportSagas,
  snipingModeSagas,
  queryPaneSagas,
  modalSagas,
  batchSagas,
  themeSagas,
  evaluationsSaga,
  onboardingSagas,
  actionExecutionChangeListeners,
  formEvaluationChangeListener,
  utilSagas,
  globalSearchSagas,
  recentEntitiesSagas,
  websocketSagas,
  debuggerSagas,
  saaSPaneSagas,
  selectionCanvasSagas,
  replaySaga,
  draggingCanvasSagas,
  gitSyncSagas,
  SuperUserSagas,
  appThemingSaga,
];

export function* rootSaga(sagasToRun = sagas): any {
  // This race effect ensures that we fail as soon as the first safe crash is dispatched.
  // Without this, all the subsequent safe crash failures would be shown in the toast messages as well.
  const result = yield race({
    running: all(
      sagasToRun.map((saga) =>
        spawn(function*() {
          while (true) {
            try {
              yield call(saga);
              break;
            } catch (e) {
              log.error(e);
              sentry.captureException(e);
            }
          }
        }),
      ),
    ),
    crashed: take(ReduxActionTypes.SAFE_CRASH_APPSMITH),
  });
  if (result.crashed) yield call(rootSaga);
}
