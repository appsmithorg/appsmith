import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import styled from "styled-components";

const SplitResizer = styled.div`
  position: absolute;
  cursor: col-resize;
  width: 2px;
  height: 100%;
  display: flex;
  z-index: 10;
  background: #ff9b4e;
  align-items: center;
  justify-content: center;
  margin-left: 2px;
  transition: width 300ms ease;
  transition: background 300ms ease;
  &::before {
    position: absolute;
    background: "transparent";
    content: "";
  }
  &:before {
    bottom: 0px;
    top: calc(50% - 12px);
    width: 10px;
    height: 24px;
    background: white;
    border-radius: 5px;
    border: 1px solid #ff9b4e;
  }

  &:hover,
  &:active {
    width: 3px;
    transition: width 300ms ease;
    transition: background 300ms ease;
    &:before {
      background: #ff9b4e;
      border: 1px solid white;
    }
  }
`;

const MIN_SPLIT_RATIO = 0.25;

export function CanvasSplitResizer({
  firstCanvas,
  firstCanvasWidth,
  parentId,
  secondCanvas,
}: {
  firstCanvasWidth: number;
  firstCanvas: string;
  secondCanvas: string;
  parentId: string;
}) {
  const isPreviewMode = useSelector(previewModeSelector);
  const ref = useRef<any>(null);

  const [resizerPosition, setResizerPosition] =
    useState<number>(firstCanvasWidth);

  const dispatch = useDispatch();

  useEffect(() => {
    setResizerPosition(firstCanvasWidth);

    const firstCanvasElement: any = document.querySelector(
      `[data-widgetid='${firstCanvas}']`,
    );
    const secondCanvasElement: any = document.querySelector(
      `[data-widgetid='${secondCanvas}']`,
    );

    firstCanvasElement.style.width = "";
    secondCanvasElement.style.width = "";
  }, [firstCanvasWidth]);

  useEffect(() => {
    const firstCanvasElement: any = document.querySelector(
      `[data-widgetid='${firstCanvas}']`,
    );
    const secondCanvasElement: any = document.querySelector(
      `[data-widgetid='${secondCanvas}']`,
    );

    // The current position of mouse
    let x = 0;
    // let y = 0;

    // The dimension of the element
    let firstWidth = resizerPosition,
      secondWidth = 0;
    //totalWidth = 0;

    let isDragging = false;

    // Handle the mousedown event
    // that's triggered when user drags the resizer
    const mouseDownHandler = function (e: any) {
      // Get the current mouse position
      x = e.clientX;
      // y = e.clientY;

      // Calculate the dimension of element
      const firstStyles = window.getComputedStyle(firstCanvasElement);
      const secondStyles = window.getComputedStyle(secondCanvasElement);
      firstWidth = parseInt(firstStyles.width, 10);
      secondWidth = parseInt(secondStyles.width, 10);

      e.preventDefault();
      e.stopPropagation();

      // Attach the listeners to `document`

      isDragging = true;
    };

    const mouseMoveHandler = function (e: any) {
      if (isDragging) {
        const dx = getDxWithLimits(
          e.clientX - x,
          firstWidth,
          secondWidth,
          MIN_SPLIT_RATIO,
        );

        firstCanvasElement.style.width = `${firstWidth + dx}px`;
        secondCanvasElement.style.width = `${secondWidth - dx}px`;
        ref.current.style.left = `${firstWidth + dx}px`;
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const mouseUpHandler = function (e: any) {
      if (isDragging) {
        mouseMoveHandler(e);
        const totalWidth = firstWidth + secondWidth;
        const dx = getDxWithLimits(
          e.clientX - x,
          firstWidth,
          secondWidth,
          MIN_SPLIT_RATIO,
        );
        dispatch({
          type: ReduxActionTypes.SPLIT_CANVAS,
          payload: {
            canvasSplitType: "2-column-custom",
            parentId: parentId,
            ratios: [
              (firstWidth + dx) / totalWidth,
              (secondWidth - dx) / totalWidth,
            ],
            keepOriginalRatios: false,
          },
        });
      }
      isDragging = false;
    };
    const rightResizer: any = ref.current;
    rightResizer &&
      rightResizer.addEventListener("mousedown", mouseDownHandler);
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);

    return () => {
      rightResizer &&
        rightResizer.removeEventListener("mousedown", mouseDownHandler);
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };
  }, [isPreviewMode]);
  return !isPreviewMode ? (
    <SplitResizer
      className="split-resizer"
      draggable
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      ref={ref}
      style={{
        top: "0",
        height: "100%",
        left: `${resizerPosition}px`,
      }}
    />
  ) : null;
}

function getDxWithLimits(
  dx: number,
  firstWidth: number,
  secondWidth: number,
  minSplitLimit: number,
): number {
  const totalWidth = firstWidth + secondWidth;
  const firstCanvasRatio = (firstWidth + dx) / totalWidth;
  if (firstCanvasRatio <= minSplitLimit) {
    return minSplitLimit * totalWidth - firstWidth;
  } else if (firstCanvasRatio >= 1 - minSplitLimit) {
    return (1 - minSplitLimit) * totalWidth - firstWidth;
  } else {
    return dx;
  }
}
