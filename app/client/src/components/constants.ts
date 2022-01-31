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
