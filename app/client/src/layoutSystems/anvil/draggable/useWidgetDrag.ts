import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { useCallback } from "react";
import { useDispatch } from "react-redux";

export const useWidgetDrag = () => {
  const dispatch = useDispatch();
  // TODO(abhinav/Satish): Performance bottleneck
  return {
    setDraggingState: useCallback(
      (isDragging: boolean) => {
        dispatch({
          type: ReduxActionTypes.SET_WIDGET_DRAGGING,
          payload: {
            isDragging,
          },
        });
      },
      [dispatch],
    ),
    setDraggingCanvas: useCallback(
      (draggedOn?: string) => {
        dispatch({
          type: ReduxActionTypes.SET_DRAGGING_CANVAS,
          payload: {
            draggedOn,
          },
        });
      },
      [dispatch],
    ),
    setIsResizing: useCallback(
      (isResizing: boolean) => {
        dispatch({
          type: ReduxActionTypes.SET_WIDGET_RESIZING,
          payload: { isResizing },
        });
      },
      [dispatch],
    ),
  };
};
