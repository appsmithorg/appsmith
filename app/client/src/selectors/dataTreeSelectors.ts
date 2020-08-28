import { createSelector } from "reselect";
import { getActionsForCurrentPage } from "./entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import * as log from "loglevel";
import "url-search-params-polyfill";
import { AppState } from "reducers";

export const getDataTree = (state: AppState) => state.dataTree;

// For autocomplete. Use actions cached responses if
// there isn't a response already
export const getDataTreeForAutocomplete = createSelector(
  getDataTree,
  getActionsForCurrentPage,
  (tree: DataTree, actions: ActionDataState) => {
    log.debug("Evaluating data tree to get autocomplete values");
    const cachedResponses: Record<string, any> = {};
    if (actions && actions.length) {
      actions.forEach(action => {
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
