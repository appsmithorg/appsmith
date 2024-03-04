import type { SnipingModeProperty } from "WidgetProvider/types";
import type { PropertyUpdates } from "constants/PropertyControlConstants";

export const methodsConfig = {
  getSnipingModeUpdates: (
    propValueMap: SnipingModeProperty,
  ): PropertyUpdates[] => {
    return [
      {
        propertyPath: "defaultCheckedState",
        propertyValue: propValueMap.data,
        isDynamicPropertyPath: true,
      },
    ];
  },
};
