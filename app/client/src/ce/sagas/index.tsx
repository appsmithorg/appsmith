import { watchActionExecutionSagas } from "ee/sagas/ActionExecution/ActionExecutionSagas";
import NavigationSagas from "ee/sagas/NavigationSagas";
import SuperUserSagas from "ee/sagas/SuperUserSagas";
import tenantSagas from "ee/sagas/tenantSagas";
import userSagas from "ee/sagas/userSagas";
import workspaceSagas from "ee/sagas/WorkspaceSagas";
import { watchPluginActionExecutionSagas } from "sagas/ActionExecution/PluginActionSaga";
import { watchActionSagas } from "sagas/ActionSagas";
import apiPaneSagas from "sagas/ApiPaneSagas";
import applicationSagas from "ee/sagas/ApplicationSagas";
import appThemingSaga from "sagas/AppThemingSaga";
import AutoHeightSagas from "sagas/autoHeightSagas";
import autoLayoutUpdateSagas from "sagas/AutoLayoutUpdateSagas";
import batchSagas from "sagas/BatchSagas";
import autoLayoutDraggingSagas from "sagas/CanvasSagas/AutoLayoutDraggingSagas";
import draggingCanvasSagas from "sagas/CanvasSagas/DraggingCanvasSagas";
import selectionCanvasSagas from "sagas/CanvasSagas/SelectionCanvasSagas";
import curlImportSagas from "sagas/CurlImportSagas";
import { watchDatasourcesSagas } from "ee/sagas/DatasourcesSagas";
import debuggerSagas from "sagas/DebuggerSagas";
import editorContextSagas from "sagas/editorContextSagas";
import errorSagas from "sagas/ErrorSagas";
import evaluationsSaga from "sagas/EvaluationsSaga";
import formEvaluationChangeListener from "sagas/FormEvaluationSaga";
import gitSyncSagas from "sagas/GitSyncSagas";
import globalSearchSagas from "sagas/GlobalSearchSagas";
import initSagas from "sagas/InitSagas";
import { watchJSActionSagas } from "ee/sagas/JSActionSagas";
import JSLibrarySaga from "sagas/JSLibrarySaga";
import jsPaneSagas from "sagas/JSPaneSagas";
import layoutConversionSagas from "sagas/layoutConversionSagas";
import LintingSaga from "sagas/LintingSagas";
import modalSagas from "sagas/ModalSagas";
import onboardingSagas from "sagas/OnboardingSagas";
import pageSagas from "ee/sagas/PageSagas";
import pluginSagas from "sagas/PluginSagas";
import queryPaneSagas from "sagas/QueryPaneSagas";
import replaySaga from "sagas/ReplaySaga";
import saaSPaneSagas from "sagas/SaaSPaneSagas";
import snapshotSagas from "sagas/SnapshotSagas";
import snipingModeSagas from "sagas/SnipingModeSagas";
import templateSagas from "sagas/TemplatesSagas";
import themeSagas from "sagas/ThemeSaga";
import actionExecutionChangeListeners from "sagas/WidgetLoadingSaga";
import widgetOperationSagas from "sagas/WidgetOperationSagas";
import oneClickBindingSaga from "sagas/OneClickBindingSaga";
import entityNavigationSaga from "sagas/NavigationSagas";
import communityTemplateSagas from "sagas/CommunityTemplatesSagas";
import anvilSagas from "layoutSystems/anvil/integrations/sagas";
import ideSagas from "sagas/IDESaga";
import sendSideBySideWidgetHoverAnalyticsEventSaga from "sagas/AnalyticsSaga";

/* Sagas that are registered by a module that is designed to be independent of the core platform */
import ternSagas from "sagas/TernSaga";
import gitSagas from "git/sagas";

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
  gitSagas,
];
