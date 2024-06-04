import type {
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/constants";
import { ParagraphIcon, ParagraphThumbnail } from "appsmith-icons";

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
  IconCmp: ParagraphIcon,
  ThumbnailCmp: ParagraphThumbnail,
};
