import type { FieldProps } from "@appsmith/wds";
import type { KeyboardEventHandler, ReactNode } from "react";
import type { TextFieldProps as AriaTextFieldProps } from "react-aria-components";

export interface TextAreaProps extends AriaTextFieldProps, FieldProps {
  placeholder?: string;
  height?: number | string;
  suffix?: ReactNode;
  prefix?: ReactNode;
  rows?: number;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
}
