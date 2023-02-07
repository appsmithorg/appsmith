import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import {
  AlignItems,
  Alignment,
  FlexDirection,
  FlexVerticalAlignment,
  JustifyContent,
  LayoutDirection,
  Positioning,
  ResponsiveBehavior,
  Spacing,
} from "utils/autoLayout/constants";
import { ValidationTypes } from "constants/WidgetValidation";

export interface LayoutProperties {
  flexDirection: FlexDirection;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
}

export const horizontalAlignment: { [key in Alignment]: LayoutProperties } = {
  top: {
    flexDirection: FlexDirection.Row,
    justifyContent: JustifyContent.FlexStart,
    alignItems: AlignItems.FlexStart,
  },
  bottom: {
    flexDirection: FlexDirection.Row,
    justifyContent: JustifyContent.FlexStart,
    alignItems: AlignItems.FlexEnd,
  },
  left: {
    flexDirection: FlexDirection.Row,
    justifyContent: JustifyContent.FlexStart,
    alignItems: AlignItems.FlexStart,
  },
  right: {
    flexDirection: FlexDirection.RowReverse,
    justifyContent: JustifyContent.FlexStart,
    alignItems: AlignItems.FlexStart,
  },
};

export const verticalAlignment: { [key in Alignment]: LayoutProperties } = {
  top: {
    flexDirection: FlexDirection.Column,
    justifyContent: JustifyContent.FlexStart,
    alignItems: AlignItems.Center,
  },
  bottom: {
    flexDirection: FlexDirection.ColumnReverse,
    justifyContent: JustifyContent.FlexStart,
    alignItems: AlignItems.Center,
  },
  left: {
    flexDirection: FlexDirection.Column,
    justifyContent: JustifyContent.FlexStart,
    alignItems: AlignItems.FlexStart,
  },
  right: {
    flexDirection: FlexDirection.Column,
    justifyContent: JustifyContent.FlexStart,
    alignItems: AlignItems.FlexEnd,
  },
};

export function getLayoutProperties(
  direction: LayoutDirection = LayoutDirection.Horizontal,
  alignment: Alignment,
  spacing: Spacing,
): LayoutProperties {
  let properties: LayoutProperties =
    direction === LayoutDirection.Horizontal
      ? horizontalAlignment[alignment]
      : verticalAlignment[alignment];
  if (spacing !== Spacing.None) {
    properties = {
      ...properties,
      justifyContent:
        spacing === Spacing.Equal
          ? JustifyContent.SpaceEvenly
          : JustifyContent.SpaceBetween,
    };
  }
  return properties;
}

export const generateResponsiveBehaviorConfig = (
  value: ResponsiveBehavior,
): any => {
  return {
    helpText: "Widget layout behavior on smaller view port",
    propertyName: "responsiveBehavior",
    label: "Responsive behavior",
    controlType: "DROP_DOWN",
    defaultValue: value || ResponsiveBehavior.Hug,
    options: [
      { label: "Fill", value: ResponsiveBehavior.Fill },
      { label: "Hug", value: ResponsiveBehavior.Hug },
    ],
    isJSConvertible: false,
    isBindProperty: false,
    isTriggerProperty: true,
    validation: { type: ValidationTypes.TEXT },
    additionalAction: (
      props: any,
      propertyName?: string,
      propertyValue?: any,
    ) => ({
      type: ReduxActionTypes.UPDATE_FILL_CHILD_LAYER,
      payload: {
        widgetId: props.widgetId,
        responsiveBehavior: propertyValue,
      },
    }),
    dependencies: ["widgetId"],
  };
};

export const generateAlignmentConfig = (
  value: Alignment = Alignment.Left,
): any => {
  return {
    helpText:
      "Alignment of children with respect to this parent (applies to Stack positioning)",
    propertyName: "alignment",
    label: "Alignment",
    controlType: "DROP_DOWN",
    defaultValue: value,
    options: [
      { label: "Top", value: Alignment.Top },
      { label: "Bottom", value: Alignment.Bottom },
      { label: "Left", value: Alignment.Left },
      { label: "Right", value: Alignment.Right },
    ],
    isJSConvertible: true,
    isBindProperty: false,
    isTriggerProperty: true,
    validation: { type: ValidationTypes.TEXT },
    hidden: (props: any) => props?.positioning === Positioning.Fixed,
  };
};

export const generateSpacingConfig = (value: Spacing = Spacing.None): any => {
  return {
    helpText: "Spacing between the children (applies to Stack positioning)",
    propertyName: "spacing",
    label: "Spacing",
    controlType: "DROP_DOWN",
    defaultValue: value,
    options: [
      { label: "None", value: Spacing.None },
      { label: "Equal", value: Spacing.Equal },
      { label: "Space between", value: Spacing.SpaceBetween },
    ],
    isJSConvertible: true,
    isBindProperty: false,
    isTriggerProperty: true,
    validation: { type: ValidationTypes.TEXT },
    hidden: (props: any) => props?.positioning === Positioning.Fixed,
  };
};

