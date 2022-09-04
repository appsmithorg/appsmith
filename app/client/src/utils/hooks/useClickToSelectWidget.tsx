import { get } from "lodash";
import { getIsPropertyPaneVisible } from "selectors/propertyPaneSelectors";
import { getIsTableFilterPaneVisible } from "selectors/tableFilterSelectors";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { useSelector } from "store";
import { AppState } from "@appsmith/reducers";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { APP_MODE } from "entities/App";
import { getAppMode } from "selectors/applicationSelectors";
import { useWidgetSelection } from "./useWidgetSelection";
import React, { ReactNode, useCallback } from "react";
import { stopEventPropagation } from "utils/AppsmithUtils";
import {
  getFocusedParentToOpen,
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import equal from "fast-deep-equal/es6";

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

  const clickToSelectWidget = useClickToSelectWidget(widgetId);
  const clickToSelectFn = useCallback(
    (e) => {
      clickToSelectWidget(e);
    },
    [clickToSelectWidget],
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

export const useClickToSelectWidget = (widgetId: string) => {
  const { focusWidget, selectWidget } = useWidgetSelection();
  const isPropPaneVisible = useSelector(getIsPropertyPaneVisible, equal);
  const isTableFilterPaneVisible = useSelector(
    getIsTableFilterPaneVisible,
    equal,
  );

  const isFocused = useSelector(isCurrentWidgetFocused(widgetId), equal);
  // const isFocused = false;

  const isSelected = useSelector(isWidgetSelected(widgetId), equal);
  // const parentWidgetToOpen = useSelector(getParentToOpenIfAny(widgetId));

  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
    equal,
  );
  const appMode = useSelector(getAppMode, equal);

  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
    equal,
  );

  const parentWidgetToOpen = useSelector(getFocusedParentToOpen, equal);

  const clickToSelectWidget = (e: any) => {
    // ignore click captures
    // 1. if the component was resizing or dragging coz it is handled internally in draggable component
    // 2. table filter property pane is open
    if (
      isResizing ||
      isDragging ||
      appMode !== APP_MODE.EDIT ||
      !isFocused ||
      isTableFilterPaneVisible
    )
      return;
    if ((!isPropPaneVisible && isSelected) || !isSelected) {
      const isMultiSelect = e.metaKey || e.ctrlKey || e.shiftKey;

      if (parentWidgetToOpen) {
        selectWidget(parentWidgetToOpen.widgetId, isMultiSelect);
      } else {
        selectWidget(widgetId, isMultiSelect);
        focusWidget(widgetId);
      }

      if (isMultiSelect) {
        e.stopPropagation();
      }
    }
  };
  return clickToSelectWidget;
};
