import { createSelector } from "reselect";
import {
  getActionsForCurrentPage,
  getAuthUser,
  getUrl,
} from "./entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { getEvaluatedDataTree } from "utils/DynamicBindingUtils";
import { DataTree, DataTreeFactory } from "entities/DataTree/dataTreeFactory";
import { getWidgets, getWidgetsMeta } from "sagas/selectors";
import * as log from "loglevel";
import "url-search-params-polyfill";
import { getPageList } from "./appViewSelectors";

export const getUnevaluatedDataTree = (withFunctions?: boolean) =>
  createSelector(
    getActionsForCurrentPage,
    getWidgets,
    getWidgetsMeta,
    getPageList,
    getAuthUser,
    getUrl,
    (actions, widgets, widgetsMeta, pageListPayload, authUser, url) => {
      const pageList = pageListPayload || [];
      return DataTreeFactory.create(
        {
          actions,
          widgets,
          widgetsMeta,
          pageList,
          authUser,
          url,
        },
        withFunctions,
      );
    },
  );

export const evaluateDataTree = (withFunctions?: boolean) =>
  createSelector(
    getUnevaluatedDataTree(withFunctions),
    (dataTree: DataTree): DataTree => {
      return getEvaluatedDataTree(dataTree);
    },
  );

export const evaluateDataTreeWithFunctions = evaluateDataTree(true);
export const evaluateDataTreeWithoutFunctions = evaluateDataTree(true);

// For autocomplete. Use actions cached responses if
// there isn't a response already
export const getDataTreeForAutocomplete = createSelector(
  evaluateDataTreeWithoutFunctions,
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
