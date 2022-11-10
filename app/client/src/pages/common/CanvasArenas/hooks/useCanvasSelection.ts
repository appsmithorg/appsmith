import * as React from "react";

import throttle from "lodash/throttle";
import { AppState } from "@appsmith/reducers";
import { APP_MODE } from "entities/App";
import { useDispatch, useSelector } from "react-redux";
import { ReflowDirection } from "reflow/reflowTypes";
import { getWidget } from "sagas/selectors";
import { getIsDraggingForSelection } from "selectors/canvasSelectors";
import { getAppMode } from "selectors/applicationSelectors";
import { getNearestParentCanvas } from "utils/generators";
import { getAbsolutePixels } from "utils/helpers";
import { ReflowInterface, useReflow } from "utils/hooks/useReflow";
import { SelectedArenaDimensions } from "../CanvasDraggingArena";
import { CanvasSelectionArenaProps } from "../CanvasSelectionArena";
import { XYCord } from "./useCanvasDragging";
import { useCanvasDragToScroll } from "./useCanvasDragToScroll";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import {
  getCurrentApplicationLayout,
  getCurrentPageId,
  previewModeSelector,
} from "selectors/editorSelectors";
import {
  drawWidget,
  selectAllWidgetsInAreaAction,
  setCanvasSelectionStateAction,
} from "actions/canvasSelectionActions";

