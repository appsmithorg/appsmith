import { watchActionExecutionSagas } from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import NavigationSagas from "@appsmith/sagas/NavigationSagas";
import SuperUserSagas from "@appsmith/sagas/SuperUserSagas";
import tenantSagas from "@appsmith/sagas/tenantSagas";
import userSagas from "@appsmith/sagas/userSagas";
import workspaceSagas from "@appsmith/sagas/WorkspaceSagas";
import { watchPluginActionExecutionSagas } from "sagas/ActionExecution/PluginActionSaga";
import { watchActionSagas } from "sagas/ActionSagas";
import apiPaneSagas from "sagas/ApiPaneSagas";
import applicationSagas from "@appsmith/sagas/ApplicationSagas";
import appThemingSaga from "sagas/AppThemingSaga";
import AutoHeightSagas from "sagas/autoHeightSagas";
import autoLayoutUpdateSagas from "sagas/AutoLayoutUpdateSagas";
import batchSagas from "sagas/BatchSagas";
import autoLayoutDraggingSagas from "sagas/CanvasSagas/AutoLayoutDraggingSagas";
import draggingCanvasSagas from "sagas/CanvasSagas/DraggingCanvasSagas";
import selectionCanvasSagas from "sagas/CanvasSagas/SelectionCanvasSagas";
import importedCollectionsSagas from "sagas/CollectionSagas";
import curlImportSagas from "sagas/CurlImportSagas";
import { watchDatasourcesSagas } from "sagas/DatasourcesSagas";
import debuggerSagas from "sagas/DebuggerSagas";
import editorContextSagas from "sagas/editorContextSagas";
import errorSagas from "sagas/ErrorSagas";
import evaluationsSaga from "sagas/EvaluationsSaga";
import formEvaluationChangeListener from "sagas/FormEvaluationSaga";
import gitSyncSagas from "sagas/GitSyncSagas";
import globalSearchSagas from "sagas/GlobalSearchSagas";
import initSagas from "sagas/InitSagas";
import { watchJSActionSagas } from "sagas/JSActionSagas";
import JSLibrarySaga from "sagas/JSLibrarySaga";
import jsPaneSagas from "sagas/JSPaneSagas";
import layoutConversionSagas from "sagas/layoutConversionSagas";
import LintingSaga from "sagas/LintingSagas";
import modalSagas from "sagas/ModalSagas";
import onboardingSagas from "sagas/OnboardingSagas";
import pageSagas from "sagas/PageSagas";
import PageVisibilitySaga from "sagas/PageVisibilitySagas";
import pluginSagas from "sagas/PluginSagas";
import providersSagas from "sagas/ProvidersSaga";
import queryPaneSagas from "sagas/QueryPaneSagas";
import replaySaga from "sagas/ReplaySaga";
import saaSPaneSagas from "sagas/SaaSPaneSagas";
import snapshotSagas from "sagas/SnapshotSagas";
import snipingModeSagas from "sagas/SnipingModeSagas";
import templateSagas from "sagas/TemplatesSagas";
import themeSagas from "sagas/ThemeSaga";
import utilSagas from "sagas/UtilSagas";
import websocketSagas from "sagas/WebsocketSagas/WebsocketSagas";
import actionExecutionChangeListeners from "sagas/WidgetLoadingSaga";
import widgetOperationSagas from "sagas/WidgetOperationSagas";

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
  JSLibrarySaga,
  LintingSaga,
  autoLayoutUpdateSagas,
  autoLayoutDraggingSagas,
  layoutConversionSagas,
  snapshotSagas,
];
