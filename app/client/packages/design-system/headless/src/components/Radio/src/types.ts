import type { StyleProps } from "@react-types/shared";
import type { SpectrumRadioGroupProps } from "@react-types/radio";

export interface RadioGroupProps
  extends Omit<
    SpectrumRadioGroupProps,
    keyof StyleProps | "labelPosition" | "labelAlign" | "isEmphasized"
  > {
  /** classname for label */
  labelClassName?: string;
  /** classname for errorMessage or description */
  helpTextClassName?: string;
  /** classname for the field */
  fieldClassName?: string;
  /** className for the text input. */
  className?: string;
}
