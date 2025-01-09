import editorReducer from "ee/reducers/uiReducers/editorReducer";
import errorReducer from "reducers/uiReducers/errorReducer";
import propertyPaneReducer from "reducers/uiReducers/propertyPaneReducer";
import appViewReducer from "reducers/uiReducers/appViewReducer";
import applicationsReducer from "ee/reducers/uiReducers/applicationsReducer";
import datasourcePaneReducer from "reducers/uiReducers/datasourcePaneReducer";
import authReducer from "reducers/uiReducers/authReducer";
import workspaceReducer from "ee/reducers/uiReducers/workspaceReducer";
import templateReducer from "reducers/uiReducers/templateReducer";
import buildingBlockReducer from "reducers/uiReducers/buildingBlockReducer";
import usersReducer from "reducers/uiReducers/usersReducer";
import { widgetDraggingReducer } from "reducers/uiReducers/dragResizeReducer";
import importReducer from "reducers/uiReducers/importReducer";
import helpReducer from "reducers/uiReducers/helpReducer";
import apiNameReducer from "ee/reducers/uiReducers/apiNameReducer";
import explorerReducer from "ee/reducers/uiReducers/explorerReducer";
import modalActionReducer from "reducers/uiReducers/modalActionReducer";
import themeReducer from "reducers/uiReducers/themeReducer";
import datasourceNameReducer from "reducers/uiReducers/datasourceNameReducer";
import pageCanvasStructureReducer from "reducers/uiReducers/pageCanvasStructureReducer";
import pageWidgetsReducer from "reducers/uiReducers/pageWidgetsReducer";
import onBoardingReducer from "reducers/uiReducers/onBoardingReducer";
import globalSearchReducer from "reducers/uiReducers/globalSearchReducer";
import actionSelectorReducer from "reducers/uiReducers/actionSelectorReducer";
import releasesReducer from "reducers/uiReducers/releasesReducer";
import debuggerReducer from "reducers/uiReducers/debuggerReducer";
import tourReducer from "reducers/uiReducers/tourReducer";
import tableFilterPaneReducer from "reducers/uiReducers/tableFilterPaneReducer";
import jsPaneReducer from "reducers/uiReducers/jsPaneReducer";
import canvasSelectionReducer from "reducers/uiReducers/canvasSelectionReducer";
import gitSyncReducer from "reducers/uiReducers/gitSyncReducer";
import crudInfoModalReducer from "reducers/uiReducers/crudInfoModalReducer";
import { widgetReflowReducer } from "reducers/uiReducers/reflowReducer";
import jsObjectNameReducer from "reducers/uiReducers/jsObjectNameReducer";
import appThemingReducer from "reducers/uiReducers/appThemingReducer";
import mainCanvasReducer from "reducers/uiReducers/mainCanvasReducer";
import focusHistoryReducer from "reducers/uiReducers/focusHistoryReducer";
import { editorContextReducer } from "ee/reducers/uiReducers/editorContextReducer";
import libraryReducer from "reducers/uiReducers/libraryReducer";
import appSettingsPaneReducer from "reducers/uiReducers/appSettingsPaneReducer";
import autoHeightUIReducer from "reducers/uiReducers/autoHeightReducer";
import analyticsReducer from "reducers/uiReducers/analyticsReducer";
import layoutConversionReducer from "reducers/uiReducers/layoutConversionReducer";
import oneClickBindingReducer from "reducers/uiReducers/oneClickBindingReducer";
import activeFieldReducer from "reducers/uiReducers/activeFieldEditorReducer";
import selectedWorkspaceReducer from "ee/reducers/uiReducers/selectedWorkspaceReducer";
import ideReducer from "reducers/uiReducers/ideReducer";
import consolidatedPageLoadReducer from "reducers/uiReducers/consolidatedPageLoadReducer";
import { pluginActionReducer } from "PluginActionEditor/store";

export const uiReducerObject = {
  analytics: analyticsReducer,
  editor: editorReducer,
  errors: errorReducer,
  propertyPane: propertyPaneReducer,
  tableFilterPane: tableFilterPaneReducer,
  appView: appViewReducer,
  applications: applicationsReducer,
  auth: authReducer,
  templates: templateReducer,
  buildingBlocks: buildingBlockReducer,
  workspaces: workspaceReducer,
  selectedWorkspace: selectedWorkspaceReducer,
  users: usersReducer,
  widgetDragResize: widgetDraggingReducer,
  imports: importReducer,
  datasourcePane: datasourcePaneReducer,
  datasourceName: datasourceNameReducer,
  help: helpReducer,
  apiName: apiNameReducer,
  explorer: explorerReducer,
  pageCanvasStructure: pageCanvasStructureReducer,
  pageWidgets: pageWidgetsReducer,
  theme: themeReducer,
  modalAction: modalActionReducer,
  onBoarding: onBoardingReducer,
  globalSearch: globalSearchReducer,
  releases: releasesReducer,
  debugger: debuggerReducer,
  tour: tourReducer,
  jsPane: jsPaneReducer,
  jsObjectName: jsObjectNameReducer,
  canvasSelection: canvasSelectionReducer,
  gitSync: gitSyncReducer,
  crudInfoModal: crudInfoModalReducer,
  widgetReflow: widgetReflowReducer,
  appTheming: appThemingReducer,
  mainCanvas: mainCanvasReducer,
  appSettingsPane: appSettingsPaneReducer,
  focusHistory: focusHistoryReducer,
  editorContext: editorContextReducer,
  libraries: libraryReducer,
  autoHeightUI: autoHeightUIReducer,
  layoutConversion: layoutConversionReducer,
  actionSelector: actionSelectorReducer,
  oneClickBinding: oneClickBindingReducer,
  activeField: activeFieldReducer,
  ide: ideReducer,
  consolidatedPageLoad: consolidatedPageLoadReducer,
  pluginActionEditor: pluginActionReducer,
};
