import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { WidgetProps } from "widgets/BaseWidget";

export interface WidgetFeatures {
  dynamicHeight: boolean;
}

export enum DynamicHeight {
  HUG_CONTENTS = "HUG_CONTENTS",
  FIXED = "FIXED",
}

export const WidgetFeatureProps = {
  DYNAMIC_HEIGHT: {
    minDynamicHeight: 0,
    maxDynamicHeight: 0,
    dynamicHeight: DynamicHeight.FIXED,
  },
};

export function hideDynamicHeightPropertyControl(props: WidgetProps) {
  return props.dynamicHeight !== DynamicHeight.HUG_CONTENTS;
}

export const PropertyPaneConfigTemplates: Record<string, PropertyPaneConfig> = {
  DYNAMIC_HEIGHT: {
    sectionName: "Layout Features",
    children: [
      {
        helpText:
          "Dynamic Height: Configure the way the widget height react to content changes.",
        propertyName: "dynamicHeight",
        label: "Height",
        controlType: "DROP_DOWN",
        isBindProperty: false,
        isTriggerProperty: false,
        options: [
          {
            label: "Hug Contents",
            value: DynamicHeight.HUG_CONTENTS,
          },
          {
            label: "Fixed",
            value: DynamicHeight.FIXED,
          },
        ],
      },
      {
        propertyName: "minDynamicHeight",
        label: "Min Height (in rows)",
        helpText: "Minimum number of rows to occupy irrespective of contents",
        controlType: "INPUT_TEXT",
        hidden: hideDynamicHeightPropertyControl,
        dependencies: ["dynamicHeight"],
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "maxDynamicHeight",
        label: "Max Height (in rows)",
        helpText: "Maximum Height, after which contents will scroll",
        controlType: "INPUT_TEXT",
        dependencies: ["dynamicHeight"],
        hidden: hideDynamicHeightPropertyControl,
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
      },
    ],
  },
};
