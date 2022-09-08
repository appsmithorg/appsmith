import { getIsPropertyPaneVisible } from "selectors/propertyPaneSelectors";
import { getIsTableFilterPaneVisible } from "selectors/tableFilterSelectors";
import { useSelector } from "store";
import { AppState } from "@appsmith/reducers";
import { APP_MODE } from "entities/App";
import { getAppMode } from "selectors/applicationSelectors";
import { useWidgetSelection } from "./useWidgetSelection";
import React, { ReactNode, useCallback, useMemo } from "react";
import { stopEventPropagation } from "utils/AppsmithUtils";
import {
  getFocusedParentToOpen,
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import equal from "fast-deep-equal/es6";

export function ClickContentToOpenPropPane({
  children,
  widgetId,
}: {
  widgetId: string;
  children?: ReactNode;
}) {
  const { focusWidget } = useWidgetSelection();

  const clickToSelectWidget = useClickToSelectWidget(widgetId);

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
      onClickCapture={clickToSelectWidget}
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

  const isFocused = useSelector(isCurrentWidgetFocused(widgetId));

  const isSelected = useSelector(isWidgetSelected(widgetId));

  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const appMode = useSelector(getAppMode);

  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const parentWidgetToOpen = useSelector(getFocusedParentToOpen, equal);

  const shouldIgnoreClicks =
    isResizing ||
    isDragging ||
    appMode !== APP_MODE.EDIT ||
    !isFocused ||
    isTableFilterPaneVisible;

  const clickToSelectWidget = useCallback(
    (e: any) => {
      // Ignore click captures
      // 1. If the component is resizing or dragging because it is handled internally in draggable component.
      // 2. If table filter property pane is open.
      if (shouldIgnoreClicks) return;
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
    },
    [shouldIgnoreClicks, isPropPaneVisible, isSelected, parentWidgetToOpen],
  );
  return clickToSelectWidget;
};
