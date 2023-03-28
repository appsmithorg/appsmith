export enum LayoutDirection {
  Horizontal = "Horizontal",
  Vertical = "Vertical",
}

export enum JustifyContent {
  FlexStart = "flex-start",
  Center = "center",
  SpaceAround = "space-around",
  SpaceBetween = "space-between",
  SpaceEvenly = "space-evenly",
  FlexEnd = "flex-end",
}

export enum AlignItems {
  FlexStart = "flex-start",
  Center = "center",
  Stretch = "stretch",
  FlexEnd = "flex-end",
}

export enum Positioning {
  Fixed = "fixed",
  Horizontal = "horizontal",
  Vertical = "vertical",
}

export enum ResponsiveBehavior {
  Fill = "fill",
  Hug = "hug",
}

export enum FlexDirection {
  Row = "row",
  RowReverse = "row-reverse",
  Column = "column",
  ColumnReverse = "column-reverse",
}

export enum Alignment {
  Top = "top",
  Bottom = "bottom",
  Left = "left",
  Right = "right",
}

export enum Spacing {
  None = "none",
  Equal = "equal",
  SpaceBetween = "space-between",
}

export enum Overflow {
  Wrap = "wrap",
  NoWrap = "nowrap",
  Hidden = "hidden",
  Scroll = "scroll",
  Auto = "auto",
}

export enum FlexLayerAlignment {
  None = "none",
  Start = "start",
  Center = "center",
  End = "end",
}

export enum FlexVerticalAlignment {
  Top = "start",
  Center = "center",
  Bottom = "end",
}

export const defaultAutoLayoutWidgets = [
  "CONTAINER_WIDGET",
  "TABS_WIDGET",
  "LIST_WIDGET_V2",
  "MODAL_WIDGET",
  "STATBOX_WIDGET",
  "FORM_WIDGET",
];
