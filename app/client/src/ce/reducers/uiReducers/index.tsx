import editorReducer from "@appsmith/reducers/uiReducers/editorReducer";
import errorReducer from "reducers/uiReducers/errorReducer";
import propertyPaneReducer from "reducers/uiReducers/propertyPaneReducer";
import appViewReducer from "reducers/uiReducers/appViewReducer";
import applicationsReducer from "@appsmith/reducers/uiReducers/applicationsReducer";
import apiPaneReducer from "@appsmith/reducers/uiReducers/apiPaneReducer";
import datasourcePaneReducer from "reducers/uiReducers/datasourcePaneReducer";
import authReducer from "reducers/uiReducers/authReducer";
import workspaceReducer from "@appsmith/reducers/uiReducers/workspaceReducer";
import templateReducer from "reducers/uiReducers/templateReducer";
import usersReducer from "reducers/uiReducers/usersReducer";
import { widgetDraggingReducer } from "reducers/uiReducers/dragResizeReducer";
import importedCollectionsReducer from "reducers/uiReducers/importedCollectionsReducer";
import providersReducer from "reducers/uiReducers/providerReducer";
import importReducer from "reducers/uiReducers/importReducer";
import queryPaneReducer from "@appsmith/reducers/uiReducers/queryPaneReducer";
import helpReducer from "reducers/uiReducers/helpReducer";
import apiNameReducer from "@appsmith/reducers/uiReducers/apiNameReducer";
import explorerReducer from "@appsmith/reducers/uiReducers/explorerReducer";
import modalActionReducer from "reducers/uiReducers/modalActionReducer";
import themeReducer from "reducers/uiReducers/themeReducer";
import datasourceNameReducer from "reducers/uiReducers/datasourceNameReducer";
import pageCanvasStructureReducer from "reducers/uiReducers/pageCanvasStructureReducer";
import pageWidgetsReducer from "reducers/uiReducers/pageWidgetsReducer";
import onBoardingReducer from "reducers/uiReducers/onBoardingReducer";
import globalSearchReducer from "reducers/uiReducers/globalSearchReducer";
import actionSelectorReducer from "reducers/uiReducers/actionSelectorReducer";
import releasesReducer from "reducers/uiReducers/releasesReducer";
import websocketReducer from "reducers/uiReducers/websocketReducer";
import debuggerReducer from "reducers/uiReducers/debuggerReducer";
import tourReducer from "reducers/uiReducers/tourReducer";
import tableFilterPaneReducer from "reducers/uiReducers/tableFilterPaneReducer";
import jsPaneReducer from "reducers/uiReducers/jsPaneReducer";
import appCollabReducer from "reducers/uiReducers/appCollabReducer";
import canvasSelectionReducer from "reducers/uiReducers/canvasSelectionReducer";
import gitSyncReducer from "reducers/uiReducers/gitSyncReducer";
import crudInfoModalReducer from "reducers/uiReducers/crudInfoModalReducer";
import { widgetReflowReducer } from "reducers/uiReducers/reflowReducer";
import jsObjectNameReducer from "reducers/uiReducers/jsObjectNameReducer";
import appThemingReducer from "reducers/uiReducers/appThemingReducer";
import mainCanvasReducer from "reducers/uiReducers/mainCanvasReducer";
import focusHistoryReducer from "reducers/uiReducers/focusHistoryReducer";
import { editorContextReducer } from "@appsmith/reducers/uiReducers/editorContextReducer";
import guidedTourReducer from "reducers/uiReducers/guidedTourReducer";
import libraryReducer from "reducers/uiReducers/libraryReducer";
import appSettingsPaneReducer from "reducers/uiReducers/appSettingsPaneReducer";
import autoHeightUIReducer from "reducers/uiReducers/autoHeightReducer";
import analyticsReducer from "reducers/uiReducers/analyticsReducer";
import layoutConversionReducer from "reducers/uiReducers/layoutConversionReducer";
import oneClickBindingReducer from "reducers/uiReducers/oneClickBindingReducer";
import activeFieldReducer from "reducers/uiReducers/activeFieldEditorReducer";

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
  layoutConversion: layoutConversionReducer,
  actionSelector: actionSelectorReducer,
  oneClickBinding: oneClickBindingReducer,
  activeField: activeFieldReducer,
};
