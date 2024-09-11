import type { UpdatePropertyArgs } from "sagas/WidgetBlueprintSagas";

/**
 * Util method that makes it easier
 * and takes in readable updates and converts them to blueprint updates
 * @param widgetUpdates
 * @returns
 */
export function getWidgetBluePrintUpdates(widgetUpdates: {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}): UpdatePropertyArgs[] {
  const widgetIds = Object.keys(widgetUpdates);

  const updates: UpdatePropertyArgs[] = [];

  for (const widgetId of widgetIds) {
    const updateProps = widgetUpdates[widgetId];

    if (updateProps) {
      const propertyNames = Object.keys(updateProps);

      for (const propertyName of propertyNames) {
        updates.push({
          widgetId: widgetId,
          propertyName: propertyName,
          propertyValue: updateProps[propertyName],
        });
      }
    }
  }

  return updates;
}
