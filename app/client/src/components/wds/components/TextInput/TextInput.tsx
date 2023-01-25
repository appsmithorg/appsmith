import React, { forwardRef } from "react";
import { Input, useInputProps } from "../Input";
import { InputWrapperBaseProps } from "../Input/InputWrapper/InputWrapper";
import { InputSharedProps } from "../Input/Input";

export interface TextInputProps
  extends InputSharedProps,
    InputWrapperBaseProps,
    Omit<React.ComponentPropsWithoutRef<"input">, "size"> {
  type?: React.HTMLInputTypeAttribute;
  wrapperProps?: Record<string, any>;
  __staticSelector?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (props, ref) => {
    const { type = "text" } = props;
    const { inputProps, wrapperProps, ...others } = useInputProps(props);

    return (
      <Input.Wrapper {...wrapperProps}>
        <Input {...inputProps} {...others} ref={ref} type={type} />
      </Input.Wrapper>
    );
  },
);

TextInput.displayName = "@mantine/core/TextInput";
