import { createSelector } from "reselect";
import {
  getCurrentActions,
  getAppData,
  getPluginDependencyConfig,
  getPluginEditorConfigs,
  getCurrentJSCollections,
  getInputsForModule,
  getModuleInstances,
  getModuleInstanceEntities,
  getCurrentModuleActions,
  getCurrentModuleJSCollections,
} from "ee/selectors/entitiesSelector";
import type { AppsmithEntity, WidgetEntity } from "ee/entities/DataTree/types";
import type {
  ConfigTree,
  DataTree,
  UnEvalTree,
} from "entities/DataTree/dataTreeTypes";
import {
  DataTreeFactory,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import {
  getIsMobileBreakPoint,
  getMetaWidgets,
  getWidgets,
  getWidgetsMeta,
} from "sagas/selectors";
import "url-search-params-polyfill";
import type { AppState } from "ee/reducers";
import { getSelectedAppThemeProperties } from "./appThemingSelectors";
import type { LoadingEntitiesState } from "reducers/evaluationReducers/loadingEntitiesReducer";
import _, { get } from "lodash";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { getEvalErrorPath } from "utils/DynamicBindingUtils";
import ConfigTreeActions from "utils/configTree";
import { DATATREE_INTERNAL_KEYWORDS } from "constants/WidgetValidation";
import { getLayoutSystemType } from "./layoutSystemSelectors";
import {
  getCurrentWorkflowActions,
  getCurrentWorkflowJSActions,
} from "ee/selectors/workflowSelectors";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import type { PageListReduxState } from "reducers/entityReducers/pageListReducer";
import { getCurrentEnvironmentName } from "ee/selectors/environmentSelectors";

export const getLoadingEntities = (state: AppState) =>
  state.evaluations.loadingEntities;

/**
 * This selector is created to combine a couple of data points required by getUnevaluatedDataTree selector.
 * Current version of reselect package only allows upto 12 arguments. Hence, this workaround.
 * TODO: Figure out a better way to do this in a separate task. Or update the package if possible.
 */
const getLayoutSystemPayload = createSelector(
  getLayoutSystemType,
  getIsMobileBreakPoint,
  (layoutSystemType, isMobile) => {
    return {
      layoutSystemType,
      isMobile,
    };
  },
);

const getCurrentActionsEntities = createSelector(
  getCurrentActions,
  getCurrentModuleActions,
  getCurrentWorkflowActions,
  (actions, moduleActions, workflowActions) => {
    return [...actions, ...moduleActions, ...workflowActions];
  },
);
const getCurrentJSActionsEntities = createSelector(
  getCurrentJSCollections,
  getCurrentModuleJSCollections,
  getCurrentWorkflowJSActions,
  (jsActions, moduleJSActions, workflowJsActions) => {
    return [...jsActions, ...moduleJSActions, ...workflowJsActions];
  },
);

const getModulesData = createSelector(
  getInputsForModule,
  getModuleInstances,
  getModuleInstanceEntities,
  (moduleInputs, moduleInstances, moduleInstanceEntities) => {
    return {
      moduleInputs: moduleInputs,
      moduleInstances: moduleInstances,
      moduleInstanceEntities: moduleInstanceEntities,
    };
  },
);

const getActionsFromUnevaluatedDataTree = createSelector(
  getCurrentActionsEntities,
  getPluginEditorConfigs,
  getPluginDependencyConfig,
  (actions, editorConfigs, pluginDependencyConfig) =>
    DataTreeFactory.actions(actions, editorConfigs, pluginDependencyConfig),
);

const getJSActionsFromUnevaluatedDataTree = createSelector(
  getCurrentJSActionsEntities,
  (jsActions) => DataTreeFactory.jsActions(jsActions),
);

const getWidgetsFromUnevaluatedDataTree = createSelector(
  getModulesData,
  getWidgets,
  getWidgetsMeta,
  getLoadingEntities,
  getLayoutSystemPayload,
  (moduleData, widgets, widgetsMeta, loadingEntities, layoutSystemPayload) =>
    DataTreeFactory.widgets(
      moduleData.moduleInputs,
      moduleData.moduleInstances,
      moduleData.moduleInstanceEntities,
      widgets,
      widgetsMeta,
      loadingEntities,
      layoutSystemPayload.layoutSystemType,
      layoutSystemPayload.isMobile,
    ),
);
const getMetaWidgetsFromUnevaluatedDataTree = createSelector(
  getMetaWidgets,
  getWidgetsMeta,
  getLoadingEntities,
  (metaWidgets, widgetsMeta, loadingEntities) =>
    DataTreeFactory.metaWidgets(metaWidgets, widgetsMeta, loadingEntities),
);

// * This is only for internal use to avoid cyclic dependency issue
const getPageListState = (state: AppState) => state.entities.pageList;
const getCurrentPageName = createSelector(
  getPageListState,
  (pageList: PageListReduxState) =>
    pageList.pages.find((page) => page.pageId === pageList.currentPageId)
      ?.pageName,
);

export const getUnevaluatedDataTree = createSelector(
  getActionsFromUnevaluatedDataTree,
  getJSActionsFromUnevaluatedDataTree,
  getWidgetsFromUnevaluatedDataTree,
  getMetaWidgetsFromUnevaluatedDataTree,
  getAppData,
  getSelectedAppThemeProperties,
  getCurrentAppWorkspace,
  getCurrentApplication,
  getCurrentPageName,
  getCurrentEnvironmentName,
  (
    actions,
    jsActions,
    widgets,
    metaWidgets,
    appData,
    theme,
    currentWorkspace,
    currentApplication,
    getCurrentPageName,
    currentEnvironmentName,
  ) => {
    let dataTree: UnEvalTree = {
      ...actions.dataTree,
      ...jsActions.dataTree,
      ...widgets.dataTree,
    };
    let configTree: ConfigTree = {
      ...actions.configTree,
      ...jsActions.configTree,
      ...widgets.configTree,
    };

    dataTree.appsmith = {
      ...appData,
      // combine both persistent and transient state with the transient state
      // taking precedence in case the key is the same
      store: appData.store,
      theme,
      currentPageName: getCurrentPageName,
      workspaceName: currentWorkspace.name,
      appName: currentApplication?.name,
      currentEnvName: currentEnvironmentName,
    } as AppsmithEntity;
    (dataTree.appsmith as AppsmithEntity).ENTITY_TYPE = ENTITY_TYPE.APPSMITH;
    dataTree = { ...dataTree, ...metaWidgets.dataTree };
    configTree = { ...configTree, ...metaWidgets.configTree };

    return { unEvalTree: dataTree, configTree };
  },
);

export const getEvaluationInverseDependencyMap = (state: AppState) =>
  state.evaluations.dependencies.inverseDependencyMap;

export const getIsWidgetLoading = createSelector(
  [getLoadingEntities, (_state: AppState, widgetName: string) => widgetName],
  (loadingEntities: LoadingEntitiesState, widgetName: string) =>
    loadingEntities.has(widgetName),
);

/**
 * returns evaluation tree object
 *
 * @param state
 */
export const getDataTree = (state: AppState): DataTree =>
  state.evaluations.tree;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getConfigTree = (): any => {
  return ConfigTreeActions.getConfigTree();
};

export const getWidgetEvalValues = createSelector(
  [getDataTree, (_state: AppState, widgetName: string) => widgetName],
  (tree: DataTree, widgetName: string) => tree[widgetName] as WidgetEntity,
);

// For autocomplete. Use actions cached responses if
// there isn't a response already
export const getDataTreeForAutocomplete = createSelector(
  getDataTree,
  (tree: DataTree) => {
    return _.omit(tree, Object.keys(DATATREE_INTERNAL_KEYWORDS));
  },
);

export const getPathEvalErrors = createSelector(
  [
    getDataTreeForAutocomplete,
    (_: unknown, dataTreePath: string) => dataTreePath,
  ],
  (dataTree: DataTree, dataTreePath: string) =>
    get(dataTree, getEvalErrorPath(dataTreePath), []) as EvaluationError[],
);
