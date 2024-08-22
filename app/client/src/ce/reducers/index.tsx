import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import entityReducer from "ee/reducers/entityReducers";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";
import type { JSCollectionDataState } from "ee/reducers/entityReducers/jsActionsReducer";
import type { SettingsReduxState } from "ee/reducers/settingsReducer";
import SettingsReducer from "ee/reducers/settingsReducer";
import type { TenantReduxState } from "ee/reducers/tenantReducer";
import tenantReducer from "ee/reducers/tenantReducer";
import uiReducer from "ee/reducers/uiReducers";
import type { ApiNameReduxState } from "ee/reducers/uiReducers/apiNameReducer";
import type { ApiPaneReduxState } from "ee/reducers/uiReducers/apiPaneReducer";
import type { ApplicationsReduxState } from "ee/reducers/uiReducers/applicationsReducer";
import type { EditorContextState } from "ee/reducers/uiReducers/editorContextReducer";
import type { EditorReduxState } from "ee/reducers/uiReducers/editorReducer";
import type { ExplorerReduxState } from "ee/reducers/uiReducers/explorerReducer";
import type { QueryPaneReduxState } from "ee/reducers/uiReducers/queryPaneReducer";
import type { SelectedWorkspaceReduxState } from "ee/reducers/uiReducers/selectedWorkspaceReducer";
import type { WorkspaceReduxState } from "ee/reducers/uiReducers/workspaceReducer";

/* Reducers which are integrated into the core system when registering a pluggable module
    or done so by a module that is designed to be eventually pluggable */
