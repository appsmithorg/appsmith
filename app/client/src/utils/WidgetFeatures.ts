import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
} from "constants/PropertyControlConstants";
import type { WidgetType } from "constants/WidgetConstants";
import { GridDefaults, WidgetHeightLimits } from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type BaseWidget from "widgets/BaseWidget";

export enum RegisteredWidgetFeatures {
  DYNAMIC_HEIGHT = "dynamicHeight",
}

interface WidgetFeatureConfig {
  active: boolean;
  defaultValue?: DynamicHeight;
  sectionIndex: number;
  helperText?: (props?: WidgetProps) => PropertyPaneControlConfig["helperText"];
}

export type WidgetFeatures = Record<
  RegisteredWidgetFeatures,
  WidgetFeatureConfig
>;

export enum DynamicHeight {
  AUTO_HEIGHT = "AUTO_HEIGHT",
  FIXED = "FIXED",
  AUTO_HEIGHT_WITH_LIMITS = "AUTO_HEIGHT_WITH_LIMITS",
}

/* This contains all properties which will be added
   to a widget, automatically, by the Appsmith platform
   Each feature, is a unique key, whose value is an object
   with the list of properties to be added to a widget along
   with their default values

   Note: These are added to the widget configs during registration
*/
export const WidgetFeatureProps: Record<
  RegisteredWidgetFeatures,
  Record<string, unknown>
> = {
  [RegisteredWidgetFeatures.DYNAMIC_HEIGHT]: {
    minDynamicHeight: WidgetHeightLimits.MIN_HEIGHT_IN_ROWS,
    maxDynamicHeight: WidgetHeightLimits.MAX_HEIGHT_IN_ROWS,
    dynamicHeight: DynamicHeight.FIXED,
  },
};

export const WidgetFeaturePropertyEnhancements: Record<
  RegisteredWidgetFeatures,
  (config: typeof BaseWidget) => Record<string, unknown>
> = {
  [RegisteredWidgetFeatures.DYNAMIC_HEIGHT]: (widget: typeof BaseWidget) => {
    const features = widget.getFeatures();
    const defaults = widget.getDefaults();
    const config = widget.getConfig();

    const newProperties: Partial<WidgetProps> = {};
    newProperties.dynamicHeight =
      features?.dynamicHeight?.defaultValue || DynamicHeight.AUTO_HEIGHT;
    if (config.isCanvas) {
      newProperties.dynamicHeight = DynamicHeight.AUTO_HEIGHT;
      newProperties.minDynamicHeight =
        defaults.minDynamicHeight ||
        WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS;
      newProperties.maxDynamicHeight =
        defaults.maxDynamicHeight || WidgetHeightLimits.MAX_HEIGHT_IN_ROWS;
      newProperties.shouldScrollContents = true;
    } else {
      newProperties.minDynamicHeight =
        defaults.minDynamicHeight || WidgetHeightLimits.MIN_HEIGHT_IN_ROWS;
      newProperties.maxDynamicHeight =
        defaults.maxDynamicHeight || WidgetHeightLimits.MAX_HEIGHT_IN_ROWS;
    }
    if (defaults.overflow) newProperties.overflow = "NONE";
    return newProperties;
  },
};

function findAndUpdatePropertyPaneControlConfig(
  config: PropertyPaneConfig[],
  propertyPaneUpdates: Record<string, Record<string, unknown>>,
): PropertyPaneConfig[] {
  return config.map((sectionConfig: PropertyPaneConfig) => {
    if (
      Array.isArray(sectionConfig.children) &&
      sectionConfig.children.length > 0
    ) {
      Object.keys(propertyPaneUpdates).forEach((propertyName: string) => {
        const controlConfigIndex: number | undefined =
          sectionConfig.children?.findIndex(
            (controlConfig: PropertyPaneConfig) =>
              (controlConfig as PropertyPaneControlConfig).propertyName ===
              propertyName,
          );

        if (
          controlConfigIndex !== undefined &&
          controlConfigIndex > -1 &&
          sectionConfig.children
        ) {
          sectionConfig.children[controlConfigIndex] = {
            ...sectionConfig.children[controlConfigIndex],
            ...propertyPaneUpdates[propertyName],
          };
        }
      });
    }
    return sectionConfig;
  });
}

