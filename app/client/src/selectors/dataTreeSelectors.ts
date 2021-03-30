import { createSelector } from "reselect";
import {
  getActionsForCurrentPage,
  getAppData,
  getPluginEditorConfigs,
} from "./entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { DataTree, DataTreeFactory } from "entities/DataTree/dataTreeFactory";
import { getWidgets, getWidgetsMeta } from "sagas/selectors";
import "url-search-params-polyfill";
import { getPageList } from "./appViewSelectors";
import { AppState } from "reducers";

export const getUnevaluatedDataTree = createSelector(
  getActionsForCurrentPage,
  getWidgets,
  getWidgetsMeta,
  getPageList,
  getAppData,
  getPluginEditorConfigs,
  (actions, widgets, widgetsMeta, pageListPayload, appData, editorConfigs) => {
    const pageList = pageListPayload || [];
    return DataTreeFactory.create({
      actions,
      widgets,
      widgetsMeta,
      pageList,
      appData,
      editorConfigs,
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
export const getDataTree = (state: AppState) => state.evaluations.tree;

// For autocomplete. Use actions cached responses if
// there isn't a response already
export const getDataTreeForAutocomplete = createSelector(
  getDataTree,
  getActionsForCurrentPage,
  (tree: DataTree, actions: ActionDataState) => {
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
