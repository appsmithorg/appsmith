import type { FieldProps, SIZES } from "@appsmith/wds";
import type { ReactNode } from "react";
import type { TextFieldProps as AriaTextFieldProps } from "react-aria-components";

export interface TextAreaProps extends AriaTextFieldProps, FieldProps {
  placeholder?: string;
  height?: number | string;
  suffix?: ReactNode;
  prefix?: ReactNode;
  rows?: number;
  fieldClassName?: string;
  inputClassName?: string;
  size?: Exclude<keyof typeof SIZES, "xSmall">;
  maxRows?: number;
  "data-testid"?: string;
}