export const WidgetFeaturePropertyPaneEnhancements: Record<
  RegisteredWidgetFeatures,
  (
    config: PropertyPaneConfig[],
    widgetType?: WidgetType,
  ) => PropertyPaneConfig[]
> = {
  [RegisteredWidgetFeatures.DYNAMIC_HEIGHT]: (
    config: PropertyPaneConfig[],
    widgetType?: WidgetType,
  ) => {
    function hideWhenDynamicHeightIsEnabled(props: WidgetProps) {
      return (
        props.dynamicHeight === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS ||
        props.dynamicHeight === DynamicHeight.AUTO_HEIGHT
      );
    }
    let update = findAndUpdatePropertyPaneControlConfig(config, {
      shouldScrollContents: {
        hidden: hideWhenDynamicHeightIsEnabled,
        dependencies: ["dynamicHeight"],
      },
      scrollContents: {
        hidden: hideWhenDynamicHeightIsEnabled,
        dependencies: ["dynamicHeight"],
      },
      fixedFooter: {
        hidden: hideWhenDynamicHeightIsEnabled,
        dependencies: ["dynamicHeight"],
      },
      overflow: {
        hidden: hideWhenDynamicHeightIsEnabled,
        dependencies: ["dynamicHeight"],
      },
    });
    if (widgetType === "MODAL_WIDGET") {
      update = findAndUpdatePropertyPaneControlConfig(update, {
        dynamicHeight: {
          options: [
            {
              label: "Auto Height",
              value: DynamicHeight.AUTO_HEIGHT,
            },
            {
              label: "Fixed",
              value: DynamicHeight.FIXED,
            },
          ],
        },
      });
    }
    return update;
  },
};

/* Hide the min height and max height properties using this function
   as the `hidden` hook in the property pane configuration
   This function checks if the `dynamicHeight` property is enabled
   and returns true if disabled, and false if enabled.
*/
export function hideDynamicHeightPropertyControl(props: WidgetProps) {
  return props.dynamicHeight !== DynamicHeight.AUTO_HEIGHT_WITH_LIMITS;
}

