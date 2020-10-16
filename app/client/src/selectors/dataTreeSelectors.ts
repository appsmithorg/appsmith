import { createSelector } from "reselect";
import { getActionsForCurrentPage, getAppData } from "./entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { getEvaluatedDataTree } from "utils/DynamicBindingUtils";
import { DataTree, DataTreeFactory } from "entities/DataTree/dataTreeFactory";
import { getWidgets, getWidgetsMeta } from "sagas/selectors";
import * as log from "loglevel";
import "url-search-params-polyfill";
import { getPageList } from "./appViewSelectors";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

export const getUnevaluatedDataTree = createSelector(
  getActionsForCurrentPage,
  getWidgets,
  getWidgetsMeta,
  getPageList,
  getAppData,
  (actions, widgets, widgetsMeta, pageListPayload, appData) => {
    PerformanceTracker.startTracking(
      PerformanceTransactionName.CONSTRUCT_UNEVAL_TREE,
    );
    const pageList = pageListPayload || [];
    const unevalTree = DataTreeFactory.create(
      {
        actions,
        widgets,
        widgetsMeta,
        pageList,
        appData,
      },
      true,
    );
    PerformanceTracker.stopTracking();
    return unevalTree;
  },
);

export const evaluateDataTree = createSelector(
  getUnevaluatedDataTree,
  (dataTree: DataTree): DataTree => {
    PerformanceTracker.startTracking(
      PerformanceTransactionName.DATA_TREE_EVALUATION,
    );
    const evalDataTree = getEvaluatedDataTree(dataTree);
    PerformanceTracker.stopTracking();
    return evalDataTree;
  },
);

export const evaluateDataTreeWithFunctions = evaluateDataTree;
export const evaluateDataTreeWithoutFunctions = evaluateDataTree;

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
