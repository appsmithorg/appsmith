import {
  AlignItems,
  Alignment,
  FlexDirection,
  JustifyContent,
  LayoutDirection,
  Positioning,
  ResponsiveBehavior,
  Spacing,
} from "components/constants";
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
  direction: LayoutDirection,
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
    isJSConvertible: true,
    isBindProperty: false,
    isTriggerProperty: true,
    validation: { type: ValidationTypes.TEXT },
  };
};

export const generateAlignmentConfig = (value: Alignment): any => {
  return {
    helpText:
      "Alignment of children with respect to this parent (applies to Stack positioning)",
    propertyName: "alignment",
    label: "Alignment",
    controlType: "DROP_DOWN",
    defaultValue: value || Alignment.Left,
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

export const generateSpacingConfig = (value: Spacing): any => {
  return {
    helpText: "Spacing between the children (applies to Stack positioning)",
    propertyName: "spacing",
    label: "Spacing",
    controlType: "DROP_DOWN",
    defaultValue: value || Spacing.None,
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

export function getLayoutConfig(alignment: Alignment, spacing: Spacing): any[] {
  return [generateAlignmentConfig(alignment), generateSpacingConfig(spacing)];
}
