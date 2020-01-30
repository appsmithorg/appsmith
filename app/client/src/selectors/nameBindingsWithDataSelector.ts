import { AppState, DataTree } from "reducers";
import { createSelector } from "reselect";
import { getActions, getDataTree } from "./entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import createCachedSelector from "re-reselect";
import { getEvaluatedDataTree } from "utils/DynamicBindingUtils";
import {
  ENTITY_TYPE_ACTION,
  ENTITY_TYPE_WIDGET,
} from "constants/entityConstants";

export type NameBindingsWithData = { [key: string]: any };

export const getNameBindingsWithData = createSelector(
  getDataTree,
  (dataTree: DataTree): NameBindingsWithData => {
    const nameBindingsWithData: Record<string, object> = {};
    dataTree.actions.forEach(a => {
      nameBindingsWithData[a.config.name] = {
        ...a,
        data: a.data ? a.data.body : {},
        __type: ENTITY_TYPE_ACTION,
      };
    });
    Object.keys(dataTree.canvasWidgets).forEach(w => {
      const widget = dataTree.canvasWidgets[w];
      nameBindingsWithData[widget.widgetName] = {
        ...widget,
        __type: ENTITY_TYPE_WIDGET,
      };
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
  (dataTree: NameBindingsWithData, actions: ActionDataState) => {
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
    return { ...dataTree, ...cachedResponses };
  },
)((state: AppState) => state.entities.actions.length);
