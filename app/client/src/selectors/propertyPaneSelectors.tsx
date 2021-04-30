import { find, get } from "lodash";
import { AppState } from "reducers";
import { createSelector } from "reselect";

import { WidgetProps } from "widgets/BaseWidget";
import { getCanvasWidgets } from "./entitiesSelector";
import { getDataTree } from "selectors/dataTreeSelectors";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getSelectedWidgets } from "./ui";

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
      if (evaluatedWidget.evaluatedValues) {
        widgetProperties.evaluatedValues = {
          ...evaluatedWidget.evaluatedValues,
        };
      }

      if (evaluatedWidget.invalidProps) {
        const { invalidProps, validationMessages } = evaluatedWidget;
        widgetProperties.invalidProps = invalidProps;
        widgetProperties.validationMessages = validationMessages;
      }
    }
    return widgetProperties;
  },
);

const isResizingorDragging = (state: AppState) =>
  state.ui.widgetDragResize.isResizing || state.ui.widgetDragResize.isDragging;

export const getIsPropertyPaneVisible = createSelector(
  getPropertyPaneState,
  isResizingorDragging,
  getSelectedWidgets,
  (pane: PropertyPaneReduxState, isResizingorDragging: boolean, widgets) =>
    !!(
      !(widgets && widgets.length > 1) &&
      !isResizingorDragging &&
      pane.isVisible &&
      pane.widgetId
    ),
);
