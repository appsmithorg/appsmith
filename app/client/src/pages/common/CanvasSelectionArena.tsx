import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import React, { memo, useEffect } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";

const StyledSelectionCanvas = styled.canvas`
  position: absolute;
  top: 0px;
  left: 0px;
  height: calc(100% + 200px);
  width: 100%;
  overflow-y: auto;
`;

interface SelectedArenaDimensions {
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
    useEffect(() => {
      const canvas: any = document.getElementById(`canvas-${widgetId}`);
      const canvascontaner: any = document.getElementById(`canvas-container`);
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
        canvas.addEventListener("mousedown", mouseDown, false);
        canvas.addEventListener("mouseup", mouseUp, false);
        canvas.addEventListener("mousemove", mouseMove, false);
      }

      function mouseDown(e: any) {
        rect.left = e.offsetX - canvas.offsetLeft;
        rect.top = e.offsetY - canvas.offsetTop;
        drag = true;
        canvas.style.zIndex = 2;
      }

      function mouseUp() {
        if (rect.left && rect.top && rect.width && rect.height) {
          dispatch(selectAllWidgetsInAction(rect));
        }
        drag = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.zIndex = null;
      }
      function mouseMove(e: any) {
        if (drag) {
          rect.width = e.offsetX - canvas.offsetLeft - rect.left;
          rect.height = e.offsetY - canvas.offsetTop - rect.top;
          const canvasSelectedHeight =
            e.offsetY - canvas.offsetTop + rect.height;
          const scrolledHeight =
            canvascontaner.scrollTop + canvascontaner.clientHeight;
          if (canvasSelectedHeight > scrolledHeight) {
            canvascontaner.scrollTo({
              top: canvascontaner.scrollTop + 15,
              behavior: "smooth",
            });
          }
          if (
            canvascontaner.scrollTop &&
            e.offsetY - canvas.offsetTop - (rect.height + 20) <
              canvascontaner.scrollTop - canvascontaner.clientHeight
          ) {
            canvascontaner.scrollTo({
              top: canvascontaner.scrollTop - 40,
              behavior: "smooth",
            });
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          draw();
        }
      }

      function draw() {
        ctx.setLineDash([6]);
        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
      }

      init();
    }, [widgetId]);
    return (
      <div style={{ overflow: "scroll" }}>
        <StyledSelectionCanvas id={`canvas-${widgetId}`} />
      </div>
    );
  },
);
CanvasSelectionArena.displayName = "CanvasSelectionArena";
