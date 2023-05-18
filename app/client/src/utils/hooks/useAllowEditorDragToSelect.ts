import type { AppState } from "@appsmith/reducers";
import {
  snipingModeSelector,
  previewModeSelector,
  getIsAutoLayout,
} from "selectors/editorSelectors";
import { useSelector } from "react-redux";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";

export const useAllowEditorDragToSelect = () => {
  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );

  const isAutoLayout = useSelector(getIsAutoLayout);

  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  // This state tells us if it is already dragging for selection
  const isSelecting = useSelector(
    (state: AppState) => state.ui.canvasSelection.isDraggingForSelection,
  );

  const isAutoCanvasResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
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
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );

  return (
    !isAutoLayout &&
    !isAutoCanvasResizing &&
    !isResizingOrDragging &&
    !isDraggingDisabled &&
    !isSnipingMode &&
    !isPreviewMode &&
    !isAppSettingsPaneWithNavigationTabOpen
  );
};