export const generatePositioningConfig = (
  value: Positioning = Positioning.Vertical,
): any => {
  return {
    helpText: "Position styles to be applied to the children",
    propertyName: "positioning",
    label: "Positioning",
    controlType: "DROP_DOWN",
    defaultValue: value,
    options: [
      { label: "Fixed", value: Positioning.Fixed },
      // { label: "Horizontal stack", value: Positioning.Horizontal },
      { label: "Vertical stack", value: Positioning.Vertical },
    ],
    isJSConvertible: false,
    isBindProperty: true,
    isTriggerProperty: true,
    validation: { type: ValidationTypes.TEXT },
    additionalAction: (
      props: any,
      propertyName?: string,
      propertyValue?: any,
    ) => {
      if (!propertyName || !propertyValue) return;
      const positioning: Positioning = propertyValue as Positioning;
      return {
        type:
          positioning === Positioning.Vertical
            ? ReduxActionTypes.ADD_CHILD_WRAPPERS
            : ReduxActionTypes.REMOVE_CHILD_WRAPPERS,
        payload: {
          parentId: props.widgetId,
        },
      };
    },
    dependencies: ["widgetId"],
  };
};

export const generateVerticalAlignmentConfig = (
  value: FlexVerticalAlignment = FlexVerticalAlignment.Top,
): any => {
  return {
    helpText: "Vertical alignment with respect to the siblings in the same row",
    propertyName: "flexVerticalAlignment",
    label: "Vertical Alignment",
    controlType: "DROP_DOWN",
    defaultValue: value,
    options: [
      { label: "Top", value: FlexVerticalAlignment.Top },
      { label: "Center", value: FlexVerticalAlignment.Center },
      { label: "Bottom", value: FlexVerticalAlignment.Bottom },
    ],
    isJSConvertible: false,
    isBindProperty: true,
    isTriggerProperty: true,
    validation: { type: ValidationTypes.TEXT },
  };
};

export function getLayoutConfig(alignment: Alignment, spacing: Spacing): any[] {
  return [generateAlignmentConfig(alignment), generateSpacingConfig(spacing)];
}

export const NonResizableWidgets = [
  "AUDIO_WIDGET",
  "BUTTON_WIDGET",
  "BUTTON_GROUP_WIDGET",
  "CHECKBOX_WIDGET",
  "CURRENCY_INPUT_WIDGET",
  "DATE_PICKER_WIDGET2",
  "DIVIDER_WIDGET",
  "FILE_PICKER_WIDGET_V2",
  "ICON_WIDGET",
  "ICON_BUTTON_WIDGET",
  "INPUT_WIDGET_V2",
  "MENU_BUTTON_WIDGET",
  "MULTI_SELECT_TREE_WIDGET",
  "MULTI_SELECT_WIDGET_V2",
  "PHONE_INPUT_WIDGET",
  "PROGRESS_WIDGET",
  "RATE_WIDGET",
  "SELECT_WIDGET",
  "SWITCH_WIDGET",
  "TEXT_WIDGET",
  "SINGLE_SELECT_TREE_WIDGET",
];

export const DefaultFillWidgets = [
  "CANVAS_WIDGET",
  "AUDIO_WIDGET",
  "AUDIO_RECORDER_WIDGET",
  "BASE_INPUT_WIDGET",
  "BUTTON_GROUP_WIDGET",
  "CHART_WIDGET",
  "CHECKBOX_WIDGET",
  "CHECKBOX_GROUP_WIDGET",
  "CURRENCY_INPUT_WIDGET",
  "CONTAINER_WIDGET",
  "DATE_PICKER_WIDGET2",
  "DIVIDER_WIDGET",
  "FORM_WIDGET",
  "FILE_PICKER_WIDGET_V2",
  "INPUT_WIDGET_V2",
  "JSON_FORM_WIDGET",
  "LIST_WIDGET",
  "MAP_WIDGET",
  "MULTI_SELECT_TREE_WIDGET",
  "MULTI_SELECT_WIDGET",
  "MULTI_SELECT_WIDGET_V2",
  "MENU_BUTTON_WIDGET",
  "PHONE_INPUT_WIDGET",
  "SELECT_WIDGET",
  "TEXT_WIDGET",
  "SINGLE_SELECT_TREE_WIDGET",
  "RICH_TEXT_EDITOR_WIDGET",
  "TABS_WIDGET",
  "TABLE_WIDGET_V2",
  "PROGRESS_WIDGET",
  "SWITCH_WIDGET",
];

export function getDefaultResponsiveBehavior(widgetType: string) {
  return DefaultFillWidgets.includes(widgetType)
    ? ResponsiveBehavior.Fill
    : ResponsiveBehavior.Hug;
}

export function getResponsiveLayoutConfig(widgetType: string) {
  // ToDO(Ashok): disabling for now, will be revisited at a later point
  return [];
  const defaultBehavior = getDefaultResponsiveBehavior(widgetType);
  return [
    {
      sectionName: "Responsive Layout",
      children: [
        generateResponsiveBehaviorConfig(defaultBehavior),
        generateVerticalAlignmentConfig(),
      ],
    },
  ];
}
