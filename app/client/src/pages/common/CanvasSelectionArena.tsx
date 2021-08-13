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
  draggableParent,
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
}: {
  canExtend: boolean;
  draggableParent: boolean;
  snapColumnSpace: number;
  widgetId: string;
  snapRows: number;
  snapRowSpace: number;
}) {
  const dispatch = useDispatch();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

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
    [widgetId],
  );
  const isDraggingForSelection = useSelector((state: AppState) => {
    return state.ui.canvasSelection.isDraggingForSelection;
  });
  const isCurrentWidgetDrawing = useSelector((state: AppState) => {
    return state.ui.canvasSelection.widgetId === widgetId;
  });
  const drawOnEnter = useRef(false);
  useEffect(() => {
    drawOnEnter.current = isDraggingForSelection && isCurrentWidgetDrawing;
  }, [isDraggingForSelection, isCurrentWidgetDrawing]);
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

      const init = () => {
        if (canvasRef.current) {
          const { height, width } = canvasRef.current.getBoundingClientRect();
          if (height && width) {
            canvasRef.current.width = width * scale;
            canvasRef.current.height =
              (snapRows * snapRowSpace + (widgetId === "0" ? 200 : 0)) * scale;
          }
          canvasCtx = canvasRef.current.getContext("2d");
          canvasCtx.scale(scale, scale);
          canvasRef.current.addEventListener("click", onClick, false);
          canvasRef.current.addEventListener("mousedown", onMouseDown, false);
          canvasRef.current.addEventListener("mouseup", onMouseUp, false);
          canvasRef.current.addEventListener("mousemove", onMouseMove, false);
          canvasRef.current.addEventListener("mouseleave", onMouseLeave, false);
          canvasRef.current.addEventListener("mouseenter", onMouseEnter, false);
          scrollParent?.addEventListener("scroll", onScroll, false);
        }
      };

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
        document.body.addEventListener("mouseup", onMouseUp, false);
        document.body.addEventListener("click", onClick, false);
      };

      const onMouseEnter = (e: any) => {
        if (canvasRef.current && !isDragging && drawOnEnter.current) {
          firstDraw(e);
          drawOnEnter.current = false;
        }
        document.body.removeEventListener("mouseup", onMouseUp);
        document.body.removeEventListener("click", onClick);
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

      const determineDirection = (pos: any) => {
        if (canvasRef.current) {
          const bounds = canvasRef.current.getBoundingClientRect();
          const w = bounds.width,
            h = bounds.height,
            x = (pos.x - bounds.left - w / 2) * (w > h ? h / w : 1),
            y = (pos.y - bounds.top - h / 2) * (h > w ? w / h : 1);

          return (
            Math.round((Math.atan2(y, x) * (180 / Math.PI) + 180) / 90 + 3) % 4
          );
        }
      };

      const firstDraw = (e: any) => {
        if (canvasRef.current) {
          console.log(determineDirection({ x: e.clientX, y: e.clientY }));
          isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
          selectionRectangle.left = e.offsetX - canvasRef.current.offsetLeft;
          selectionRectangle.top = e.offsetY - canvasRef.current.offsetTop;
          selectionRectangle.width = 0;
          selectionRectangle.height = 0;
          isDragging = true;
          // bring the canvas to the top layer
          canvasRef.current.style.zIndex = "2";
        }
      };

      const onMouseDown = (e: any) => {
        if (canvasRef.current && (!draggableParent || e.ctrlKey || e.metaKey)) {
          dispatch(setCanvasSelectionStateAction(true, widgetId));
          firstDraw(e);
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
      if (appMode === APP_MODE.EDIT) {
        init();
      }
      return () => {
        canvasRef.current?.removeEventListener("mousedown", onMouseDown);
        canvasRef.current?.removeEventListener("mouseup", onMouseUp);
        canvasRef.current?.removeEventListener("mousemove", onMouseMove);
        canvasRef.current?.removeEventListener("mouseleave", onMouseLeave);
        canvasRef.current?.removeEventListener("mouseenter", onMouseEnter);
        canvasRef.current?.removeEventListener("click", onClick);
      };
    }
  }, [appLayout, currentPageId, mainContainer, isDragging, snapRows]);

  return appMode === APP_MODE.EDIT && !(isDragging || isResizing) ? (
    <StyledSelectionCanvas
      data-testid={`canvas-${widgetId}`}
      id={`canvas-${widgetId}`}
      ref={canvasRef}
    />
  ) : null;
}
CanvasSelectionArena.displayName = "CanvasSelectionArena";
