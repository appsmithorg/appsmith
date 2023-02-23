import initSagas from "../src/sagas/InitSagas";
import apiPaneSagas from "../src/sagas/ApiPaneSagas";
import jsPaneSagas from "../src/sagas/JSPaneSagas";
import userSagas from "@appsmith/sagas/userSagas";
import pluginSagas from "../src/sagas/PluginSagas";
import workspaceSagas from "@appsmith/sagas/WorkspaceSagas";
import importedCollectionsSagas from "../src/sagas/CollectionSagas";
import providersSagas from "../src/sagas/ProvidersSaga";
import curlImportSagas from "../src/sagas/CurlImportSagas";
import snipingModeSagas from "../src/sagas/SnipingModeSagas";
import queryPaneSagas from "../src/sagas/QueryPaneSagas";
import modalSagas from "../src/sagas/ModalSagas";
import batchSagas from "../src/sagas/BatchSagas";
import themeSagas from "../src/sagas/ThemeSaga";
import utilSagas from "../src/sagas/UtilSagas";
import saaSPaneSagas from "../src/sagas/SaaSPaneSagas";
import actionExecutionChangeListeners from "../src/sagas/WidgetLoadingSaga";
import globalSearchSagas from "../src/sagas/GlobalSearchSagas";
import websocketSagas from "../src/sagas/WebsocketSagas/WebsocketSagas";
import debuggerSagas from "../src/sagas/DebuggerSagas";
import { watchActionSagas } from "sagas/ActionSagas";
import { watchActionExecutionSagas } from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import widgetOperationSagas from "../src/sagas/WidgetOperationSagas";
import applicationSagas from "../src/sagas/ApplicationSagas";
import { watchDatasourcesSagas } from "sagas/DatasourcesSagas";
import { watchJSActionSagas } from "sagas/JSActionSagas";
import selectionCanvasSagas from "../src/sagas/CanvasSagas/SelectionCanvasSagas";
import draggingCanvasSagas from "../src/sagas/CanvasSagas/DraggingCanvasSagas";
import formEvaluationChangeListener from "../src/sagas/FormEvaluationSaga";
import LintingSaga from "../src/sagas/LintingSagas";
import JSLibrarySaga from "../src/sagas/JSLibrarySaga";
import NavigationSagas from "../src/ee/sagas/NavigationSagas";

export const sagasToRunForTests = [
  initSagas,
  watchActionSagas,
  watchActionExecutionSagas,
  widgetOperationSagas,
  watchDatasourcesSagas,
  applicationSagas,
  apiPaneSagas,
  jsPaneSagas,
  userSagas,
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
  actionExecutionChangeListeners,
  formEvaluationChangeListener,
  utilSagas,
  saaSPaneSagas,
  globalSearchSagas,
  websocketSagas,
  debuggerSagas,
  watchJSActionSagas,
  selectionCanvasSagas,
  draggingCanvasSagas,
  LintingSaga,
  JSLibrarySaga,
  NavigationSagas,
];
