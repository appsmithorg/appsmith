import { AppState } from "@appsmith/reducers";
import equal from "fast-deep-equal/es6";
import React, { ReactNode, useCallback } from "react";
import { useSelector } from "react-redux";
import { getIsPropertyPaneVisible } from "selectors/propertyPaneSelectors";
import {
  getFocusedParentToOpen,
  isWidgetSelected,
  shouldWidgetIgnoreClicksSelector,
} from "selectors/widgetSelectors";
import { stopEventPropagation } from "utils/AppsmithUtils";
import { useWidgetSelection } from "./useWidgetSelection";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

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

  const styles = {
    width: "100%",
    height: "100%",
  };

  return (
    <div
      onClick={stopEventPropagation}
      onMouseDownCapture={clickToSelectWidget}
      onMouseOver={handleMouseOver}
      style={styles}
    >
      {children}
    </div>
  );
}

export const useClickToSelectWidget = (widgetId: string) => {
  const { focusWidget, selectWidget } = useWidgetSelection();
  const isPropPaneVisible = useSelector(getIsPropertyPaneVisible);
  const isSelected = useSelector(isWidgetSelected(widgetId));
  const parentWidgetToOpen = useSelector(getFocusedParentToOpen, equal);
  const shouldIgnoreClicks = useSelector(
    shouldWidgetIgnoreClicksSelector(widgetId),
  );

  const clickToSelectWidget = useCallback(
    (e: any) => {
      // Ignore click captures
      // 1. If the component is resizing or dragging because it is handled internally in draggable component.
      // 2. If table filter property pane is open.
      if (shouldIgnoreClicks) return;
      if ((!isPropPaneVisible && isSelected) || !isSelected) {
        let type: SelectionRequestType = SelectionRequestType.One;
        if (e.metaKey || e.ctrlKey) {
          type = SelectionRequestType.PushPop;
        } else if (e.shiftKey) {
          type = SelectionRequestType.ShiftSelect;
        }

        if (parentWidgetToOpen) {
          selectWidget(type, [parentWidgetToOpen.widgetId]);
        } else {
          selectWidget(type, [widgetId]);
          focusWidget(widgetId);
        }

        if (
          type === SelectionRequestType.PushPop ||
          type === SelectionRequestType.ShiftSelect
        ) {
          e.stopPropagation();
        }
      }
    },
    [shouldIgnoreClicks, isPropPaneVisible, isSelected, parentWidgetToOpen],
  );
  return clickToSelectWidget;
};
