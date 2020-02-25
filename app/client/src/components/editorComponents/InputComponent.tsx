import React from "react";
import styled from "styled-components";
import { Intent as BlueprintIntent, InputGroup } from "@blueprintjs/core";
import { Intent, BlueprintInputTransform } from "constants/DefaultTheme";
import { WrappedFieldInputProps } from "redux-form";

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
};

const InputComponent = (props: InputComponentProps) => {
  console.log(props);
  return (
    <StyledInputGroup
      {...props.input}
      disabled={props.disabled}
      placeholder={props.placeholder}
      type={props.type}
      intent={props.intent as BlueprintIntent}
    />
  );
};

export default InputComponent;
