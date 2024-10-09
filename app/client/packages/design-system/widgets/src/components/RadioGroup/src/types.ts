import type { FieldProps, ORIENTATION } from "@appsmith/wds";
import type { RadioGroupProps as HeadlessRadioGroupProps } from "react-aria-components";

export interface RadioGroupProps extends HeadlessRadioGroupProps, FieldProps {
  /**
   * The orientation of the radio group.
   */
  orientation?: keyof typeof ORIENTATION;
  /**
   * children for the radio group
   */
  children?: React.ReactNode;
}
