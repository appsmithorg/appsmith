import type { ReactNode } from "react";
import type { FieldProps, SIZES } from "@appsmith/wds";
import type { TextFieldProps as AriaTextFieldProps } from "react-aria-components";

export interface TextFieldProps extends AriaTextFieldProps, FieldProps {
  placeholder?: string;
  suffix?: ReactNode;
  prefix?: ReactNode;
  size?: Omit<keyof typeof SIZES, "xSmall">;
}
