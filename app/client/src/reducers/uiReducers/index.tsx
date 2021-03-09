import { combineReducers } from "redux";
import editorReducer from "./editorReducer";
import errorReducer from "./errorReducer";
import propertyPaneReducer from "./propertyPaneReducer";
import appViewReducer from "./appViewReducer";
import applicationsReducer from "./applicationsReducer";
import { widgetSidebarReducer } from "./widgetSidebarReducer";
import apiPaneReducer from "./apiPaneReducer";
import datasourcePaneReducer from "./datasourcePaneReducer";
import authReducer from "./authReducer";
import orgReducer from "./orgReducer";
import usersReducer from "./usersReducer";
import { widgetDraggingReducer } from "./dragResizeReducer";
import importedCollectionsReducer from "./importedCollectionsReducer";
import providersReducer from "./providerReducer";
import importReducer from "./importReducer";
import queryPaneReducer from "./queryPaneReducer";
import helpReducer from "./helpReducer";
import apiNameReducer from "./apiNameReducer";
import explorerReducer from "./explorerReducer";
import confirmRunActionReducer from "./confirmRunActionReducer";
import themeReducer from "./themeReducer";
import datasourceNameReducer from "./datasourceNameReducer";
import pageCanvasStructureReducer from "reducers/uiReducers/pageCanvasStructureReducer";
import pageWidgetsReducer from "./pageWidgetsReducer";
import onBoardingReducer from "./onBoardingReducer";
import globalSearchReducer from "./globalSearchReducer";
import releasesReducer from "./releasesReducer";

const uiReducer = combineReducers({
  widgetSidebar: widgetSidebarReducer,
  editor: editorReducer,
  errors: errorReducer,
  propertyPane: propertyPaneReducer,
  appView: appViewReducer,
  applications: applicationsReducer,
  apiPane: apiPaneReducer,
  auth: authReducer,
  orgs: orgReducer,
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
  confirmRunAction: confirmRunActionReducer,
  onBoarding: onBoardingReducer,
  globalSearch: globalSearchReducer,
  releases: releasesReducer,
});
export default uiReducer;
