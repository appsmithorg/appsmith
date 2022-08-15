import {
  AlignItems,
  Alignment,
  FlexDirection,
  JustifyContent,
  LayoutDirection,
  Spacing,
} from "components/constants";

interface LayoutProperties {
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
    alignItems: AlignItems.FlexStart,
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
  if (spacing !== Spacing.none) {
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
