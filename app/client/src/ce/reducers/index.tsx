import entityReducer from "reducers/entityReducers";
import uiReducer from "reducers/uiReducers";
import evaluationsReducer from "reducers/evaluationReducers";
import { reducer as formReducer } from "redux-form";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { EditorReduxState } from "reducers/uiReducers/editorReducer";
import { ErrorReduxState } from "reducers/uiReducers/errorReducer";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import { TemplatesReduxState } from "reducers/uiReducers/templateReducer";
import { WidgetConfigReducerState } from "reducers/entityReducers/widgetConfigReducer";
import { DatasourceDataState } from "reducers/entityReducers/datasourceReducer";
import { AppViewReduxState } from "reducers/uiReducers/appViewReducer";
import { DatasourcePaneReduxState } from "reducers/uiReducers/datasourcePaneReducer";
import { ApplicationsReduxState } from "@appsmith/reducers/uiReducers/applicationsReducer";
import { PageListReduxState } from "reducers/entityReducers/pageListReducer";
import { ApiPaneReduxState } from "reducers/uiReducers/apiPaneReducer";
import { QueryPaneReduxState } from "reducers/uiReducers/queryPaneReducer";
import { PluginDataState } from "reducers/entityReducers/pluginsReducer";
import { AuthState } from "reducers/uiReducers/authReducer";
import { WorkspaceReduxState } from "reducers/uiReducers/workspaceReducer";
import { UsersReduxState } from "reducers/uiReducers/usersReducer";
import { ThemeState } from "reducers/uiReducers/themeReducer";
import { WidgetDragResizeState } from "reducers/uiReducers/dragResizeReducer";
import { ImportedCollectionsReduxState } from "reducers/uiReducers/importedCollectionsReducer";
import { ProvidersReduxState } from "reducers/uiReducers/providerReducer";
import { MetaState } from "reducers/entityReducers/metaReducer";
import { ImportReduxState } from "reducers/uiReducers/importReducer";
import { HelpReduxState } from "reducers/uiReducers/helpReducer";
import { ApiNameReduxState } from "reducers/uiReducers/apiNameReducer";
import { ExplorerReduxState } from "reducers/uiReducers/explorerReducer";
import { PageCanvasStructureReduxState } from "reducers/uiReducers/pageCanvasStructureReducer";
import { ModalActionReduxState } from "reducers/uiReducers/modalActionReducer";
import { AppDataState } from "reducers/entityReducers/appReducer";
import { DatasourceNameReduxState } from "reducers/uiReducers/datasourceNameReducer";
import { EvaluatedTreeState } from "reducers/evaluationReducers/treeReducer";
import { EvaluationDependencyState } from "reducers/evaluationReducers/dependencyReducer";
import { PageWidgetsReduxState } from "reducers/uiReducers/pageWidgetsReducer";
import { OnboardingState } from "reducers/uiReducers/onBoardingReducer";
import { GlobalSearchReduxState } from "reducers/uiReducers/globalSearchReducer";
import { ReleasesState } from "reducers/uiReducers/releasesReducer";
import { LoadingEntitiesState } from "reducers/evaluationReducers/loadingEntitiesReducer";
import { WebsocketReducerState } from "reducers/uiReducers/websocketReducer";
import { DebuggerReduxState } from "reducers/uiReducers/debuggerReducer";
import { TourReducerState } from "reducers/uiReducers/tourReducer";
import { TableFilterPaneReduxState } from "reducers/uiReducers/tableFilterPaneReducer";
import { JsPaneReduxState } from "reducers/uiReducers/jsPaneReducer";
import { JSCollectionDataState } from "reducers/entityReducers/jsActionsReducer";
import { CanvasSelectionState } from "reducers/uiReducers/canvasSelectionReducer";
import { JSObjectNameReduxState } from "reducers/uiReducers/jsObjectNameReducer";
import { GitSyncReducerState } from "reducers/uiReducers/gitSyncReducer";
import { AppCollabReducerState } from "reducers/uiReducers/appCollabReducer";
import { CrudInfoModalReduxState } from "reducers/uiReducers/crudInfoModalReducer";
import { FormEvaluationState } from "reducers/evaluationReducers/formEvaluationReducer";
import { widgetReflow } from "reducers/uiReducers/reflowReducer";
import { AppThemingState } from "reducers/uiReducers/appThemingReducer";
import { MainCanvasReduxState } from "reducers/uiReducers/mainCanvasReducer";
import SettingsReducer, {
  SettingsReduxState,
} from "@appsmith/reducers/settingsReducer";
import { GuidedTourState } from "reducers/uiReducers/guidedTourReducer";
import { TriggerValuesEvaluationState } from "reducers/evaluationReducers/triggerReducer";
import { CanvasWidgetStructure } from "widgets/constants";

export const reducerObject = {
  entities: entityReducer,
  ui: uiReducer,
  evaluations: evaluationsReducer,
  form: formReducer,
  settings: SettingsReducer,
};

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
    templates: TemplatesReduxState;
    workspaces: WorkspaceReduxState;
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
    modalAction: ModalActionReduxState;
    datasourceName: DatasourceNameReduxState;
    theme: ThemeState;
    onBoarding: OnboardingState;
    guidedTour: GuidedTourState;
    globalSearch: GlobalSearchReduxState;
    releases: ReleasesState;
    websocket: WebsocketReducerState;
    debugger: DebuggerReduxState;
    tour: TourReducerState;
    jsPane: JsPaneReduxState;
    canvasSelection: CanvasSelectionState;
    jsObjectName: JSObjectNameReduxState;
    gitSync: GitSyncReducerState;
    appCollab: AppCollabReducerState;
    crudInfoModal: CrudInfoModalReduxState;
    widgetReflow: widgetReflow;
    appTheming: AppThemingState;
    mainCanvas: MainCanvasReduxState;
  };
  entities: {
    canvasWidgetsStructure: CanvasWidgetStructure;
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
    triggers: TriggerValuesEvaluationState;
  };
  form: {
    [key: string]: any;
  };
  settings: SettingsReduxState;
}
