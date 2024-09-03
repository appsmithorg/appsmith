import type { WidgetProps } from "widgets/BaseWidget";
import type { PropertyUpdates } from "WidgetProvider/constants";

import type { InputType } from "./types";
import { INPUT_TYPE_TO_WIDGET_TYPE_MAP } from "./constants";

export function isReadOnlyUpdateHook(
  props: WidgetProps,
  propertyName: string,
  propertyValue: boolean,
) {
  const updates: PropertyUpdates[] = [
    {
      propertyPath: propertyName,
      propertyValue: propertyValue,
    },
  ];

  // if user is marking readOnly as true and if the input type is not INPUT_CURRENCY_WIDGET or INPUT_PHONE_WIDGET,
  // then we update the type to WDS_KEY_VALUE_WIDGET, else we update the type based on the input type
  if (
    !["WDS_CURRENCY_INPUT_WIDGET", "WDS_PHONE_INPUT_WIDGET"].includes(
      props.type,
    )
  ) {
    updates.push({
      propertyPath: "type",
      propertyValue: propertyValue
        ? "WDS_KEY_VALUE_WIDGET"
        : INPUT_TYPE_TO_WIDGET_TYPE_MAP[props.inputType as InputType],
    });
  }

  return updates;
}
