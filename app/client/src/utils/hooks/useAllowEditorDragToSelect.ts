import type { DefaultRootState } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import { useSelector } from "react-redux";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { LayoutSystemTypes } from "layoutSystems/types";
import { getWidgetSelectionBlock } from "../../selectors/ui";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";

export const useAllowEditorDragToSelect = () => {
  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: DefaultRootState) => state.ui.widgetDragResize.isResizing,
  );
  const layoutSystemType = useSelector(getLayoutSystemType);

  const isFixedLayout = layoutSystemType === LayoutSystemTypes.FIXED;

  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: DefaultRootState) => state.ui.widgetDragResize.isDragging,
  );

  // This state tells us if it is already dragging for selection
  const isSelecting = useSelector(
    (state: DefaultRootState) =>
      state.ui.canvasSelection.isDraggingForSelection,
  );

  const isAutoCanvasResizing = useSelector(
    (state: DefaultRootState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );

  // This state tells us to disable dragging,
  // This is usually true when widgets themselves implement drag/drop
  // This flag resolves conflicting drag/drop triggers.
  const isDraggingDisabled: boolean = useSelector(
    (state: DefaultRootState) => state.ui.widgetDragResize.isDraggingDisabled,
  );

  // True when any widget is dragging or resizing, including this one
  const isResizingOrDragging = !!isResizing || !!isDragging || !!isSelecting;
  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(selectCombinedPreviewMode);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );

  const isWidgetSelectionBlocked = useSelector(getWidgetSelectionBlock);

  return (
    isFixedLayout &&
    !isAutoCanvasResizing &&
    !isResizingOrDragging &&
    !isDraggingDisabled &&
    !isSnipingMode &&
    !isPreviewMode &&
    !isAppSettingsPaneWithNavigationTabOpen &&
    !isWidgetSelectionBlocked
  );
};
