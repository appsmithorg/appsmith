import { combineReducers } from "redux";
import entityReducer from "./entityReducers";
import uiReducer from "./uiReducers";
import evaluationsReducer from "./evaluationReducers";
import { reducer as formReducer } from "redux-form";
import { CanvasWidgetsReduxState } from "./entityReducers/canvasWidgetsReducer";
import { EditorReduxState } from "./uiReducers/editorReducer";
import { ErrorReduxState } from "./uiReducers/errorReducer";
import { ActionDataState } from "./entityReducers/actionsReducer";
import { PropertyPaneReduxState } from "./uiReducers/propertyPaneReducer";
import { WidgetConfigReducerState } from "./entityReducers/widgetConfigReducer";
import { WidgetSidebarReduxState } from "./uiReducers/widgetSidebarReducer";
import { DatasourceDataState } from "./entityReducers/datasourceReducer";
import { AppViewReduxState } from "./uiReducers/appViewReducer";
import { DatasourcePaneReduxState } from "./uiReducers/datasourcePaneReducer";
import { ApplicationsReduxState } from "./uiReducers/applicationsReducer";
import { PageListReduxState } from "./entityReducers/pageListReducer";
import { ApiPaneReduxState } from "./uiReducers/apiPaneReducer";
import { QueryPaneReduxState } from "./uiReducers/queryPaneReducer";
import { PluginDataState } from "reducers/entityReducers/pluginsReducer";
import { AuthState } from "reducers/uiReducers/authReducer";
import { OrgReduxState } from "reducers/uiReducers/orgReducer";
import { UsersReduxState } from "reducers/uiReducers/usersReducer";
import { ThemeState } from "reducers/uiReducers/themeReducer";
import { WidgetDragResizeState } from "reducers/uiReducers/dragResizeReducer";
import { ImportedCollectionsReduxState } from "reducers/uiReducers/importedCollectionsReducer";
import { ProvidersReduxState } from "reducers/uiReducers/providerReducer";
import { MetaState } from "./entityReducers/metaReducer";
import { ImportReduxState } from "reducers/uiReducers/importReducer";
import { HelpReduxState } from "./uiReducers/helpReducer";
import { ApiNameReduxState } from "./uiReducers/apiNameReducer";
import { ExplorerReduxState } from "./uiReducers/explorerReducer";
import { PageCanvasStructureReduxState } from "reducers/uiReducers/pageCanvasStructureReducer";
import { ConfirmRunActionReduxState } from "./uiReducers/confirmRunActionReducer";
import { AppDataState } from "reducers/entityReducers/appReducer";
import { DatasourceNameReduxState } from "./uiReducers/datasourceNameReducer";
import { EvaluatedTreeState } from "./evaluationReducers/treeReducer";
import { EvaluationDependencyState } from "./evaluationReducers/dependencyReducer";
import { PageWidgetsReduxState } from "./uiReducers/pageWidgetsReducer";
import { OnboardingState } from "./uiReducers/onBoardingReducer";
import { GlobalSearchReduxState } from "./uiReducers/globalSearchReducer";
import { ReleasesState } from "./uiReducers/releasesReducer";
import { LoadingEntitiesState } from "./evaluationReducers/loadingEntitiesReducer";

const appReducer = combineReducers({
  entities: entityReducer,
  ui: uiReducer,
  evaluations: evaluationsReducer,
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
    auth: AuthState;
    orgs: OrgReduxState;
    users: UsersReduxState;
    widgetDragResize: WidgetDragResizeState;
    importedCollections: ImportedCollectionsReduxState;
    providers: ProvidersReduxState;
    imports: ImportReduxState;
    queryPane: QueryPaneReduxState;
    datasourcePane: DatasourcePaneReduxState;
    help: HelpReduxState;
    apiName: ApiNameReduxState;
    explorer: ExplorerReduxState;
    pageCanvasStructure: PageCanvasStructureReduxState;
    pageWidgets: PageWidgetsReduxState;
    confirmRunAction: ConfirmRunActionReduxState;
    datasourceName: DatasourceNameReduxState;
    theme: ThemeState;
    onBoarding: OnboardingState;
    globalSearch: GlobalSearchReduxState;
    releases: ReleasesState;
  };
  entities: {
    canvasWidgets: CanvasWidgetsReduxState;
    actions: ActionDataState;
    widgetConfig: WidgetConfigReducerState;
    datasources: DatasourceDataState;
    pageList: PageListReduxState;
    plugins: PluginDataState;
    meta: MetaState;
    app: AppDataState;
  };
  evaluations: {
    tree: EvaluatedTreeState;
    dependencies: EvaluationDependencyState;
    loadingEntities: LoadingEntitiesState;
  };
}
