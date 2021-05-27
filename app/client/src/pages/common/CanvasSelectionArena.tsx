import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { debounce } from "lodash";
import React, { memo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getWidget } from "sagas/selectors";
import {
  getCurrentApplicationLayout,
  getCurrentPageId,
} from "selectors/editorSelectors";
import styled from "styled-components";

const StyledSelectionCanvas = styled.canvas`
  position: absolute;
  top: 0px;
  left: 0px;
  height: calc(100% + 200px);
  width: 100%;
  overflow-y: auto;
`;

export interface SelectedArenaDimensions {
  top: number;
  left: number;
  width: number;
  height: number;
}

const selectAllWidgetsInAction = (
  arenaProps: SelectedArenaDimensions,
): ReduxAction<any> => {
  return {
    type: ReduxActionTypes.SELECT_WIDGETS_IN_AREA,
    payload: arenaProps,
  };
};

export const CanvasSelectionArena = memo(
  ({ widgetId }: { widgetId: string }) => {
    const dispatch = useDispatch();
    const canvasRef = useRef<HTMLDivElement>(null);
    const mainContainer = useSelector((state: AppState) =>
      getWidget(state, MAIN_CONTAINER_WIDGET_ID),
    );
    const currentPageId = useSelector(getCurrentPageId);
    const appLayout = useSelector(getCurrentApplicationLayout);
    useEffect(() => {
      const canvas: any = document.getElementById(`canvas-${widgetId}`);
      // const canvascontaner: any = document.getElementById(`canvas-container`);
      const { height, width } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      const rect: SelectedArenaDimensions = {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      };

      let drag = false;

      function init() {
        canvas.addEventListener(
          "click",
          (e: any) => {
            if (Math.abs(rect.height) + Math.abs(rect.width) > 0) {
              e.stopPropagation();
            }
          },
          false,
        );
        canvas.addEventListener("mousedown", mouseDown, false);
        canvas.addEventListener("mouseup", mouseUp, false);
        canvas.addEventListener("mousemove", mouseMove, false);
        canvas.addEventListener("mouseleave", onMouseLeave, false);
        canvas.addEventListener("mouseenter", onMouseEnter, false);
      }

      function onMouseLeave() {
        document.body.addEventListener("mouseup", mouseUp, false);
      }

      function onMouseEnter() {
        document.body.removeEventListener("mouseup", mouseUp);
      }

      function mouseDown(e: any) {
        rect.left = e.offsetX - canvas.offsetLeft;
        rect.top = e.offsetY - canvas.offsetTop;
        rect.width = 0;
        rect.height = 0;
        drag = true;
        canvas.style.zIndex = 2;
      }

      const selectWidgets = debounce(() => {
        const selectionDimensions = {
          top: rect.height < 0 ? rect.top - Math.abs(rect.height) : rect.top,
          left: rect.width < 0 ? rect.left - Math.abs(rect.width) : rect.left,
          width: Math.abs(rect.width),
          height: Math.abs(rect.height),
        };
        dispatch(selectAllWidgetsInAction(selectionDimensions));
      });
      function mouseUp(e: any) {
        if (drag) {
          drag = false;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.style.zIndex = null;
          if (rect.left && rect.top && rect.width && rect.height) {
            selectWidgets();
          }
        }
      }
      function mouseMove(e: any) {
        if (drag) {
          rect.width = e.offsetX - canvas.offsetLeft - rect.left;
          rect.height = e.offsetY - canvas.offsetTop - rect.top;
          // const canvasSelectedHeight =
          //   e.offsetY - canvas.offsetTop + rect.height;
          // const scrolledHeight =
          //   canvascontaner.scrollTop + canvascontaner.clientHeight;
          // if (canvasSelectedHeight > scrolledHeight) {
          //   canvascontaner.scrollTo({
          //     top: canvascontaner.scrollTop + 15,
          //     behavior: "smooth",
          //   });
          // }
          // if (
          //   canvascontaner.scrollTop &&
          //   e.offsetY - canvas.offsetTop - (rect.height + 20) <
          //     canvascontaner.scrollTop - canvascontaner.clientHeight
          // ) {
          //   canvascontaner.scrollTo({
          //     top: canvascontaner.scrollTop - 40,
          //     behavior: "smooth",
          //   });
          // }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          draw();
        }
      }

      function draw() {
        const selectionDimensions = {
          top: rect.height < 0 ? rect.top - Math.abs(rect.height) : rect.top,
          left: rect.width < 0 ? rect.left - Math.abs(rect.width) : rect.left,
          width: Math.abs(rect.width),
          height: Math.abs(rect.height),
        };
        ctx.setLineDash([5]);
        ctx.strokeStyle = "rgb(84, 132, 236)";
        ctx.strokeRect(
          selectionDimensions.left - 1,
          selectionDimensions.top - 1,
          selectionDimensions.width + 2,
          selectionDimensions.height + 2,
        );
        ctx.fillStyle = "rgb(84, 132, 236, 0.06)";
        ctx.fillRect(
          selectionDimensions.left,
          selectionDimensions.top,
          selectionDimensions.width,
          selectionDimensions.height,
        );
        if (rect.left && rect.top && rect.width && rect.height) {
          selectWidgets();
        }
      }

      init();
    }, [
      appLayout,
      currentPageId,
      mainContainer.rightColumn,
      mainContainer.bottomRow,
    ]);

    return (
      <div ref={canvasRef} style={{ overflow: "scroll" }}>
        <StyledSelectionCanvas id={`canvas-${widgetId}`} />
      </div>
    );
  },
);
CanvasSelectionArena.displayName = "CanvasSelectionArena";
