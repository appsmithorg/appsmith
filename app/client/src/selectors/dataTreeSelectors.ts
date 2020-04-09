import { createSelector } from "reselect";
import { getActionsForCurrentPage } from "./entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { getEvaluatedDataTree } from "utils/DynamicBindingUtils";
import { extraLibraries } from "jsExecution/JSExecutionManagerSingleton";
import { DataTree, DataTreeFactory } from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { getWidgets, getWidgetsMeta } from "sagas/selectors";
import * as log from "loglevel";
import "url-search-params-polyfill";

// TODO Commenting out for now as it is causing performance issues
// function getQueryParams() {
//   const urlParams = new URLSearchParams(window.location.search);
//   const keys = urlParams.keys();
//   let key = keys.next().value;
//   const queryParams: Record<string, string> = {};
//   while (key) {
//     queryParams[key] = urlParams.get(key) as string;
//     key = keys.next().value;
//   }
//   return queryParams;
// }
//
// const getUrlParams = createSelector(
//   getQueryParams,
//   (queryParams: Record<string, string>): DataTreeUrl => {
//     return {
//       host: window.location.host,
//       hostname: window.location.hostname,
//       queryParams: queryParams,
//       protocol: window.location.protocol,
//       pathname: window.location.pathname,
//       port: window.location.port,
//       href: window.location.href,
//       hash: window.location.hash,
//     };
//   },
// );
//
export const getUnevaluatedDataTree = createSelector(
  getActionsForCurrentPage,
  getWidgets,
  getWidgetsMeta,
  (actions, widgets, widgetsMeta) => {
    return DataTreeFactory.create({
      actions,
      widgets,
      widgetsMeta,
    });
  },
);

export const evaluateDataTree = createSelector(
  getUnevaluatedDataTree,
  (dataTree: DataTree): DataTree => {
    return getEvaluatedDataTree(dataTree);
  },
);

// For autocomplete. Use actions cached responses if
// there isn't a response already
export const getDataTreeForAutocomplete = createSelector(
  evaluateDataTree,
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
    _.omit(tree, ["MainContainer", "actionPaths"]);
    const libs: Record<string, any> = {};
    extraLibraries.forEach(config => (libs[config.accessor] = config.lib));
    return { ...tree, ...cachedResponses, ...libs };
  },
);
