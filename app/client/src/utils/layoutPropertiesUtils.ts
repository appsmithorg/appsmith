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
} from "layoutSystems/common/utils/constants";
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  };
};

export const generateAlignmentConfig = (
  value: Alignment = Alignment.Left,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hidden: (props: any) => props?.positioning === Positioning.Fixed,
  };
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hidden: (props: any) => props?.positioning === Positioning.Fixed,
  };
};

export const generatePositioningConfig = (
  value: Positioning = Positioning.Vertical,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  };
};

export const generateVerticalAlignmentConfig = (
  value: FlexVerticalAlignment = FlexVerticalAlignment.Top,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  return {
    helpText: "Vertical alignment with respect to the siblings in the same row",
    propertyName: "flexVerticalAlignment",
    label: "Vertical alignment",
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLayoutConfig(alignment: Alignment, spacing: Spacing): any[] {
  return [generateAlignmentConfig(alignment), generateSpacingConfig(spacing)];
}
