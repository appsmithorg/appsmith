import { ReactComponent as Column100 } from "assets/icons/control/1-column.svg";
import { ReactComponent as Column25_75 } from "assets/icons/control/2-column-25-75.svg";
import { ReactComponent as Column50_50 } from "assets/icons/control/2-column-50-50.svg";
import { ReactComponent as Column75_25 } from "assets/icons/control/2-column-75-25.svg";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import {
  AlignItems,
  Alignment,
  FlexDirection,
  JustifyContent,
  LayoutDirection,
  Positioning,
  ResponsiveBehavior,
  Spacing,
  FlexVerticalAlignment,
} from "components/constants";
import { ValidationTypes } from "constants/WidgetValidation";
import React from "react";
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
interface ColumnSplitOptionType {
  label: string;
  value: ColumnSplitTypes;
  icon: any;
}

export type ColumnSplitTypes =
  | "1-column"
  | "2-column-50-50"
  | "2-column-25-75"
  | "2-column-75-25";

export const ColumnSplitRatio: { [key in ColumnSplitTypes]: number[] } = {
  "1-column": [1],
  "2-column-50-50": [0.5, 0.5],
  "2-column-25-75": [0.25, 0.75],
  "2-column-75-25": [0.75, 0.25],
};

export const ColumnSplitOptions: ColumnSplitOptionType[] = [
  {
    label: "1 Column",
    value: "1-column",
    icon: <Column100 />,
  },
  {
    label: "2 Column 50-50",
    value: "2-column-50-50",
    icon: <Column50_50 />,
  },
  {
    label: "2 Column 25-75",
    value: "2-column-25-75",
    icon: <Column25_75 />,
  },
  {
    label: "2 Column 75-25",
    value: "2-column-75-25",
    icon: <Column75_25 />,
  },
];

export const getColumnSplittingConfig = () => {
  return {
    helpText: "Layout Preset",
    propertyName: "columnSplitType",
    label: "Layout preset",
    controlType: "COLUMN_SPLIT_OPTIONS",
    defaultValue: ColumnSplitOptions[0].value,
    options: ColumnSplitOptions,
    isJSConvertible: false,
    isBindProperty: false,
    isTriggerProperty: true,
    validation: { type: ValidationTypes.TEXT },
  };
};

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
