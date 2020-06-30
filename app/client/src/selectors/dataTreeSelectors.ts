import { createSelector } from "reselect";
import { getActionDrafts, getActionsForCurrentPage } from "./entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { getEvaluatedDataTree } from "utils/DynamicBindingUtils";
import { DataTree, DataTreeFactory } from "entities/DataTree/dataTreeFactory";
import { getWidgets, getWidgetsMeta } from "sagas/selectors";
import * as log from "loglevel";
import "url-search-params-polyfill";
import { getPageList } from "./appViewSelectors";

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
export const getUnevaluatedDataTree = (withFunctions?: boolean) =>
  createSelector(
    getActionsForCurrentPage,
    getActionDrafts,
    getWidgets,
    getWidgetsMeta,
    getPageList,
    (actions, actionDrafts, widgets, widgetsMeta, pageListPayload) => {
      const pageList = pageListPayload || [];
      return DataTreeFactory.create(
        {
          actions,
          actionDrafts,
          widgets,
          widgetsMeta,
          pageList,
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

// For autocomplete. Use actions cached responses if
// there isn't a response already
export const getDataTreeForAutocomplete = createSelector(
  evaluateDataTree(false),
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
