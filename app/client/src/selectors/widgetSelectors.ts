import { createSelector } from "reselect";
import { AppState } from "@appsmith/reducers";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { getExistingWidgetNames } from "sagas/selectors";
import { getNextEntityName } from "utils/AppsmithUtils";

import WidgetFactory from "utils/WidgetFactory";
import {
  getFocusedWidget,
  getLastSelectedWidget,
  getSelectedWidgets,
} from "./ui";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { get } from "lodash";
import { getAppMode } from "selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { getIsTableFilterPaneVisible } from "selectors/tableFilterSelectors";
import { getIsAutoHeightWithLimitsChanging } from "utils/hooks/autoHeightUIHooks";

export const getIsDraggingOrResizing = (state: AppState) =>
  state.ui.widgetDragResize.isResizing || state.ui.widgetDragResize.isDragging;

export const getIsResizing = (state: AppState) =>
  state.ui.widgetDragResize.isResizing;

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

export const getFocusedParentToOpen = createSelector(
  getCanvasWidgets,
  (state: AppState) => state.ui.widgetDragResize.focusedWidget,
  (canvasWidgets, focusedWidgetId) => {
    return getParentToOpenIfAny(focusedWidgetId, canvasWidgets);
  },
);

export const getParentToOpenSelector = (widgetId: string) => {
  return createSelector(getCanvasWidgets, (canvasWidgets) => {
    return getParentToOpenIfAny(widgetId, canvasWidgets);
  });
};

// Check if widget is in the list of selected widgets
export const isWidgetSelected = (widgetId: string) => {
  return createSelector(getSelectedWidgets, (widgets): boolean =>
    widgets.includes(widgetId),
  );
};

export const isCurrentWidgetFocused = (widgetId: string) => {
  return createSelector(
    getFocusedWidget,
    (widget): boolean => widget === widgetId,
  );
};

// Check if current widget is the last selected widget
export const isCurrentWidgetLastSelected = (widgetId: string) => {
  return createSelector(
    getLastSelectedWidget,
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

export function getParentToOpenIfAny(
  widgetId: string | undefined,
  widgets: CanvasWidgetsReduxState,
) {
  if (widgetId) {
    let widget = get(widgets, widgetId, undefined);

    // While this widget has a openParentPropertyPane equal to true
    while (widget?.openParentPropertyPane) {
      // Get parent widget props
      const parent = get(widgets, `${widget.parentId}`, undefined);

      // If parent has openParentPropertyPane = false, return the current parent
      if (!parent?.openParentPropertyPane) {
        return parent;
      }

      if (parent?.parentId && parent.parentId !== MAIN_CONTAINER_WIDGET_ID) {
        widget = get(widgets, `${widget.parentId}`, undefined);

        continue;
      }
    }
  }

  return;
}

export const shouldWidgetIgnoreClicksSelector = (widgetId: string) => {
  return createSelector(
    getFocusedWidget,
    getIsTableFilterPaneVisible,
    (state: AppState) => state.ui.widgetDragResize.isResizing,
    (state: AppState) => state.ui.widgetDragResize.isDragging,
    getAppMode,
    getIsAutoHeightWithLimitsChanging,
    (
      focusedWidgetId,
      isTableFilterPaneVisible,
      isResizing,
      isDragging,
      appMode,
      isAutoHeightWithLimitsChanging,
    ) => {
      const isFocused = focusedWidgetId === widgetId;

      return (
        isResizing ||
        isDragging ||
        appMode !== APP_MODE.EDIT ||
        !isFocused ||
        isTableFilterPaneVisible ||
        isAutoHeightWithLimitsChanging
      );
    },
  );
};
