import { createSelector } from "reselect";
import {
  MAIN_CONTAINER_WIDGET_ID,
  WidgetType,
} from "constants/WidgetConstants";
import { get, set } from "lodash";
import WidgetConfigResponse from "mockResponses/WidgetConfigResponse";
import { AppState } from "reducers";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgets } from "sagas/selectors";

/*
Note:
Signature for enhancements in WidgetConfigResponse is as follows:
enhancements: {
    child: {
        autocomplete: (parentProps: any) => Record<string, Record<string, unknown>>,
        customJSControl: (parentProps: any) => string,
        propertyUpdateHook: (parentProps: any, widgetName: string, propertyPath: string, propertyValue: string),
        action: (parentProps: any, dynamicString: string, responseData?: any[]) => { actionString: string, dataToApply?: any[]},
    }
}
*/

// Enum which identifies the path in the enhancements for the
export enum WidgetEnhancementType {
  WIDGET_ACTION = "child.action",
  PROPERTY_UPDATE = "child.propertyUpdateHook",
  CUSTOM_CONTROL = "child.customJSControl",
  AUTOCOMPLETE = "child.autocomplete",
  HIDE_EVALUATED_VALUE = "child.hideEvaluatedValue",
  UPDATE_DATA_TREE_PATH = "child.updateDataTreePath",
}

const getEvaluationTree = (state: AppState) => state.evaluations.tree;

export function getParentWithEnhancementFn(
  widgetId: string,
  widgets: CanvasWidgetsReduxState,
) {
  let widget = get(widgets, widgetId, undefined);

  // While this widget has a parent
  while (widget?.parentId) {
    // Get parent widget props
    const parent = get(widgets, widget.parentId, undefined);

    // If parent has enhancements property
    // enhancements property is a new widget property which tells us that
    // the property pane, properties or actions of this widget or its children
    // can be enhanced

    if (parent && parent.enhancements) {
      return parent;
    }
    // If we didn't find any enhancements
    // keep walking up the tree to find the parent which does
    // if the parent doesn't have a parent stop walking the tree.
    // also stop if the parent is the main container (Main container doesn't have enhancements)
    if (parent?.parentId && parent.parentId !== MAIN_CONTAINER_WIDGET_ID) {
      widget = get(widgets, widget.parentId, undefined);

      continue;
    }

    return;
  }
}

export function getWidgetEnhancementFn(
  type: WidgetType,
  enhancementType: WidgetEnhancementType,
) {
  // Get enhancements for the widget type from the config response
  // Spread the config response so that we don't pollute the original
  // configs
  const { enhancements = {} } = {
    ...(WidgetConfigResponse as any).config[type],
  };
  return get(enhancements, enhancementType, undefined);
}

// TODO(abhinav): Getting data from the tree may not be needed
// confirm this.
export const getPropsFromTree = (
  tree: unknown,
  widgetName?: string,
): unknown => {
  // Get the evaluated data of this widget from the evaluations tree.
  if (!widgetName) return;

  return get(tree, widgetName, undefined);
};

type EnhancementFns = {
  enhancementFns: {
    updateDataTreePathFn: any;
    propertyPaneEnhancementFn: any;
    autoCompleteEnhancementFn: any;
    customJSControlEnhancementFn: any;
    hideEvaluatedValueEnhancementFn: any;
  };
  parentIdWithEnhancementFn: any;
};

export const getWidgetEnhancementFns = (widgetId: string) => {
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
