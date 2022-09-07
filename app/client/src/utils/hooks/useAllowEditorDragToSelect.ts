import { AppState } from "reducers";
import {
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { useSelector } from "store";

export const useAllowEditorDragToSelect = () => {
  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );

  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  // This state tells us if it is already dragging for selection
  const isSelecting = useSelector(
    (state: AppState) => state.ui.canvasSelection.isDraggingForSelection,
  );

  // This state tells us to disable dragging,
  // This is usually true when widgets themselves implement drag/drop
  // This flag resolves conflicting drag/drop triggers.
  const isDraggingDisabled: boolean = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDraggingDisabled,
  );

  // True when any widget is dragging or resizing, including this one
  const isResizingOrDragging = !!isResizing || !!isDragging || !!isSelecting;
  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(previewModeSelector);

  return (
    !isResizingOrDragging &&
    !isDraggingDisabled &&
    !isSnipingMode &&
    !isPreviewMode
  );
};
