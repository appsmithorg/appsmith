import { createSelector } from "reselect";
import { AppState } from "reducers";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { getExistingWidgetNames } from "sagas/selectors";
import { getNextEntityName } from "utils/AppsmithUtils";

import WidgetFactory from "utils/WidgetFactory";
import { getSelectedWidget, getSelectedWidgets } from "./ui";

const getCanvasWidgets = (state: AppState) => state.entities.canvasWidgets;
export const getModalDropdownList = createSelector(
  getCanvasWidgets,
  (widgets) => {
    const modalWidgets = Object.values(widgets).filter(
      (widget: FlattenedWidgetProps) => widget.type === "MODAL_WIDGET",
    );
    if (modalWidgets.length === 0) return undefined;

    return modalWidgets.map((widget: FlattenedWidgetProps) => ({
      id: widget.widgetId,
      label: widget.widgetName,
      value: `${widget.widgetName}`,
    }));
  },
);

export const getNextModalName = createSelector(
  getExistingWidgetNames,
  (names) => {
    const prefix =
      WidgetFactory.widgetConfigMap.get("MODAL_WIDGET")?.widgetName || "";
    return getNextEntityName(prefix, names);
  },
);

/**
 * Selector to get the parent widget of a particaular widget with id as a prop
 */
export const getParentWidget = createSelector(
  getCanvasWidgets,
  (state: AppState, widgetId: string) => widgetId,
  (canvasWidgets, widgetId: string): FlattenedWidgetProps | undefined => {
    if (canvasWidgets.hasOwnProperty(widgetId)) {
      const widget = canvasWidgets[widgetId];
      if (widget.parentId && canvasWidgets.hasOwnProperty(widget.parentId)) {
        const parent = canvasWidgets[widget.parentId];
        return parent;
      }
    }
    return;
  },
);

// Check if current widget is in the list of selected widgets
export const isCurrentWidgetSelected = (widgetId: string) => {
  return createSelector(getSelectedWidgets, (widgets): boolean =>
    widgets.includes(widgetId),
  );
};

export const isCurrentWidgetFocused = (widgetId: string) => {
  return createSelector(
    (state: AppState) => state.ui.widgetDragResize.focusedWidget,
    (widget): boolean => widget === widgetId,
  );
};

// Check if current widget is the last selected widget
export const isCurrentWidgetLastSelected = (widgetId: string) => {
  return createSelector(
    getSelectedWidget,
    (widget): boolean => widget === widgetId,
  );
};

// Check if current widget is one of multiple selected widgets
export const isMultiSelectedWidget = (widgetId: string) => {
  return createSelector(
    getSelectedWidgets,
    (widgets): boolean => widgets.length > 1 && widgets.includes(widgetId),
  );
};
