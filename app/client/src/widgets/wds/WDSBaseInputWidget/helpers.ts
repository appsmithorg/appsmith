import type { WidgetProps } from "widgets/BaseWidget";
import type { PropertyUpdates } from "WidgetProvider/constants";
import type { InputType } from "../WDSInputWidget/component/types";
import { INPUT_TYPE_TO_WIDGET_TYPE_MAP } from "../WDSInputWidget/constants";

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
  // then we need to update the type to WDS_KEY_VALUE_WIDGET
  if (
    !["WDS_CURRENCY_INPUT_WIDGET", "WDS_PHONE_INPUT_WIDGET"].includes(
      props.type,
    )
  ) {
    if (propertyValue) {
      updates.push({
        propertyPath: "type",
        propertyValue: "WDS_KEY_VALUE_WIDGET",
      });
    } else {
      updates.push({
        propertyPath: "type",
        propertyValue:
          INPUT_TYPE_TO_WIDGET_TYPE_MAP[props.inputType as InputType],
      });
    }
  }

  return updates;
}
