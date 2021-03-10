import { call, all, spawn } from "redux-saga/effects";
import pageSagas from "sagas/PageSagas";
import { fetchWidgetCardsSaga } from "./WidgetSidebarSagas";
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
import onboardingSaga from "./OnboardingSagas";
import actionExecutionChangeListeners from "./WidgetLoadingSaga";
import globalSearchSagas from "./GlobalSearchSagas";
import recentEntitiesSagas from "./RecentEntitiesSagas";
import log from "loglevel";
import * as sentry from "@sentry/react";

export function* rootSaga() {
  const sagas = [
    initSagas,
    pageSagas,
    fetchWidgetCardsSaga,
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
    onboardingSaga,
    actionExecutionChangeListeners,
    globalSearchSagas,
    recentEntitiesSagas,
  ];
  yield all(
    sagas.map((saga) =>
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
