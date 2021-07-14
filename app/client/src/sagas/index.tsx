import { call, all, spawn } from "redux-saga/effects";
import pageSagas from "sagas/PageSagas";
import { watchActionSagas } from "./ActionSagas";
import { watchActionExecutionSagas } from "sagas/ActionExecutionSagas";
import widgetOperationSagas from "./WidgetOperationSagas";
import errorSagas from "./ErrorSagas";
import applicationSagas from "./ApplicationSagas";
import { watchDatasourcesSagas } from "./DatasourcesSagas";
import initSagas from "./InitSagas";
import apiPaneSagas from "./ApiPaneSagas";
import userSagas from "./userSagas";
import pluginSagas from "./PluginSagas";
import orgSagas from "./OrgSagas";
import importedCollectionsSagas from "./CollectionSagas";
import providersSagas from "./ProvidersSaga";
import curlImportSagas from "./CurlImportSagas";
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
import selectionCanvasSagas from "./SelectionCanvasSagas";
import log from "loglevel";
import * as sentry from "@sentry/react";

const sagas = [
  initSagas,
  pageSagas,
  watchActionSagas,
  watchActionExecutionSagas,
  widgetOperationSagas,
  errorSagas,
  watchDatasourcesSagas,
  applicationSagas,
  apiPaneSagas,
  userSagas,
  pluginSagas,
  orgSagas,
  importedCollectionsSagas,
  providersSagas,
  curlImportSagas,
  queryPaneSagas,
  modalSagas,
  batchSagas,
  themeSagas,
  evaluationsSaga,
  onboardingSagas,
  actionExecutionChangeListeners,
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
