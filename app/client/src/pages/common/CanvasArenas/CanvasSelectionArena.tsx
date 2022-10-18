import {
  drawWidget,
  selectAllWidgetsInAreaAction,
  setCanvasSelectionStateAction,
} from "actions/canvasSelectionActions";
import { throttle } from "lodash";
import React, { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import { APP_MODE } from "entities/App";
import { getWidget } from "sagas/selectors";
import { getAppMode } from "selectors/applicationSelectors";
import {
  getCurrentApplicationLayout,
  getCurrentPageId,
  previewModeSelector,
} from "selectors/editorSelectors";
import { getNearestParentCanvas } from "utils/generators";
import { useCanvasDragToScroll } from "./hooks/useCanvasDragToScroll";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { XYCord } from "./hooks/useCanvasDragging";
import { theme } from "constants/DefaultTheme";
import { getIsDraggingForSelection } from "selectors/canvasSelectors";
import { StickyCanvasArena } from "./StickyCanvasArena";
import { getAbsolutePixels, getSnappedXY } from "utils/helpers";
import {
  getSlidingCanvasName,
  getStickyCanvasName,
} from "constants/componentClassNameConstants";
import { ReflowInterface, useReflow } from "utils/hooks/useReflow";
import { ReflowDirection } from "reflow/reflowTypes";

export interface SelectedArenaDimensions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function CanvasSelectionArena({
  canExtend,
  dropDisabled,
  parentId,
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
}: {
  canExtend: boolean;
  dropDisabled: boolean;
  parentId?: string;
  snapColumnSpace: number;
  widgetId: string;
  snapRows: number;
  snapRowSpace: number;
}) {
  const dispatch = useDispatch();
  const canvasPadding =
    widgetId === MAIN_CONTAINER_WIDGET_ID ? theme.canvasBottomPadding : 0;
  const slidingArenaRef = React.useRef<HTMLDivElement>(null);
  const stickyCanvasRef = React.useRef<HTMLCanvasElement>(null);

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

  const reflow = useRef<ReflowInterface>();
  reflow.current = useReflow(draggingSpaces, widgetId || "", gridProps);

  const throttledWidgetSelection = useCallback(
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
  const drawOnEnterObj = useRef<{
    canDraw: boolean;
    startPoints?: XYCord;
  }>(defaultDrawOnObj);

  // start main container selection from widget editor
  useEffect(() => {
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
  useEffect(() => {
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

      let rectWidth = 0,
        rectHeight = 0;

      const triggerReflow = (selectionDimensions: SelectedArenaDimensions) => {
        const strokeWidth = 1;
        let direction: ReflowDirection = ReflowDirection.UNSET;

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
          canvasCtx.setLineDash([5]);
          canvasCtx.strokeStyle = "rgba(125,188,255,1)";

          const snappedXY = getSnappedXY(
            snapColumnSpace,
            snapRowSpace,
            {
              x: selectionDimensions.left,
              y: selectionDimensions.top,
            },
            {
              x: 0,
              y: 0,
            },
          );

          if (isDrawingModeEnabled) {
            const direction = triggerReflow(selectionDimensions);

            canvasCtx.strokeRect(
              snappedXY.X - leftOffset - strokeWidth - CONTAINER_GRID_PADDING,
              snappedXY.Y - topOffset - strokeWidth - CONTAINER_GRID_PADDING,

              rectWidth,
              rectHeight,
            );

            if (direction !== ReflowDirection.UNSET && reflow.current) {
              const topRow = Math.floor(selectionDimensions.top / snapRowSpace);
              const leftColumn = Math.floor(
                selectionDimensions.left / snapColumnSpace,
              );
              const resizedPositions = [
                {
                  left: leftColumn,
                  right: Math.floor(
                    leftColumn + selectionDimensions.width / snapColumnSpace,
                  ),
                  top: topRow,
                  bottom: Math.floor(
                    topRow + selectionDimensions.height / snapRowSpace,
                  ),
                  id: "1",
                  parentId: widgetId,
                },
              ];

              console.log("REFLOW DIRECTION", direction);
              console.log("REFLOW RESIZED POSITION", resizedPositions);
              const {
                isIdealToJumpContainer,
                movementLimitMap,
              } = reflow.current(resizedPositions, direction);
            }
          } else {
            canvasCtx.strokeRect(
              selectionDimensions.left - strokeWidth - leftOffset,
              selectionDimensions.top - strokeWidth - topOffset,
              selectionDimensions.width + 2 * strokeWidth,
              selectionDimensions.height + 2 * strokeWidth,
            );
          }
          canvasCtx.fillStyle = "rgb(84, 132, 236, 0.06)";
          canvasCtx.fillRect(
            selectionDimensions.left - leftOffset,
            selectionDimensions.top - topOffset,
            selectionDimensions.width,
            selectionDimensions.height,
          );
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
          firstRender(e, true);
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
          (!isDraggableParent || e.ctrlKey || e.metaKey)
        ) {
          dispatch(setCanvasSelectionStateAction(true, widgetId));

          firstRender(e);
        }
      };

      let isDrawing = false;

      const onMouseUp = () => {
        if (isDragging && slidingArenaRef.current && stickyCanvasRef.current) {
          isDragging = false;
          const { height, left, top, width } = getSelectionDimensions();
          canvasCtx.clearRect(
            0,
            0,
            stickyCanvasRef.current.width,
            stickyCanvasRef.current.height,
          );
          stickyCanvasRef.current.style.zIndex = "";
          slidingArenaRef.current.style.zIndex = "";
          slidingArenaRef.current.style.cursor = "";
          if (isDrawingModeEnabled && isDrawing) {
            const rows = Math.floor(height / snapRowSpace);
            const topRow = Math.floor(top / snapRowSpace);

            const columns = Math.floor(width / snapColumnSpace);
            const leftColumn = Math.floor(left / snapColumnSpace);
            dispatch(
              drawWidget({
                rows,
                columns,
                topRow,
                leftColumn,
                widgetId,
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

  // Resizing state still shows selection arena to aid with scroll behavior

  const shouldShow =
    appMode === APP_MODE.EDIT && !(isDragging || isPreviewMode || dropDisabled);

  const canvasRef = React.useRef({
    slidingArenaRef,
    stickyCanvasRef,
  });
  return shouldShow ? (
    <StickyCanvasArena
      canExtend={canExtend}
      canvasId={getSlidingCanvasName(widgetId)}
      canvasPadding={canvasPadding}
      getRelativeScrollingParent={getNearestParentCanvas}
      id={getStickyCanvasName(widgetId)}
      ref={canvasRef}
      showCanvas={shouldShow}
      snapColSpace={snapColumnSpace}
      snapRowSpace={snapRowSpace}
      snapRows={snapRows}
    />
  ) : null;
}
CanvasSelectionArena.displayName = "CanvasSelectionArena";
