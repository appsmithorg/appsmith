import { useWidgetSelection } from "./useWidgetSelection";
import { useSelector } from "react-redux";
import { isWidgetFocused } from "selectors/widgetSelectors";
import { getAnvilSpaceDistributionStatus } from "layoutSystems/anvil/integrations/selectors";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";
import type { AppState } from "ee/reducers";
import type React from "react";
import { useCurrentAppState } from "pages/Editor/IDE/hooks/useCurrentAppState";
import { EditorState } from "IDE/Interfaces/EditorState";

export const useHoverToFocusWidget = (
  widgetId: string,
  resizeDisabled?: boolean,
) => {
  const { focusWidget } = useWidgetSelection();

  // This state tels us which widget is focused
  // The value is the widgetId of the focused widget.
  const isFocused = useSelector(isWidgetFocused(widgetId));

  // This state tells the current IDE state
  const ideState = useCurrentAppState();
  // Check if in the editor state
  const isEditor = ideState === EditorState.EDITOR;

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
  const isPreviewMode = useSelector(selectCombinedPreviewMode);
  // When mouse is over this draggable
  const handleMouseOver = (e: React.MouseEvent) => {
    focusWidget &&
      !isResizingOrDragging &&
      !isFocused &&
      isEditor &&
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
