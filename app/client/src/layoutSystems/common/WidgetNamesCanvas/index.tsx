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
  getMouseOverHandler,
  getScrollEndHandler,
  getScrollHandler,
} from "./eventHandlers";
import { WDS_MODAL_WIDGET_CLASSNAME } from "widgets/wds/constants";

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

  const modalScrollParent: HTMLDivElement | null = document.querySelector(
    `.${WDS_MODAL_WIDGET_CLASSNAME}`,
  ) as HTMLDivElement;

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
   *
   *
   * The logic for handling modal scroll is similar to the main container scroll
   * The functions have been modified to be able to handle this for any scrollParent
   *
   * It is likely that the code below will need to be refactored for any new use cases
   * However, the logic for handling scroll and scroll end will remain the same
   *
   *
   */
  useEffect(() => {
    const scrollParent: HTMLDivElement | null =
      getMainContainerAnvilCanvasDOMElement();
    const wrapper: HTMLDivElement | null = wrapperRef?.current;

    if (!wrapper || !scrollParent) return;

    const reset = resetCanvas.bind(this, widgetNamePositions, stageRef);

    // As we're not in control of when a modal mounts or unmounts
    // from this component, we need to create abort controllers
    // to remotely abort the event listeners
    const scrollController = new AbortController();
    const scrollEndController = new AbortController();

    const modalScrollHandler = getScrollHandler(
      isScrolling,
      hasScroll,
      reset,
      scrollTop,
      modalScrollParent,
    );

    const modalScrollEndHandler = getScrollEndHandler(
      isScrolling,
      hasScroll,
      updateFn,
    );

    // Since we're not handling scroll in a modal,
    // we need to handle scroll for the main container
    const scrollHandler = getScrollHandler(
      isScrolling,
      hasScroll,
      reset,
      scrollTop,
      scrollParent,
    );

    const scrollEndHandler = getScrollEndHandler(
      isScrolling,
      hasScroll,
      updateFn,
    );

    // If we have a modal parent, we need to handle scroll for the modal
    // While the modal is visible the scrollParent will be the modal
    if (modalScrollParent) {
      modalScrollParent.addEventListener("scroll", modalScrollHandler, {
        signal: scrollController.signal,
        // we need to let the browser handle scroll without waiting for the
        // event listener to run
        passive: true,
      });
      modalScrollParent.addEventListener("scrollend", modalScrollEndHandler, {
        signal: scrollEndController.signal,
        // we need to let the browser handle scroll end without waiting for the
        // event listener to run
        passive: true,
      });
    } else {
      // Aborting the controllers here, because otherwise we may have memory leaks
      // Tryout this code by removing the this code and then opening a modal
      // The event listeners will be added to the main container, but they won't be removed
      // The number of event listeners shoot up from ~1000 in the test app to ~9000
      scrollController.abort();
      scrollEndController.abort();

      scrollParent.addEventListener("scroll", scrollHandler, { passive: true });
      scrollParent.addEventListener("scrollend", scrollEndHandler, {
        passive: true,
      });
    }

    const mouseMoveHandler = getMouseMoveHandler(
      wrapperRef,
      canvasPositions,
      widgetNamePositions,
    );

    const mouseOverHandler = (e: MouseEvent) =>
      getMouseOverHandler(
        e,
        widgetNamePositions.current,
        canvasPositions.current,
      );

    scrollParent.addEventListener("mouseover", mouseOverHandler);
    scrollParent.addEventListener("mousemove", mouseMoveHandler);
    wrapper.addEventListener("mousemove", mouseMoveHandler);

    return () => {
      scrollParent.removeEventListener("mouseover", mouseOverHandler);
      scrollParent.removeEventListener("mousemove", mouseMoveHandler);
      scrollParent.removeEventListener("scroll", scrollHandler);
      scrollParent.removeEventListener("scrollend", scrollEndHandler);
      wrapper.removeEventListener("mousemove", mouseMoveHandler);
      if (modalScrollParent) {
        // This piece of code is unlikely to be executed, because modalScrollParent
        // could be unmounted but this component will still be mounted
        modalScrollParent.removeEventListener("scroll", modalScrollHandler);
        modalScrollParent.removeEventListener(
          "scrollend",
          modalScrollEndHandler,
        );
      }
      // Aborting for good measure
      scrollController.abort();
      scrollEndController.abort();
    };
  }, [wrapperRef?.current, stageRef?.current, modalScrollParent]);

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
