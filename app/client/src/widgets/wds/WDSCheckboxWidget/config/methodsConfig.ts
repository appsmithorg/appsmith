import type {
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/constants";

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
