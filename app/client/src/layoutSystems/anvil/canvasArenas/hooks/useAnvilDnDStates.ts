import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { AppState } from "@appsmith/reducers";
import { getDragDetails, getWidgetByID, getWidgets } from "sagas/selectors";
import { useSelector } from "react-redux";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { useEffect, useRef } from "react";
import { getSelectedWidgets } from "selectors/ui";
import type { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

export const useAnvilDnDStates = ({
  canvasId,
  layoutId,
}: {
  canvasId: string;
  layoutId: string;
}) => {
  const lastDraggedCanvas = useRef<string | undefined>(undefined);
  const selectedWidgets = useSelector(getSelectedWidgets);
  const allWidgets = useSelector(getWidgets);
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
      ![canvasId, MAIN_CONTAINER_WIDGET_ID].includes(dragDetails.draggedOn)
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

  const isChildOfCanvas = dragParent === canvasId;
  const isCurrentDraggedCanvas = dragDetails.draggedOn === layoutId;
  const isNewWidgetInitialTargetCanvas =
    isNewWidget && layoutId === MAIN_CONTAINER_WIDGET_ID;
  const getDraggedBlocks = (): {
    widgetId?: string;
    type: string;
    responsiveBehavior?: ResponsiveBehavior;
  }[] => {
    if (isNewWidget) {
      const { newWidget } = dragDetails;

      return [
        {
          type: newWidget.type,
          responsiveBehavior: newWidget.responsiveBehavior,
        },
      ];
    } else {
      return selectedWidgets.map((eachWidgetId) => ({
        type: allWidgets[eachWidgetId].type,
        widgetId: eachWidgetId,
        responsiveBehavior: allWidgets[eachWidgetId].responsiveBehavior,
      }));
    }
  };
  return {
    draggedBlocks: getDraggedBlocks(),
    dragDetails,
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isNewWidgetInitialTargetCanvas,
    isResizing,
  };
};
