import type { Ref } from "react";
import React, { forwardRef, useRef } from "react";
import { useTextField } from "@react-aria/textfield";
import type { SpectrumTextFieldProps } from "@react-types/textfield";

import { TextInputBase } from "./TextInputBase";

export type TextInputProps = Omit<SpectrumTextFieldProps, "isQuiet"> & {
  loadingIcon?: React.ReactNode;
};

export type TextInputRef = Ref<HTMLDivElement>;

function TextInput(props: TextInputProps, ref: Ref<HTMLDivElement>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { descriptionProps, errorMessageProps, inputProps, labelProps } =
    useTextField(props, inputRef);

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
      inputProps={inputProps}
      inputRef={inputRef}
      labelProps={labelProps}
      ref={ref}
    />
  );
}

const _TextInput = forwardRef(TextInput);
export { _TextInput as TextInput };
