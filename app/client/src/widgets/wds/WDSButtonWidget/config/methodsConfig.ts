import type {
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/types";
import { ButtonIcon, ButtonThumbnail } from "appsmith-icons";

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
  IconCmp: ButtonIcon,
  ThumbnailCmp: ButtonThumbnail,
};
