import React, { useState, useEffect, MutableRefObject } from "react";

import { unFocus } from "utils/helpers";

/**
 * use resize
 *
 * @param ref
 * @param onWidthChange
 * @param onHeightChange
 * @param onDragEnd
 * @param inverse
 */
const useResize = (
  ref: MutableRefObject<HTMLElement | null>,
  onWidthChange?: (newWidth: number) => void,
  onHeightChange?: (newWidth: number) => void,
  onDragEnd?: () => void,
  inverse = false,
) => {
  let MIN_WIDTH = 0;
  let MAX_WIDTH = 0;
  let MIN_HEIGHT = 0;
  let MAX_HEIGHT = 0;
  const [resizing, setResizing] = useState(false);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);

  // saving min width and max width
  useEffect(() => {
    if (ref.current) {
      MIN_WIDTH = parseInt(
        window.getComputedStyle(ref.current).minWidth.replace("px", ""),
      );
      MAX_WIDTH = parseInt(
        window.getComputedStyle(ref.current).maxWidth.replace("px", ""),
      );
      MIN_HEIGHT = parseInt(
        window.getComputedStyle(ref.current).minHeight.replace("px", ""),
      );
      MAX_HEIGHT = parseInt(
        window.getComputedStyle(ref.current).maxHeight.replace("px", ""),
      );
    }
  });

  // registering event listeners
  useEffect(() => {
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onTouchMove);

    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, [resizing, positionX, positionY]);

  /**
   * passing the event to touch start on mouse down
   *
   * @param event
   */
  const onMouseDown = (event: React.MouseEvent) => {
    const eventWithTouches = Object.assign({}, event, {
      touches: [{ clientX: event.clientX, clientY: event.clientY }],
    });

    onTouchStart(eventWithTouches);
  };

  /**
   * sets resizing and position on touch start
   */
  const onTouchStart = (
    event:
      | React.TouchEvent
      | (React.MouseEvent<Element, MouseEvent> & {
          touches: { clientX: number; clientY: number }[];
        }),
  ) => {
    unFocus(document, window);
    setPositionX(event.touches[0].clientX);
    setPositionY(event.touches[0].clientY);
    setResizing(true);
    document.body.classList.add("cursor-ew-resize");
  };

  /**
   * sets resizing false on mouse up
   * also calls onDragFinished if any
   */
  const onMouseUp = () => {
    if (resizing) {
      if (typeof onDragEnd === "function") {
        onDragEnd();
      }

      setResizing(false);
      document.body.classList.remove("cursor-ew-resize");
    }
  };

  /**
   * passing the event to touch move on mouse move
   */
  const onMouseMove = (event: MouseEvent) => {
    const eventWithTouches = Object.assign({}, event, {
      touches: [{ clientX: event.clientX, clientY: event.clientY }],
    });
    onTouchMove(eventWithTouches);
  };

  /**
   * calculate the new width based on the pixel moved
   *
   * @param event
   */
  const onTouchMove = (
    event:
      | TouchEvent
      | (MouseEvent & { touches: { clientX: number; clientY: number }[] }),
  ) => {
    if (resizing) {
      unFocus(document, window);

      if (ref.current) {
        const width = ref.current.clientWidth;
        const height = ref.current.clientHeight;
        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;
        const positionXDelta = positionX - currentX;
        const positionYDelta = positionY - currentY;
        const widthDelta = inverse ? -positionXDelta : positionXDelta;
        const heightDelta = inverse ? -positionYDelta : positionYDelta;
        let newWidth = width - widthDelta;
        let newHeight = height - heightDelta;
        const newXPosition = positionX - positionXDelta;
        const newYPosition = positionY - positionYDelta;

        if (newWidth < MIN_WIDTH) {
          newWidth = MIN_WIDTH;
        } else if (newWidth > MAX_WIDTH) {
          newWidth = MAX_WIDTH;
        } else {
          setPositionX(newXPosition);
        }

        if (newHeight < MIN_HEIGHT) {
          newHeight = MIN_HEIGHT;
        } else if (newHeight > MAX_HEIGHT) {
          newHeight = MAX_HEIGHT;
        } else {
          setPositionX(newYPosition);
        }

        if (typeof onWidthChange === "function") {
          onWidthChange(newWidth);
        }
        if (typeof onHeightChange === "function") {
          onHeightChange(newHeight);
        }
      }
    }
  };

  return { onTouchStart, onMouseDown, onMouseUp, resizing };
};

export default useResize;
