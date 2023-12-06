import type { AppState } from "@appsmith/reducers";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { useShowPropertyPane } from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

export const useClickToClearSelections = (widgetId: string) => {
  const { deselectAll, focusWidget } = useWidgetSelection();
  // This shows the property pane
  const showPropertyPane = useShowPropertyPane();

  // Are we currently dragging?
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isCanvasResizing: boolean = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );
  const isDistributingSpace: boolean = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDistributingSpace,
  );

  return (e: React.MouseEvent<HTMLElement>) => {
    const isTargetMainCanvas = widgetId === MAIN_CONTAINER_WIDGET_ID;

    if (!(isDragging || isCanvasResizing || isDistributingSpace)) {
      // Check if Target is the MainCanvas
      if (isTargetMainCanvas) {
        deselectAll();
        focusWidget && focusWidget(widgetId);
        showPropertyPane && showPropertyPane();
        e.preventDefault();
      } else {
        // Prevent onClick from Bubbling out of the Canvas to the WidgetEditor for any other widget except the MainCanvas
        e.stopPropagation();
      }
    }
  };
};