// TODO (abhinav): ADD_UNIT_TESTS
function updateMinMaxDynamicHeight(
  props: WidgetProps,
  propertyName: string,
  propertyValue: unknown,
) {
  const updates = [
    {
      propertyPath: propertyName,
      propertyValue: propertyValue,
    },
  ];

  if (propertyValue === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS) {
    const minDynamicHeight = parseInt(props.minDynamicHeight, 10);

    if (
      isNaN(minDynamicHeight) ||
      minDynamicHeight < WidgetHeightLimits.MIN_HEIGHT_IN_ROWS
    ) {
      updates.push({
        propertyPath: "minDynamicHeight",
        propertyValue: WidgetHeightLimits.MIN_HEIGHT_IN_ROWS,
      });
    }
    const maxDynamicHeight = parseInt(props.maxDynamicHeight, 10);
    if (
      isNaN(maxDynamicHeight) ||
      maxDynamicHeight === WidgetHeightLimits.MAX_HEIGHT_IN_ROWS ||
      maxDynamicHeight <= WidgetHeightLimits.MIN_HEIGHT_IN_ROWS
    ) {
      updates.push({
        propertyPath: "maxDynamicHeight",
        propertyValue:
          props.bottomRow - props.topRow + GridDefaults.CANVAS_EXTENSION_OFFSET,
      });
    }

    // Case where maxDynamicHeight is zero
    if (isNaN(maxDynamicHeight) || maxDynamicHeight === 0) {
      updates.push({
        propertyPath: "maxDynamicHeight",
        propertyValue: props.bottomRow - props.topRow,
      });
    }
  } else if (propertyValue === DynamicHeight.AUTO_HEIGHT) {
    const minHeightInRows = props.isCanvas
      ? WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS
      : WidgetHeightLimits.MIN_HEIGHT_IN_ROWS;
    updates.push(
      {
        propertyPath: "minDynamicHeight",
        propertyValue: minHeightInRows,
      },
      {
        propertyPath: "maxDynamicHeight",
        propertyValue: WidgetHeightLimits.MAX_HEIGHT_IN_ROWS,
      },
    );
  }

  if (propertyValue === DynamicHeight.FIXED) {
    updates.push({
      propertyPath: "originalBottomRow",
      propertyValue: undefined,
    });
    updates.push({
      propertyPath: "originalTopRow",
      propertyValue: undefined,
    });
  }

  // The following are updates which apply to specific widgets.
  if (
    propertyValue === DynamicHeight.AUTO_HEIGHT ||
    propertyValue === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS
  ) {
    if (props.dynamicHeight === DynamicHeight.FIXED) {
      updates.push({
        propertyPath: "originalBottomRow",
        propertyValue: props.bottomRow,
      });
      updates.push({
        propertyPath: "originalTopRow",
        propertyValue: props.topRow,
      });
    }
    if (!props.shouldScrollContents) {
      updates.push({
        propertyPath: "shouldScrollContents",
        propertyValue: true,
      });
    }
    if (props.overflow !== undefined) {
      updates.push({
        propertyPath: "overflow",
        propertyValue: "NONE",
      });
    }
    if (props.scrollContents === true) {
      updates.push({
        propertyPath: "scrollContents",
        propertyValue: false,
      });
    }
    if (props.fixedFooter === true) {
      updates.push({
        propertyPath: "fixedFooter",
        propertyValue: false,
      });
    }
  }

  return updates;
}

// TODO FEATURE:(abhinav) Add validations to these properties

const CONTAINER_SCROLL_HELPER_TEXT =
  "This widget shows an internal scroll when you add widgets in edit mode. It'll resize after you've added widgets. The scroll won't exist in view mode.";

export const PropertyPaneConfigTemplates: Record<
  RegisteredWidgetFeatures,
  (featureConfig: WidgetFeatureConfig) => PropertyPaneConfig[]
> = {
  [RegisteredWidgetFeatures.DYNAMIC_HEIGHT]: (featureConfig) => [
    {
      helpText:
        "Auto Height: Configure the way the widget height reacts to content changes.",
      propertyName: "dynamicHeight",
      label: "Height",
      controlType: "DROP_DOWN",
      isBindProperty: false,
      isTriggerProperty: false,
      dependencies: [
        "shouldScrollContents",
        "maxDynamicHeight",
        "minDynamicHeight",
        "bottomRow",
        "topRow",
        "overflow",
        "dynamicHeight",
        "isCanvas",
      ],
      updateHook: updateMinMaxDynamicHeight,
      //TODO: Canvas widgets should also use the helper text config of dynamic height feature
      // instead of using a hardcoded string
      helperText: (props: WidgetProps) => {
        return props.isCanvas &&
          props.dynamicHeight === DynamicHeight.AUTO_HEIGHT
          ? CONTAINER_SCROLL_HELPER_TEXT
          : featureConfig.helperText?.(props) || "";
      },
      options: [
        {
          label: "Auto Height",
          value: DynamicHeight.AUTO_HEIGHT,
        },
        {
          label: "Auto Height with limits",
          value: DynamicHeight.AUTO_HEIGHT_WITH_LIMITS,
        },
        {
          label: "Fixed",
          value: DynamicHeight.FIXED,
        },
      ],
      postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
    },
  ],
};
