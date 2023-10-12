import {
  addNewAnvilWidgetAction,
  moveAnvilWidgets,
} from "layoutSystems/anvil/actions/draggingActions";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { getSelectedWidgets } from "selectors/ui";

export const useAnvilWidgetDrop = (
  canvasId: string,
  anvilDragStates: {
    dragDetails: DragDetails;
    isChildOfCanvas: boolean;
    isCurrentDraggedCanvas: boolean;
    isDragging: boolean;
    isNewWidget: boolean;
    isNewWidgetInitialTargetCanvas: boolean;
    isResizing: boolean;
  },
) => {
  const dispatch = useDispatch();
  const selectedWidgets = useSelector(getSelectedWidgets);
  const { dragDetails, isNewWidget } = anvilDragStates;
  const generateNewWidgetBlock = useCallback(() => {
    const { newWidget } = dragDetails;
    return {
      width: newWidget.width,
      height: newWidget.height,
      newWidgetId: newWidget.widgetId,
      parentId: canvasId,
      type: newWidget.type,
    };
  }, [dragDetails]);
  return (renderedBlock: AnvilHighlightInfo) => {
    if (isNewWidget) {
      const newWidgetBlock = generateNewWidgetBlock();
      dispatch(addNewAnvilWidgetAction(newWidgetBlock, renderedBlock));
    } else {
      dispatch(moveAnvilWidgets(renderedBlock, selectedWidgets));
    }
  };
};
