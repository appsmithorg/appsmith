import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { PADDING_FOR_HORIZONTAL_HIGHLIGHT } from "layoutSystems/anvil/utils/constants";
import { memoize } from "lodash";
import { getAbsolutePixels } from "utils/helpers";
import { getEdgeHighlightOffset } from "./utils";
import type { LayoutElementPosition } from "layoutSystems/common/types";

/**
 * Function to render UX to denote that the widget type cannot be dropped in the layout
 */
export const renderDisallowOnCanvas = (slidingArena: HTMLDivElement) => {
  slidingArena.style.backgroundColor = "#EB714D";
  slidingArena.style.color = "white";
  slidingArena.innerText = "This Layout doesn't support the widget";

  slidingArena.style.textAlign = "center";
  slidingArena.style.opacity = "0.8";
};

export const getDropIndicatorColor = memoize(() => {
  const rootStyles = getComputedStyle(document.documentElement);
  return rootStyles.getPropertyValue("--anvil-drop-indicator");
});

/**
 * Function to stroke a rectangle on the canvas that looks like a highlight/drop area.
 */
export const renderBlocksOnCanvas = (
  stickyCanvas: HTMLCanvasElement,
  blockToRender: AnvilHighlightInfo,
  currentLayoutPositions: LayoutElementPosition,
  shouldDraw: boolean,
  canvasToLayoutGap: { left: number; top: number },
) => {
  if (!shouldDraw) {
    return;
  }
  // Calculating offset based on the position of the canvas
  const topOffset = getAbsolutePixels(stickyCanvas.style.top);
  const leftOffset = getAbsolutePixels(stickyCanvas.style.left);
  const dropIndicatorColor = getDropIndicatorColor();
  const canvasCtx = stickyCanvas.getContext("2d") as CanvasRenderingContext2D;

  // Clearing previous drawings on the canvas
  canvasCtx.clearRect(0, 0, stickyCanvas.width, stickyCanvas.height);
  canvasCtx.beginPath();
  // Extracting dimensions of the block to render
  const { height, posX, posY, width } = blockToRender;
  const left = posX - leftOffset + canvasToLayoutGap.left;
  const top = posY - topOffset + canvasToLayoutGap.top;
  const edgeOffset = getEdgeHighlightOffset(
    { left, top, width, height },
    currentLayoutPositions,
    canvasToLayoutGap,
    blockToRender.isVertical,
  );
  const horizontalPadding = blockToRender.isVertical
    ? 0
    : PADDING_FOR_HORIZONTAL_HIGHLIGHT;
  const verticalPadding = blockToRender.isVertical
    ? PADDING_FOR_HORIZONTAL_HIGHLIGHT / 2
    : 0;
  canvasCtx.roundRect(
    left + horizontalPadding + edgeOffset.leftOffset,
    top + verticalPadding + edgeOffset.topOffset,
    width - horizontalPadding * 2,
    height - verticalPadding * 2,
    2,
  );
  canvasCtx.fillStyle = dropIndicatorColor;
  canvasCtx.fill();
  canvasCtx.closePath();
};
