import {
  selectAllWidgetsInAreaAction,
  setCanvasSelectionStateAction,
} from "actions/canvasSelectionActions";
import { throttle } from "lodash";
import React, { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { APP_MODE } from "entities/App";
import { getWidget } from "sagas/selectors";
import { getAppMode } from "selectors/applicationSelectors";
import {
  getCurrentApplicationLayout,
  getCurrentPageId,
} from "selectors/editorSelectors";
import styled from "styled-components";
import { getNearestParentCanvas } from "utils/generators";
import { useCanvasDragToScroll } from "utils/hooks/useCanvasDragToScroll";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { XYCord } from "utils/hooks/useCanvasDragging";
import { theme } from "constants/DefaultTheme";
import { commentModeSelector } from "../../selectors/commentsSelectors";

const StyledSelectionCanvas = styled.canvas`
  position: absolute;
  top: 0px;
  left: 0px;
  height: calc(
    100% +
      ${(props) =>
        props.id === "canvas-0" ? props.theme.canvasBottomPadding : 0}px
  );
  width: 100%;
  overflow-y: auto;
`;

export interface SelectedArenaDimensions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function CanvasSelectionArena({
  canExtend,
  parentId,
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
}: {
  canExtend: boolean;
  parentId?: string;
  snapColumnSpace: number;
  widgetId: string;
  snapRows: number;
  snapRowSpace: number;
}) {
  const dispatch = useDispatch();
  const isCommentMode = useSelector(commentModeSelector);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const parentWidget = useSelector((state: AppState) =>
    getWidget(state, parentId || ""),
  );
  const isDraggableParent = !(
    widgetId === MAIN_CONTAINER_WIDGET_ID ||
    (parentWidget && parentWidget.detachFromLayout)
  );
  const appMode = useSelector(getAppMode);
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const mainContainer = useSelector((state: AppState) =>
    getWidget(state, widgetId),
  );
  const currentPageId = useSelector(getCurrentPageId);
  const appLayout = useSelector(getCurrentApplicationLayout);
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
  const isDraggingForSelection = useSelector((state: AppState) => {
    return state.ui.canvasSelection.isDraggingForSelection;
  });
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
    if (canvasRef.current && canDrawOnEnter) {
      canvasRef.current.style.zIndex = "2";
    }
  }, [
    isDraggingForSelection,
    isCurrentWidgetDrawing,
    outOfCanvasStartPositions,
  ]);

  useCanvasDragToScroll(
    canvasRef,
    isCurrentWidgetDrawing,
    isDraggingForSelection,
    snapRows,
    canExtend,
  );
  useEffect(() => {
    if (appMode === APP_MODE.EDIT && !isDragging && canvasRef.current) {
      // ToDo: Needs a repositioning canvas window to limit the highest number of pixels rendered for an application of any height.
      // as of today (Pixels rendered by canvas) ∝ (Application height) so as height increases will run into to dead renders.
      // https://on690.codesandbox.io/ to check the number of pixels limit supported for a canvas
      // const { devicePixelRatio: scale = 1 } = window;

      const scale = 1;
      const scrollParent: Element | null = getNearestParentCanvas(
        canvasRef.current,
      );
      const scrollObj: any = {};
      let canvasCtx: any = canvasRef.current.getContext("2d");
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

      const drawRectangle = (selectionDimensions: SelectedArenaDimensions) => {
        const strokeWidth = 1;
        canvasCtx.setLineDash([5]);
        canvasCtx.strokeStyle = "rgba(125,188,255,1)";
        canvasCtx.strokeRect(
          selectionDimensions.left - strokeWidth,
          selectionDimensions.top - strokeWidth,
          selectionDimensions.width + 2 * strokeWidth,
          selectionDimensions.height + 2 * strokeWidth,
        );
        canvasCtx.fillStyle = "rgb(84, 132, 236, 0.06)";
        canvasCtx.fillRect(
          selectionDimensions.left,
          selectionDimensions.top,
          selectionDimensions.width,
          selectionDimensions.height,
        );
      };

      const onMouseLeave = () => {
        if (widgetId === MAIN_CONTAINER_WIDGET_ID) {
          document.body.addEventListener("mouseup", onMouseUp, false);
          document.body.addEventListener("click", onClick, false);
        }
      };

      const onMouseEnter = (e: any) => {
        if (
          canvasRef.current &&
          !isDragging &&
          drawOnEnterObj?.current.canDraw
        ) {
          firstRender(e, true);
          drawOnEnterObj.current = defaultDrawOnObj;
        } else if (widgetId === MAIN_CONTAINER_WIDGET_ID) {
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
        if (canvasRef.current && startPoints) {
          const {
            height,
            left,
            top,
            width,
          } = canvasRef.current.getBoundingClientRect();
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
        if (canvasRef.current && !isDragging) {
          isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
          if (fromOuterCanvas) {
            const { left, top } = startPositionsForOutCanvasSelection();
            selectionRectangle.left = left;
            selectionRectangle.top = top;
          } else {
            selectionRectangle.left = e.offsetX - canvasRef.current.offsetLeft;
            selectionRectangle.top = e.offsetY - canvasRef.current.offsetTop;
          }
          selectionRectangle.width = 0;
          selectionRectangle.height = 0;

          isDragging = true;
          // bring the canvas to the top layer
          canvasRef.current.style.zIndex = "2";
        }
      };

      const onMouseDown = (e: any) => {
        if (
          canvasRef.current &&
          (!isDraggableParent || e.ctrlKey || e.metaKey)
        ) {
          dispatch(setCanvasSelectionStateAction(true, widgetId));
          firstRender(e);
        }
      };
      const onMouseUp = () => {
        if (isDragging && canvasRef.current) {
          isDragging = false;
          canvasCtx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height,
          );
          canvasRef.current.style.zIndex = "";
          dispatch(setCanvasSelectionStateAction(false, widgetId));
        }
      };
      const onMouseMove = (e: any) => {
        if (isDragging && canvasRef.current) {
          selectionRectangle.width =
            e.offsetX - canvasRef.current.offsetLeft - selectionRectangle.left;
          selectionRectangle.height =
            e.offsetY - canvasRef.current.offsetTop - selectionRectangle.top;
          canvasCtx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height,
          );
          const selectionDimensions = getSelectionDimensions();
          drawRectangle(selectionDimensions);
          selectWidgetsInit(selectionDimensions, isMultiSelect);
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
        canvasRef.current?.addEventListener("click", onClick, false);
        canvasRef.current?.addEventListener("mousedown", onMouseDown, false);
        canvasRef.current?.addEventListener("mouseup", onMouseUp, false);
        canvasRef.current?.addEventListener("mousemove", onMouseMove, false);
        canvasRef.current?.addEventListener("mouseleave", onMouseLeave, false);
        canvasRef.current?.addEventListener("mouseenter", onMouseEnter, false);
        scrollParent?.addEventListener("scroll", onScroll, false);
      };
      const removeEventListeners = () => {
        canvasRef.current?.removeEventListener("mousedown", onMouseDown);
        canvasRef.current?.removeEventListener("mouseup", onMouseUp);
        canvasRef.current?.removeEventListener("mousemove", onMouseMove);
        canvasRef.current?.removeEventListener("mouseleave", onMouseLeave);
        canvasRef.current?.removeEventListener("mouseenter", onMouseEnter);
        canvasRef.current?.removeEventListener("click", onClick);
      };
      const init = () => {
        if (canvasRef.current) {
          const { height, width } = canvasRef.current.getBoundingClientRect();
          if (height && width) {
            canvasRef.current.width = width * scale;
            canvasRef.current.height =
              (snapRows * snapRowSpace +
                (widgetId === MAIN_CONTAINER_WIDGET_ID
                  ? theme.canvasBottomPadding
                  : 0)) *
              scale;
          }
          canvasCtx = canvasRef.current.getContext("2d");
          canvasCtx.scale(scale, scale);
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
    mainContainer,
    isDragging,
    isResizing,
    snapRows,
    snapColumnSpace,
    snapRowSpace,
  ]);

  const shouldShow =
    appMode === APP_MODE.EDIT && !(isDragging || isResizing || isCommentMode);

  return shouldShow ? (
    <StyledSelectionCanvas
      data-testid={`canvas-${widgetId}`}
      id={`canvas-${widgetId}`}
      ref={canvasRef}
    />
  ) : null;
}
CanvasSelectionArena.displayName = "CanvasSelectionArena";
