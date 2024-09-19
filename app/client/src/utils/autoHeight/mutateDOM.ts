import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { Classes } from "@blueprintjs/core";

// Here the data structure is the `widgetsToUpdate` data structure. If possible, we should create the `updates`
// we use in the function directly in the `widgets.ts` (auto height saga)
// This way, we can avoid looping again in this place.
export function getNodesAndStylesToUpdate(
  widgetsToUpdate: Record<
    string,
    Array<{ propertyPath: string; propertyValue: number }>
  >,
  widgetsMeasuredInPixels: string[],
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};

  // For each widget which has changes
  for (const widgetId in widgetsToUpdate) {
    const propertiesToUpdate: Record<string, number> = {};

    // For each update in this widget
    for (const propertyUpdate of widgetsToUpdate[widgetId]) {
      // add to the data structure which is a key value pair.
      propertiesToUpdate[propertyUpdate.propertyPath] =
        propertyUpdate.propertyValue;
    }

    // Start with top and height as 0
    let height = 0;
    let y = 0;

    // If topRow is not defined, it is most likely the main container
    if (propertiesToUpdate.topRow === undefined) {
      propertiesToUpdate.topRow = 0;
    }

    // If we have already measured in pixels, we don't need to multiply with row height
    const multiplier = widgetsMeasuredInPixels.includes(widgetId)
      ? 1
      : GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    if (propertiesToUpdate.height) {
      height = propertiesToUpdate.height * multiplier;
    } else {
      height =
        (propertiesToUpdate.bottomRow - propertiesToUpdate.topRow) * multiplier;
    }

    y = propertiesToUpdate.topRow * multiplier + CONTAINER_GRID_PADDING;

    result[widgetId] = { y, height };
  }

  return result;
}

export function directlyMutateDOMNodes(
  widgetsToUpdate: Record<
    string,
    Array<{ propertyPath: string; propertyValue: number }>
  >,
  widgetsMeasuredInPixels: string[],
  widgetCanvasOffsets: Record<string, number>,
): void {
  const updates: Record<
    string,
    Record<string, number>
  > = getNodesAndStylesToUpdate(widgetsToUpdate, widgetsMeasuredInPixels);

  for (const widgetId in updates) {
    const idSelector = widgetId;
    const height = updates[widgetId].height;
    let skipTop = false;

    // Special handling for Modal widget 🤢
    // TODO(abhinav): We need to re-structure the modal widget, possibly get away from blueprintjs
    // Better yet, find a way that doesn't have to deal with these abstraction leaks.
    let widgetNode = document.getElementById(idSelector);

    if (
      widgetsMeasuredInPixels.indexOf(widgetId) > -1 &&
      widgetId !== MAIN_CONTAINER_WIDGET_ID
    ) {
      // We need to select the modal widget's parent overlay to adjust size.
      widgetNode = (widgetNode?.closest(`.${Classes.OVERLAY_CONTENT}`) ||
        null) as HTMLElement | null;
      // We don't mess with the top, and let the widget handle it.
      skipTop = true;
    }

    const widgetBoundary = document.querySelector(
      `.widget-boundary-${widgetId}`,
    );

    if (widgetBoundary) {
      (widgetBoundary as HTMLDivElement).style.opacity = "0";
    }

    const dropTarget = widgetNode?.querySelector(`.drop-target-${widgetId}`);

    if (widgetNode) {
      widgetNode.style.height = `${height}px`;

      // For some widgets the top is going to be useless,
      // for example, modal widget and main container
      if (!skipTop) {
        widgetNode.style.top = `${updates[widgetId].y}px`;
      }

      if (dropTarget) {
        const dropTargetHeight =
          updates[widgetId].height -
          CONTAINER_GRID_PADDING * 2 -
          (widgetCanvasOffsets[widgetId] || 0) *
            GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

        (dropTarget as HTMLElement).style.height = `${dropTargetHeight}px`;
      }
    }
  }
}
