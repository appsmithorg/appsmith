import type { DragEventHandler, DragEvent } from "react";
import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { throttle } from "lodash";
import { Layer, Stage } from "react-konva";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

import {
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import type {
  CanvasPositions,
  WidgetNameData,
  WidgetNamePositionData,
  WIDGET_NAME_TYPE,
} from "./WidgetNameConstants";
import {
  DEFAULT_WIDGET_NAME_CANVAS_HEIGHT,
  WIDGET_NAME_CANVAS_PADDING,
  widgetNameWrapperStyle,
  WIDGET_NAME_CANVAS,
} from "./WidgetNameConstants";
import {
  getFocusedWidgetNameData,
  getSelectedWidgetNameData,
} from "@appsmith/selectors/entitiesSelector";
import type { WidgetPosition } from "reducers/entityReducers/widgetPositionsReducer";
import { getShouldAllowDrag } from "selectors/widgetDragSelectors";
import type { Stage as CanvasStageType } from "konva/lib/Stage";
import type { Layer as KonvaLayer } from "konva/lib/Layer";
import { getWidgetNameComponent } from "./utils";

/**
 * This Component contains logic to draw widget name on canvas
 * and also to make the widget name Intractable like selection of widget or dragging of widget
 * @param props Object that contains
 * @prop canvasWidth width of canvas in pixels
 * @prop containerRef ref of PageViewWrapper component
 * @prop parentRef ref of the MainContainerWrapper component i.e, the parent of the canvas component
 */
const OverlayCanvasContainer = (props: {
  canvasWidth: number;
  containerRef: React.RefObject<HTMLDivElement>;
  parentRef: React.RefObject<HTMLDivElement>;
}) => {
  //widget name data of widgets
  const selectedWidgetNameData: WidgetNameData | undefined = useSelector(
    getSelectedWidgetNameData,
  );
  const focusedWidgetNameData: WidgetNameData | undefined = useSelector(
    getFocusedWidgetNameData,
  );

  const shouldAllowDrag = useSelector(getShouldAllowDrag);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // used to keep track of positions of widgetName drawn on canvas to make it intractable
  const widgetNamePositions = useRef<{
    selected: WidgetNamePositionData | undefined;
    focused: WidgetNamePositionData | undefined;
  }>({ selected: undefined, focused: undefined });

  const { setDraggingState } = useWidgetDragResize();
  const showTableFilterPane = useShowTableFilterPane();

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
  const isScrolling = useRef(0);
  const hasScroll = useRef<boolean>(false);
  const stageRef = useRef<CanvasStageType>(null);

  const { selectWidget } = useWidgetSelection();

  //used to set canvasPositions, which is used further to calculate the exact positions of widgets
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
        width: rect.width,
      };
    }
  }, [wrapperRef?.current, props.canvasWidth]);

  /**
   * Method used to add widget name to the Konva canvas' layer
   * @param layer Konva layer onto which the widget name is to be added
   * @param widgetNameData widget name data contains more information regarding the widget that is used in drawing the name
   * @param position position of widget in pixels
   * @param type if it's either selected or focused widget name
   */
  const addWidgetNameToCanvas = (
    layer: KonvaLayer,
    widgetNameData: WidgetNameData,
    position: WidgetPosition,
    type: WIDGET_NAME_TYPE,
  ) => {
    if (!position) return;

    const { id: widgetId, widgetName } = widgetNameData;

    //Get Widget Name
    if (widgetName) {
      const {
        canvasLeftOffset,
        canvasTopOffset,
        widgetNameComponent,
        widgetNamePosition,
      } = getWidgetNameComponent(
        position,
        widgetName,
        widgetNameData,
        props?.parentRef?.current,
        stageRef?.current?.content,
        scrollTop.current,
      );

      widgetNamePositions.current[type] = { ...widgetNamePosition };

      canvasPositions.current = {
        ...canvasPositions.current,
        xDiff: canvasLeftOffset,
        yDiff: canvasTopOffset,
      };

      //Make widget name clickable
      widgetNameComponent.on("click", () => {
        selectWidget(SelectionRequestType.One, [widgetId]);
      });

      //Add widget name to canvas
      layer.add(widgetNameComponent);
    }
  };

  /**
   * This method is called whenever there is a change in state of canvas,
   * i.e, widget position is changed, canvas resized, selected widget changes
   * @param widgetPosition
   */
  const updateSelectedWidgetPositions = (widgetPosition?: WidgetPosition) => {
    if (!stageRef?.current) return;

    const stage = stageRef.current;
    const layer = stage.getLayers()[0];
    //destroy all drawings on canvas
    layer.destroyChildren();

    //Check and draw selected Widget
    if (selectedWidgetNameData) {
      const { position: selectedWidgetPosition } = selectedWidgetNameData;

      const position = widgetPosition || selectedWidgetPosition;

      addWidgetNameToCanvas(
        layer,
        selectedWidgetNameData,
        position,
        "selected",
      );
    }

    //Check and draw focused Widget
    if (focusedWidgetNameData) {
      const { position } = focusedWidgetNameData;

      addWidgetNameToCanvas(layer, focusedWidgetNameData, position, "focused");
    }

    layer.draw();
  };

  /**
   * Mouse Move event function, this tracks every mouse move on canvas such that
   * if the mouse position coincides with the positions of widget name, it makes the canvas intractable
   * This is throttled since it tracks every single mouse move
   */
  const handleMouseMove = throttle((e: MouseEvent) => {
    const wrapper = wrapperRef?.current as HTMLDivElement;
    if (!wrapper) return;

    //check if the mouse is coinciding with the widget name drawing on canvas
    const { cursor, isMouseOver } = getMouseOverDetails(e);

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
  }, 20);

  /**
   * on Drag Start event handler to enable drag of widget from the widget name component drawing on canvas
   * @param e
   */
  const handleDragStart: DragEventHandler = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    //checks if the mouse is over the widget name, if so return it's details
    const { isMouseOver, widgetNameData } = getMouseOverDetails(
      e as unknown as MouseEvent,
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

  /**
   * handle Scroll of the canvas, this helps in keeping track og canvas scroll
   * so that the widget name remains accurately placed even when the canvas is scrolled
   */
  const handleScroll = () => {
    if (!props.parentRef?.current) return;

    const currentScrollTop: number = props.parentRef?.current?.scrollTop;

    if (!isScrolling.current) {
      resetCanvas();
    }

    clearTimeout(isScrolling.current);
    isScrolling.current = setTimeout(() => {
      scrollTop.current = currentScrollTop;
      //while scrolling update the widget name position
      updateSelectedWidgetPositions();
      isScrolling.current = 0;
      if (
        (props.parentRef?.current?.scrollHeight || 0) >
        (props.parentRef?.current?.clientHeight || 0)
      )
        hasScroll.current = true;
    }, 100);
  };

  //Add event listeners
  useEffect(() => {
    if (
      !props.containerRef?.current ||
      !props.parentRef?.current ||
      !wrapperRef?.current
    )
      return;

    const container: HTMLDivElement = props.containerRef
      ?.current as HTMLDivElement;
    const parent: HTMLDivElement = props.parentRef?.current as HTMLDivElement;

    container.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("scroll", handleScroll);
    };
  }, [
    props.containerRef?.current,
    props.parentRef?.current,
    wrapperRef?.current,
    widgetNamePositions.current,
    canvasPositions.current,
  ]);

  /**
   * This Method verifies if the mouse position coincides with any widget name drawn on canvas
   * and returns details regarding the widget
   * @param e Mouse event
   * @returns Mainly isMouseOver indicating if the mouse is on any one of the widget name
   * if true also returns data regarding the widget
   */
  const getMouseOverDetails = (e: MouseEvent) => {
    const x = e.clientX - canvasPositions.current.left;
    const y = e.clientY - canvasPositions.current.top;
    const widgetNamePositionsArray = Object.values(widgetNamePositions.current);

    //for selected and focused widget names check the widget name positions with respect to mouse positions
    for (const widgetNamePosition of widgetNamePositionsArray) {
      if (widgetNamePosition) {
        const { height, left, top, widgetNameData, width } = widgetNamePosition;
        if (x > left && x < left + width && y > top && y < top + height) {
          return { isMouseOver: true, cursor: "pointer", widgetNameData };
        }
      }
    }

    return { isMouseOver: false };
  };

  //Used when the position of selected or focused widget changes
  useEffect(() => {
    if (!selectedWidgetNameData && !focusedWidgetNameData) {
      resetCanvas();
    } else {
      updateSelectedWidgetPositions();
    }
  }, [selectedWidgetNameData, focusedWidgetNameData]);

  /**
   * Resets canvas when there is nothing to be drawn on canvas
   */
  const resetCanvas = () => {
    // Resets stored widget position names
    widgetNamePositions.current = { selected: undefined, focused: undefined };

    // clears all drawings on canvas
    const stage = stageRef.current;
    if (!stage) return;
    const layer = stage.getLayers()[0];
    if (!layer) return;
    layer.destroyChildren();
    layer.draw();
  };

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
        width={props.canvasWidth + WIDGET_NAME_CANVAS_PADDING}
      >
        <Layer />
      </Stage>
    </div>
  );
};

export default OverlayCanvasContainer;
