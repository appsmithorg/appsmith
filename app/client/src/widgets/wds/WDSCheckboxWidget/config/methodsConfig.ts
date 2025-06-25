import type {
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/types";
import { CheckboxIcon, CheckboxThumbnail } from "appsmith-icons";

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
  IconCmp: CheckboxIcon,
  ThumbnailCmp: CheckboxThumbnail,
};
