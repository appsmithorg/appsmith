import type { StyleProps } from "@react-types/shared";
import type { SpectrumTextFieldProps } from "@react-types/textfield";

export type OmitedSpectrumTextFieldProps = Omit<
  SpectrumTextFieldProps,
  keyof StyleProps | "icon" | "isQuiet" | "labelPosition" | "labelAlign"
>;

export interface TextInputProps extends OmitedSpectrumTextFieldProps {
  /** classname for the input element */
  inputClassName?: string;
  /** spell check attribute */
  spellCheck?: boolean;
  /** classname for label */
  labelClassName?: string;
  /** classname for errorMessage or description */
  helpTextClassName?: string;
  /** classname for the field */
  fieldClassName?: string;
  /** className for the text input. */
  className?: string;
  /**an icon to be displayed at the start of the component  */
  startIcon?: React.ReactNode;
  /** an icon to be displayed at the end of the component */
  endIcon?: React.ReactNode;
  /** indicates loading state of the text input */
  isLoading?: boolean;
  /** suffix component  */
  prefix?: React.ReactNode;
  /** prefix component */
  suffix?: React.ReactNode;
}
