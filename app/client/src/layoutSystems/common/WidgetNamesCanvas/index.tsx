import type { CSSProperties, DragEventHandler, DragEvent } from "react";
import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { throttle } from "lodash";
import { Layer, Stage } from "react-konva";
import Konva from "konva";
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
} from "./WidgetNameTypes";
import { WidgetNameState } from "./WidgetNameTypes";
import {
  getFocusedWidgetNameData,
  getSelectedWidgetNameData,
} from "@appsmith/selectors/entitiesSelector";
import type { WidgetPosition } from "reducers/entityReducers/widgetPositionsReducer";
import { getShouldAllowDrag } from "selectors/widgetDragSelectors";
import type { Stage as CanvasStageType } from "konva/lib/Stage";
import type { Layer as KonvaLayer } from "konva/lib/Layer";
import { Colors } from "constants/Colors";

const WIDGET_NAME_CANVAS = "widget-name-canvas";
const FONT_SIZE = 14;
const LINE_HEIGHT = Math.floor(FONT_SIZE * 1.2);
const VERTICAL_PADDING = 4;
const HORIZONTAL_PADDING = 6;
const ICON_PADDING = 16;

const HEIGHT = Math.floor(LINE_HEIGHT + VERTICAL_PADDING * 1.5);

const FILL_COLORS = {
  [WidgetNameState.NORMAL]: Colors.JAFFA_DARK,
  [WidgetNameState.FOCUSED]: Colors.WATUSI,
  [WidgetNameState.ERROR]: Colors.DANGER_SOLID,
};
const TEXT_COLOR = Colors.WHITE;

type WIDGET_NAME_TYPE = "selected" | "focused";

//Adding this here as Konva accepts this type of path for SVG
const warningSVGPath =
  "M 18 9 C 18 13.9706 13.9706 18 9 18 C 4.0294 18 0 13.9706 0 9 C 0 4.0294 4.0294 0 9 0 C 13.9706 0 18 4.0294 18 9 Z M 7.875 3.9375 V 10.125 H 10.125 V 3.9375 H 7.875 Z M 9 14.0625 C 9.6213 14.0625 10.125 13.5588 10.125 12.9375 C 10.125 12.3162 9.6213 11.8125 9 11.8125 C 8.3787 11.8125 7.875 12.3162 7.875 12.9375 C 7.875 13.5588 8.3787 14.0625 9 14.0625 Z";

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
   * Used to calculate the positions of the widget with respect to the HTML Canvas that is rendered by Konva
   * @param position position of widget with respect to client window in pixels
   * @returns
   */
  const getPositionsForBoundary = (position: WidgetPosition) => {
    const { left: parentLeft = 0, top: parentTop = 0 } =
      props.parentRef?.current?.getBoundingClientRect() || {};
    const { left: canvasLeft = 0, top: canvasTop = 0 } =
      stageRef?.current?.content?.getBoundingClientRect() || {};

    const leftOffset = parentLeft - canvasLeft;
    const topOffset = parentTop - canvasTop;

    canvasPositions.current = {
      ...canvasPositions.current,
      xDiff: leftOffset,
      yDiff: topOffset,
    };

    const left: number = position.left + leftOffset;
    const top: number = position.top + topOffset - scrollTop.current;

    return { left, top };
  };

  /**
   * used to get the Konva Group Element that is a group of all the elements
   * that are to  be drawn as part of widget name on canvas
   * @param position Position of widget
   * @param widgetName widget name
   * @param widgetNameData widget name data contains more information regarding the widget that helps in determining the state of widget name
   * @param type if it's either selected or focused widget name
   */
  const getWidgetNameComponent = (
    position: WidgetPosition,
    widgetName: string,
    widgetNameData: WidgetNameData,
    type: WIDGET_NAME_TYPE,
  ) => {
    let showIcon = false;

    const { nameState } = widgetNameData;

    if (nameState === WidgetNameState.ERROR) {
      showIcon = true;
    }

    //Defining Text Element
    const textEl = new Konva.Text({
      fill: TEXT_COLOR,
      fontFamily: "sans-serif",
      fontSize: FONT_SIZE,
      text: widgetName,
      x: showIcon ? ICON_PADDING + HORIZONTAL_PADDING : HORIZONTAL_PADDING,
      y: VERTICAL_PADDING,
    });

    const textWidth: number = textEl.width();
    const componentWidth: number =
      textWidth + HORIZONTAL_PADDING * 2 + (showIcon ? ICON_PADDING : 0);

    const { left: widgetLeft, top: widgetTop } =
      getPositionsForBoundary(position);
    const left: number = widgetLeft + position.width - componentWidth + 0.5;
    const top: number = widgetTop - HEIGHT;

    //Store the widget name positions for future use
    widgetNamePositions.current[type] = {
      left: left,
      top: top,
      width: componentWidth,
      height: HEIGHT,
      widgetNameData: widgetNameData,
    };

    //rectangle encompassing the widget name
    const rectEl = new Konva.Rect({
      cornerRadius: [4, 4, 0, 0],
      fill: FILL_COLORS[nameState],
      height: HEIGHT,
      width: componentWidth,
      x: 0,
      y: 0,
    });

    //Icon in widget name componenet in case of error
    const iconEl = new Konva.Path({
      x: HORIZONTAL_PADDING,
      y: VERTICAL_PADDING,
      data: warningSVGPath,
      fill: TEXT_COLOR,
      scaleX: 0.7,
      scaleY: 0.7,
    });

    //Group Containing all the elements of that particular widget name
    const groupEl = new Konva.Group({
      height: HEIGHT,
      width: componentWidth,
      x: left,
      y: top,
    });

    groupEl.add(rectEl);
    groupEl.add(textEl);
    showIcon && groupEl.add(iconEl);

    return groupEl;
  };

  /**
   * Method used to add widget name to the Konva canvas' layer
   * @param layer Konva layer onto which the widget name is to be added
   * @param widgetNameData widget name data contains more information regarding the widget that is used in drawing the name
   * @param position position of widget in pixels
   * @param type if it's either selected or focused widget name
   */
  const addWidgetToCanvas = (
    layer: KonvaLayer,
    widgetNameData: WidgetNameData,
    position: WidgetPosition,
    type: WIDGET_NAME_TYPE,
  ) => {
    if (!position) return;

    const { id: widgetId, widgetName } = widgetNameData;

    //Get Widget Name
    if (widgetName) {
      const widgetNameComponent = getWidgetNameComponent(
        position,
        widgetName,
        widgetNameData,
        type,
      );

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

      addWidgetToCanvas(layer, selectedWidgetNameData, position, "selected");
    }

    //Check and draw focused Widget
    if (focusedWidgetNameData) {
      const { position } = focusedWidgetNameData;

      addWidgetToCanvas(layer, focusedWidgetNameData, position, "focused");
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
      return;
    }
    updateSelectedWidgetPositions();
  }, [selectedWidgetNameData, focusedWidgetNameData]);

  /**
   * Resets canvas when there is nothing to be drawn on canvas
   * @returns
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

  const wrapperStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
    pointerEvents: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    height: "100%",
  };

  return (
    <div
      draggable
      id={WIDGET_NAME_CANVAS}
      onDragStart={handleDragStart}
      ref={wrapperRef}
      style={wrapperStyle}
    >
      <Stage
        height={canvasPositions?.current.height || 600}
        ref={stageRef}
        width={props.canvasWidth + 20}
      >
        <Layer />
      </Stage>
    </div>
  );
};

export default OverlayCanvasContainer;
