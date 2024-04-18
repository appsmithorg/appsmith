import { useWidgetSelection } from "./useWidgetSelection";
import { useSelector } from "react-redux";
import { isCurrentWidgetFocused } from "selectors/widgetSelectors";
import { getAnvilSpaceDistributionStatus } from "layoutSystems/anvil/integrations/selectors";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import type { AppState } from "@appsmith/reducers";
import type React from "react";

export const useHoverToFocusWidget = (
  widgetId: string,
  resizeDisabled?: boolean,
) => {
  const { focusWidget } = useWidgetSelection();

  // This state tels us which widget is focused
  // The value is the widgetId of the focused widget.
  const isFocused = useSelector(isCurrentWidgetFocused(widgetId));

  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const isResizingOrDragging = isResizing || isDragging;
  // This state tells us whether space redistribution is in process
  const isDistributingSpace = useSelector(getAnvilSpaceDistributionStatus);
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  // When mouse is over this draggable
  const handleMouseOver = (e: React.MouseEvent) => {
    focusWidget &&
      !isResizingOrDragging &&
      !isFocused &&
      !isDistributingSpace &&
      !resizeDisabled &&
      !isPreviewMode &&
      focusWidget(widgetId, e.metaKey);
    e.stopPropagation();
  };

  const handleMouseLeave = () => {
    // on leaving a widget, we reset the focused widget
    focusWidget && focusWidget();
  };

  return [handleMouseOver, handleMouseLeave];
};
