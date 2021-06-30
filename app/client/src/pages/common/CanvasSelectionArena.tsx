import {
  selectAllWidgetsInAreaAction,
  setCanvasSelectionStateAction,
} from "actions/canvasSelectionActions";
import { theme } from "constants/DefaultTheme";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { throttle } from "lodash";
import React, { memo, useEffect, useCallback } from "react";
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
  height: calc(100% + ${(props) => props.theme.canvasBottomPadding}px);
  width: 100%;
  overflow-y: auto;
`;

export interface SelectedArenaDimensions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const CanvasSelectionArena = memo(
  ({ widgetId }: { widgetId: string }) => {
    const dispatch = useDispatch();
    const appMode = useSelector(getAppMode);

    const mainContainer = useSelector((state: AppState) =>
      getWidget(state, MAIN_CONTAINER_WIDGET_ID),
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
      if (appMode === APP_MODE.EDIT) {
        const selectionCanvas: any = document.getElementById(
          `canvas-${widgetId}`,
        );
        const canvasCtx = selectionCanvas.getContext("2d");
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
          const { height, width } = selectionCanvas.getBoundingClientRect();
          if (height && width) {
            selectionCanvas.width = mainContainer.rightColumn;
            selectionCanvas.height =
              mainContainer.bottomRow + theme.canvasBottomPadding;
          }
          selectionCanvas.addEventListener("click", onClick, false);
          selectionCanvas.addEventListener("mousedown", onMouseDown, false);
          selectionCanvas.addEventListener("mouseup", onMouseUp, false);
          selectionCanvas.addEventListener("mousemove", onMouseMove, false);
          selectionCanvas.addEventListener("mouseleave", onMouseLeave, false);
          selectionCanvas.addEventListener("mouseenter", onMouseEnter, false);
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

        const drawRectangle = (
          selectionDimensions: SelectedArenaDimensions,
        ) => {
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
          isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
          selectionRectangle.left = e.offsetX - selectionCanvas.offsetLeft;
          selectionRectangle.top = e.offsetY - selectionCanvas.offsetTop;
          selectionRectangle.width = 0;
          selectionRectangle.height = 0;
          isDragging = true;
          dispatch(setCanvasSelectionStateAction(true));
          // bring the canvas to the top layer
          selectionCanvas.style.zIndex = 2;
        };
        const onMouseUp = () => {
          if (isDragging) {
            isDragging = false;
            canvasCtx.clearRect(
              0,
              0,
              selectionCanvas.width,
              selectionCanvas.height,
            );
            selectionCanvas.style.zIndex = null;
            dispatch(setCanvasSelectionStateAction(false));
          }
        };
        const onMouseMove = (e: any) => {
          if (isDragging) {
            selectionRectangle.width =
              e.offsetX - selectionCanvas.offsetLeft - selectionRectangle.left;
            selectionRectangle.height =
              e.offsetY - selectionCanvas.offsetTop - selectionRectangle.top;
            canvasCtx.clearRect(
              0,
              0,
              selectionCanvas.width,
              selectionCanvas.height,
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
          selectionCanvas.removeEventListener("mousedown", onMouseDown);
          selectionCanvas.removeEventListener("mouseup", onMouseUp);
          selectionCanvas.removeEventListener("mousemove", onMouseMove);
          selectionCanvas.removeEventListener("mouseleave", onMouseLeave);
          selectionCanvas.removeEventListener("mouseenter", onMouseEnter);
          selectionCanvas.removeEventListener("click", onClick);
        };
      }
    }, [
      appLayout,
      currentPageId,
      mainContainer.rightColumn,
      mainContainer.bottomRow,
      mainContainer.minHeight,
    ]);

    return appMode === APP_MODE.EDIT ? (
      <StyledSelectionCanvas
        data-testid={`canvas-${widgetId}`}
        id={`canvas-${widgetId}`}
      />
    ) : null;
  },
);
CanvasSelectionArena.displayName = "CanvasSelectionArena";