export const useCanvasSelection = (
  slidingArenaRef: React.RefObject<HTMLDivElement>,
  stickyCanvasRef: React.RefObject<HTMLCanvasElement>,
  {
    canExtend,
    dropDisabled,
    parentId,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    widgetId,
  }: CanvasSelectionArenaProps,
) => {
  const dispatch = useDispatch();

  const parentWidget = useSelector((state: AppState) =>
    getWidget(state, parentId || ""),
  );
  const isDraggableParent = !(
    widgetId === MAIN_CONTAINER_WIDGET_ID ||
    (parentWidget && parentWidget.detachFromLayout)
  );
  const appMode = useSelector(getAppMode);
  const isPreviewMode = useSelector(previewModeSelector);
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isDrawingModeEnabled = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDrawing,
  );

  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const mainContainer = useSelector((state: AppState) =>
    getWidget(state, widgetId),
  );
  const currentPageId = useSelector(getCurrentPageId);
  const appLayout = useSelector(getCurrentApplicationLayout);

  const drawWidgetValues = React.useRef<any>();
  const directionRef = React.useRef(ReflowDirection.UNSET);
  const rectRef = React.useRef<any>();

  const draggingSpaces = [
    {
      top: 0,
      left: 0,
      right: 1,
      bottom: 1,
      id: "1",
    },
  ];

  const gridProps = {
    parentColumnSpace: snapColumnSpace,
    parentRowSpace: snapRowSpace,
    maxGridColumns: GridDefaults.DEFAULT_GRID_COLUMNS,
    paddingOffset: 0,
  };

  const reflow = React.useRef<ReflowInterface>();
  reflow.current = useReflow(draggingSpaces, widgetId || "", gridProps);

  const throttledWidgetSelection = React.useCallback(
    throttle(
      (
        selectionDimensions: SelectedArenaDimensions,
        snapToNextColumn: boolean,
        snapToNextRow: boolean,
        isMultiSelect: boolean,
      ) => {
        dispatch(
          selectAllWidgetsInAreaAction(
            selectionDimensions,
            snapToNextColumn,
            snapToNextRow,
            isMultiSelect,
            {
              snapColumnSpace,
              snapRowSpace,
            },
          ),
        );
      },
      150,
      {
        leading: true,
        trailing: true,
      },
    ),
    [widgetId, snapColumnSpace, snapRowSpace],
  );
  const isDraggingForSelection = useSelector(getIsDraggingForSelection);
  const isCurrentWidgetDrawing = useSelector((state: AppState) => {
    return state.ui.canvasSelection.widgetId === widgetId;
  });
  const outOfCanvasStartPositions = useSelector((state: AppState) => {
    return state.ui.canvasSelection.outOfCanvasStartPositions;
  });
  const defaultDrawOnObj = {
    canDraw: false,
    startPoints: undefined,
  };
  const drawOnEnterObj = React.useRef<{
    canDraw: boolean;
    startPoints?: XYCord;
  }>(defaultDrawOnObj);

  // start main container selection from widget editor
  React.useEffect(() => {
    const canDrawOnEnter =
      isDraggingForSelection &&
      isCurrentWidgetDrawing &&
      !!outOfCanvasStartPositions;

    drawOnEnterObj.current = {
      canDraw: canDrawOnEnter,
      startPoints: canDrawOnEnter ? outOfCanvasStartPositions : undefined,
    };
    if (slidingArenaRef.current && stickyCanvasRef.current && canDrawOnEnter) {
      stickyCanvasRef.current.style.zIndex = "2";
      slidingArenaRef.current.style.zIndex = "2";
    }
  }, [
    isDraggingForSelection,
    isCurrentWidgetDrawing,
    outOfCanvasStartPositions,
  ]);

  useCanvasDragToScroll(
    slidingArenaRef,
    isCurrentWidgetDrawing || isResizing,
    isDraggingForSelection || isResizing,
    snapRows,
    canExtend,
  );
  React.useEffect(() => {
    if (
      appMode === APP_MODE.EDIT &&
      !isDragging &&
      slidingArenaRef.current &&
      stickyCanvasRef.current
    ) {
      const scrollParent: Element | null = getNearestParentCanvas(
        slidingArenaRef.current,
      );
      const scrollObj: any = {};
      const canvasCtx: any = stickyCanvasRef.current.getContext("2d");
      const initRectangle = (): SelectedArenaDimensions => ({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      });
      let selectionRectangle: SelectedArenaDimensions = initRectangle();
      let isMultiSelect = false;
      let isDragging = false;

      const getSelectionDimensions = () => {
        return {
          top:
            selectionRectangle.height < 0
              ? selectionRectangle.top - Math.abs(selectionRectangle.height)
              : selectionRectangle.top,
          left:
            selectionRectangle.width < 0
              ? selectionRectangle.left - Math.abs(selectionRectangle.width)
              : selectionRectangle.left,
          width: Math.abs(selectionRectangle.width),
          height: Math.abs(selectionRectangle.height),
        };
      };

      const selectWidgetsInit = (
        selectionDimensions: SelectedArenaDimensions,
        isMultiSelect: boolean,
      ) => {
        if (
          selectionDimensions.left &&
          selectionDimensions.top &&
          selectionDimensions.width &&
          selectionDimensions.height
        ) {
          const snapToNextColumn = selectionRectangle.height < 0;
          const snapToNextRow = selectionRectangle.width < 0;
          throttledWidgetSelection(
            selectionDimensions,
            snapToNextColumn,
            snapToNextRow,
            isMultiSelect,
          );
        }
      };

      /**
       * When we are drawing a widget and we
       * press escape key then reset the rectangle
       */
      if (!isDragging && !isDrawingModeEnabled) {
        canvasCtx.clearRect(
          0,
          0,
          stickyCanvasRef.current.width,
          stickyCanvasRef.current.height,
        );
        stickyCanvasRef.current.style.zIndex = "";
        slidingArenaRef.current.style.zIndex = "";
        slidingArenaRef.current.style.cursor = "";
      }

      const drawWidgetDimensions = () => {
        const { height, left, top, width } = getSelectionDimensions();

        const leftColumn = Math.floor(left / snapColumnSpace);
        const topRow = Math.floor(top / snapRowSpace);

        const rows = Math.floor(height / snapRowSpace);
        const columns = Math.floor(width / snapColumnSpace);

        const values = {
          rows,
          topRow,
          columns,
          leftColumn,
          right: leftColumn + columns,
          bottom: topRow + rows,
        };

        return values;
      };

      let rectWidth = 0,
        rectHeight = 0;

      const getReflowDirection = (
        selectionDimensions: SelectedArenaDimensions,
      ) => {
        const strokeWidth = 1;
        let direction: ReflowDirection = directionRef.current;

        const width =
          Math.round(
            (selectionDimensions.width + strokeWidth) / snapColumnSpace,
          ) * snapColumnSpace;

        const height =
          Math.round(
            (selectionDimensions.height + strokeWidth) / snapRowSpace,
          ) * snapRowSpace;

        if (width !== rectWidth) {
          if (width > rectWidth) {
            direction = ReflowDirection.RIGHT;
          } else {
            direction = ReflowDirection.LEFT;
          }
          rectWidth = width;
        }

        if (height !== rectHeight) {
          if (height > rectHeight) {
            direction = ReflowDirection.BOTTOM;
          } else {
            direction = ReflowDirection.TOP;
          }
          rectHeight = height;
        }

        return direction;
      };

      const drawRectangle = (selectionDimensions: SelectedArenaDimensions) => {
        if (stickyCanvasRef.current) {
          const strokeWidth = 1;
          const topOffset = getAbsolutePixels(
            stickyCanvasRef.current.style.top,
          );
          const leftOffset = getAbsolutePixels(
            stickyCanvasRef.current.style.left,
          );

          if (isDrawingModeEnabled) {
            const direction = getReflowDirection(selectionDimensions);
            directionRef.current = direction;
            const values = drawWidgetDimensions();

            const { bottom, columns, leftColumn, right, rows, topRow } = values;

            if (direction !== ReflowDirection.UNSET && reflow.current) {
              const resizedPositions = [
                {
                  left: leftColumn,
                  right,
                  top: topRow,
                  bottom,
                  id: "1",
                  parentId: widgetId,
                },
              ];

              const { movementLimitMap } = reflow.current(
                resizedPositions,
                direction,
              );

              canvasCtx.strokeStyle = "#768896";
              canvasCtx.fillStyle = "white";

              if (movementLimitMap) {
                const { canHorizontalMove, canVerticalMove } = movementLimitMap[
                  "1"
                ];

                if (!canHorizontalMove) {
                  const rectangleDimensions = {
                    x: rectRef.current.x,
                    y: topRow * snapRowSpace + CONTAINER_GRID_PADDING,
                    width: rectRef.current.width,
                    height: rows * snapRowSpace,
                  };

                  canvasCtx.strokeRect(
                    rectangleDimensions.x,
                    rectangleDimensions.y,
                    rectangleDimensions.width,
                    rectangleDimensions.height,
                  );

                  rectRef.current = rectangleDimensions;
                  return;
                }

                if (!canVerticalMove) {
                  const rectangleDimensions = {
                    x: leftColumn * snapColumnSpace + CONTAINER_GRID_PADDING,
                    y: rectRef.current.y,
                    width: columns * snapColumnSpace,
                    height: rectRef.current.height,
                  };

                  canvasCtx.strokeRect(
                    rectangleDimensions.x,
                    rectangleDimensions.y,
                    rectangleDimensions.width,
                    rectangleDimensions.height,
                  );

                  rectRef.current = rectangleDimensions;
                  return;
                }
              }

              const rectangleDimensions = {
                x: leftColumn * snapColumnSpace + CONTAINER_GRID_PADDING,
                y: topRow * snapRowSpace + CONTAINER_GRID_PADDING,
                width: columns * snapColumnSpace,
                height: rows * snapRowSpace,
              };

              canvasCtx.strokeRect(
                rectangleDimensions.x,
                rectangleDimensions.y,
                rectangleDimensions.width,
                rectangleDimensions.height,
              );

              drawWidgetValues.current = { ...values };
              rectRef.current = rectangleDimensions;
            }
          } else {
            canvasCtx.setLineDash([5]);
            canvasCtx.strokeStyle = "rgba(125,188,255,1)";
            canvasCtx.strokeRect(
              selectionDimensions.left - strokeWidth - leftOffset,
              selectionDimensions.top - strokeWidth - topOffset,
              selectionDimensions.width + 2 * strokeWidth,
              selectionDimensions.height + 2 * strokeWidth,
            );
            canvasCtx.fillStyle = "rgb(84, 132, 236, 0.06)";
            canvasCtx.fillRect(
              selectionDimensions.left - leftOffset,
              selectionDimensions.top - topOffset,
              selectionDimensions.width,
              selectionDimensions.height,
            );
          }
        }
      };

      const onMouseLeave = () => {
        document.body.addEventListener("mouseup", onMouseUp, false);
        document.body.addEventListener("click", onClick, false);
      };

      const onMouseEnter = (e: any) => {
        if (
          slidingArenaRef.current &&
          !isDragging &&
          drawOnEnterObj?.current.canDraw
        ) {
          firstRender(e, !isDrawingModeEnabled);
          drawOnEnterObj.current = defaultDrawOnObj;
        } else {
          document.body.removeEventListener("mouseup", onMouseUp);
          document.body.removeEventListener("click", onClick);
        }
      };

      const onClick = (e: any) => {
        if (
          Math.abs(selectionRectangle.height) +
            Math.abs(selectionRectangle.width) >
          0
        ) {
          if (!isDragging) {
            // cant set this in onMouseUp coz click seems to happen after onMouseUp.
            selectionRectangle = initRectangle();
          }
          e.stopPropagation();
        }
      };

      const startPositionsForOutCanvasSelection = () => {
        const startPoints = drawOnEnterObj.current.startPoints;
        const startPositions = {
          top: 0,
          left: 0,
        };
        if (slidingArenaRef.current && startPoints) {
          const {
            height,
            left,
            top,
            width,
          } = slidingArenaRef.current.getBoundingClientRect();
          const outOfMaxBounds = {
            x: startPoints.x < left + width,
            y: startPoints.y < top + height,
          };
          const outOfMinBounds = {
            x: startPoints.x > left,
            y: startPoints.y > top,
          };
          const xInRange = outOfMaxBounds.x && outOfMinBounds.x;
          const yInRange = outOfMaxBounds.y && outOfMinBounds.y;
          const bufferFromBoundary = 2;
          startPositions.left = xInRange
            ? startPoints.x - left
            : outOfMinBounds.x
            ? width - bufferFromBoundary
            : bufferFromBoundary;
          startPositions.top = yInRange
            ? startPoints.y - top
            : outOfMinBounds.y
            ? height - bufferFromBoundary
            : bufferFromBoundary;
        }
        return startPositions;
      };

      const firstRender = (e: any, fromOuterCanvas = false) => {
        if (slidingArenaRef.current && stickyCanvasRef.current && !isDragging) {
          isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
          if (fromOuterCanvas) {
            const { left, top } = startPositionsForOutCanvasSelection();
            selectionRectangle.left = left;
            selectionRectangle.top = top;
          } else {
            selectionRectangle.left =
              e.offsetX - slidingArenaRef.current.offsetLeft;
            selectionRectangle.top =
              e.offsetY - slidingArenaRef.current.offsetTop;
          }
          selectionRectangle.width = 0;
          selectionRectangle.height = 0;
          isDragging = true;
          // bring the canvas to the top layer
          stickyCanvasRef.current.style.zIndex = "2";
          slidingArenaRef.current.style.zIndex = "2";
          if (!isDrawingModeEnabled) {
            slidingArenaRef.current.style.cursor = "default";
          }
        }
      };

      const onMouseDown = (e: any) => {
        const isNotRightClick = !(e.which === 3 || e.button === 2);
        if (
          isNotRightClick &&
          slidingArenaRef.current &&
          (!isDraggableParent || e.ctrlKey || e.metaKey || isDrawingModeEnabled)
        ) {
          dispatch(setCanvasSelectionStateAction(true, widgetId));

          firstRender(e);
        }
      };

      let isDrawing = false;

      const onMouseUp = () => {
        if (isDragging && slidingArenaRef.current && stickyCanvasRef.current) {
          isDragging = false;
          canvasCtx.clearRect(
            0,
            0,
            stickyCanvasRef.current.width,
            stickyCanvasRef.current.height,
          );
          stickyCanvasRef.current.style.zIndex = "";
          slidingArenaRef.current.style.zIndex = "";
          slidingArenaRef.current.style.cursor = "";

          // Draw Widget on the Canvas
          if (isDrawingModeEnabled && isDrawing) {
            const {
              columns,
              leftColumn,
              rows,
              topRow,
            } = drawWidgetValues.current;

            dispatch(
              drawWidget({
                rows,
                columns,
                topRow,
                leftColumn,
                widgetId,
                snapColumnSpace,
                snapRowSpace,
              }),
            );
            isDrawing = false;
          }
          dispatch(setCanvasSelectionStateAction(false, widgetId));
        }
      };
      const onMouseMove = (e: any) => {
        if (isDragging && slidingArenaRef.current && stickyCanvasRef.current) {
          isDrawing = true;
          selectionRectangle.width =
            e.offsetX -
            slidingArenaRef.current.offsetLeft -
            selectionRectangle.left;
          selectionRectangle.height =
            e.offsetY -
            slidingArenaRef.current.offsetTop -
            selectionRectangle.top;
          canvasCtx.clearRect(
            0,
            0,
            stickyCanvasRef.current.width,
            stickyCanvasRef.current.height,
          );
          const selectionDimensions = getSelectionDimensions();
          drawRectangle(selectionDimensions);
          if (!isDrawingModeEnabled) {
            selectWidgetsInit(selectionDimensions, isMultiSelect);
          }
          scrollObj.lastMouseMoveEvent = e;
          scrollObj.lastScrollTop = scrollParent?.scrollTop;
          scrollObj.lastScrollHeight = scrollParent?.scrollHeight;
        }
      };
      const onScroll = () => {
        const {
          lastMouseMoveEvent,
          lastScrollHeight,
          lastScrollTop,
        } = scrollObj;
        if (
          lastMouseMoveEvent &&
          Number.isInteger(lastScrollHeight) &&
          Number.isInteger(lastScrollTop) &&
          scrollParent
        ) {
          const delta =
            scrollParent?.scrollHeight +
            scrollParent?.scrollTop -
            (lastScrollHeight + lastScrollTop);
          onMouseMove({
            offsetX: lastMouseMoveEvent.offsetX,
            offsetY: lastMouseMoveEvent.offsetY + delta,
          });
        }
      };

      const addEventListeners = () => {
        slidingArenaRef.current?.addEventListener("click", onClick, false);
        slidingArenaRef.current?.addEventListener(
          "mousedown",
          onMouseDown,
          false,
        );
        slidingArenaRef.current?.addEventListener("mouseup", onMouseUp, false);
        slidingArenaRef.current?.addEventListener(
          "mousemove",
          onMouseMove,
          false,
        );
        slidingArenaRef.current?.addEventListener(
          "mouseleave",
          onMouseLeave,
          false,
        );
        slidingArenaRef.current?.addEventListener(
          "mouseenter",
          onMouseEnter,
          false,
        );
        scrollParent?.addEventListener("scroll", onScroll, false);
      };
      const removeEventListeners = () => {
        slidingArenaRef.current?.removeEventListener("mousedown", onMouseDown);
        slidingArenaRef.current?.removeEventListener("mouseup", onMouseUp);
        slidingArenaRef.current?.removeEventListener("mousemove", onMouseMove);
        slidingArenaRef.current?.removeEventListener(
          "mouseleave",
          onMouseLeave,
        );
        slidingArenaRef.current?.removeEventListener(
          "mouseenter",
          onMouseEnter,
        );
        slidingArenaRef.current?.removeEventListener("click", onClick);
        scrollParent?.removeEventListener("scroll", onScroll);
      };
      const init = () => {
        if (
          scrollParent &&
          stickyCanvasRef.current &&
          slidingArenaRef.current
        ) {
          removeEventListeners();
          addEventListeners();
        }
      };
      if (appMode === APP_MODE.EDIT) {
        init();
      }
      return () => {
        removeEventListeners();
      };
    }
  }, [
    appLayout,
    currentPageId,
    dropDisabled,
    mainContainer,
    isDragging,
    isDrawingModeEnabled,
    isResizing,
    snapRows,
    snapColumnSpace,
    snapRowSpace,
  ]);

  const shouldShow =
    appMode === APP_MODE.EDIT && !(isDragging || isPreviewMode || dropDisabled);

  return {
    shouldShow,
  };
};
