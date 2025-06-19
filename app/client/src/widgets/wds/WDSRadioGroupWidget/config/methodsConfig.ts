import type {
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/types";
import { RadioGroupIcon, RadioGroupThumbnail } from "appsmith-icons";

export const methodsConfig = {
  getSnipingModeUpdates: (
    propValueMap: SnipingModeProperty,
  ): PropertyUpdates[] => {
    return [
      {
        propertyPath: "options",
        propertyValue: propValueMap.data,
        isDynamicPropertyPath: true,
      },
    ];
  },
  IconCmp: RadioGroupIcon,
  ThumbnailCmp: RadioGroupThumbnail,
};
