import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const useShowPropertyPane = () => {
  const dispatch = useDispatch();
  return (widgetId?: string, callForDragOrResize?: boolean, force = false) => {
    dispatch(
      // If widgetId is not provided, we don't show the property pane.
      // However, if callForDragOrResize is provided, it will be a start or end of a drag or resize action
      // callForDragOrResize payload is handled in SHOW_PROPERTY_PANE action.
      // Ergo, when either widgetId or callForDragOrResize are provided, SHOW_PROPERTY_PANE
      // Else, HIDE_PROPERTY_PANE
      {
        type:
          widgetId || callForDragOrResize
            ? ReduxActionTypes.SHOW_PROPERTY_PANE
            : ReduxActionTypes.HIDE_PROPERTY_PANE,
        payload: { widgetId, callForDragOrResize, force },
      },
    );
  };
};

export const useCanvasSnapRowsUpdateHook = () => {
  const dispatch = useDispatch();
  const updateCanvasSnapRows = (canvasWidgetId: string, snapRows: number) => {
    dispatch({
      type: ReduxActionTypes.UPDATE_CANVAS_SIZE,
      payload: {
        canvasWidgetId,
        snapRows,
      },
    });
  };
  return updateCanvasSnapRows;
};

export const useWidgetSelection = () => {
  const dispatch = useDispatch();
  return {
    selectWidget: (widgetId?: string) => {
      dispatch({ type: ReduxActionTypes.SELECT_WIDGET, payload: { widgetId } });
    },
    focusWidget: (widgetId?: string) =>
      dispatch({ type: ReduxActionTypes.FOCUS_WIDGET, payload: { widgetId } }),
  };
};

export const useWidgetDragResize = () => {
  const dispatch = useDispatch();
  return {
    setIsDragging: (isDragging: boolean) =>
      dispatch({
        type: ReduxActionTypes.SET_WIDGET_DRAGGING,
        payload: { isDragging },
      }),
    setIsResizing: (isResizing: boolean) => {
      dispatch({
        type: ReduxActionTypes.SET_WIDGET_RESIZING,
        payload: { isResizing },
      });
    },
  };
};
