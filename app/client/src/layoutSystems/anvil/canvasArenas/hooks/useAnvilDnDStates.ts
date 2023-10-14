import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { AppState } from "@appsmith/reducers";
import { getDragDetails, getWidgets } from "sagas/selectors";
import { useSelector } from "react-redux";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { useMemo } from "react";
import { getSelectedWidgets } from "selectors/ui";
import { getWidgetPositions } from "layoutSystems/common/selectors";
import type { DraggedWidget } from "layoutSystems/anvil/utils/anvilTypes";
import type { WidgetPositions } from "layoutSystems/common/types";
import WidgetFactory from "WidgetProvider/factory";
import { getDropTargetLayoutId } from "layoutSystems/anvil/integrations/selectors";

interface AnvilDnDStatesProps {
  allowedWidgetTypes: string[];
  canvasId: string;
  layoutId: string;
}

export interface AnvilDnDStates {
  allowToDrop: boolean;
  draggedBlocks: DraggedWidget[];
  dragDetails: DragDetails;
  filteredSelectedWidgets: string[];
  isChildOfCanvas: boolean;
  isCurrentDraggedCanvas: boolean;
  isDragging: boolean;
  isNewWidget: boolean;
  isNewWidgetInitialTargetCanvas: boolean;
  isResizing: boolean;
  widgetPositions: WidgetPositions;
  mainCanvasLayoutId: string;
}

export const useAnvilDnDStates = ({
  allowedWidgetTypes,
  canvasId,
  layoutId,
}: AnvilDnDStatesProps): AnvilDnDStates => {
  const mainCanvasLayoutId: string = useSelector((state) =>
    getDropTargetLayoutId(state, MAIN_CONTAINER_WIDGET_ID),
  );
  const widgetPositions = useSelector(getWidgetPositions);
  const allWidgets = useSelector(getWidgets);
  const selectedWidgets = useSelector(getSelectedWidgets);
  const filteredSelectedWidgets = selectedWidgets.filter(
    (eachWidgetId) =>
      !!allWidgets[eachWidgetId] && !!widgetPositions[eachWidgetId],
  );
  // dragDetails contains of info needed for a container jump:
  // which parent the dragging widget belongs,
  // which canvas is active(being dragged on),
  // which widget is grabbed while dragging started,
  // relative position of mouse pointer wrt to the last grabbed widget.
  const dragDetails: DragDetails = useSelector(getDragDetails);
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const { dragGroupActualParent: dragParent, newWidget } = dragDetails;
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isNewWidget = !!newWidget && !dragParent;
  const isChildOfCanvas = dragParent === canvasId;
  const isCurrentDraggedCanvas = dragDetails.draggedOn === layoutId;
  const isNewWidgetInitialTargetCanvas =
    isNewWidget && layoutId === mainCanvasLayoutId;
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
  // process drag blocks only once and per first render
  // this is by taking advantage of the fact that isNewWidget and dragDetails are unchanged states during the dragging action.
  const draggedBlocks = useMemo(
    () => (isDragging ? getDraggedBlocks() : []),
    [isDragging, filteredSelectedWidgets],
  );

  return {
    allowToDrop,
    draggedBlocks,
    dragDetails,
    filteredSelectedWidgets,
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isNewWidgetInitialTargetCanvas,
    isResizing,
    mainCanvasLayoutId,
    widgetPositions,
  };
};
