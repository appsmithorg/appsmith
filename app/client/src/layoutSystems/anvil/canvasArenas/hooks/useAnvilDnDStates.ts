import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { AppState } from "@appsmith/reducers";
import { getDragDetails, getWidgetByID, getWidgets } from "sagas/selectors";
import { useSelector } from "react-redux";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { getSelectedWidgets } from "selectors/ui";
import { getWidgetPositions } from "layoutSystems/common/selectors";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
} from "layoutSystems/anvil/utils/anvilTypes";
import type { WidgetPositions } from "layoutSystems/common/types";
import WidgetFactory from "WidgetProvider/factory";

export const useAnvilDnDStates = ({
  allowedWidgetTypes,
  canvasId,
  deriveAllHighlightsFn,
  layoutId,
}: {
  allowedWidgetTypes: string[];
  canvasId: string;
  layoutId: string;
  deriveAllHighlightsFn: (
    widgetPositions: WidgetPositions,
    draggedWidgets: DraggedWidget[],
  ) => AnvilHighlightInfo[];
}) => {
  const lastDraggedCanvas = useRef<string | undefined>(undefined);
  const widgetPositions = useSelector(getWidgetPositions);
  const allWidgets = useSelector(getWidgets);
  const selectedWidgets = useSelector(getSelectedWidgets);
  const filteredSelectedWidgets = selectedWidgets.filter(
    (eachWidgetId) => !!allWidgets[eachWidgetId],
  );
  // dragDetails contains of info needed for a container jump:
  // which parent the dragging widget belongs,
  // which canvas is active(being dragged on),
  // which widget is grabbed while dragging started,
  // relative position of mouse pointer wrt to the last grabbed widget.
  const dragDetails: DragDetails = useSelector(getDragDetails);
  const draggingCanvas = useSelector(
    getWidgetByID(dragDetails.draggedOn || ""),
  );
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
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
  const isChildOfCanvas = dragParent === canvasId;
  const isCurrentDraggedCanvas = dragDetails.draggedOn === layoutId;
  const isNewWidgetInitialTargetCanvas =
    isNewWidget && canvasId === MAIN_CONTAINER_WIDGET_ID;
  const getDraggedBlocks = (): DraggedWidget[] => {
    if (isNewWidget) {
      const { newWidget } = dragDetails;

      return [
        {
          widgetId: newWidget.widgetId,
          type: newWidget.type,
          responsiveBehavior:
            newWidget.responsiveBehavior ??
            WidgetFactory.getConfig(newWidget.type)?.responsiveBehavior,
        },
      ];
    } else {
      return filteredSelectedWidgets.map((eachWidgetId) => ({
        type: allWidgets[eachWidgetId].type,
        widgetId: eachWidgetId,
        responsiveBehavior: allWidgets[eachWidgetId].responsiveBehavior,
      }));
    }
  };
  const checkIfWidgetTypeDraggedIsAllowedToDrop = () => {
    if (allowedWidgetTypes.length === 0) {
      return true;
    }
    if (isNewWidget) {
      const { newWidget } = dragDetails;
      return allowedWidgetTypes.includes(newWidget.type);
    } else {
      return filteredSelectedWidgets.every((eachWidgetId) => {
        return allowedWidgetTypes.includes(allWidgets[eachWidgetId].type);
      });
    }
  };
  const allowToDrop = isDragging && checkIfWidgetTypeDraggedIsAllowedToDrop();
  const draggedBlocks = getDraggedBlocks();
  const memoizedDeriveHighlights = useCallback(
    () => deriveAllHighlightsFn(widgetPositions, draggedBlocks),
    [widgetPositions, draggedBlocks, isNewWidget],
  );
  const allHighLights = useMemo(
    () => (isDragging ? memoizedDeriveHighlights() : []),
    [isDragging],
  );
  console.log("!!!!", { allHighLights, draggedBlocks });
  return {
    allHighLights,
    allowToDrop,
    draggedBlocks,
    dragDetails,
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isNewWidgetInitialTargetCanvas,
    isResizing,
    widgetPositions,
  };
};
