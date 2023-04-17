import { combineReducers } from "redux";
import editorReducer from "./editorReducer";
import errorReducer from "./errorReducer";
import propertyPaneReducer from "./propertyPaneReducer";
import appViewReducer from "./appViewReducer";
import applicationsReducer from "@appsmith/reducers/uiReducers/applicationsReducer";
import apiPaneReducer from "./apiPaneReducer";
import datasourcePaneReducer from "./datasourcePaneReducer";
import authReducer from "./authReducer";
import workspaceReducer from "@appsmith/reducers/uiReducers/workspaceReducer";
import templateReducer from "./templateReducer";
import usersReducer from "./usersReducer";
import { widgetDraggingReducer } from "./dragResizeReducer";
import importedCollectionsReducer from "./importedCollectionsReducer";
import providersReducer from "./providerReducer";
import importReducer from "./importReducer";
import queryPaneReducer from "./queryPaneReducer";
import helpReducer from "./helpReducer";
import apiNameReducer from "./apiNameReducer";
import explorerReducer from "./explorerReducer";
import modalActionReducer from "./modalActionReducer";
import themeReducer from "./themeReducer";
import datasourceNameReducer from "./datasourceNameReducer";
import pageCanvasStructureReducer from "reducers/uiReducers/pageCanvasStructureReducer";
import pageWidgetsReducer from "./pageWidgetsReducer";
import onBoardingReducer from "./onBoardingReducer";
import globalSearchReducer from "./globalSearchReducer";
import releasesReducer from "./releasesReducer";
import websocketReducer from "./websocketReducer";
import debuggerReducer from "./debuggerReducer";
import tourReducer from "./tourReducer";
import tableFilterPaneReducer from "./tableFilterPaneReducer";
import jsPaneReducer from "./jsPaneReducer";
import appCollabReducer from "./appCollabReducer";
import canvasSelectionReducer from "./canvasSelectionReducer";
import gitSyncReducer from "./gitSyncReducer";
import crudInfoModalReducer from "./crudInfoModalReducer";
import { widgetReflowReducer } from "./reflowReducer";
import jsObjectNameReducer from "./jsObjectNameReducer";
import appThemingReducer from "./appThemingReducer";
import mainCanvasReducer from "./mainCanvasReducer";
import focusHistoryReducer from "./focusHistoryReducer";
import { editorContextReducer } from "./editorContextReducer";
import guidedTourReducer from "./guidedTourReducer";
import libraryReducer from "./libraryReducer";
import appSettingsPaneReducer from "./appSettingsPaneReducer";
import autoHeightUIReducer from "./autoHeightReducer";
import analyticsReducer from "./analyticsReducer";
import multiPaneReducer from "./multiPaneReducer";
import layoutConversionReducer from "./layoutConversionReducer";

const uiReducer = combineReducers({
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
  workspaces: workspaceReducer,
  users: usersReducer,
  widgetDragResize: widgetDraggingReducer,
  importedCollections: importedCollectionsReducer,
  providers: providersReducer,
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
  guidedTour: guidedTourReducer,
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
  multiPaneConfig: multiPaneReducer,
  layoutConversion: layoutConversionReducer,
});

export default uiReducer;
