import type { RefObject } from "react";
import type { TextFieldAria } from "@react-aria/textfield";
import type { PressEvents, StyleProps } from "@react-types/shared";
import type { OmitedSpectrumTextFieldProps } from "../../TextInput";

export interface TextInputBaseProps
  extends Omit<
      OmitedSpectrumTextFieldProps,
      "onChange" | "icon" | keyof StyleProps
    >,
    PressEvents {
  /** classname for the input element */
  inputClassName?: string;
  /** indicates if the component is textarea */
  multiLine?: boolean;
  /** props to be passed to label component */
  labelProps?: TextFieldAria["labelProps"];
  /** props to be passed to input component */
  inputProps: TextFieldAria<"input" | "textarea">["inputProps"];
  /** props to be passed to description component */
  descriptionProps?: TextFieldAria["descriptionProps"];
  /** props to be passed to error component */
  errorMessageProps?: TextFieldAria["errorMessageProps"];
  /** ref for input component */
  inputRef?: RefObject<HTMLInputElement | HTMLTextAreaElement>;
  /** indicates loading state of the text input */
  isLoading?: boolean;
  /** className for the text input. */
  className?: string;
  /**an icon to be displayed at the start of the component  */
  startIcon?: React.ReactNode;
  /** an icon to be displayed at the end of the component */
  endIcon?: React.ReactNode;
}
