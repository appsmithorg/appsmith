import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Layer, Stage } from "react-konva/lib/ReactKonvaCore";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

import {
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import type {
  CanvasPositions,
  WidgetNameData,
  WidgetNamePositionType,
} from "./WidgetNameTypes";
import {
  DEFAULT_WIDGET_NAME_CANVAS_HEIGHT,
  widgetNameWrapperStyle,
  WIDGET_NAME_CANVAS,
} from "./WidgetNameConstants";
import {
  getFocusedWidgetNameData,
  getSelectedWidgetNameData,
} from "../selectors";

import { getShouldAllowDrag } from "selectors/widgetDragSelectors";
import type { Stage as CanvasStageType } from "konva/lib/Stage";
import {
  getMainContainerAnvilCanvasDOMElement,
  resetCanvas,
  updateSelectedWidgetPositions,
} from "./widgetNameRenderUtils";
import {
  getDragStartHandler,
  getMouseMoveHandler,
  getScrollEndHandler,
  getScrollHandler,
} from "./eventHandlers";

/**
 * This Component contains logic to draw widget name on canvas
 * and also to make the widget name Intractable like selection of widget or dragging of widget
 * @param props Object that contains
 * @prop canvasWidth width of canvas in pixels
 * @prop containerRef ref of PageViewWrapper component
 */
const OverlayCanvasContainer = (props: { canvasWidth: number }) => {
  //widget name data of widgets
  const selectedWidgetNameData: WidgetNameData[] | undefined = useSelector(
    getSelectedWidgetNameData,
  );
  const focusedWidgetNameData: WidgetNameData | undefined = useSelector(
    getFocusedWidgetNameData,
  );

  // should we allow dragging of widgets
  const shouldAllowDrag = useSelector(getShouldAllowDrag);
  // When we begin dragging, the drag and resize hooks need a few details to take over
  const { setDraggingState } = useWidgetDragResize();
  const showTableFilterPane = useShowTableFilterPane();
  const { selectWidget } = useWidgetSelection();

  const wrapperRef = useRef<HTMLDivElement>(null);
  // used to keep track of positions of widgetName drawn on canvas to make it intractable
  const widgetNamePositions = useRef<WidgetNamePositionType>({
    selected: {},
    focused: {},
  });
  //Positions of canvas
  const canvasPositions = useRef<CanvasPositions>({
    top: 0,
    left: 0,
    xDiff: 0,
    width: 0,
    yDiff: 0,
    height: 0,
  });

  const scrollTop = useRef<number>(0);
  const isScrolling = useRef<number>(0);
  const hasScroll = useRef<boolean>(false);
  const stageRef = useRef<CanvasStageType | null>(null);

  // Pre bind arguments to the updateSelectedWidgetPositions function
  // This makes it easier to use the function later in the code
  const updateFn = updateSelectedWidgetPositions.bind(this, {
    stageRef,
    selectedWidgetNameData,
    focusedWidgetNameData,
    selectWidget,
    scrollTop,
    widgetNamePositions,
    canvasPositions,
  });

  // Used to set canvasPositions, which is used further to calculate the exact positions of widgets
  useEffect(() => {
    if (!stageRef?.current?.content || !wrapperRef?.current) return;

    const HTMLCanvas: HTMLDivElement = stageRef?.current?.content;
    const rect: DOMRect = HTMLCanvas.getBoundingClientRect();
    const wrapper: HTMLDivElement = wrapperRef?.current as HTMLDivElement;
    const wrapperRect: DOMRect = wrapper.getBoundingClientRect();

    if (rect && wrapperRect) {
      canvasPositions.current = {
        ...canvasPositions.current,
        height: wrapperRect.height,
        left: rect.left,
        top: rect.top,
        width: wrapperRect.width,
      };
    }
  }, [wrapperRef?.current, props.canvasWidth]);

  /**
   * Adds 3 event listeners.
   * 1. Mouse Move: On the container, to check if the mouse is over a widget, so that we can focus it
   * 2. Scroll: On the MainContainer, to check if the user is scrolling. This is so that we can hide the widget names
   * Also, this tells us that we need to compute and store scroll offset values to correctly position the widget name components.
   * 3. Scroll End: On the MainContainer, to check if the user has stopped scrolling. This is so that we can show the widget names again
   */
  useEffect(() => {
    const scrollParent: HTMLDivElement | null =
      getMainContainerAnvilCanvasDOMElement();
    const wrapper: HTMLDivElement | null = wrapperRef?.current;

    if (!wrapper || !scrollParent) return;

    const reset = resetCanvas.bind(this, widgetNamePositions, stageRef);

    const scrollHandler = getScrollHandler(
      isScrolling,
      hasScroll,
      reset,
      scrollTop,
    );

    const scrollEndHandler = getScrollEndHandler(
      isScrolling,
      hasScroll,
      updateFn,
    );

    const mouseMoveHandler = getMouseMoveHandler(
      wrapperRef,
      canvasPositions,
      widgetNamePositions,
    );

    scrollParent.addEventListener("mousemove", mouseMoveHandler);
    scrollParent.addEventListener("scroll", scrollHandler);
    scrollParent.addEventListener("scrollend", scrollEndHandler);
    wrapper.addEventListener("mousemove", mouseMoveHandler);

    return () => {
      scrollParent.removeEventListener("mousemove", mouseMoveHandler);
      scrollParent.removeEventListener("scroll", scrollHandler);
      scrollParent.removeEventListener("scrollend", scrollEndHandler);
      wrapper.removeEventListener("mousemove", mouseMoveHandler);
    };
  }, [wrapperRef?.current, stageRef?.current]);

  // Reset the canvas if no widgets are focused or selected
  // Update the widget name positions if there are widgets focused or selected
  // and they've changed.
  useEffect(() => {
    if (!selectedWidgetNameData && !focusedWidgetNameData) {
      resetCanvas(widgetNamePositions, stageRef);
    } else {
      // The following is a hack, where if the widget name data is an empty array
      // The source is the fact that we're moving a widget
      // In this case, we don't want to lose the references we have right now,
      // because after dropping, the selectedWidgetNameData will come back as it was before
      // the move. We only want to recompute widget name positions if the widget name data
      // has changed after the layout element positions have been computed
      // In the case of layout element positions being recomputed, the actual widget name data
      // will be different from the widget name data we have right now.
      if (selectedWidgetNameData?.length === 0) {
        resetCanvas(widgetNamePositions, stageRef, true);
      } else {
        updateFn();
      }
    }
  }, [selectedWidgetNameData, focusedWidgetNameData]);

  const handleDragStart = getDragStartHandler(
    showTableFilterPane,
    setDraggingState,
    shouldAllowDrag,
    canvasPositions,
    widgetNamePositions,
  );

  return (
    <div
      draggable
      id={WIDGET_NAME_CANVAS}
      onDragStart={handleDragStart}
      ref={wrapperRef}
      style={widgetNameWrapperStyle}
    >
      <Stage
        height={
          canvasPositions?.current.height || DEFAULT_WIDGET_NAME_CANVAS_HEIGHT
        }
        ref={stageRef}
        width={canvasPositions?.current.width || 0}
      >
        <Layer />
      </Stage>
    </div>
  );
};

export default OverlayCanvasContainer;
