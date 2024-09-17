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
import type { WidgetEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { DataTreeFactory } from "entities/DataTree/dataTreeFactory";
import {
  getIsMobileBreakPoint,
  getMetaWidgets,
  getWidgetsForEval,
  getWidgetsMeta,
} from "sagas/selectors";
import "url-search-params-polyfill";
import { getPageList } from "./appViewSelectors";
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

const getCurrentActionEntities = createSelector(
  getCurrentActions,
  getCurrentModuleActions,
  getCurrentWorkflowActions,
  getCurrentJSCollections,
  getCurrentModuleJSCollections,
  getCurrentWorkflowJSActions,
  (
    actions,
    moduleActions,
    workflowActions,
    jsActions,
    moduleJSActions,
    workflowJsActions,
  ) => {
    return {
      actions: [...actions, ...moduleActions, ...workflowActions],
      jsActions: [...jsActions, ...moduleJSActions, ...workflowJsActions],
    };
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

export const getUnevaluatedDataTree = createSelector(
  getCurrentActionEntities,
  getWidgetsForEval,
  getWidgetsMeta,
  getPageList,
  getAppData,
  getPluginEditorConfigs,
  getPluginDependencyConfig,
  getSelectedAppThemeProperties,
  getMetaWidgets,
  getLayoutSystemPayload,
  getLoadingEntities,
  getModulesData,
  (
    currentActionEntities,
    widgets,
    widgetsMeta,
    pageListPayload,
    appData,
    editorConfigs,
    pluginDependencyConfig,
    selectedAppThemeProperty,
    metaWidgets,
    layoutSystemPayload,
    loadingEntities,
    modulesData,
  ) => {
    const pageList = pageListPayload || [];

    return DataTreeFactory.create({
      ...currentActionEntities,
      widgets,
      widgetsMeta,
      pageList,
      appData,
      editorConfigs,
      pluginDependencyConfig,
      theme: selectedAppThemeProperty,
      metaWidgets,
      loadingEntities,
      ...layoutSystemPayload,
      ...modulesData,
    });
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
