import type React from "react";
import type { RefObject } from "react";
import type { SpectrumTextFieldProps } from "@react-types/textfield";
import type { TextFieldAria } from "@react-aria/textfield";
import type { PressEvents, StyleProps } from "@react-types/shared";

export type OmitedSpectrumTextFieldProps = Omit<
  SpectrumTextFieldProps,
  keyof StyleProps | "icon" | "isQuiet" | "necessityIndicator"
>;

export interface TextInputProps
  extends OmitedSpectrumTextFieldProps,
    Pick<TextInputBaseProps, "startIcon" | "endIcon" | "inputClassName"> {
  spellCheck?: boolean;
}

export interface TextInputBaseProps
  extends Omit<SpectrumTextFieldProps, "onChange" | "icon" | keyof StyleProps>,
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
