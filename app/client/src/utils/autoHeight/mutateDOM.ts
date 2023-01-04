import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";

// Here the data structure is the `widgetsToUpdate` data structure. If possible, we should create the `updates`
// we use in the function directly in the `widgets.ts` (auto height saga)
// This way, we can avoid looping again in this place.
export function directlyMutateDOMNodes(
  widgetsToUpdate: Record<
    string,
    Array<{ propertyPath: string; propertyValue: unknown }>
  >,
): void {
  const updates: Record<
    string,
    Record<string, number>
  > = getNodesAndStylesToUpdate(widgetsToUpdate);
  for (const widgetId in updates) {
    let idSelector = widgetId;
    let height = updates[widgetId].height;
    if (widgetId === MAIN_CONTAINER_WIDGET_ID) {
      idSelector = "art-board";
      height =
        updates[widgetId].height -
        CONTAINER_GRID_PADDING * 2 -
        GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
    }
    const widgetNode = document.getElementById(idSelector);
    const dropTarget = widgetNode?.querySelector(`.drop-target-${widgetId}`);

    console.log("Auto Height: ", {
      updates,
      dropTarget,
      widgetNode,
      widgetsToUpdate,
    });

    if (widgetNode) {
      widgetNode.style.height = `${height}px`;
      widgetNode.style.top = `${updates[widgetId].y}px`;

      if (dropTarget) {
        const dropTargetHeight =
          updates[widgetId].height - CONTAINER_GRID_PADDING * 2;
        (dropTarget as HTMLElement).style.height = `${dropTargetHeight}px`;
      }
    }
  }
}

function getNodesAndStylesToUpdate(
  widgetsToUpdate: Record<
    string,
    Array<{ propertyPath: string; propertyValue: unknown }>
  >,
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const widgetId in widgetsToUpdate) {
    const propertiesToUpdate: Record<string, unknown> = {};
    for (const propertyUpdate of widgetsToUpdate[widgetId]) {
      propertiesToUpdate[propertyUpdate.propertyPath] =
        propertyUpdate.propertyValue;
    }
    let height = 0;
    let y = 0;
    if (propertiesToUpdate.topRow !== undefined) {
      height =
        ((propertiesToUpdate.bottomRow as number) -
          (propertiesToUpdate.topRow as number)) *
        GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
      y =
        (propertiesToUpdate.topRow as number) *
        GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
    } else {
      height = propertiesToUpdate.bottomRow as number;
    }
    result[widgetId] = { y, height };
  }
  return result;
}
