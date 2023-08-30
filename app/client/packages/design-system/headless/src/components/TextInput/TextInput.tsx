import type { Ref } from "react";
import React, { forwardRef, useRef } from "react";
import { useTextField } from "@react-aria/textfield";
import type { StyleProps } from "@react-types/shared";
import type { SpectrumTextFieldProps } from "@react-types/textfield";

import { TextInputBase } from "./TextInputBase";
import type { TextInputBaseProps } from "./TextInputBase";

type MyOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface TextInputProps
  extends MyOmit<
      SpectrumTextFieldProps,
      keyof StyleProps | "icon" | "isQuiet" | "necessityIndicator"
    >,
    Pick<TextInputBaseProps, "startIcon" | "endIcon" | "inputClassName"> {
  spellCheck?: boolean;
}

export type TextInputRef = Ref<HTMLDivElement>;

function TextInput(props: TextInputProps, ref: TextInputRef) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { spellCheck, ...rest } = props;
  const { descriptionProps, errorMessageProps, inputProps, labelProps } =
    useTextField(rest, inputRef);

  if (props.placeholder) {
    // eslint-disable-next-line no-console
    console.warn(
      "Placeholders are deprecated due to accessibility issues. Please use help text instead. See the docs for details: https://react-spectrum.adobe.com/react-spectrum/TextField.html#help-text",
    );
  }

  return (
    <TextInputBase
      {...props}
      descriptionProps={descriptionProps}
      errorMessageProps={errorMessageProps}
      inputProps={{
        ...inputProps,
        spellCheck,
      }}
      inputRef={inputRef}
      labelProps={labelProps}
      ref={ref}
    />
  );
}

const _TextInput = forwardRef(TextInput);
export { _TextInput as TextInput };
