import { createSelector } from "reselect";
import {
  getCurrentActions,
  getAppData,
  getPluginDependencyConfig,
  getPluginEditorConfigs,
  getCurrentJSCollections,
  getInputsForModule,
} from "@appsmith/selectors/entitiesSelector";
import type { DataTree, WidgetEntity } from "@appsmith/entities/DataTree/types";
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
import _, { get } from "lodash";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { getEvalErrorPath } from "utils/DynamicBindingUtils";
import ConfigTreeActions from "utils/configTree";
import { DATATREE_INTERNAL_KEYWORDS } from "constants/WidgetValidation";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";

export const getLoadingEntities = (state: AppState) =>
  state.evaluations.loadingEntities;

/**
 * This selector is created to combine a couple of data points required by getUnevaluatedDataTree selector.
 * Current version of reselect package only allows upto 12 arguments. Hence, this workaround.
 * TODO: Figure out a better way to do this in a separate task. Or update the package if possible.
 */
const getLayoutSystemPayload = (state: AppState) => ({
  // appPositioning?.type instead of appPositioning.type is for legacy applications that may not have the appPositioning object.
  // All new applications will have appPositioning.type
  appPositioningType:
    AppPositioningTypes[
      state.ui.applications.currentApplication?.applicationDetail
        ?.appPositioning?.type || AppPositioningTypes.FIXED
    ],
  isMobile: state.ui.mainCanvas.isMobile,
});

const getCurrentActionEntities = createSelector(
  getCurrentActions,
  getCurrentJSCollections,
  (actions, jsActions) => {
    return {
      actions: actions,
      jsActions: jsActions,
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
  getInputsForModule,
  getLayoutSystemPayload,
  getLoadingEntities,
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
    moduleInputs,
    layoutSystemPayload,
    loadingEntities,
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
      moduleInputs,
      loadingEntities,
      ...layoutSystemPayload,
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
