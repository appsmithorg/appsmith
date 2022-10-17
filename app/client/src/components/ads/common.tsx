import { Theme } from "constants/DefaultTheme";
import tinycolor from "tinycolor2";
import styled from "styled-components";
import { toast } from "react-toastify";

export type ThemeProp = {
  theme: Theme;
};

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

export enum ToastTypeOptions {
  success = "success",
  info = "info",
  warning = "warning",
  error = "error",
}

const TOAST_VARIANT_LOOKUP = {
  [toast.TYPE.ERROR]: Variant.danger,
  [toast.TYPE.INFO]: Variant.info,
  [toast.TYPE.SUCCESS]: Variant.success,
  [toast.TYPE.WARNING]: Variant.warning,
  undefined: Variant.info,
};

export const ToastVariant = (type: any): Variant => {
  return (
    TOAST_VARIANT_LOOKUP[type as keyof typeof TOAST_VARIANT_LOOKUP] ||
    Variant.info
  );
};
