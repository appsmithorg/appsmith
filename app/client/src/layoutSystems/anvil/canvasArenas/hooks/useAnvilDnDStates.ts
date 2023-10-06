import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { AppState } from "@appsmith/reducers";
import { getDragDetails, getWidgetByID } from "sagas/selectors";
import { useSelector } from "react-redux";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { useEffect, useRef } from "react";

export const useAnvilDnDStates = ({ widgetId }: { widgetId: string }) => {
  const lastDraggedCanvas = useRef<string | undefined>(undefined);

  // dragDetails contains of info needed for a container jump:
  // which parent the dragging widget belongs,
  // which canvas is active(being dragged on),
  // which widget is grabbed while dragging started,
  // relative position of mouse pointer wrt to the last grabbed widget.
  const dragDetails: DragDetails = useSelector(getDragDetails);
  const draggingCanvas = useSelector(
    getWidgetByID(dragDetails.draggedOn || ""),
  );
  useEffect(() => {
    if (
      dragDetails.draggedOn &&
      draggingCanvas &&
      draggingCanvas.parentId &&
      ![widgetId, MAIN_CONTAINER_WIDGET_ID].includes(dragDetails.draggedOn)
    ) {
      lastDraggedCanvas.current = draggingCanvas.parentId;
    }
  }, [dragDetails.draggedOn]);

  const { dragGroupActualParent: dragParent, newWidget } = dragDetails;
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isNewWidget = !!newWidget && !dragParent;
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const isChildOfCanvas = dragParent === widgetId;
  const isCurrentDraggedCanvas = dragDetails.draggedOn === widgetId;
  const isNewWidgetInitialTargetCanvas =
    isNewWidget && widgetId === MAIN_CONTAINER_WIDGET_ID;

  return {
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isNewWidgetInitialTargetCanvas,
    isResizing,
  };
};
