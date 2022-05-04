import {
  getCurrentWidgetId,
  getIsPropertyPaneVisible,
} from "selectors/propertyPaneSelectors";
import { getIsTableFilterPaneVisible } from "selectors/tableFilterSelectors";
import { useSelector } from "store";
import { AppState } from "reducers";
import { APP_MODE } from "entities/App";
import { getAppMode } from "selectors/applicationSelectors";
import { useWidgetSelection } from "./useWidgetSelection";
import React, { ReactNode, useCallback } from "react";
import { stopEventPropagation } from "utils/AppsmithUtils";
import { getParentToOpenIfAny } from "selectors/widgetSelectors";

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

  const parentWidgetToOpen = useSelector(getParentToOpenIfAny(focusedWidgetId));
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
