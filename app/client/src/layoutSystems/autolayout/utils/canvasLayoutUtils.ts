import {
  AUTO_LAYOUT_CONTAINER_PADDING,
  FLEXBOX_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  MAX_MODAL_WIDTH_FROM_MAIN_WIDTH,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgetWidth } from "./flexWidgetUtils";

function getPadding(canvas: FlattenedWidgetProps): number {
  let padding = 0;
  if (canvas.widgetId === MAIN_CONTAINER_WIDGET_ID) {
    padding = FLEXBOX_PADDING * 2;
  } else if (canvas.type === "CONTAINER_WIDGET") {
    padding = (AUTO_LAYOUT_CONTAINER_PADDING + FLEXBOX_PADDING) * 2;
  } else if (canvas.isCanvas) {
    padding = AUTO_LAYOUT_CONTAINER_PADDING * 2;
  }

  if (canvas.noPad) {
    padding -= WIDGET_PADDING;
  }

  return padding;
}

function getCanvasWidth(
  canvas: FlattenedWidgetProps,
  widgets: CanvasWidgetsReduxState,
  mainCanvasWidth: number,
  isMobile: boolean,
): number {
  if (!mainCanvasWidth) return 0;
  if (canvas.widgetId === MAIN_CONTAINER_WIDGET_ID)
    return mainCanvasWidth - getPadding(canvas);

  const stack = [];
  let widget = canvas;
  while (widget.parentId) {
    stack.push(widget);
    widget = widgets[widget.parentId];

    //stop at modal
    if (widget.type === "MODAL_WIDGET") {
      break;
    }
  }
  stack.push(widget);

  let width = mainCanvasWidth;

  //modal will be the total width instead of the mainCanvasWidth
  if (widget.type === "MODAL_WIDGET") {
    width = Math.min(
      widget.width || 0,
      mainCanvasWidth * MAX_MODAL_WIDTH_FROM_MAIN_WIDTH,
    );
  }

  while (stack.length) {
    const widget = stack.pop();
    if (!widget) continue;
    const columns = getWidgetWidth(widget, isMobile);
    const padding = getPadding(widget);
    const factor = widget.detachFromLayout
      ? 1
      : columns / GridDefaults.DEFAULT_GRID_COLUMNS;
    width = width * factor - padding;
  }

  return width;
}

export function getCanvasDimensions(
  canvas: FlattenedWidgetProps,
  widgets: CanvasWidgetsReduxState,
  mainCanvasWidth: number,
  isMobile: boolean,
): { canvasWidth: number; columnSpace: number } {
  const canvasWidth: number = getCanvasWidth(
    canvas,
    widgets,
    mainCanvasWidth,
    isMobile,
  );

  const columnSpace: number = canvasWidth / GridDefaults.DEFAULT_GRID_COLUMNS;

  return { canvasWidth: canvasWidth, columnSpace };
}
