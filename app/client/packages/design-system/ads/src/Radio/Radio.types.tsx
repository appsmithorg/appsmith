import type { ReactNode } from "react";
import type { RadioGroupProps as StatelyRadioGroupProps } from "@react-stately/radio";
import type { Orientation } from "@react-types/shared";
import type { AriaRadioProps } from "@react-aria/radio";

export type RadioProps = {
  value: string;
  children?: ReactNode;
  isDisabled?: boolean;
} & AriaRadioProps;

export type RadioGroupProps = {
  /** The list of Radio components. */
  children: React.ReactNode;
  orientation?: Orientation;
  /** The current value (controlled). */
  value?: string;
  /** The default value (uncontrolled). */
  defaultValue?: string;
  /** Handler that is called when the value changes. */
  onChange?: (value: string) => void;
  /** The gap between the Radio components. */
  UNSAFE_gap?: string;
} & Omit<StatelyRadioGroupProps, "onChange"> &
  Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">;
