import { Theme } from "constants/DefaultTheme";
import tinycolor from "tinycolor2";
import styled from "styled-components";
import { toast } from "react-toastify";

export interface CommonComponentProps {
  isLoading?: boolean; //default false
  cypressSelector?: string;
  className?: string;
  disabled?: boolean; //default false
}

export type ThemeProp = {
  theme: Theme;
};

export enum Classes {
  ICON = "cs-icon",
  APP_ICON = "cs-app-icon",
  TEXT = "cs-text",
  BP3_POPOVER_ARROW_BORDER = "bp3-popover-arrow-border",
  BP3_POPOVER_ARROW_FILL = "bp3-popover-arrow-fill",
  SPINNER = "cs-spinner",
  MULTI_SELECT_BOX = "cs-multi-select-box",
  DATE_PICKER_OVARLAY = "date-picker-overlay",
}

export const hexToRgb = (
  hex: string,
): {
  r: number;
  g: number;
  b: number;
} => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : {
        r: -1,
        g: -1,
        b: -1,
      };
};

export const hexToRgba = (color: string, alpha: number) => {
  const value = hexToRgb(color);
  return `rgba(${value.r}, ${value.g}, ${value.b}, ${alpha});`;
};

export const lighten = (color: string, amount: number) => {
  return tinycolor(color)
    .lighten(amount)
    .toString();
};

export const darken = (color: string, amount: number) => {
  return tinycolor(color)
    .darken(amount)
    .toString();
};
export const StoryWrapper = styled.div`
  background: #ffffff;
  height: 700px;
  padding: 50px 100px;
`;

export enum Variant {
  success = "success",
  info = "info",
  warning = "warning",
  danger = "danger",
}

export const ToastVariant = (type: any) => {
  let variant: Variant;
  switch (type) {
    case toast.TYPE.ERROR === type:
      variant = Variant.danger;
      break;
    case toast.TYPE.INFO === type:
      variant = Variant.info;
      break;
    case toast.TYPE.SUCCESS === type:
      variant = Variant.success;
      break;
    case toast.TYPE.WARNING === type:
      variant = Variant.warning;
      break;
    default:
      variant = Variant.info;
      break;
  }
  return variant;
};
