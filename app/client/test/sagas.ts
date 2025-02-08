import { watchActionExecutionSagas } from "ee/sagas/ActionExecution/ActionExecutionSagas";
import userSagas from "ee/sagas/userSagas";
import workspaceSagas from "ee/sagas/WorkspaceSagas";
import { watchActionSagas } from "sagas/ActionSagas";
import layoutUpdateSagas from "sagas/AutoLayoutUpdateSagas";
import { watchDatasourcesSagas } from "ee/sagas/DatasourcesSagas";
import { watchJSActionSagas } from "ee/sagas/JSActionSagas";
import apiPaneSagas from "../src/sagas/ApiPaneSagas";
import applicationSagas from "ee/sagas/ApplicationSagas";
import batchSagas from "../src/sagas/BatchSagas";
import draggingCanvasSagas from "../src/sagas/CanvasSagas/DraggingCanvasSagas";
import selectionCanvasSagas from "../src/sagas/CanvasSagas/SelectionCanvasSagas";
import curlImportSagas from "../src/sagas/CurlImportSagas";
import debuggerSagas from "../src/sagas/DebuggerSagas";
import formEvaluationChangeListener from "../src/sagas/FormEvaluationSaga";
import globalSearchSagas from "../src/sagas/GlobalSearchSagas";
import initSagas from "../src/sagas/InitSagas";
import JSLibrarySaga from "../src/sagas/JSLibrarySaga";
import jsPaneSagas from "../src/sagas/JSPaneSagas";
import LintingSaga from "../src/sagas/LintingSagas";
import modalSagas from "../src/sagas/ModalSagas";
import pluginSagas from "../src/sagas/PluginSagas";
import queryPaneSagas from "../src/sagas/QueryPaneSagas";
import saaSPaneSagas from "../src/sagas/SaaSPaneSagas";
import snipingModeSagas from "../src/sagas/SnipingModeSagas";
import themeSagas from "../src/sagas/ThemeSaga";
import actionExecutionChangeListeners from "../src/sagas/WidgetLoadingSaga";
import widgetOperationSagas from "../src/sagas/WidgetOperationSagas";
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
  curlImportSagas,
  snipingModeSagas,
  queryPaneSagas,
  modalSagas,
  batchSagas,
  themeSagas,
  actionExecutionChangeListeners,
  formEvaluationChangeListener,
  saaSPaneSagas,
  globalSearchSagas,
  debuggerSagas,
  watchJSActionSagas,
  selectionCanvasSagas,
  draggingCanvasSagas,
  LintingSaga,
  JSLibrarySaga,
  NavigationSagas,
  layoutUpdateSagas,
];
