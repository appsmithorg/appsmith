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
import { CommentsReduxState } from "./uiReducers/commentsReducer/interfaces";
import { WebsocketReducerState } from "./uiReducers/websocketReducer";
import { DebuggerReduxState } from "./uiReducers/debuggerReducer";
import { TourReducerState } from "./uiReducers/tourReducer";
import { TableFilterPaneReduxState } from "./uiReducers/tableFilterPaneReducer";
import { JsPaneReduxState } from "./uiReducers/jsPaneReducer";
import { JSCollectionDataState } from "./entityReducers/jsActionsReducer";
import { NotificationReducerState } from "./uiReducers/notificationsReducer";
import { CanvasSelectionState } from "./uiReducers/canvasSelectionReducer";
import { JSObjectNameReduxState } from "./uiReducers/jsObjectNameReducer";
import { GitSyncReducerState } from "./uiReducers/gitSyncReducer";
import { AppCollabReducerState } from "./uiReducers/appCollabReducer";
import { CrudInfoModalReduxState } from "./uiReducers/crudInfoModalReducer";
import { FormEvaluationState } from "./evaluationReducers/formEvaluationReducer";
import { widgetReflowState } from "./uiReducers/reflowReducer";
import SettingsReducer, { SettingsReduxState } from "./settingsReducer";

const appReducer = combineReducers({
  entities: entityReducer,
  ui: uiReducer,
  evaluations: evaluationsReducer,
  form: formReducer,
  settings: SettingsReducer,
});

export default appReducer;

export interface AppState {
  ui: {
    editor: EditorReduxState;
    propertyPane: PropertyPaneReduxState;
    tableFilterPane: TableFilterPaneReduxState;
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
    comments: CommentsReduxState;
    websocket: WebsocketReducerState;
    debugger: DebuggerReduxState;
    tour: TourReducerState;
    jsPane: JsPaneReduxState;
    notifications: NotificationReducerState;
    canvasSelection: CanvasSelectionState;
    jsObjectName: JSObjectNameReduxState;
    gitSync: GitSyncReducerState;
    appCollab: AppCollabReducerState;
    crudInfoModal: CrudInfoModalReduxState;
    widgetReflow: widgetReflowState;
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
    jsActions: JSCollectionDataState;
  };
  evaluations: {
    tree: EvaluatedTreeState;
    dependencies: EvaluationDependencyState;
    loadingEntities: LoadingEntitiesState;
    formEvaluation: FormEvaluationState;
  };
  form: {
    [key: string]: any;
  };
  settings: SettingsReduxState;
}
