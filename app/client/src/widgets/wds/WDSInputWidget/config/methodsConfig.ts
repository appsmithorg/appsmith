import type {
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/constants";
import { InputIcon, InputThumbnail } from "appsmith-icons";

export const methodsConfig = {
  getSnipingModeUpdates: (
    propValueMap: SnipingModeProperty,
  ): PropertyUpdates[] => {
    return [
      {
        propertyPath: "defaultText",
        propertyValue: propValueMap.data,
        isDynamicPropertyPath: true,
      },
    ];
  },
  IconCmp: InputIcon,
  ThumbnailCmp: InputThumbnail,
};
