import {
  selectAllWidgetsInAreaAction,
  setCanvasSelectionStateAction,
} from "actions/canvasSelectionActions";
import { throttle } from "lodash";
import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { APP_MODE } from "reducers/entityReducers/appReducer";
import { getWidget } from "sagas/selectors";
import { getAppMode } from "selectors/applicationSelectors";
import {
  getCurrentApplicationLayout,
  getCurrentPageId,
} from "selectors/editorSelectors";
import styled from "styled-components";

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
  snapRows,
  snapRowSpace,
  widgetId,
}: {
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
  useEffect(() => {
    if (appMode === APP_MODE.EDIT && !isDragging && canvasRef.current) {
      const { devicePixelRatio: scale = 1 } = window;

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
        canvasCtx.strokeStyle = "rgb(84, 132, 236)";
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

      const onMouseEnter = () => {
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

      const onMouseDown = (e: any) => {
        if (canvasRef.current && (widgetId === "0" || e.ctrlKey || e.metaKey)) {
          isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
          selectionRectangle.left = e.offsetX - canvasRef.current.offsetLeft;
          selectionRectangle.top = e.offsetY - canvasRef.current.offsetTop;
          selectionRectangle.width = 0;
          selectionRectangle.height = 0;
          isDragging = true;
          dispatch(setCanvasSelectionStateAction(true, widgetId));
          // bring the canvas to the top layer
          canvasRef.current.style.zIndex = "2";
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
  }, [
    appLayout,
    currentPageId,
    mainContainer,
    isDragging,
    snapRows,
    // mainContainer.minHeight,
  ]);

  return appMode === APP_MODE.EDIT && !isDragging ? (
    <StyledSelectionCanvas
      data-testid={`canvas-${widgetId}`}
      id={`canvas-${widgetId}`}
      ref={canvasRef}
    />
  ) : null;
}
CanvasSelectionArena.displayName = "CanvasSelectionArena";
