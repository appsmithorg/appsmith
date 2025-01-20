import type { MutableRefObject } from "react";
import React from "react";

export enum DIRECTION {
  vertical,
  horizontal,
}

export interface CallbackResponseType {
  height: number;
  width: number;
}

function useResize(
  ref: MutableRefObject<HTMLElement | null>,
  direction: DIRECTION,
  afterResizeCallback?: (data: CallbackResponseType) => void,
) {
  const [mouseDown, setMouseDown] = React.useState(false);
  const animationFrameRef = React.useRef<number>();
  const dimensionsRef = React.useRef<CallbackResponseType>({
    height: 0,
    width: 0,
  });

  const pointer =
    direction === DIRECTION.vertical ? "cursor-ns-resize" : "cursor-ew-resize";

  const updateDimensions = React.useCallback(() => {
    if (!ref.current) return;

    const { height, width } = dimensionsRef.current;

    if (direction === DIRECTION.vertical) {
      ref.current.style.height = `${height}px`;
    } else {
      ref.current.style.width = `${width}px`;
    }

    if (afterResizeCallback) {
      afterResizeCallback({ height, width });
    }

    animationFrameRef.current = requestAnimationFrame(updateDimensions);
  }, [direction, afterResizeCallback]);

  const onMouseMove = React.useCallback(
    (e: MouseEvent) => {
      document.body.classList.add(pointer);

      if (ref.current) {
        // below lines stop selection of texts
        if (e.stopPropagation) e.stopPropagation();

        if (e.preventDefault) e.preventDefault();

        const { bottom, left, right, top } =
          ref.current.getBoundingClientRect();

        const currentMouseYPosition = e.clientY;
        const currentMouseXPosition = e.clientX;

        const distanceYDragged = currentMouseYPosition - bottom;
        const distanceXDragged = currentMouseXPosition - right;

        const currentHeight = bottom - top;
        const currentWidth = right - left;

        dimensionsRef.current = {
          height: currentHeight + distanceYDragged,
          width: currentWidth + distanceXDragged,
        };

        if (!animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(updateDimensions);
        }
      }
    },
    [pointer, updateDimensions],
  );

  const onMouseUp = React.useCallback(() => {
    setMouseDown(false);
    document.body.classList.remove(pointer);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, [pointer]);

  React.useEffect(() => {
    if (mouseDown) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [mouseDown, onMouseMove, onMouseUp]);

  return { mouseDown, setMouseDown };
}

export default useResize;
