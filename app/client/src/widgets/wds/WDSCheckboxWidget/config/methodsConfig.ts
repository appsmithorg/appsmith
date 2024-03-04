import type {
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/types";

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
