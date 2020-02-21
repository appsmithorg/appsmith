import { AppState } from "reducers";
import { createSelector } from "reselect";
import { getActions } from "./entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import createCachedSelector from "re-reselect";
import { getEvaluatedDataTree } from "utils/DynamicBindingUtils";
import { extraLibraries } from "jsExecution/JSExecutionManagerSingleton";
import { DataTree, DataTreeFactory } from "entities/DataTree/dataTreeFactory";

export const getUnevaluatedDataTree = (state: AppState): DataTree =>
  DataTreeFactory.create(state);

export const getParsedDataTree = createSelector(
  getUnevaluatedDataTree,
  (dataTree: DataTree) => {
    return getEvaluatedDataTree(dataTree, true);
  },
);

// For autocomplete. Use actions cached responses if
// there isn't a response already
export const getDataTreeForAutocomplete = createCachedSelector(
  getParsedDataTree,
  getActions,
  (dataTree: DataTree, actions: ActionDataState) => {
    const cachedResponses: Record<string, any> = {};
    if (actions && actions.length) {
      actions.forEach(action => {
        if (!(action.config.name in dataTree) && action.config.cacheResponse) {
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
    const libs: Record<string, any> = {};
    extraLibraries.forEach(
      config => (libs[config.accessor] = libs[config.accessor]),
    );
    return { ...dataTree, ...cachedResponses, ...libs };
  },
)((state: AppState) => state.entities.actions.length);
