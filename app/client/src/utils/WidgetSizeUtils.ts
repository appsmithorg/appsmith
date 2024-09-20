import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { WidgetType } from "../WidgetProvider/factory";
import WidgetFactory from "../WidgetProvider/factory";

/**
 * This returns the number of rows which is not occupied by a Canvas Widget within
 * a parent container like widget of type widgetType
 * For example, the Tabs Widget takes 4 rows for the tabs
 * @param widgetType Type of widget
 * @param props Widget properties
 * @returns the offset in rows
 */
export const getCanvasHeightOffset = (
  widgetType: WidgetType,
  props: WidgetProps,
) => {
  const { getCanvasHeightOffset } = WidgetFactory.getWidgetMethods(widgetType);
  let offset = 0;

  if (getCanvasHeightOffset) {
    offset = getCanvasHeightOffset(props);
  }

  return offset;
};

/**
 * This function computes the heights of canvas widgets which may be effected by the changes in other widget properties (updatedWidgetIds)
 * @param updatedWidgetIds Widgets which have updated
 * @param canvasWidgets The widgets in the redux state, used for computations
 * @returns A list of canvas widget ids with their heights in pixels
 */
export function getCanvasWidgetHeightsToUpdate(
  updatedWidgetIds: string[],
  canvasWidgets: Record<string, FlattenedWidgetProps>,
): Record<string, number> {
  const updatedCanvasWidgets: Record<string, number> = {};

  for (const widgetId of updatedWidgetIds) {
    const widget = canvasWidgets[widgetId];

    if (widget) {
      if (
        widget.type !== "CANVAS_WIDGET" &&
        Array.isArray(widget.children) &&
        widget.children.length > 0
      ) {
        for (const childCanvasWidgetId of widget.children) {
          if (!updatedCanvasWidgets.hasOwnProperty(childCanvasWidgetId)) {
            const bottomRow = getCanvasBottomRow(
              childCanvasWidgetId,
              canvasWidgets,
            );

            if (bottomRow > 0) {
              updatedCanvasWidgets[childCanvasWidgetId] = bottomRow;
            }
          }
        }
      }

      if (widget.parentId) {
        if (!updatedCanvasWidgets.hasOwnProperty(widget.parentId)) {
          const bottomRow = getCanvasBottomRow(widget.parentId, canvasWidgets);

          if (bottomRow > 0) updatedCanvasWidgets[widget.parentId] = bottomRow;
        }
      }
    } else {
      // This usually means, that we're deleting a widget.
      if (!updatedCanvasWidgets.hasOwnProperty(MAIN_CONTAINER_WIDGET_ID)) {
        const bottomRow = getCanvasBottomRow(
          MAIN_CONTAINER_WIDGET_ID,
          canvasWidgets,
        );

        if (bottomRow > 0)
          updatedCanvasWidgets[MAIN_CONTAINER_WIDGET_ID] = bottomRow;
      }
    }
  }

  return updatedCanvasWidgets;
}

/**
 * A function to compute the height of a given canvas widget (canvasWidgetId) in pixels
 * @param canvasWidgetId The CANVAS_WIDGET's widgetId. This canvas widget is the one whose bottomRow we need to compute
 * @param canvasWidgets The widgets in the redux state. We use this to get appropriate info regarding types, parent and children for computations
 * @returns The canvas widget's height in pixels (this is also the minHight and bottomRow property values)
 */
export function getCanvasBottomRow(
  canvasWidgetId: string,
  canvasWidgets: Record<string, FlattenedWidgetProps>,
) {
  const canvasWidget = canvasWidgets[canvasWidgetId];

  // If this widget is not defined
  // It is likely a part of the list widget's canvases
  if (canvasWidget === undefined) {
    return 0;
  }

  // If this widget is not a CANVAS_WIDGET
  if (canvasWidget.type !== "CANVAS_WIDGET") {
    return canvasWidget.bottomRow;
  }

  const children = canvasWidget.children;
  let parentHeightInRows = Math.ceil(
    canvasWidget.bottomRow / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  );

  // Hypothetical thoughts:
  // If this is the MainContainer
  // We need some special handling.
  // What we can do is use the viewport height and compute the minimum using that
  // in the edit mode
  // In the view mode, we can do the same?
  // This is because, we might have changed the "bottomRow" somewhere and that will
  // cause it to consider that value, and give us a large scroll.

  if (canvasWidget.parentId) {
    const parentWidget = canvasWidgets[canvasWidget.parentId];

    // If the parent widget is undefined but the parentId exists
    // It is likely a part of the list widget
    if (parentWidget === undefined) {
      return 0;
    }

    // If the parent is list widget, let's return the canvasWidget.bottomRow
    // We'll be handling this specially in withWidgetProps
    if (parentWidget.type === "LIST_WIDGET") {
      return canvasWidget.bottomRow;
    }

    // Widgets like Tabs widget have an offset we need to subtract
    const parentHeightOffset = getCanvasHeightOffset(
      parentWidget.type,
      parentWidget,
    );

    // The parent's height in rows
    parentHeightInRows = parentWidget.bottomRow - parentWidget.topRow;

    // If the parent is modal widget, we need to consider the `height` instead
    // of the bottomRow
    // TODO(abhinav): We could use one or the other and not have both, maybe
    // update the bottomRow of the modal widget instead?
    if (parentWidget.type === "MODAL_WIDGET" && parentWidget.height) {
      parentHeightInRows = Math.floor(
        parentWidget.height / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      );
    }

    // Subtract the canvas offset due to some parent elements
    parentHeightInRows = parentHeightInRows - parentHeightOffset;
  } else {
    parentHeightInRows =
      CANVAS_DEFAULT_MIN_HEIGHT_PX / GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
  }

  if (Array.isArray(children) && children.length > 0) {
    const bottomRow = children.reduce((prev, next) => {
      if (canvasWidgets[next].detachFromLayout) {
        return prev;
      }

      if (canvasWidgets[next].bottomRow === canvasWidgets[next].topRow) {
        return prev;
      }

      return canvasWidgets[next].bottomRow > prev
        ? canvasWidgets[next].bottomRow
        : prev;
    }, parentHeightInRows);

    return bottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
  }

  return parentHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
}
