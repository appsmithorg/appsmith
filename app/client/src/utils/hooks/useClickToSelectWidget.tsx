import { getIsPropertyPaneVisible } from "selectors/propertyPaneSelectors";
import { getIsTableFilterPaneVisible } from "selectors/tableFilterSelectors";
import { useSelector } from "store";
import { AppState } from "reducers";
import { APP_MODE } from "entities/App";
import { getAppMode } from "selectors/applicationSelectors";
import { useWidgetSelection } from "./useWidgetSelection";
import React, { ReactNode, useCallback } from "react";
import { stopEventPropagation } from "utils/AppsmithUtils";
import {
  getParentToOpenIfAny,
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";

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
  const isPropPaneVisible = useSelector(getIsPropertyPaneVisible);
  const isTableFilterPaneVisible = useSelector(getIsTableFilterPaneVisible);
  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const appMode = useSelector(getAppMode);

  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isFocused = useSelector(isCurrentWidgetFocused(widgetId));
  const isSelected = useSelector(isWidgetSelected(widgetId));
  const parentWidgetToOpen = useSelector(getParentToOpenIfAny(widgetId));

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
