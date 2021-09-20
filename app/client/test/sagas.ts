import initSagas from "../src/sagas/InitSagas";
import apiPaneSagas from "../src/sagas/ApiPaneSagas";
import jsPaneSagas from "../src/sagas/JSPaneSagas";
import userSagas from "../src/sagas/userSagas";
import pluginSagas from "../src/sagas/PluginSagas";
import orgSagas from "../src/sagas/OrgSagas";
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
import recentEntitiesSagas from "../src/sagas/RecentEntitiesSagas";
import commentSagas from "../src/sagas/CommentSagas";
import websocketSagas from "../src/sagas/WebsocketSagas/WebsocketSagas";
import debuggerSagas from "../src/sagas/DebuggerSagas";
import { watchActionSagas } from "../src/sagas/ActionSagas";
import { watchActionExecutionSagas } from "../src/sagas/ActionExecution/ActionExecutionSagas";
import widgetOperationSagas from "../src/sagas/WidgetOperationSagas";
import applicationSagas from "../src/sagas/ApplicationSagas";
import { watchDatasourcesSagas } from "../src/sagas/DatasourcesSagas";
import { watchJSActionSagas } from "../src/sagas/JSActionSagas";
import tourSagas from "../src/sagas/TourSagas";
import notificationsSagas from "../src/sagas/NotificationsSagas";
import selectionCanvasSagas from "../src/sagas/CanvasSagas/SelectionCanvasSagas";
import draggingCanvasSagas from "../src/sagas/CanvasSagas/DraggingCanvasSagas";
import formEvaluationChangeListener from "../src/sagas/FormEvaluationSaga";

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
  orgSagas,
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
  recentEntitiesSagas,
  commentSagas,
  websocketSagas,
  debuggerSagas,
  watchJSActionSagas,
  tourSagas,
  notificationsSagas,
  selectionCanvasSagas,
  draggingCanvasSagas,
];
