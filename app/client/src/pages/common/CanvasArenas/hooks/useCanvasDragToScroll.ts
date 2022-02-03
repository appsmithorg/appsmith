import { RefObject, useEffect, useRef } from "react";
import { getNearestParentCanvas } from "utils/generators";
import { getScrollByPixels } from "utils/helpers";

export const useCanvasDragToScroll = (
  canvasRef: RefObject<HTMLElement>,
  isCurrentDraggedCanvas: boolean,
  isDragging: boolean,
  snapRows: number,
  canExtend: boolean,
) => {
  const canScroll = useRef(true);
  useEffect(() => {
    if (isCurrentDraggedCanvas) {
      let scrollTimeOut: number[] = [];
      let scrollDirection = 0;
      let scrollByPixels = 0;
      let speed = 0;
      const clearScrollStacks = () => {
        if (scrollTimeOut.length) {
          scrollTimeOut.forEach((each) => {
            clearTimeout(each);
          });
          scrollTimeOut = [];
        }
      };
      const scrollFn = () => {
        clearScrollStacks();
        if (!canScroll.current) {
          scrollDirection = 0;
        }
        const scrollParent: Element | null = getNearestParentCanvas(
          canvasRef.current,
        );
        if (
          isDragging &&
          isCurrentDraggedCanvas &&
          scrollParent &&
          canScroll.current
        ) {
          if (
            (scrollByPixels < 0 && scrollParent.scrollTop > 0) ||
            scrollByPixels > 0
          ) {
            scrollParent.scrollBy({
              top: scrollByPixels,
              behavior: "smooth",
            });
          }
          scrollTimeOut.push(setTimeout(scrollFn, 100 * Math.max(0.4, speed)));
        }
      };
      const checkIfNeedsScroll = (e: any) => {
        if (isDragging && isCurrentDraggedCanvas) {
          const scrollParent: Element | null = getNearestParentCanvas(
            canvasRef.current,
          );
          if (canvasRef.current && scrollParent) {
            const scrollObj = getScrollByPixels(
              {
                top: e.offsetY,
                height: 0,
              },
              scrollParent,
              canvasRef.current,
            );
            scrollByPixels = scrollObj.scrollAmount;
            speed = scrollObj.speed;
            const currentScrollDirection =
              canScroll.current && scrollByPixels
                ? scrollByPixels > 0
                  ? 1
                  : -1
                : 0;
            if (currentScrollDirection !== scrollDirection) {
              scrollDirection = currentScrollDirection;
              if (!!scrollDirection) {
                scrollFn();
              }
            }
          }
        }
      };
      canvasRef.current?.addEventListener(
        "mousemove",
        checkIfNeedsScroll,
        false,
      );
      return () => {
        clearScrollStacks();
        canvasRef.current?.removeEventListener("mousemove", checkIfNeedsScroll);
      };
    }
  }, [isCurrentDraggedCanvas, isDragging, snapRows, canExtend]);
  return canScroll;
};
