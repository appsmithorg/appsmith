import { call, all, spawn } from "redux-saga/effects";
import pageSagas from "sagas/PageSagas";
import { watchActionSagas } from "./ActionSagas";
import { watchJSActionSagas } from "./JSActionSagas";
import { watchActionExecutionSagas } from "sagas/ActionExecution/ActionExecutionSagas";
import { watchPluginActionExecutionSagas } from "sagas/ActionExecution/PluginActionSaga";
import widgetOperationSagas from "./WidgetOperationSagas";
import errorSagas from "./ErrorSagas";
import applicationSagas from "./ApplicationSagas";
import { watchDatasourcesSagas } from "./DatasourcesSagas";
import initSagas from "./InitSagas";
import apiPaneSagas from "./ApiPaneSagas";
import jsPaneSagas from "./JSPaneSagas";
import userSagas from "./userSagas";
import pluginSagas from "./PluginSagas";
import orgSagas from "./OrgSagas";
import importedCollectionsSagas from "./CollectionSagas";
import providersSagas from "./ProvidersSaga";
import curlImportSagas from "./CurlImportSagas";
import snipingModeSagas from "./SnipingModeSagas";
import queryPaneSagas from "./QueryPaneSagas";
import modalSagas from "./ModalSagas";
import batchSagas from "./BatchSagas";
import themeSagas from "./ThemeSaga";
import evaluationsSaga from "./EvaluationsSaga";
import onboardingSagas from "./OnboardingSagas";
import utilSagas from "./UtilSagas";
import saaSPaneSagas from "./SaaSPaneSagas";
import actionExecutionChangeListeners from "./WidgetLoadingSaga";
import globalSearchSagas from "./GlobalSearchSagas";
import recentEntitiesSagas from "./RecentEntitiesSagas";
import commentSagas from "./CommentSagas";
import websocketSagas from "./WebsocketSagas/WebsocketSagas";
import debuggerSagas from "./DebuggerSagas";
import tourSagas from "./TourSagas";
import notificationsSagas from "./NotificationsSagas";
import replaySaga from "./ReplaySaga";
import selectionCanvasSagas from "./CanvasSagas/SelectionCanvasSagas";
import draggingCanvasSagas from "./CanvasSagas/DraggingCanvasSagas";
import gitSyncSagas from "./GitSyncSagas";

import log from "loglevel";
import * as sentry from "@sentry/react";
import formEvaluationChangeListener from "./FormEvaluationSaga";
import SuperUserSagas from "./SuperUserSagas";
import reflowSagas from "./ReflowSagas";

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
  pluginSagas,
  orgSagas,
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
  commentSagas,
  websocketSagas,
  debuggerSagas,
  saaSPaneSagas,
  tourSagas,
  notificationsSagas,
  selectionCanvasSagas,
  replaySaga,
  draggingCanvasSagas,
  gitSyncSagas,
  SuperUserSagas,
  reflowSagas,
];

export function* rootSaga(sagasToRun = sagas) {
  yield all(
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
  );
}
