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
import userSagas from "@appsmith/sagas/userSagas";
import pluginSagas from "sagas/PluginSagas";
import workspaceSagas from "@appsmith/sagas/WorkspaceSagas";
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
import websocketSagas from "sagas/WebsocketSagas/WebsocketSagas";
import debuggerSagas from "sagas/DebuggerSagas";
import replaySaga from "sagas/ReplaySaga";
import selectionCanvasSagas from "sagas/CanvasSagas/SelectionCanvasSagas";
import draggingCanvasSagas from "sagas/CanvasSagas/DraggingCanvasSagas";
import gitSyncSagas from "sagas/GitSyncSagas";
import appThemingSaga from "sagas/AppThemingSaga";
import formEvaluationChangeListener from "sagas/FormEvaluationSaga";
import SuperUserSagas from "@appsmith/sagas/SuperUserSagas";
import NavigationSagas from "sagas/NavigationSagas";
import editorContextSagas from "sagas/editorContextSagas";
import PageVisibilitySaga from "sagas/PageVisibilitySagas";
import AutoHeightSagas from "sagas/autoHeightSagas";
import tenantSagas from "@appsmith/sagas/tenantSagas";

export const sagas = [
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
  websocketSagas,
  debuggerSagas,
  saaSPaneSagas,
  selectionCanvasSagas,
  replaySaga,
  draggingCanvasSagas,
  gitSyncSagas,
  SuperUserSagas,
  appThemingSaga,
  NavigationSagas,
  editorContextSagas,
  PageVisibilitySaga,
  AutoHeightSagas,
  tenantSagas,
];
