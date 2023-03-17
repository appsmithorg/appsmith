import React from "react";
import styled from "styled-components";
import type { Intent as BlueprintIntent } from "@blueprintjs/core";
import { InputGroup } from "@blueprintjs/core";
import type { Intent } from "constants/DefaultTheme";
import { BlueprintInputTransform } from "constants/DefaultTheme";
import type { WrappedFieldInputProps } from "redux-form";

const StyledInputGroup = styled(InputGroup)`
  &&& {
    ${BlueprintInputTransform};
  }
`;

export type InputType = "text" | "password" | "number" | "email" | "tel";

type InputComponentProps = {
  placeholder: string;
  input: Partial<WrappedFieldInputProps>;
  type?: InputType;
  intent?: Intent;
  disabled?: boolean;
  autoFocus?: boolean;
};

function InputComponent(props: InputComponentProps) {
  return (
    <StyledInputGroup
      {...props.input}
      autoFocus={props.autoFocus}
      disabled={props.disabled}
      intent={props.intent as BlueprintIntent}
      placeholder={props.placeholder}
      type={props.type}
    />
  );
}

export default InputComponent;
