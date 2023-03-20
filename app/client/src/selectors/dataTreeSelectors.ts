import { createSelector } from "reselect";
import {
  getActionsForCurrentPage,
  getAppData,
  getPluginDependencyConfig,
  getPluginEditorConfigs,
  getJSCollectionsForCurrentPage,
} from "./entitiesSelector";
import type { DataTree, WidgetEntity } from "entities/DataTree/dataTreeFactory";
import { DataTreeFactory } from "entities/DataTree/dataTreeFactory";
import {
  getMetaWidgets,
  getWidgetsForEval,
  getWidgetsMeta,
} from "sagas/selectors";
import "url-search-params-polyfill";
import { getPageList } from "./appViewSelectors";
import type { AppState } from "@appsmith/reducers";
import { getSelectedAppThemeProperties } from "./appThemingSelectors";
import type { LoadingEntitiesState } from "reducers/evaluationReducers/loadingEntitiesReducer";
import { get } from "lodash";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { getEvalErrorPath } from "utils/DynamicBindingUtils";
import ConfigTreeActions from "utils/configTree";

export const getUnevaluatedDataTree = createSelector(
  getActionsForCurrentPage,
  getJSCollectionsForCurrentPage,
  getWidgetsForEval,
  getWidgetsMeta,
  getPageList,
  getAppData,
  getPluginEditorConfigs,
  getPluginDependencyConfig,
  getSelectedAppThemeProperties,
  getMetaWidgets,
  (
    actions,
    jsActions,
    widgets,
    widgetsMeta,
    pageListPayload,
    appData,
    editorConfigs,
    pluginDependencyConfig,
    selectedAppThemeProperty,
    metaWidgets,
  ) => {
    const pageList = pageListPayload || [];
    return DataTreeFactory.create({
      actions,
      jsActions,
      widgets,
      widgetsMeta,
      pageList,
      appData,
      editorConfigs,
      pluginDependencyConfig,
      theme: selectedAppThemeProperty,
      metaWidgets,
    });
  },
);

export const getEvaluationInverseDependencyMap = (state: AppState) =>
  state.evaluations.dependencies.inverseDependencyMap;

export const getLoadingEntities = (state: AppState) =>
  state.evaluations.loadingEntities;

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
    return tree;
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
