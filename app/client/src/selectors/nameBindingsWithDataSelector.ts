import { AppState, DataTree } from "reducers";
import { JSONPath } from "jsonpath-plus";
import { createSelector } from "reselect";
import { getActions, getDataTree } from "./entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import createCachedSelector from "re-reselect";
import { getEvaluatedDataTree } from "utils/DynamicBindingUtils";

export type NameBindingsWithData = Record<string, object>;

export const getNameBindingsWithData = createSelector(
  getDataTree,
  (dataTree: DataTree): NameBindingsWithData => {
    const nameBindingsWithData: Record<string, object> = {};
    Object.keys(dataTree.nameBindings).forEach(key => {
      const nameBindings = dataTree.nameBindings[key];
      nameBindingsWithData[key] = JSONPath({
        path: nameBindings,
        json: dataTree,
      })[0];
    });
    return nameBindingsWithData;
  },
);

export const getParsedDataTree = createSelector(
  getNameBindingsWithData,
  (namedBindings: NameBindingsWithData) => {
    return getEvaluatedDataTree(namedBindings, true);
  },
);

// For autocomplete. Use actions cached responses if
// there isn't a response already
export const getNameBindingsForAutocomplete = createCachedSelector(
  getParsedDataTree,
  getActions,
  (dataTree: NameBindingsWithData, actions: ActionDataState["data"]) => {
    const cachedResponses: Record<string, any> = {};
    if (actions && actions.length) {
      actions.forEach(action => {
        if (!(action.name in dataTree) && action.cacheResponse) {
          try {
            cachedResponses[action.name] = JSON.parse(action.cacheResponse);
          } catch (e) {
            cachedResponses[action.name] = action.cacheResponse;
          }
        }
      });
    }
    return { ...dataTree, ...cachedResponses };
  },
)((state: AppState) => state.entities.actions.data.length);
