import { get } from "lodash";
import {
  getCurrentWidgetId,
  getIsPropertyPaneVisible,
} from "selectors/propertyPaneSelectors";
import { getIsTableFilterPaneVisible } from "selectors/tableFilterSelectors";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { useSelector } from "store";
import { AppState } from "reducers";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { APP_MODE } from "entities/App";
import { getAppMode } from "selectors/applicationSelectors";
import { getWidgets } from "sagas/selectors";
import { useWidgetSelection } from "./useWidgetSelection";
import React, { ReactNode, useCallback } from "react";
import { stopEventPropagation } from "utils/AppsmithUtils";

/**
 *
 * @param widgetId
 * @param widgets
 * @returns
 */
export function getParentToOpenIfAny(
  widgetId: string | undefined,
  widgets: CanvasWidgetsReduxState,
) {
  if (widgetId) {
    let widget = get(widgets, widgetId, undefined);

    // While this widget has a openParentPropertyPane equql to true
    while (widget?.openParentPropertyPane) {
      // Get parent widget props
      const parent = get(widgets, `${widget.parentId}`, undefined);

      // If parent has openParentPropertyPane = false, return the currnet parent
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

export function ClickContentToOpenPropPane({
  children,
  widgetId,
}: {
  widgetId: string;
  children?: ReactNode;
}) {
  const { focusWidget } = useWidgetSelection();

  const clickToSelectWidget = useClickToSelectWidget();
  const clickToSelectFn = useCallback(
    (e) => {
      clickToSelectWidget(e, widgetId);
    },
    [widgetId, clickToSelectWidget],
  );
  const focusedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.focusedWidget,
  );

  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isResizingOrDragging = !!isResizing || !!isDragging;
  const handleMouseOver = (e: any) => {
    focusWidget &&
      !isResizingOrDragging &&
      focusedWidget !== widgetId &&
      focusWidget(widgetId);
    e.stopPropagation();
  };

  return (
    <div
      onClick={stopEventPropagation}
      onClickCapture={clickToSelectFn}
      onMouseOver={handleMouseOver}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </div>
  );
}

export const useClickToSelectWidget = () => {
  const { focusWidget, selectWidget } = useWidgetSelection();
  const isPropPaneVisible = useSelector(getIsPropertyPaneVisible);
  const isTableFilterPaneVisible = useSelector(getIsTableFilterPaneVisible);
  const widgets: CanvasWidgetsReduxState = useSelector(getWidgets);
  const selectedWidgetId = useSelector(getCurrentWidgetId);
  const focusedWidgetId = useSelector(
    (state: AppState) => state.ui.widgetDragResize.focusedWidget,
  );
  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const appMode = useSelector(getAppMode);

  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const parentWidgetToOpen = getParentToOpenIfAny(focusedWidgetId, widgets);
  const clickToSelectWidget = (e: any, targetWidgetId: string) => {
    // ignore click captures
    // 1. if the component was resizing or dragging coz it is handled internally in draggable component
    // 2. table filter property pane is open
    if (
      isResizing ||
      isDragging ||
      appMode !== APP_MODE.EDIT ||
      targetWidgetId !== focusedWidgetId ||
      isTableFilterPaneVisible
    )
      return;
    if (
      (!isPropPaneVisible && selectedWidgetId === focusedWidgetId) ||
      selectedWidgetId !== focusedWidgetId
    ) {
      const isMultiSelect = e.metaKey || e.ctrlKey || e.shiftKey;

      if (parentWidgetToOpen) {
        selectWidget(parentWidgetToOpen.widgetId, isMultiSelect);
      } else {
        selectWidget(focusedWidgetId, isMultiSelect);
        focusWidget(focusedWidgetId);
      }

      if (isMultiSelect) {
        e.stopPropagation();
      }
    }
  };
  return clickToSelectWidget;
};
