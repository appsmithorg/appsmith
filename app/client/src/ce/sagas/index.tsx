import { watchActionExecutionSagas } from "ee/sagas/ActionExecution/ActionExecutionSagas";
import applicationSagas from "ee/sagas/ApplicationSagas";
import { watchJSActionSagas } from "ee/sagas/JSActionSagas";
import NavigationSagas from "ee/sagas/NavigationSagas";
import pageSagas from "ee/sagas/PageSagas";
import SuperUserSagas from "ee/sagas/SuperUserSagas";
import workspaceSagas from "ee/sagas/WorkspaceSagas";
import tenantSagas from "ee/sagas/tenantSagas";
import userSagas from "ee/sagas/userSagas";
import anvilSagas from "layoutSystems/anvil/integrations/sagas";
import { watchPluginActionExecutionSagas } from "sagas/ActionExecution/PluginActionSaga";
import { watchActionSagas } from "sagas/ActionSagas";
import sendSideBySideWidgetHoverAnalyticsEventSaga from "sagas/AnalyticsSaga";
import apiPaneSagas from "sagas/ApiPaneSagas";
import appThemingSaga from "sagas/AppThemingSaga";
import autoLayoutUpdateSagas from "sagas/AutoLayoutUpdateSagas";
import batchSagas from "sagas/BatchSagas";
import autoLayoutDraggingSagas from "sagas/CanvasSagas/AutoLayoutDraggingSagas";
import draggingCanvasSagas from "sagas/CanvasSagas/DraggingCanvasSagas";
import selectionCanvasSagas from "sagas/CanvasSagas/SelectionCanvasSagas";
import communityTemplateSagas from "sagas/CommunityTemplatesSagas";
import curlImportSagas from "sagas/CurlImportSagas";
import { watchDatasourcesSagas } from "sagas/DatasourcesSagas";
import debuggerSagas from "sagas/DebuggerSagas";
import errorSagas from "sagas/ErrorSagas";
import evaluationsSaga from "sagas/EvaluationsSaga";
import formEvaluationChangeListener from "sagas/FormEvaluationSaga";
import gitSyncSagas from "sagas/GitSyncSagas";
import globalSearchSagas from "sagas/GlobalSearchSagas";
import ideSagas from "sagas/IDESaga";
import initSagas from "sagas/InitSagas";
import JSLibrarySaga from "sagas/JSLibrarySaga";
import jsPaneSagas from "sagas/JSPaneSagas";
import LintingSaga from "sagas/LintingSagas";
import modalSagas from "sagas/ModalSagas";
import entityNavigationSaga from "sagas/NavigationSagas";
import onboardingSagas from "sagas/OnboardingSagas";
import oneClickBindingSaga from "sagas/OneClickBindingSaga";
import PageVisibilitySaga from "sagas/PageVisibilitySagas";
import pluginSagas from "sagas/PluginSagas";
import queryPaneSagas from "sagas/QueryPaneSagas";
import replaySaga from "sagas/ReplaySaga";
import saaSPaneSagas from "sagas/SaaSPaneSagas";
import snapshotSagas from "sagas/SnapshotSagas";
import snipingModeSagas from "sagas/SnipingModeSagas";
import templateSagas from "sagas/TemplatesSagas";

/* Sagas that are registered by a module that is designed to be independent of the core platform */
import ternSagas from "sagas/TernSaga";
import themeSagas from "sagas/ThemeSaga";
import websocketSagas from "sagas/WebsocketSagas/WebsocketSagas";
import actionExecutionChangeListeners from "sagas/WidgetLoadingSaga";
import widgetOperationSagas from "sagas/WidgetOperationSagas";
import AutoHeightSagas from "sagas/autoHeightSagas";
import editorContextSagas from "sagas/editorContextSagas";
import layoutConversionSagas from "sagas/layoutConversionSagas";

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
  oneClickBindingSaga,
  entityNavigationSaga,
  communityTemplateSagas,
  anvilSagas,
  ternSagas,
  ideSagas,
  sendSideBySideWidgetHoverAnalyticsEventSaga,
];
