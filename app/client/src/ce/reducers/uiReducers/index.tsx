import apiNameReducer from "ee/reducers/uiReducers/apiNameReducer";
import apiPaneReducer from "ee/reducers/uiReducers/apiPaneReducer";
import applicationsReducer from "ee/reducers/uiReducers/applicationsReducer";
import { editorContextReducer } from "ee/reducers/uiReducers/editorContextReducer";
import editorReducer from "ee/reducers/uiReducers/editorReducer";
import explorerReducer from "ee/reducers/uiReducers/explorerReducer";
import queryPaneReducer from "ee/reducers/uiReducers/queryPaneReducer";
import selectedWorkspaceReducer from "ee/reducers/uiReducers/selectedWorkspaceReducer";
import workspaceReducer from "ee/reducers/uiReducers/workspaceReducer";
import actionSelectorReducer from "reducers/uiReducers/actionSelectorReducer";
import activeFieldReducer from "reducers/uiReducers/activeFieldEditorReducer";
import analyticsReducer from "reducers/uiReducers/analyticsReducer";
import appCollabReducer from "reducers/uiReducers/appCollabReducer";
import appSettingsPaneReducer from "reducers/uiReducers/appSettingsPaneReducer";
import appThemingReducer from "reducers/uiReducers/appThemingReducer";
import appViewReducer from "reducers/uiReducers/appViewReducer";
import authReducer from "reducers/uiReducers/authReducer";
import autoHeightUIReducer from "reducers/uiReducers/autoHeightReducer";
import buildingBlockReducer from "reducers/uiReducers/buildingBlockReducer";
import canvasSelectionReducer from "reducers/uiReducers/canvasSelectionReducer";
import consolidatedPageLoadReducer from "reducers/uiReducers/consolidatedPageLoadReducer";
import crudInfoModalReducer from "reducers/uiReducers/crudInfoModalReducer";
import datasourceNameReducer from "reducers/uiReducers/datasourceNameReducer";
import datasourcePaneReducer from "reducers/uiReducers/datasourcePaneReducer";
import debuggerReducer from "reducers/uiReducers/debuggerReducer";
import { widgetDraggingReducer } from "reducers/uiReducers/dragResizeReducer";
import errorReducer from "reducers/uiReducers/errorReducer";
import focusHistoryReducer from "reducers/uiReducers/focusHistoryReducer";
import gitSyncReducer from "reducers/uiReducers/gitSyncReducer";
import globalSearchReducer from "reducers/uiReducers/globalSearchReducer";
import helpReducer from "reducers/uiReducers/helpReducer";
import importReducer from "reducers/uiReducers/importReducer";
import jsObjectNameReducer from "reducers/uiReducers/jsObjectNameReducer";
import jsPaneReducer from "reducers/uiReducers/jsPaneReducer";
import layoutConversionReducer from "reducers/uiReducers/layoutConversionReducer";
import libraryReducer from "reducers/uiReducers/libraryReducer";
import mainCanvasReducer from "reducers/uiReducers/mainCanvasReducer";
import modalActionReducer from "reducers/uiReducers/modalActionReducer";
import onBoardingReducer from "reducers/uiReducers/onBoardingReducer";
import oneClickBindingReducer from "reducers/uiReducers/oneClickBindingReducer";
import pageCanvasStructureReducer from "reducers/uiReducers/pageCanvasStructureReducer";
import pageWidgetsReducer from "reducers/uiReducers/pageWidgetsReducer";
import propertyPaneReducer from "reducers/uiReducers/propertyPaneReducer";
import { widgetReflowReducer } from "reducers/uiReducers/reflowReducer";
import releasesReducer from "reducers/uiReducers/releasesReducer";
import tableFilterPaneReducer from "reducers/uiReducers/tableFilterPaneReducer";
import templateReducer from "reducers/uiReducers/templateReducer";
import themeReducer from "reducers/uiReducers/themeReducer";
import tourReducer from "reducers/uiReducers/tourReducer";
import usersReducer from "reducers/uiReducers/usersReducer";
import websocketReducer from "reducers/uiReducers/websocketReducer";

import ideReducer from "../../../reducers/uiReducers/ideReducer";

export const uiReducerObject = {
  analytics: analyticsReducer,
  editor: editorReducer,
  errors: errorReducer,
  propertyPane: propertyPaneReducer,
  tableFilterPane: tableFilterPaneReducer,
  appView: appViewReducer,
  applications: applicationsReducer,
  apiPane: apiPaneReducer,
  auth: authReducer,
  templates: templateReducer,
  buildingBlocks: buildingBlockReducer,
  workspaces: workspaceReducer,
  selectedWorkspace: selectedWorkspaceReducer,
  users: usersReducer,
  widgetDragResize: widgetDraggingReducer,
  imports: importReducer,
  queryPane: queryPaneReducer,
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
  websocket: websocketReducer,
  debugger: debuggerReducer,
  tour: tourReducer,
  jsPane: jsPaneReducer,
  jsObjectName: jsObjectNameReducer,
  canvasSelection: canvasSelectionReducer,
  gitSync: gitSyncReducer,
  appCollab: appCollabReducer,
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
};
