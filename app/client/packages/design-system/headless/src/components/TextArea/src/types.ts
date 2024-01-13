import type { TextInputBaseProps } from "../../TextInputBase";
import type { OmitedSpectrumTextFieldProps } from "../../TextInput";

export interface TextAreaProps
  extends OmitedSpectrumTextFieldProps,
    Pick<TextInputBaseProps, "inputClassName"> {
  height?: number | string;
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
}
