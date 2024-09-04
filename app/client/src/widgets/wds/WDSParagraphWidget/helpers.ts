import type { PropertyUpdates } from "WidgetProvider/constants";
import type { WidgetProps } from "widgets/BaseWidget";

import { FONT_SIZE_TO_WIDGET_TYPE_MAP } from "./constants";

export function fontSizeUpdateHook(
  props: WidgetProps,
  propertyName: string,
  propertyValue: keyof typeof FONT_SIZE_TO_WIDGET_TYPE_MAP,
) {
  const updates: PropertyUpdates[] = [
    {
      propertyPath: propertyName,
      propertyValue: propertyValue,
    },
  ];

  updates.push({
    propertyPath: "type",
    propertyValue: FONT_SIZE_TO_WIDGET_TYPE_MAP[propertyValue],
  });

  return updates;
}
