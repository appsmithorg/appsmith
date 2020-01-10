import { combineReducers } from "redux";
import entityReducer from "./entityReducers";
import uiReducer from "./uiReducers";
import { reducer as formReducer } from "redux-form";
import { CanvasWidgetsReduxState } from "./entityReducers/canvasWidgetsReducer";
import { EditorReduxState } from "./uiReducers/editorReducer";
import { ErrorReduxState } from "./uiReducers/errorReducer";
import { APIDataState } from "./entityReducers/apiDataReducer";
import { QueryDataState } from "./entityReducers/queryDataReducer";
import { ActionDataState } from "./entityReducers/actionsReducer";
import { PropertyPaneConfigState } from "./entityReducers/propertyPaneConfigReducer";
import { PropertyPaneReduxState } from "./uiReducers/propertyPaneReducer";
import { WidgetConfigReducerState } from "./entityReducers/widgetConfigReducer";
import { WidgetSidebarReduxState } from "./uiReducers/widgetSidebarReducer";
import { DatasourceDataState } from "./entityReducers/datasourceReducer";
import { AppViewReduxState } from "./uiReducers/appViewReducer";
import { ApplicationsReduxState } from "./uiReducers/applicationsReducer";
import { BindingsDataState } from "./entityReducers/bindingsReducer";
import { PageListReduxState } from "./entityReducers/pageListReducer";
import { ApiPaneReduxState } from "./uiReducers/apiPaneReducer";
import { RoutesParamsReducerState } from "reducers/uiReducers/routesParamsReducer";
import { PluginDataState } from "reducers/entityReducers/pluginsReducer";
import { AuthState } from "reducers/uiReducers/authReducer";
import { OrgReduxState } from "reducers/uiReducers/orgReducer";
import { UsersReduxState } from "reducers/uiReducers/usersReducer";
import { WidgetDraggingState } from "actions/widgetActions";

const appReducer = combineReducers({
  entities: entityReducer,
  ui: uiReducer,
  form: formReducer,
});

export default appReducer;

export interface AppState {
  ui: {
    widgetSidebar: WidgetSidebarReduxState;
    editor: EditorReduxState;
    propertyPane: PropertyPaneReduxState;
    errors: ErrorReduxState;
    appView: AppViewReduxState;
    applications: ApplicationsReduxState;
    apiPane: ApiPaneReduxState;
    routesParams: RoutesParamsReducerState;
    auth: AuthState;
    orgs: OrgReduxState;
    users: UsersReduxState;
    widgetDragging: WidgetDraggingState;
  };
  entities: {
    canvasWidgets: CanvasWidgetsReduxState;
    apiData: APIDataState;
    queryData: QueryDataState;
    actions: ActionDataState;
    propertyConfig: PropertyPaneConfigState;
    widgetConfig: WidgetConfigReducerState;
    datasources: DatasourceDataState;
    nameBindings: BindingsDataState;
    pageList: PageListReduxState;
    plugins: PluginDataState;
  };
}

export type DataTree = AppState["entities"];
