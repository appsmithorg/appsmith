import { createSelector } from "reselect";
import {
  getActionsForCurrentPage,
  getAppData,
  getPluginDependencyConfig,
  getPluginEditorConfigs,
  getJSCollectionsForCurrentPage,
} from "./entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { DataTree, DataTreeFactory } from "entities/DataTree/dataTreeFactory";
import { getWidgets, getWidgetsMeta } from "sagas/selectors";
import "url-search-params-polyfill";
import { getPageList } from "./appViewSelectors";
import { AppState } from "reducers";

export const getUnevaluatedDataTree = createSelector(
  getActionsForCurrentPage,
  getJSCollectionsForCurrentPage,
  getWidgets,
  getWidgetsMeta,
  getPageList,
  getAppData,
  getPluginEditorConfigs,
  getPluginDependencyConfig,
  (
    actions,
    jsActions,
    widgets,
    widgetsMeta,
    pageListPayload,
    appData,
    editorConfigs,
    pluginDependencyConfig,
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
    });
  },
);

export const getEvaluationInverseDependencyMap = (state: AppState) =>
  state.evaluations.dependencies.inverseDependencyMap;

export const getLoadingEntities = (state: AppState) =>
  state.evaluations.loadingEntities;

/**
 * returns evaluation tree object
 *
 * @param state
 */
export const getDataTree = (state: AppState): DataTree =>
  state.evaluations.tree;

// For autocomplete. Use actions cached responses if
// there isn't a response already
export const getDataTreeForAutocomplete = createSelector(
  getDataTree,
  getActionsForCurrentPage,
  getJSCollectionsForCurrentPage,
  (tree: DataTree, actions: ActionDataState) => {
    //js actions needs to be added
    const cachedResponses: Record<string, any> = {};
    if (actions && actions.length) {
      actions.forEach((action) => {
        if (!(action.config.name in tree) && action.config.cacheResponse) {
          try {
            cachedResponses[action.config.name] = JSON.parse(
              action.config.cacheResponse,
            );
          } catch (e) {
            cachedResponses[action.config.name] = action.config.cacheResponse;
          }
        }
      });
    }
    return tree;
  },
);
