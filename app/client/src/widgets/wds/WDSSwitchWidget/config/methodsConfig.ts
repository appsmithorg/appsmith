import type {
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/constants";
import { SwitchIcon, SwitchThumbnail } from "appsmith-icons";

export const methodsConfig = {
  getSnipingModeUpdates: (
    propValueMap: SnipingModeProperty,
  ): PropertyUpdates[] => {
    return [
      {
        propertyPath: "defaultSwitchState",
        propertyValue: propValueMap.data,
        isDynamicPropertyPath: true,
      },
    ];
  },
  IconCmp: SwitchIcon,
  ThumbnailCmp: SwitchThumbnail,
};
