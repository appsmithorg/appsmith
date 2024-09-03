import type { PropertyUpdates } from "WidgetProvider/constants";
import type { WidgetProps } from "widgets/BaseWidget";

import { FONT_SIZE_TO_WIDGET_TYPE_MAP } from "./constants";

export function fontSizeUpdateHook(
  props: WidgetProps,
  propertyName: string,
  propertyValue: string,
) {
  const updates: PropertyUpdates[] = [
    {
      propertyPath: propertyName,
      propertyValue: propertyValue,
    },
  ];

  updates.push({
    propertyPath: "type",
    propertyValue:
      FONT_SIZE_TO_WIDGET_TYPE_MAP[
        propertyValue as keyof typeof FONT_SIZE_TO_WIDGET_TYPE_MAP
      ],
  });

  return updates;
}
