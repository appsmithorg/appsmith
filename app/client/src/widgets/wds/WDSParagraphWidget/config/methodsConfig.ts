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
        propertyPath: "text",
        propertyValue: propValueMap.data,
        isDynamicPropertyPath: true,
      },
    ];
  },
};
