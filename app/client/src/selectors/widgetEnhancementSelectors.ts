import { createSelector } from "reselect";
import { get, set } from "lodash";
import type { DefaultRootState } from "react-redux";

import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import {
  getParentWithEnhancementFn,
  getWidgetEnhancementFn,
  WidgetEnhancementType,
} from "sagas/WidgetEnhancementHelpers";
import { getWidgets } from "sagas/selectors";

const getEvaluationTree = (state: DefaultRootState) => state.evaluations.tree;

const getPropsFromTree = (tree: unknown, widgetName?: string): unknown => {
  // Get the evaluated data of this widget from the evaluations tree.
  if (!widgetName) return;

  return get(tree, widgetName, undefined);
};

export interface EnhancementFns {
  enhancementFns: {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateDataTreePathFn: any;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propertyPaneEnhancementFn: any;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    autoCompleteEnhancementFn: any;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customJSControlEnhancementFn: any;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hideEvaluatedValueEnhancementFn: any;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shouldHidePropertyFn: any;
  };
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentIdWithEnhancementFn: any;
}

export const getWidgetEnhancementSelector = (widgetId: string | undefined) => {
  return createSelector(
    getWidgets,
    getEvaluationTree,
    (widgets: CanvasWidgetsReduxState, dataTree: unknown): EnhancementFns => {
      const enhancementFns = {
        updateDataTreePathFn: undefined,
        propertyPaneEnhancementFn: undefined,
        autoCompleteEnhancementFn: undefined,
        customJSControlEnhancementFn: undefined,
        hideEvaluatedValueEnhancementFn: undefined,
        shouldHidePropertyFn: undefined,
      };

      // Get the parent which wants to enhance this widget
      const parentWithEnhancementFn = getParentWithEnhancementFn(
        widgetId,
        widgets,
      );
      // If such a parent is found
      // Get the parent's evaluated data from the evaluatedTree
      const parentDataFromDataTree: unknown = getPropsFromTree(
        dataTree,
        parentWithEnhancementFn?.widgetName,
      );

      if (parentWithEnhancementFn) {
        // Get the enhancement function based on the enhancementType
        // from the configs
        const widgetEnhancementFns = {
          updateDataTreePathFn: getWidgetEnhancementFn(
            parentWithEnhancementFn.type,
            WidgetEnhancementType.UPDATE_DATA_TREE_PATH,
          ),
          propertyPaneEnhancementFn: getWidgetEnhancementFn(
            parentWithEnhancementFn.type,
            WidgetEnhancementType.PROPERTY_UPDATE,
          ),
          autoCompleteEnhancementFn: getWidgetEnhancementFn(
            parentWithEnhancementFn.type,
            WidgetEnhancementType.AUTOCOMPLETE,
          ),
          customJSControlEnhancementFn: getWidgetEnhancementFn(
            parentWithEnhancementFn.type,
            WidgetEnhancementType.CUSTOM_CONTROL,
          ),
          hideEvaluatedValueEnhancementFn: getWidgetEnhancementFn(
            parentWithEnhancementFn.type,
            WidgetEnhancementType.HIDE_EVALUATED_VALUE,
          ),
          shouldHidePropertyFn: getWidgetEnhancementFn(
            parentWithEnhancementFn.type,
            WidgetEnhancementType.SHOULD_HIDE_PROPERTY,
          ),
        };

        Object.keys(widgetEnhancementFns).map((key: string) => {
          const enhancementFn = get(widgetEnhancementFns, `${key}`);

          if (parentDataFromDataTree && enhancementFn) {
            set(enhancementFns, `${key}`, (...args: unknown[]) =>
              enhancementFn(parentDataFromDataTree, ...args),
            );
          }
        });
      }

      return {
        enhancementFns: enhancementFns,
        parentIdWithEnhancementFn: get(parentWithEnhancementFn, "widgetId", ""),
      };
    },
  );
};
