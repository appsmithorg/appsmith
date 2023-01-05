import { Intent as BlueprintIntent } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";

export interface DropdownOption {
  label: string;
  value: string;
  icon?: IconName;
  subText?: string;
  id?: string;
  onSelect?: (option: DropdownOption) => void;
  children?: DropdownOption[];
  intent?: BlueprintIntent;
}

export enum SubTextPosition {
  BOTTOM,
  LEFT,
}

export const InputTypes: { [key: string]: string } = {
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  INTEGER: "INTEGER",
  PHONE_NUMBER: "PHONE_NUMBER",
  EMAIL: "EMAIL",
  PASSWORD: "PASSWORD",
  CURRENCY: "CURRENCY",
  SEARCH: "SEARCH",
};

export type InputType = typeof InputTypes[keyof typeof InputTypes];

export enum ButtonBorderRadiusTypes {
  SHARP = "SHARP",
  ROUNDED = "ROUNDED",
  CIRCLE = "CIRCLE",
}

export type ButtonBorderRadius = keyof typeof ButtonBorderRadiusTypes;

export enum ButtonBoxShadowTypes {
  NONE = "NONE",
  VARIANT1 = "VARIANT1",
  VARIANT2 = "VARIANT2",
  VARIANT3 = "VARIANT3",
  VARIANT4 = "VARIANT4",
  VARIANT5 = "VARIANT5",
}

export type ButtonBoxShadow = keyof typeof ButtonBoxShadowTypes;

export type ButtonStyle =
  | "PRIMARY_BUTTON"
  | "SECONDARY_BUTTON"
  | "SUCCESS_BUTTON"
  | "DANGER_BUTTON";

export enum ButtonStyleTypes {
  PRIMARY = "PRIMARY",
  WARNING = "WARNING",
  DANGER = "DANGER",
  INFO = "INFO",
  SECONDARY = "SECONDARY",
  CUSTOM = "CUSTOM",
}
export type ButtonStyleType = keyof typeof ButtonStyleTypes;

export enum ButtonVariantTypes {
  PRIMARY = "PRIMARY",
  SECONDARY = "SECONDARY",
  TERTIARY = "TERTIARY",
}
export type ButtonVariant = keyof typeof ButtonVariantTypes;

export enum RecaptchaTypes {
  V3 = "V3",
  V2 = "V2",
}
export type RecaptchaType = keyof typeof RecaptchaTypes;

export enum CheckboxGroupAlignmentTypes {
  START = "flex-start",
  END = "flex-end",
  CENTER = "center",
  SPACE_BETWEEN = "space-between",
  SPACE_AROUND = "space-around",
  NONE = "unset",
}
export type CheckboxGroupAlignment = keyof typeof CheckboxGroupAlignmentTypes;
export enum ButtonPlacementTypes {
  START = "START",
  BETWEEN = "BETWEEN",
  CENTER = "CENTER",
}
export type ButtonPlacement = keyof typeof ButtonPlacementTypes;

export enum LabelPosition {
  Auto = "Auto",
  Top = "Top",
  Left = "Left",
  Right = "Right",
}

/**
 * Default height for Select, MultiSelect, SingleTreeSelect and MultiTreeSelect
 */
export const SELECT_DEFAULT_HEIGHT = "32px";

/**
 * Default margin bottom value for old select widgets
 */
export const LABEL_MARGIN_OLD_SELECT = "5px";

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

export enum FlexGap {
  None = 0,
  Small = 4,
  Medium = 8,
  Large = 16,
  XtraLarge = 32,
}

export enum Overflow {
  Wrap = "wrap",
  NoWrap = "nowrap",
  Hidden = "hidden",
  Scroll = "scroll",
  Auto = "auto",
}

export enum FlexLayerAlignment {
  Start = "start",
  Center = "center",
  End = "end",
}

export enum FlexVerticalAlignment {
  Top = "start",
  Center = "center",
  Bottom = "end",
}
