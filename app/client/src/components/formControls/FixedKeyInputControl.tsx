import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { InputType } from "components/constants";
import type { ControlType } from "constants/PropertyControlConstants";
import TextField from "components/editorComponents/form/fields/TextField";
import styled from "styled-components";

const Wrapper = styled.div`
  width: 545px;
`;

class FixKeyInputControl extends BaseControl<FixedKeyInputControlProps> {
  render() {
    const { configProperty, dataType, disabled, fixedKey, placeholderText } =
      this.props;

    return (
      <Wrapper>
        <TextField
          format={(value) => {
            // Get the value property
            if (value) {
              return value.value;
            }

            return "";
          }}
          isDisabled={disabled}
          name={configProperty}
          parse={(value) => {
            // Store the value in this field as {key: fixedKey, value: <user-input>}
            return {
              key: fixedKey,
              value: value,
            };
          }}
          placeholder={placeholderText}
          size="md"
          type={this.getType(dataType)}
        />
      </Wrapper>
    );
  }

  getType(dataType: InputType | undefined) {
    switch (dataType) {
      case "PASSWORD":
        return "password";
      case "NUMBER":
        return "number";
      default:
        return "text";
    }
  }

  getControlType(): ControlType {
    return "FIXED_KEY_INPUT";
  }
}

export interface FixedKeyInputControlProps extends ControlProps {
  placeholderText: string;
  inputType?: InputType;
  dataType?: InputType;
  fixedKey: string;
}

export default FixKeyInputControl;
