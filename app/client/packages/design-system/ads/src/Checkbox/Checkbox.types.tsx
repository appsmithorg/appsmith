import type { ReactNode } from "react";
import type { AriaCheckboxProps } from "@react-aria/checkbox";

export type CheckboxProps = {
  name?: string;
  value?: string;
  children?: ReactNode;
  isDefaultSelected?: boolean;
  isSelected?: boolean;
  isIndeterminate?: boolean;
  isDisabled?: boolean;
  onChange?: (isSelected: boolean) => void;
} & Omit<AriaCheckboxProps, "onChange"> &
  Omit<React.LabelHTMLAttributes<HTMLLabelElement>, "onChange">;
