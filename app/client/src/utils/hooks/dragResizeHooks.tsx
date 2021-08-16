import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { useCallback, useEffect, useState } from "react";
import { commentModeSelector } from "selectors/commentsSelectors";
import { snipingModeSelector } from "selectors/editorSelectors";

export const useShowPropertyPane = () => {
  const dispatch = useDispatch();
  const isCommentMode = useSelector(commentModeSelector);
  const isSnipingMode = useSelector(snipingModeSelector);

  // TODO(abhinav/Satish): Performance bottleneck
  return useCallback(
    (widgetId?: string, callForDragOrResize?: boolean, force = false) => {
      // Don't show property pane in comment mode
      if (isCommentMode || isSnipingMode) return;

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
    },
    [dispatch, isCommentMode, isSnipingMode],
  );
};

export const useShowTableFilterPane = () => {
  const dispatch = useDispatch();
  const isCommentMode = useSelector(commentModeSelector);

  return useCallback(
    (widgetId?: string, callForDragOrResize?: boolean, force = false) => {
      // Don't show property pane in comment mode
      if (isCommentMode) return;

      dispatch(
        // If widgetId is not provided, we don't show the table filter pane.
        // However, if callForDragOrResize is provided, it will be a start or end of a drag or resize action
        // callForDragOrResize payload is handled in SHOW_TABLE_FILTER_PANE action.
        // Ergo, when either widgetId or callForDragOrResize are provided, SHOW_TABLE_FILTER_PANE
        // Else, HIDE_TABLE_FILTER_PANE
        {
          type:
            widgetId || callForDragOrResize
              ? ReduxActionTypes.SHOW_TABLE_FILTER_PANE
              : ReduxActionTypes.HIDE_TABLE_FILTER_PANE,
          payload: { widgetId, callForDragOrResize, force },
        },
      );
    },
    [dispatch, isCommentMode],
  );
};

export const useToggleEditWidgetName = () => {
  const dispatch = useDispatch();
  return useCallback(
    (widgetId: string, enable: boolean) => {
      dispatch({
        type: ReduxActionTypes.TOGGLE_PROPERTY_PANE_WIDGET_NAME_EDIT,
        payload: {
          enable,
          widgetId,
        },
      });
    },
    [dispatch],
  );
};

export const useCanvasSnapRowsUpdateHook = () => {
  const dispatch = useDispatch();
  const updateCanvasSnapRows = useCallback(
    (canvasWidgetId: string, snapRows: number) => {
      dispatch({
        type: ReduxActionTypes.UPDATE_CANVAS_SIZE,
        payload: {
          canvasWidgetId,
          snapRows,
        },
      });
    },
    [dispatch],
  );
  return updateCanvasSnapRows;
};

export const useWidgetDragResize = () => {
  const dispatch = useDispatch();
  // TODO(abhinav/Satish): Performance bottleneck
  return {
    setDraggingNewWidget: useCallback(
      (isDragging: boolean, newWidgetProps: any) => {
        if (isDragging) {
          document.body.classList.add("dragging");
        } else {
          document.body.classList.remove("dragging");
        }
        dispatch({
          type: ReduxActionTypes.SET_NEW_WIDGET_DRAGGING,
          payload: { isDragging, newWidgetProps },
        });
      },
      [dispatch],
    ),
    setDraggingState: useCallback(
      ({
        isDragging,
        dragGroupActualParent = "",
        draggingGroupCenter = {},
        startPoints,
      }: {
        isDragging: boolean;
        dragGroupActualParent?: string;
        draggingGroupCenter?: Record<string, any>;
        startPoints?: any;
      }) => {
        if (isDragging) {
          document.body.classList.add("dragging");
        } else {
          document.body.classList.remove("dragging");
        }
        dispatch({
          type: ReduxActionTypes.SET_WIDGET_DRAGGING,
          payload: {
            isDragging,
            dragGroupActualParent,
            draggingGroupCenter,
            startPoints,
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

export const useWindowSizeHooks = () => {
  const [windowSize, updateWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const onResize = () => {
    updateWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };
  useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return windowSize;
};
