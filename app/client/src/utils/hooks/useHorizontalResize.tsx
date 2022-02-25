import React, { useState, useEffect, MutableRefObject } from "react";

import { unFocus } from "utils/helpers";

/**
 * use horizontal resize
 *
 * @param ref
 * @param onWidthChange
 */
const useHorizontalResize = (
  ref: MutableRefObject<HTMLElement | null>,
  onWidthChange?: (newWidth: number) => void,
  onDragEnd?: () => void,
  inverse = false,
) => {
  let MIN_WIDTH = 0;
  let MAX_WIDTH = 0;
  const [resizing, setResizing] = useState(false);
  const [position, setPosition] = useState(0);

  // saving min width and max width
  useEffect(() => {
    if (ref.current) {
      MIN_WIDTH = parseInt(
        window.getComputedStyle(ref.current).minWidth.replace("px", ""),
      );
      MAX_WIDTH = parseInt(
        window.getComputedStyle(ref.current).maxWidth.replace("px", ""),
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
  }, [resizing, position]);

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
    setPosition(event.touches[0].clientX);
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
        const current = event.touches[0].clientX;
        const positionDelta = position - current;
        const widthDelta = inverse ? -positionDelta : positionDelta;
        let newWidth = width - widthDelta;
        const newPosition = position - positionDelta;

        if (newWidth < MIN_WIDTH) {
          newWidth = MIN_WIDTH;
        } else if (newWidth > MAX_WIDTH) {
          newWidth = MAX_WIDTH;
        } else {
          setPosition(newPosition);
        }

        if (typeof onWidthChange === "function") {
          onWidthChange(newWidth);
        }
      }
    }
  };

  return { onTouchStart, onMouseDown, onMouseUp, resizing };
};

export default useHorizontalResize;
