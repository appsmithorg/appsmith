import { combineReducers } from "redux";
import editorReducer from "./editorReducer";
import errorReducer from "./errorReducer";
import propertyPaneReducer from "./propertyPaneReducer";
import appViewReducer from "./appViewReducer";
import applicationsReducer from "./applicationsReducer";
import { widgetSidebarReducer } from "./widgetSidebarReducer";
import apiPaneReducer from "./apiPaneReducer";
import routesParamsReducer from "reducers/uiReducers/routesParamsReducer";
import authReducer from "./authReducer";
import orgReducer from "./orgReducer";
import usersReducer from "./usersReducer";
import { widgetDraggingReducer } from "./dragResizeReducer";

const uiReducer = combineReducers({
  widgetSidebar: widgetSidebarReducer,
  editor: editorReducer,
  errors: errorReducer,
  propertyPane: propertyPaneReducer,
  appView: appViewReducer,
  applications: applicationsReducer,
  apiPane: apiPaneReducer,
  routesParams: routesParamsReducer,
  auth: authReducer,
  orgs: orgReducer,
  users: usersReducer,
  widgetDragResize: widgetDraggingReducer,
});
export default uiReducer;
