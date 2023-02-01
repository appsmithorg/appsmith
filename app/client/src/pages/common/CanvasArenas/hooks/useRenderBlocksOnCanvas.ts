import { Colors } from "constants/Colors";
import { CONTAINER_GRID_PADDING } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { SpaceMap } from "reflow/reflowTypes";
import { getZoomLevel } from "selectors/editorSelectors";
import { HighlightInfo } from "utils/autoLayout/highlightUtils";
import { getAbsolutePixels } from "utils/helpers";
import { modifyDrawingRectangles } from "./canvasDraggingUtils";
import { WidgetDraggingBlock } from "./useBlocksToBeDraggedOnCanvas";

export interface XYCord {
  x: number;
  y: number;
}

/**
 * returns a method that renders dragging blocks on canvas
 * @param slidingArenaRef DOM ref of Sliding Canvas
 * @param stickyCanvasRef DOM ref of Sticky Canvas
 * @param noPad Boolean to indicate if the container type widget has padding
 * @param snapColumnSpace width between columns
 * @param snapRowSpace height between rows
 * @param getSnappedXY Method that returns XY on the canvas Grid
 * @param isCurrentDraggedCanvas boolean if the current canvas is being dragged on
 * @returns
 */
export const useRenderBlocksOnCanvas = (
  slidingArenaRef: React.RefObject<HTMLDivElement>,
  stickyCanvasRef: React.RefObject<HTMLCanvasElement>,
  noPad: boolean,
  snapColumnSpace: number,
  snapRowSpace: number,
  getSnappedXY: (
    parentColumnWidth: number,
    parentRowHeight: number,
    currentOffset: XYCord,
    parentOffset: XYCord,
  ) => {
    X: number;
    Y: number;
  },
  isCurrentDraggedCanvas: boolean,
) => {
  const canvasZoomLevel = useSelector(getZoomLevel);

  /**
   * draws the  block on canvas
   * @param blockDimensions Dimensions of block to be drawn
   * @param scrollParent DOM element of parent
   */
  const drawBlockOnCanvas = (
    blockDimensions: WidgetDraggingBlock,
    scrollParent: Element | null,
    useAutoLayout?: boolean,
  ) => {
    if (
      stickyCanvasRef.current &&
      slidingArenaRef.current &&
      scrollParent &&
      isCurrentDraggedCanvas
    ) {
      const canvasCtx: any = stickyCanvasRef.current.getContext("2d");
      const topOffset = getAbsolutePixels(stickyCanvasRef.current.style.top);
      const leftOffset = getAbsolutePixels(stickyCanvasRef.current.style.left);
      const snappedXY = getSnappedXY(
        snapColumnSpace,
        snapRowSpace,
        {
          x: blockDimensions.left,
          y: blockDimensions.top,
        },
        {
          x: 0,
          y: 0,
        },
      );

      canvasCtx.fillStyle = `${
        blockDimensions.isNotColliding
          ? "rgb(104,	113,	239, 0.6)"
          : "rgb(255,	55,	35, 0.6)"
      }`;
      canvasCtx.fillRect(
        blockDimensions.left -
          leftOffset +
          (noPad ? 0 : CONTAINER_GRID_PADDING),
        blockDimensions.top - topOffset + (noPad ? 0 : CONTAINER_GRID_PADDING),
        blockDimensions.width,
        blockDimensions.height,
      );
      if (!useAutoLayout) {
        const strokeWidth = 1;
        canvasCtx.setLineDash([3]);
        canvasCtx.strokeStyle = blockDimensions.isNotColliding
          ? "rgb(104,	113,	239)"
          : "red";
        canvasCtx.strokeRect(
          snappedXY.X -
            leftOffset +
            strokeWidth +
            (noPad ? 0 : CONTAINER_GRID_PADDING),
          snappedXY.Y -
            topOffset +
            strokeWidth +
            (noPad ? 0 : CONTAINER_GRID_PADDING),
          blockDimensions.width - strokeWidth,
          blockDimensions.height - strokeWidth,
        );
      }
    }
  };

  /**
   * renders blocks on Canvas
   * @param rectanglesToDraw Rectangles that are to be drawn
   * @param spacePositionMap current dimensions of the dragging widgets
   * @param isUpdatingRows boolean
   * @param canvasIsDragging
   * @param scrollParent DOM element of parent
   * @returns
   */
  const renderBlocks = (
    rectanglesToDraw: WidgetDraggingBlock[],
    spacePositionMap: SpaceMap | undefined,
    isUpdatingRows: boolean,
    canvasIsDragging: boolean,
    scrollParent: Element | null,
    highlight?: HighlightInfo | undefined,
    isMainContainer?: boolean,
    parentOffsetTop?: number,
    useAutoLayout?: boolean,
  ) => {
    let isCurrUpdatingRows = isUpdatingRows;
    const modifiedRectanglesToDraw = modifyDrawingRectangles(
      rectanglesToDraw,
      spacePositionMap,
      snapColumnSpace,
      snapRowSpace,
    );
    if (
      slidingArenaRef.current &&
      isCurrentDraggedCanvas &&
      canvasIsDragging &&
      stickyCanvasRef.current
    ) {
      const canvasCtx: any = stickyCanvasRef.current.getContext("2d");
      canvasCtx.save();
      canvasCtx.clearRect(
        0,
        0,
        stickyCanvasRef.current.width,
        stickyCanvasRef.current.height,
      );
      canvasCtx.beginPath();
      isCurrUpdatingRows = false;
      canvasCtx.transform(canvasZoomLevel, 0, 0, canvasZoomLevel, 0, 0);
      if (canvasIsDragging) {
        modifiedRectanglesToDraw.forEach((each) => {
          drawBlockOnCanvas(each, scrollParent, useAutoLayout);
        });
      }
      if (highlight) {
        canvasCtx.fillStyle = Colors.HIGHLIGHT_FILL;
        canvasCtx.lineWidth = 1;
        canvasCtx.strokeStyle = Colors.HIGHLIGHT_OUTLINE;
        canvasCtx.setLineDash([]);
        const { height, posX, posY, width } = highlight;
        let val = 0;
        if (scrollParent?.scrollTop)
          val = isMainContainer
            ? scrollParent.scrollTop
            : parentOffsetTop && scrollParent.scrollTop > parentOffsetTop
            ? scrollParent.scrollTop - parentOffsetTop
            : 0;
        // roundRect is not currently supported in firefox.
        if (canvasCtx.roundRect)
          canvasCtx.roundRect(posX, posY - val, width, height, 4);
        else canvasCtx.rect(posX, posY - val, width, height);
        canvasCtx.fill();
        canvasCtx.stroke();
        canvasCtx.save();
      }
      canvasCtx.restore();
    }

    return isCurrUpdatingRows;
  };

  return renderBlocks;
};
