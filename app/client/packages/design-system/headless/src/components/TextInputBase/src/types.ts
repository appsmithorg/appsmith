import type { RefObject } from "react";
import type { TextFieldAria } from "@react-aria/textfield";

import type { PressEvents } from "@react-types/shared";

import type { TextInputProps } from "../../TextInput";

export interface TextInputBaseProps
  extends Omit<TextInputProps, "onChange">,
    PressEvents {
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
}
