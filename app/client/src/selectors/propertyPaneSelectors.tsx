import { find, get } from "lodash";
import { AppState } from "reducers";
import { createSelector } from "reselect";

import { WidgetProps } from "widgets/BaseWidget";
import { getCanvasWidgets } from "./entitiesSelector";
import { getDataTree } from "selectors/dataTreeSelectors";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getSelectedWidget, getSelectedWidgets } from "./ui";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";

const getPropertyPaneState = (state: AppState): PropertyPaneReduxState =>
  state.ui.propertyPane;

export const getCurrentWidgetId = createSelector(
  getPropertyPaneState,
  (propertyPane: PropertyPaneReduxState) => propertyPane.widgetId,
);

export const getCurrentWidgetProperties = createSelector(
  getCanvasWidgets,
  getPropertyPaneState,
  (
    widgets: CanvasWidgetsReduxState,
    pane: PropertyPaneReduxState,
  ): WidgetProps | undefined => {
    return get(widgets, `${pane.widgetId}`);
  },
);

export const getWidgetPropsForPropertyPane = createSelector(
  getCurrentWidgetProperties,
  getDataTree,
  (
    widget: WidgetProps | undefined,
    evaluatedTree: DataTree,
  ): WidgetProps | undefined => {
    if (!widget) return undefined;
    const evaluatedWidget = find(evaluatedTree, {
      widgetId: widget.widgetId,
    }) as DataTreeWidget;
    const widgetProperties = { ...widget };

    if (evaluatedWidget) {
      widgetProperties[EVALUATION_PATH] = evaluatedWidget[EVALUATION_PATH];
    }
    return widgetProperties;
  },
);

const populateWidgetProperties = (
  widget: WidgetProps,
  propertyName: string,
  dependencies: string[],
) => {
  const widgetProperties: any = {
    type: widget.type,
    widgetName: widget.widgetName,
    widgetId: widget.widgetId,
    dynamicTriggerPathList: widget.dynamicTriggerPathList,
    dynamicPropertyPathList: widget.dynamicPropertyPathList,
    [propertyName]: widget[propertyName],
  };

  if (dependencies && dependencies.length > 0) {
    for (const dependentProperty of dependencies) {
      widgetProperties[dependentProperty] = widget[dependentProperty];
    }
  }

  return widgetProperties;
};

const populateEvaluatedWidgetProperties = (
  evaluatedWidget: DataTreeWidget,
  propertyName: string,
) => {
  if (!evaluatedWidget || !evaluatedWidget[EVALUATION_PATH]) return;

  const evaluatedWidgetPath = evaluatedWidget[EVALUATION_PATH];

  const evaluatedProperties = {
    errors: {
      [propertyName]: evaluatedWidgetPath?.errors
        ? evaluatedWidgetPath?.errors[propertyName]
        : [],
    },
    evaluatedValues: {
      [propertyName]: evaluatedWidgetPath?.evaluatedValues
        ? evaluatedWidgetPath?.evaluatedValues[propertyName]
        : [],
    },
  };

  return evaluatedProperties;
};

export const getWidgetPropsForPropertyName = (
  propertyName: string,
  dependencies: string[] = [],
) => {
  return createSelector(
    getCurrentWidgetProperties,
    getDataTree,
    (
      widget: WidgetProps | undefined,
      evaluatedTree: DataTree,
    ): any | undefined => {
      if (!widget) return undefined;

      const evaluatedWidget = find(evaluatedTree, {
        widgetId: widget.widgetId,
      }) as DataTreeWidget;

      const widgetProperties = populateWidgetProperties(
        widget,
        propertyName,
        dependencies,
      );

      widgetProperties[EVALUATION_PATH] = populateEvaluatedWidgetProperties(
        evaluatedWidget,
        propertyName,
      );

      return widgetProperties;
    },
  );
};

const isResizingorDragging = (state: AppState) =>
  state.ui.widgetDragResize.isResizing || state.ui.widgetDragResize.isDragging;

export const getIsPropertyPaneVisible = createSelector(
  getPropertyPaneState,
  isResizingorDragging,
  getSelectedWidget,
  getSelectedWidgets,
  (
    pane: PropertyPaneReduxState,
    isResizingorDragging: boolean,
    lastSelectedWidget,
    widgets,
  ) => {
    const isWidgetSelected = pane.widgetId
      ? lastSelectedWidget === pane.widgetId || widgets.includes(pane.widgetId)
      : false;
    const multipleWidgetsSelected = !!(widgets && widgets.length >= 2);
    return !!(
      isWidgetSelected &&
      !multipleWidgetsSelected &&
      !isResizingorDragging &&
      pane.isVisible &&
      pane.widgetId
    );
  },
);
