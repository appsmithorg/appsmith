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
        propertyPath: "onClick",
        propertyValue: propValueMap.run,
        isDynamicPropertyPath: true,
      },
    ];
  },
};
