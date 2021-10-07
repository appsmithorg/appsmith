import { RefObject } from "react";
import { getNearestParentCanvas } from "utils/generators";

const getCanvasToDrawTopOffset = (
  scrollParentTop: number,
  scrollParentTopHeight: number,
  canvasTop: number,
  canvasHeight: number,
) => {
  return scrollParentTop > canvasTop
    ? Math.min(
        scrollParentTop - canvasTop,
        Math.max(canvasHeight - scrollParentTopHeight, 0),
      )
    : 0;
};

export const getCanvasTopOffset = (
  slidingArenaRef: RefObject<HTMLDivElement>,
  stickyCanvasRef: RefObject<HTMLCanvasElement>,
  canExtend: boolean,
) => {
  const parentCanvas: Element | null = getNearestParentCanvas(
    slidingArenaRef.current,
  );

  if (parentCanvas && stickyCanvasRef.current && slidingArenaRef.current) {
    if (canExtend) {
      return parentCanvas.scrollTop;
    } else {
      const {
        height: scrollParentTopHeight,
        top: scrollParentTop,
      } = parentCanvas.getBoundingClientRect();
      const {
        height: canvasHeight,
        top: canvasTop,
      } = slidingArenaRef.current.getBoundingClientRect();
      return getCanvasToDrawTopOffset(
        scrollParentTop,
        scrollParentTopHeight,
        canvasTop,
        canvasHeight,
      );
    }
  }
  return 0;
};
