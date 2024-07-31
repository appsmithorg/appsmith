import type { AriaSwitchProps } from "@react-aria/switch";
import type { ReactNode } from "react";

// Switch props
export type SwitchProps = {
  /** (try not to) pass addition classes here */
  className?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  children?: ReactNode;
  onChange?: (isSelected: boolean) => void;
  value?: string;
  defaultSelected?: boolean;
} & AriaSwitchProps;
