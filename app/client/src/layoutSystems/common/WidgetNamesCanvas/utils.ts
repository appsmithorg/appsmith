import Konva from "konva";
import type { LayoutElementPosition } from "layoutSystems/common/types";
import type { WidgetNameData, WidgetNamePositionData } from "./WidgetNameTypes";
import {
  warningSVGPath,
  WidgetNameState,
  WIDGET_NAME_FILL_COLORS,
  WIDGET_NAME_FONT_SIZE,
  WIDGET_NAME_HEIGHT,
  WIDGET_NAME_HORIZONTAL_PADDING,
  WIDGET_NAME_ICON_PADDING,
  WIDGET_NAME_TEXT_COLOR,
  WIDGET_NAME_VERTICAL_PADDING,
} from "./WidgetNameConstants";

/**
 * used to get the Konva Group Element that is a group of all the elements
 * that are to  be drawn as part of widget name on canvas
 * @param position Position of widget
 * @param widgetName widget name
 * @param widgetNameData widget name data contains more information regarding the widget that helps in determining the state of widget name
 * @param parentDOM DOM element the MainContainerWrapper component i.e, the parent of the canvas component
 * @param htmlCanvasDOM DOM element of the html canvas on which the widget name is drawn
 * @param scrollTop amount of pixels scrolled by canvas
 * @returns an object that contains
 *          widgetName Group on Konva, position of widgetName on canvas and canvas offsets
 */
export const getWidgetNameComponent = (
  widgetName: string,
  widgetNameData: WidgetNameData,
  parentDOM: HTMLDivElement | null,
  htmlCanvasDOM: HTMLDivElement | undefined,
  scrollTop: number,
) => {
  let showIcon = false;

  const { nameState } = widgetNameData;

  if (nameState === WidgetNameState.ERROR) {
    showIcon = true;
  }

  //Defining Text Element
  const textEl = new Konva.Text({
    fill: WIDGET_NAME_TEXT_COLOR,
    fontFamily: "sans-serif",
    fontSize: WIDGET_NAME_FONT_SIZE,
    text: widgetName,
    x: showIcon
      ? WIDGET_NAME_ICON_PADDING + WIDGET_NAME_HORIZONTAL_PADDING
      : WIDGET_NAME_HORIZONTAL_PADDING,
    y: WIDGET_NAME_VERTICAL_PADDING,
  });

  const textWidth: number = textEl.width();
  const componentWidth: number =
    textWidth +
    WIDGET_NAME_HORIZONTAL_PADDING * 2 +
    (showIcon ? WIDGET_NAME_ICON_PADDING : 0);

  const {
    canvasLeftOffset,
    canvasTopOffset,
    left: widgetLeft,
    top: widgetTop,
  } = getPositionsForBoundary(
    parentDOM,
    htmlCanvasDOM,
    widgetNameData.position,
    scrollTop,
  );
  const left: number =
    widgetLeft + widgetNameData.position.width - componentWidth;
  const top: number = widgetTop - WIDGET_NAME_HEIGHT;

  //Store the widget name positions for future use
  const widgetNamePosition: WidgetNamePositionData = {
    left: left,
    top: top,
    width: componentWidth,
    height: WIDGET_NAME_HEIGHT,
    widgetNameData: widgetNameData,
  };

  //rectangle encompassing the widget name
  const rectEl = new Konva.Rect({
    cornerRadius: [4, 4, 0, 0],
    fill: WIDGET_NAME_FILL_COLORS[nameState],
    height: WIDGET_NAME_HEIGHT,
    width: componentWidth,
    x: 0,
    y: 0,
  });

  //Icon in widget name componenet in case of error
  const iconEl = new Konva.Path({
    x: WIDGET_NAME_HORIZONTAL_PADDING,
    y: WIDGET_NAME_VERTICAL_PADDING,
    data: warningSVGPath,
    fill: WIDGET_NAME_TEXT_COLOR,
    scaleX: 0.7,
    scaleY: 0.7,
  });

  //Group Containing all the elements of that particular widget name
  const groupEl = new Konva.Group({
    height: WIDGET_NAME_HEIGHT,
    width: componentWidth,
    x: left,
    y: top,
  });

  groupEl.add(rectEl);
  groupEl.add(textEl);
  showIcon && groupEl.add(iconEl);

  return {
    widgetNameComponent: groupEl,
    widgetNamePosition,
    canvasLeftOffset,
    canvasTopOffset,
  };
};

/**
 * Used to calculate the positions of the widget with respect to the HTML Canvas that is rendered by Konva
 * @param parentDOM DOM element the MainContainerWrapper component i.e, the parent of the canvas component
 * @param htmlCanvasDOM DOM element of the html canvas on which the widget name is drawn
 * @param position position of widget with respect to client window in pixels
 * @param scrollTop amount of pixels scrolled by canvas
 * @returns mainly the left and top of widget with respect to the html canvas
 *          and also the canvas offset
 */
const getPositionsForBoundary = (
  parentDOM: HTMLDivElement | null,
  htmlCanvasDOM: HTMLDivElement | undefined,
  position: LayoutElementPosition,
  scrollTop: number,
) => {
  const { left: parentLeft = 0, top: parentTop = 0 } =
    parentDOM?.getBoundingClientRect() || {};
  const { left: canvasLeft = 0, top: canvasTop = 0 } =
    htmlCanvasDOM?.getBoundingClientRect() || {};

  const canvasLeftOffset = parentLeft - canvasLeft;
  const canvasTopOffset = parentTop - canvasTop;

  const left: number = position.left + canvasLeftOffset;
  const top: number = position.top + canvasTopOffset - scrollTop;

  return { left, top, canvasLeftOffset, canvasTopOffset };
};
