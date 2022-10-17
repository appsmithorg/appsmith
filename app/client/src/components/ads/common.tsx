import { Theme } from "constants/DefaultTheme";
import { toast } from "react-toastify";
import { Variant } from "design-system";

export type ThemeProp = {
  theme: Theme;
};
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
