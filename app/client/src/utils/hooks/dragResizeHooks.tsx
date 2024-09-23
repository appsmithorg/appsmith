import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import { showPropertyPane } from "actions/propertyPaneActions";
import { closePropertyPane } from "actions/widgetActions";

export const useShowPropertyPane = () => {
  const dispatch = useDispatch();
  const isSnipingMode = useSelector(snipingModeSelector);

  // TODO(abhinav/Satish): Performance bottleneck
  return useCallback(
    (widgetId?: string, callForDragOrResize?: boolean, force = false) => {
      // Don't show property pane in comment mode
      if (isSnipingMode) return;

      // If widgetId is not provided, we don't show the property pane.
      // However, if callForDragOrResize is provided, it will be a start or end of a drag or resize action
      // callForDragOrResize payload is handled in SHOW_PROPERTY_PANE action.
      // Ergo, when either widgetId or callForDragOrResize are provided, SHOW_PROPERTY_PANE
      // Else, HIDE_PROPERTY_PANE
      if (widgetId || callForDragOrResize) {
        dispatch(showPropertyPane({ widgetId, callForDragOrResize, force }));
      } else {
        dispatch(closePropertyPane(force));
      }
    },
    [dispatch, isSnipingMode],
  );
};

export const useShowTableFilterPane = () => {
  const dispatch = useDispatch();

  return useCallback(
    (widgetId?: string, callForDragOrResize?: boolean, force = false) => {
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
    [dispatch],
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

export interface SetDraggingStateActionPayload {
  isDragging: boolean;
  dragGroupActualParent?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  draggingGroupCenter?: Record<string, any>;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startPoints?: any;
  draggedOn?: string;
}

export const useWidgetDragResize = () => {
  const dispatch = useDispatch();

  // TODO(abhinav/Satish): Performance bottleneck
  return {
    setDraggingNewWidget: useCallback(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        draggedOn,
        draggingGroupCenter = {},
        dragGroupActualParent = "",
        isDragging,
        startPoints,
      }: SetDraggingStateActionPayload) => {
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
            draggedOn,
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
