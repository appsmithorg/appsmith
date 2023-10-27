import type { DragEventHandler, MutableRefObject, DragEvent } from "react";
import type {
  CanvasPositions,
  WidgetNameData,
  WidgetNamePositionType,
} from "./WidgetNameTypes";
import { throttle } from "lodash";
import { getMainContainerAnvilCanvasDOMElement } from "./widgetNameRenderUtils";
import type { SetDraggingStateActionPayload } from "utils/hooks/dragResizeHooks";

/**
 * This returns a callback for scroll event on the MainContainer
 *
 * This callback does the following:
 * 1. Sets the scrolling state to 1 if it is not already set to 0.
 * A value of 0 signifies that we've only just started scrolling and this event has triggered
 * So, we set it to 1 after we've reset the canvas.
 * We reset the canvas as we donot want to show any widget names while scrolling.
 *
 * 2. We update the scrollTop in a ref. This is used to calculate the position of the widget name
 * We also wrap this in a requestAnimationFrame to ensure that we get the latest scrollTop value and it doesn't cause layout thrashing
 *
 * 3. If there is actually a scroll ofset, we set hasScroll to true
 *
 * @returns void
 */
export function getScrollHandler(
  isScrolling: MutableRefObject<number>,
  hasScroll: MutableRefObject<boolean>,
  resetCanvas: () => void,
  scrollTop: MutableRefObject<number>,
) {
  return function handleScroll() {
    const scrollParent: HTMLDivElement | null =
      getMainContainerAnvilCanvasDOMElement();
    if (!scrollParent) return;

    if (isScrolling.current === 0) {
      isScrolling.current = 1;
      resetCanvas();
    }

    window.requestAnimationFrame(() => {
      scrollTop.current = scrollParent.scrollTop;
      if (scrollParent.scrollHeight > scrollParent.clientHeight) {
        hasScroll.current = true;
      }
    });
  };
}

/**
 *
 * This returns a callback for scroll end event on the MainContainer
 *
 * This callback does the following:
 * 1. Sets the scrolling state to 0 (see handleScroll)
 * 2. If there is a scroll offset, we update the positions of the selected and focused widget names
 */
export function getScrollEndHandler(
  isScrolling: MutableRefObject<number>,
  hasScroll: MutableRefObject<boolean>,
  updateSelectedWidgetPositions: () => void,
) {
  return function handleScrollEnd() {
    isScrolling.current = 0;
    if (hasScroll.current) {
      updateSelectedWidgetPositions();
    }
  };
}

/**
 * This Method verifies if the mouse position coincides with any widget name drawn on canvas
 * and returns details regarding the widget
 * @param e Mouse event
 * @returns Mainly isMouseOver indicating if the mouse is on any one of the widget name
 * if true also returns data regarding the widget
 */
export function getMouseOverDetails(
  e: MouseEvent,
  canvasPositions: MutableRefObject<CanvasPositions>,
  widgetNamePositions: MutableRefObject<WidgetNamePositionType>,
) {
  const x = e.clientX - canvasPositions.current.left;
  const y = e.clientY - canvasPositions.current.top;
  const widgetNamePositionsArray = [
    ...Object.values(widgetNamePositions.current.focused),
    ...Object.values(widgetNamePositions.current.selected),
  ];

  let result: {
    isMouseOver: boolean;
    cursor?: string;
    widgetNameData?: WidgetNameData;
  } = { isMouseOver: false, cursor: "default" };

  //for selected and focused widget names check the widget name positions with respect to mouse positions
  for (const widgetNamePosition of widgetNamePositionsArray) {
    if (widgetNamePosition) {
      const { height, left, top, widgetNameData, width } = widgetNamePosition;
      if (x > left && x < left + width && y > top && y < top + height) {
        result = { isMouseOver: true, cursor: "pointer", widgetNameData };
        break;
      }
    }
  }
  return result;
}

export function getMouseMoveHandler(
  wrapperRef: MutableRefObject<HTMLDivElement | null>,
  canvasPositions: MutableRefObject<CanvasPositions>,
  widgetNamePositions: MutableRefObject<WidgetNamePositionType>,
) {
  /**
   * Mouse Move event function, this tracks every mouse move on canvas such that
   * if the mouse position coincides with the positions of widget name, it makes the canvas intractable
   * This is throttled since it tracks every single mouse move
   */
  return throttle((e: MouseEvent) => {
    const wrapper = wrapperRef?.current as HTMLDivElement;
    if (!wrapper) return;

    //check if the mouse is coinciding with the widget name drawing on canvas
    const { cursor, isMouseOver } = getMouseOverDetails(
      e,
      canvasPositions,
      widgetNamePositions,
    );

    //if mouse over make the canvas intractable
    if (isMouseOver) {
      if (wrapper.style.pointerEvents === "none") {
        wrapper.style.pointerEvents = "auto";
      }
    } // if not mouse over then keep it default
    else if (wrapper.style.pointerEvents !== "none") {
      wrapper.style.pointerEvents = "none";
      wrapper.style.cursor = "default";
    }

    //set cursor based on intractability
    if (!cursor) {
      wrapper.style.cursor = "default";
    } else if (wrapper.style.cursor !== cursor) {
      wrapper.style.cursor = cursor;
    }
  }, 50);
}

/**
 * on Drag Start event handler to enable drag of widget from the widget name component drawing on canvas
 */
export function getDragStartHandler(
  showTableFilterPane: () => void,
  setDraggingState: (payload: SetDraggingStateActionPayload) => void,
  shouldAllowDrag: boolean,
  canvasPositions: MutableRefObject<CanvasPositions>,
  widgetNamePositions: MutableRefObject<WidgetNamePositionType>,
): DragEventHandler {
  return (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    //checks if the mouse is over the widget name, if so return it's details
    const { isMouseOver, widgetNameData } = getMouseOverDetails(
      e as unknown as MouseEvent,
      canvasPositions,
      widgetNamePositions,
    );

    if (!isMouseOver || !shouldAllowDrag || widgetNameData?.dragDisabled)
      return;

    //set dragging state
    const startPoints = {
      top: 0,
      left: 0,
    };
    showTableFilterPane();
    setDraggingState({
      isDragging: true,
      dragGroupActualParent: widgetNameData?.parentId,
      draggingGroupCenter: { widgetId: widgetNameData?.id },
      startPoints,
      draggedOn: widgetNameData?.parentId,
    });
  };
}