import type { LayoutElementPositionsReduxState } from "layoutSystems/anvil/integrations/reducers/layoutElementPositionsReducer";
import type { AppDataState } from "reducers/entityReducers/appReducer";
import type { AutoHeightLayoutTreeReduxState } from "reducers/entityReducers/autoHeightReducers/autoHeightLayoutTreeReducer";
import type { CanvasLevelsReduxState } from "reducers/entityReducers/autoHeightReducers/canvasLevelsReducer";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { DatasourceDataState } from "reducers/entityReducers/datasourceReducer";
import type { MetaState } from "reducers/entityReducers/metaReducer";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";
import type { PageListReduxState } from "reducers/entityReducers/pageListReducer";
import type { PluginDataState } from "reducers/entityReducers/pluginsReducer";
import evaluationsReducer from "reducers/evaluationReducers";
import type { EvaluationDependencyState } from "reducers/evaluationReducers/dependencyReducer";
import type { FormEvaluationState } from "reducers/evaluationReducers/formEvaluationReducer";
import type { LoadingEntitiesState } from "reducers/evaluationReducers/loadingEntitiesReducer";
import type { EvaluatedTreeState } from "reducers/evaluationReducers/treeReducer";
import type { TriggerValuesEvaluationState } from "reducers/evaluationReducers/triggerReducer";
import lintErrorReducer from "reducers/lintingReducers";
import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import type { ActionSelectorReduxState } from "reducers/uiReducers/actionSelectorReducer";
import type { ActiveField } from "reducers/uiReducers/activeFieldEditorReducer";
import type { AnalyticsReduxState } from "reducers/uiReducers/analyticsReducer";
import type { AppCollabReducerState } from "reducers/uiReducers/appCollabReducer";
import type { AppSettingsPaneReduxState } from "reducers/uiReducers/appSettingsPaneReducer";
import type { AppThemingState } from "reducers/uiReducers/appThemingReducer";
import type { AppViewReduxState } from "reducers/uiReducers/appViewReducer";
import type { AuthState } from "reducers/uiReducers/authReducer";
import type { AutoHeightUIState } from "reducers/uiReducers/autoHeightReducer";
import type { BuildingBlocksReduxState } from "reducers/uiReducers/buildingBlockReducer";
import type { CanvasSelectionState } from "reducers/uiReducers/canvasSelectionReducer";
import type { ConsolidatedPageLoadState } from "reducers/uiReducers/consolidatedPageLoadReducer";
import type { CrudInfoModalReduxState } from "reducers/uiReducers/crudInfoModalReducer";
import type { DatasourceNameReduxState } from "reducers/uiReducers/datasourceNameReducer";
import type { DatasourcePaneReduxState } from "reducers/uiReducers/datasourcePaneReducer";
import type { DebuggerReduxState } from "reducers/uiReducers/debuggerReducer";
import type { WidgetDragResizeState } from "reducers/uiReducers/dragResizeReducer";
import type { ErrorReduxState } from "reducers/uiReducers/errorReducer";
import type { FocusHistoryState } from "reducers/uiReducers/focusHistoryReducer";
import type { GitSyncReducerState } from "reducers/uiReducers/gitSyncReducer";
import type { GlobalSearchReduxState } from "reducers/uiReducers/globalSearchReducer";
import type { HelpReduxState } from "reducers/uiReducers/helpReducer";
import type { IDEState } from "reducers/uiReducers/ideReducer";
import type { ImportReduxState } from "reducers/uiReducers/importReducer";
import type { JSObjectNameReduxState } from "reducers/uiReducers/jsObjectNameReducer";
import type { JsPaneReduxState } from "reducers/uiReducers/jsPaneReducer";
import type { layoutConversionReduxState } from "reducers/uiReducers/layoutConversionReducer";
import type { LibraryState } from "reducers/uiReducers/libraryReducer";
import type { MainCanvasReduxState } from "reducers/uiReducers/mainCanvasReducer";
import type { ModalActionReduxState } from "reducers/uiReducers/modalActionReducer";
import type { OnboardingState } from "reducers/uiReducers/onBoardingReducer";
import type { OneClickBindingState } from "reducers/uiReducers/oneClickBindingReducer";
import type { PageCanvasStructureReduxState } from "reducers/uiReducers/pageCanvasStructureReducer";
import type { PageWidgetsReduxState } from "reducers/uiReducers/pageWidgetsReducer";
import type { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import type { widgetReflow } from "reducers/uiReducers/reflowReducer";
import type { ReleasesState } from "reducers/uiReducers/releasesReducer";
import type { TableFilterPaneReduxState } from "reducers/uiReducers/tableFilterPaneReducer";
import type { TemplatesReduxState } from "reducers/uiReducers/templateReducer";
import type { ThemeState } from "reducers/uiReducers/themeReducer";
import type { TourReducerState } from "reducers/uiReducers/tourReducer";
import type { UsersReduxState } from "reducers/uiReducers/usersReducer";
import type { WebsocketReducerState } from "reducers/uiReducers/websocketReducer";
import { reducer as formReducer } from "redux-form";

export const reducerObject = {
  entities: entityReducer,
  ui: uiReducer,
  evaluations: evaluationsReducer,
  form: formReducer,
  settings: SettingsReducer,
  tenant: tenantReducer,
  linting: lintErrorReducer,
};

export interface AppState {
  ui: {
    consolidatedPageLoad: ConsolidatedPageLoadState;
    analytics: AnalyticsReduxState;
    editor: EditorReduxState;
    propertyPane: PropertyPaneReduxState;
    tableFilterPane: TableFilterPaneReduxState;
    errors: ErrorReduxState;
    appView: AppViewReduxState;
    applications: ApplicationsReduxState;
    apiPane: ApiPaneReduxState;
    auth: AuthState;
    templates: TemplatesReduxState;
    buildingBlocks: BuildingBlocksReduxState;
    workspaces: WorkspaceReduxState;
    selectedWorkspace: SelectedWorkspaceReduxState;
    users: UsersReduxState;
    widgetDragResize: WidgetDragResizeState;
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
    appSettingsPane: AppSettingsPaneReduxState;
    focusHistory: FocusHistoryState;
    editorContext: EditorContextState;
    libraries: LibraryState;
    autoHeightUI: AutoHeightUIState;
    layoutConversion: layoutConversionReduxState;
    actionSelector: ActionSelectorReduxState;
    oneClickBinding: OneClickBindingState;
    activeField: ActiveField;
    ide: IDEState;
  };
  entities: {
    canvasWidgetsStructure: CanvasWidgetStructure;
    canvasWidgets: CanvasWidgetsReduxState;
    metaWidgets: MetaWidgetsReduxState;
    actions: ActionDataState;
    datasources: DatasourceDataState;
    pageList: PageListReduxState;
    plugins: PluginDataState;
    meta: MetaState;
    app: AppDataState;
    jsActions: JSCollectionDataState;
    autoHeightLayoutTree: AutoHeightLayoutTreeReduxState;
    canvasLevels: CanvasLevelsReduxState;
    layoutElementPositions: LayoutElementPositionsReduxState;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    moduleInstanceEntities: any;
  };
  evaluations: {
    tree: EvaluatedTreeState;
    dependencies: EvaluationDependencyState;
    loadingEntities: LoadingEntitiesState;
    formEvaluation: FormEvaluationState;
    triggers: TriggerValuesEvaluationState;
  };
  linting: {
    errors: LintErrorsStore;
  };
  form: {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  settings: SettingsReduxState;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tenant: TenantReduxState<any>;
}
